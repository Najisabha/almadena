import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { authRequired } from "../../auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SIGNS_ROOT = path.join(__dirname, "../../../uploads/signs");
const OPTIONS_ROOT = path.join(__dirname, "../../../uploads/options");
const LICENSES_ROOT = path.join(__dirname, "../../../uploads/licenses");
fs.mkdirSync(OPTIONS_ROOT, { recursive: true });
fs.mkdirSync(LICENSES_ROOT, { recursive: true });

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

export function buildUploadRouter() {
  const router = express.Router();

  router.post("/signs", authRequired, upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "لم يتم إرسال أي ملف صورة" });
    }

    const { section_key, sign_number } = req.body;

    if (!section_key || !SECTION_FOLDER_MAP[section_key]) {
      return res.status(400).json({ message: "section_key غير صالح أو مفقود" });
    }
    if (!sign_number || isNaN(Number(sign_number))) {
      return res.status(400).json({ message: "sign_number مفقود أو غير صالح" });
    }

    const folder     = SECTION_FOLDER_MAP[section_key];
    const ext        = EXT_MAP[req.file.mimetype] || path.extname(req.file.originalname).toLowerCase() || ".png";
    const filename   = `${sign_number}${ext}`;
    const destDir    = path.join(SIGNS_ROOT, folder);
    const destPath   = path.join(destDir, filename);

    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(destPath, req.file.buffer);

    const url = `/uploads/signs/${encodeURIComponent(folder)}/${filename}`;
    return res.json({ url });
  });

  // POST /api/upload/options — رفع صورة لخيار إجابة سؤال
  router.post("/options", authRequired, upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "لم يتم إرسال أي ملف صورة" });
    }
    const ext = EXT_MAP[req.file.mimetype] || path.extname(req.file.originalname).toLowerCase() || ".png";
    const filename = `${Date.now()}-${Math.floor(Math.random() * 100000)}${ext}`;
    const destPath = path.join(OPTIONS_ROOT, filename);
    fs.writeFileSync(destPath, req.file.buffer);
    const url = `/uploads/options/${filename}`;
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

  return router;
}
