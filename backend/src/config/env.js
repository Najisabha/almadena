import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __configDir = dirname(fileURLToPath(import.meta.url));
/* يحمّل backend/.env حتى لو كان cwd هو جذر المستودع (مثل node backend/src/scripts/init-db.js) */
dotenv.config({ path: join(__configDir, "../../.env") });
dotenv.config();

const requiredVars = ["DATABASE_URL", "JWT_SECRET", "CLIENT_ORIGIN"];

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if ((process.env.JWT_SECRET || "").length < 24) {
  throw new Error("JWT_SECRET must be at least 24 characters long");
}

/** عدة واجهات: افصل بفاصلة، مثال: http://localhost:8080,https://app.example.com */
const clientOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (clientOrigins.length === 0) {
  throw new Error("CLIENT_ORIGIN must include at least one origin URL");
}

/* Vite قد يستخدم 8081 إذا كان 8080 مشغولًا — نفس الجهاز فقط، وليس في production */
const isProduction = process.env.NODE_ENV === "production";
if (!isProduction) {
  for (const o of [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
  ]) {
    if (!clientOrigins.includes(o)) clientOrigins.push(o);
  }
}

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  /** أول نطاق (للتوافق مع السجلات القديمة) */
  clientOrigin: clientOrigins[0],
  clientOrigins,
};
