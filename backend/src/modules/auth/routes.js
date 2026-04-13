import express from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import { pool, query } from "../../db.js";
import { authRequired, signToken } from "../../auth.js";
import { deleteIdDocumentFileIfLocal, writeIdDocumentBuffer } from "../../lib/idDocumentFiles.js";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("نوع ملف الهوية غير مدعوم. استخدم jpg أو png أو webp أو gif"));
    }
  },
});

/** إزالة أحرف اتجاه/نسخ، وتحويل الأرقام العربية/الفارسية إلى لاتينية — يطابق ما يُخزَّن في id_number */
function normalizeIdNumber(raw) {
  if (raw == null) return "";
  let s = String(raw)
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .trim();
  const eastern = {
    "\u0660": "0",
    "\u0661": "1",
    "\u0662": "2",
    "\u0663": "3",
    "\u0664": "4",
    "\u0665": "5",
    "\u0666": "6",
    "\u0667": "7",
    "\u0668": "8",
    "\u0669": "9",
    "\u06F0": "0",
    "\u06F1": "1",
    "\u06F2": "2",
    "\u06F3": "3",
    "\u06F4": "4",
    "\u06F5": "5",
    "\u06F6": "6",
    "\u06F7": "7",
    "\u06F8": "8",
    "\u06F9": "9",
  };
  s = s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (c) => eastern[c] || c);
  return s;
}

function parseProfile(body) {
  let profile = body?.profile;
  if (typeof profile === "string") {
    try {
      profile = JSON.parse(profile);
    } catch {
      profile = {};
    }
  }
  return profile && typeof profile === "object" ? profile : {};
}

export function buildAuthRouter() {
  const router = express.Router();

  router.post(
    "/register",
    (req, res, next) => {
      upload.single("idImage")(req, res, (err) => {
        if (!err) return next();
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "حجم صورة الهوية كبير جداً (الحد 5 ميجابايت)" });
        }
        return res.status(400).json({ message: err.message || "خطأ في رفع صورة الهوية" });
      });
    },
    async (req, res) => {
      const idNumber = normalizeIdNumber(req.body?.idNumber ?? req.body?.id_number);
      const password = req.body?.password;
      const profile = parseProfile(req.body);

      if (!idNumber || !password) {
        return res.status(400).json({ message: "رقم الهوية وكلمة المرور مطلوبان" });
      }

      let id_image_url = null;
      if (req.file) {
        try {
          id_image_url = writeIdDocumentBuffer(
            req.file.buffer,
            req.file.mimetype,
            idNumber,
            req.file.originalname
          );
        } catch (e) {
          return res.status(500).json({ message: "فشل حفظ صورة الهوية", detail: e.message });
        }
      }

      let client;
      try {
        const hash = await bcrypt.hash(password, 10);
        client = await pool.connect();
        await client.query("BEGIN");

        const exists = await client.query("SELECT id FROM users WHERE id_number = $1 LIMIT 1", [idNumber]);
        if (exists.rowCount > 0) {
          await client.query("ROLLBACK");
          deleteIdDocumentFileIfLocal(id_image_url);
          return res.status(409).json({ message: "رقم الهوية مسجل مسبقًا" });
        }

        const userResult = await client.query(
          "INSERT INTO users (id_number, password_hash) VALUES ($1, $2) RETURNING id, id_number",
          [idNumber, hash]
        );
        const user = userResult.rows[0];

        await client.query("INSERT INTO user_roles (user_id, role) VALUES ($1, 'user')", [user.id]);

        await client.query(
          `INSERT INTO profiles (
          id, first_name, last_name, date_of_birth, phone, city, town, full_address, license_type, id_image_url,
          id_image_status, id_image_pinned
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            user.id,
            profile?.first_name || "",
            profile?.last_name || "",
            profile?.date_of_birth || null,
            profile?.phone || null,
            profile?.city || null,
            profile?.town || null,
            profile?.full_address || null,
            profile?.license_type || null,
            id_image_url,
            id_image_url ? "pending" : "none",
            false,
          ]
        );

        const studentsResult = await client.query("INSERT INTO students (user_id) VALUES ($1) RETURNING id", [user.id]);
        if (studentsResult.rowCount === 0) {
          await client.query("ROLLBACK");
          deleteIdDocumentFileIfLocal(id_image_url);
          return res.status(500).json({
            message: "فشل إنشاء الحساب",
            detail: "لم يُنشأ سجل الطالب في النظام",
          });
        }

        await client.query("COMMIT");

        const token = signToken(user);
        return res.json({ token, user: { id: user.id, idNumber: user.id_number } });
      } catch (error) {
        if (client) {
          try {
            await client.query("ROLLBACK");
          } catch {
            /* ignore */
          }
        }
        deleteIdDocumentFileIfLocal(id_image_url);
        if (error?.code === "23505") {
          return res.status(409).json({ message: "رقم الهوية مسجل مسبقًا" });
        }
        return res.status(500).json({ message: "فشل إنشاء الحساب", detail: error.message });
      } finally {
        if (client) {
          client.release();
        }
      }
    }
  );

  router.post("/login", async (req, res) => {
    try {
      const idNumber = normalizeIdNumber(req.body?.idNumber ?? req.body?.id_number);
      const password = req.body?.password;
      if (!idNumber || password === undefined || password === null) {
        return res.status(400).json({ message: "رقم الهوية وكلمة المرور مطلوبان" });
      }

      let userResult = await query(
        "SELECT id, id_number, password_hash FROM users WHERE id_number = $1 LIMIT 1",
        [idNumber]
      );
      if (userResult.rowCount === 0) {
        const digitsOnly = idNumber.replace(/\D/g, "");
        if (digitsOnly.length > 0) {
          userResult = await query(
            `SELECT id, id_number, password_hash FROM users
             WHERE regexp_replace(id_number, '\\D', '', 'g') = $1 LIMIT 1`,
            [digitsOnly]
          );
        }
      }
      if (userResult.rowCount === 0) {
        return res.status(401).json({ message: "رقم الهوية أو كلمة المرور غير صحيحة" });
      }

      const user = userResult.rows[0];
      const ok = await bcrypt.compare(String(password), user.password_hash);
      if (!ok) {
        return res.status(401).json({ message: "رقم الهوية أو كلمة المرور غير صحيحة" });
      }

      const token = signToken(user);
      return res.json({ token, user: { id: user.id, idNumber: user.id_number } });
    } catch (error) {
      return res.status(500).json({ message: "فشل تسجيل الدخول", detail: error.message });
    }
  });

  router.get("/session", authRequired, async (req, res) => {
    try {
      const userResult = await query("SELECT id, id_number FROM users WHERE id = $1", [req.user.sub]);
      if (userResult.rowCount === 0) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      const u = userResult.rows[0];
      return res.json({ user: { id: u.id, idNumber: u.id_number } });
    } catch (error) {
      return res.status(500).json({ message: "فشل جلب الجلسة", detail: error.message });
    }
  });

  return router;
}
