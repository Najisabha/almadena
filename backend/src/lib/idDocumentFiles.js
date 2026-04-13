import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.join(__dirname, "..", "..");
export const ID_DOCS_DIR = path.join(BACKEND_ROOT, "uploads", "id-documents");

export const ID_DOC_EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/** يطابق منطق auth: أرقام لاتينية فقط لاسم الملف */
export function sanitizeIdNumberForFilename(idNumber) {
  if (idNumber == null) return "";
  let s = String(idNumber)
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
  const digits = s.replace(/\D/g, "");
  return digits.slice(0, 32);
}

/** حذف ملف محلي تحت uploads/id-documents فقط (مع حماية المسار). */
export function deleteIdDocumentFileIfLocal(url) {
  if (url == null || typeof url !== "string") return;
  const trimmed = url.trim();
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (!normalized.startsWith("/uploads/id-documents/")) return;
  const rel = normalized.slice(1);
  const abs = path.resolve(BACKEND_ROOT, rel);
  const safeRoot = path.resolve(ID_DOCS_DIR);
  if (!abs.startsWith(safeRoot)) return;
  try {
    fs.unlinkSync(abs);
  } catch {
    /* ignore */
  }
}

/** يحذف أي ملف سابق لنفس رقم الهوية (امتدادات مختلفة) قبل رفع جديد. */
export function unlinkIdDocumentsMatchingBase(sanitizedBase) {
  if (!sanitizedBase) return;
  try {
    fs.mkdirSync(ID_DOCS_DIR, { recursive: true });
    const files = fs.readdirSync(ID_DOCS_DIR);
    for (const f of files) {
      if (path.parse(f).name === sanitizedBase) {
        fs.unlinkSync(path.join(ID_DOCS_DIR, f));
      }
    }
  } catch {
    /* ignore */
  }
}

/**
 * يكتب صورة هوية باسم {رقم_الهوية}.{ext}
 * @returns {string} مسار URL مثل /uploads/id-documents/123.jpg
 */
export function writeIdDocumentBuffer(buffer, mimetype, idNumberRaw, originalName = "") {
  const base = sanitizeIdNumberForFilename(idNumberRaw);
  if (!base) {
    throw new Error("رقم الهوية مطلوب لتسمية ملف صورة الهوية");
  }
  const ext =
    ID_DOC_EXT[mimetype] ||
    path.extname(originalName).toLowerCase() ||
    ".jpg";
  unlinkIdDocumentsMatchingBase(base);
  const filename = `${base}${ext}`;
  fs.mkdirSync(ID_DOCS_DIR, { recursive: true });
  const destPath = path.join(ID_DOCS_DIR, filename);
  fs.writeFileSync(destPath, buffer);
  return `/uploads/id-documents/${filename}`;
}
