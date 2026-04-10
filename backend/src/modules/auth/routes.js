import express from "express";
import bcrypt from "bcryptjs";
import { query } from "../../db.js";
import { authRequired, signToken } from "../../auth.js";

export function buildAuthRouter() {
  const router = express.Router();

  router.post("/register", async (req, res) => {
    try {
      const { idNumber, password, profile } = req.body;
      if (!idNumber || !password) {
        return res.status(400).json({ message: "رقم الهوية وكلمة المرور مطلوبان" });
      }

      const exists = await query("SELECT id FROM users WHERE id_number = $1 LIMIT 1", [idNumber]);
      if (exists.rowCount > 0) {
        return res.status(409).json({ message: "رقم الهوية مسجل مسبقًا" });
      }

      const hash = await bcrypt.hash(password, 10);
      const userResult = await query(
        "INSERT INTO users (id_number, password_hash) VALUES ($1, $2) RETURNING id, id_number",
        [idNumber, hash]
      );
      const user = userResult.rows[0];

      await query("INSERT INTO user_roles (user_id, role) VALUES ($1, 'user') ON CONFLICT DO NOTHING", [
        user.id,
      ]);
      await query(
        `INSERT INTO profiles (
          id, first_name, last_name, date_of_birth, phone, city, town, full_address, license_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
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
        ]
      );

      const token = signToken(user);
      return res.json({ token, user: { id: user.id, idNumber: user.id_number } });
    } catch (error) {
      return res.status(500).json({ message: "فشل إنشاء الحساب", detail: error.message });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const { idNumber, password } = req.body;
      const userResult = await query(
        "SELECT id, id_number, password_hash FROM users WHERE id_number = $1 LIMIT 1",
        [idNumber]
      );
      if (userResult.rowCount === 0) {
        return res.status(401).json({ message: "رقم الهوية أو كلمة المرور غير صحيحة" });
      }

      const user = userResult.rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
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
