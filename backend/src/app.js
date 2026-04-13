import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { buildRouter } from "./routes.js";
import { env } from "./config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (env.clientOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
    })
  );
  app.use(express.json());

  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api", buildRouter());

  return app;
}
