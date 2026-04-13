import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { authRequired } from "../../auth.js";
import { adminRequired } from "../../adminAuth.js";
import { writeIdDocumentBuffer } from "../../lib/idDocumentFiles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SIGNS_ROOT = path.join(__dirname, "../../../uploads/signs");
const LICENSES_ROOT = path.join(__dirname, "../../../uploads/licenses");
const SUCCESS_STORIES_ROOT = path.join(__dirname, "../../../uploads/success-stories");
const INSTRUCTORS_ROOT = path.join(__dirname, "../../../uploads/instructors");
fs.mkdirSync(LICENSES_ROOT, { recursive: true });
fs.mkdirSync(SUCCESS_STORIES_ROOT, { recursive: true });
fs.mkdirSync(INSTRUCTORS_ROOT, { recursive: true });

const SECTION_FOLDER_MAP = {
  warning:          "Warning signals",
  guidance:         "Guidance signals",
  inquiry:          "Inquiry signals",
  "road-surface":   "Road surface signs",
  "traffic-lights": "Traffic lights",
  support:          "Auxiliary signals",
};

Object.values(SECTION_FOLDER_MAP).forEach((folder) => {
  fs.mkdirSync(path.join(SIGNS_ROOT, folder), { recursive: true });
});

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);

const EXT_MAP = {
  "image/jpeg":    ".jpg",
  "image/png":     ".png",
  "image/webp":    ".webp",
  "image/gif":     ".gif",
  "image/svg+xml": ".svg",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("نوع الملف غير مدعوم. الأنواع المسموحة: jpg, png, webp, gif, svg"));
    }
  },
});

const ID_DOC_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const uploadIdDoc = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ID_DOC_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("صورة الهوية: jpg أو png أو webp أو gif فقط"));
    }
  },
});

export function buildUploadRouter() {
  const router = express.Router();

  router.post("/signs", authRequired, upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "لم يتم إرسال أي ملف صورة" });
    }

    const { section_key, sign_number, sign_suffix } = req.body;

    if (!section_key || !SECTION_FOLDER_MAP[section_key]) {
      return res.status(400).json({ message: "section_key غير صالح أو مفقود" });
    }
    if (!sign_number || isNaN(Number(sign_number))) {
      return res.status(400).json({ message: "sign_number مفقود أو غير صالح" });
    }

    const suffixRaw = sign_suffix != null ? String(sign_suffix).trim() : "";
    const suffixSafe = suffixRaw.slice(0, 4);

    const folder     = SECTION_FOLDER_MAP[section_key];
    const ext        = EXT_MAP[req.file.mimetype] || path.extname(req.file.originalname).toLowerCase() || ".png";
    const filename   = suffixSafe ? `${sign_number}-${suffixSafe}${ext}` : `${sign_number}${ext}`;
    const destDir    = path.join(SIGNS_ROOT, folder);
    const destPath   = path.join(destDir, filename);

    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(destPath, req.file.buffer);

    const url = `/uploads/signs/${encodeURIComponent(folder)}/${filename}`;
    return res.json({ url });
  });

  // POST /api/upload/licenses — رفع صورة/أيقونة للرخصة
  router.post("/licenses", authRequired, upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "لم يتم إرسال أي ملف صورة" });
    }
    const ext = EXT_MAP[req.file.mimetype] || path.extname(req.file.originalname).toLowerCase() || ".png";
    const filename = `${Date.now()}-${Math.floor(Math.random() * 100000)}${ext}`;
    const destPath = path.join(LICENSES_ROOT, filename);
    fs.writeFileSync(destPath, req.file.buffer);
    const url = `/uploads/licenses/${filename}`;
    return res.json({ url });
  });

  // POST /api/upload/success-stories — رفع صورة طالب لقصة نجاح (مشرف فقط)
  router.post("/success-stories", authRequired, upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "لم يتم إرسال أي ملف صورة" });
    }
    const ext = EXT_MAP[req.file.mimetype] || path.extname(req.file.originalname).toLowerCase() || ".png";
    const filename = `${Date.now()}-${Math.floor(Math.random() * 100000)}${ext}`;
    const destPath = path.join(SUCCESS_STORIES_ROOT, filename);
    fs.writeFileSync(destPath, req.file.buffer);
    const url = `/uploads/success-stories/${filename}`;
    return res.json({ url });
  });

  // POST /api/upload/instructors — صورة المدرب (مسجّل؛ التعديل عبر جدول المدربين للمشرفين)
  router.post("/instructors", authRequired, upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "لم يتم إرسال أي ملف صورة" });
    }
    const ext = EXT_MAP[req.file.mimetype] || path.extname(req.file.originalname).toLowerCase() || ".png";
    const filename = `${Date.now()}-${Math.floor(Math.random() * 100000)}${ext}`;
    const destPath = path.join(INSTRUCTORS_ROOT, filename);
    fs.writeFileSync(destPath, req.file.buffer);
    const url = `/uploads/instructors/${filename}`;
    return res.json({ url });
  });

  /**
   * POST /api/upload/id-document
   * مشرف فقط: رفع صورة هوية إلى id-documents (نفس مسار التسجيل).
   */
  router.post(
    "/id-document",
    adminRequired,
    (req, res, next) => {
      uploadIdDoc.single("image")(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: "حجم صورة الهوية كبير جداً (الحد 5 ميجابايت)" });
          }
          return res.status(400).json({ message: err.message || "خطأ في رفع صورة الهوية" });
        }
        return next();
      });
    },
    (req, res) => {
      if (!req.file) {
        return res.status(400).json({ message: "لم يتم إرسال صورة الهوية" });
      }
      const idNumber = req.body?.id_number ?? req.body?.idNumber ?? "";
      try {
        const url = writeIdDocumentBuffer(
          req.file.buffer,
          req.file.mimetype,
          idNumber,
          req.file.originalname
        );
        return res.json({ data: { url } });
      } catch (e) {
        return res.status(400).json({
          message: e.message || "فشل حفظ صورة الهوية",
        });
      }
    }
  );

  return router;
}
