import express from "express";
import { buildAuthRouter } from "./modules/auth/routes.js";
import { buildTableRouter } from "./modules/table/routes.js";
import { buildUploadRouter } from "./modules/upload/routes.js";
import { buildQuestionsRouter } from "./modules/questions/routes.js";
import { buildStudentDashboardRouter } from "./modules/student-dashboard/routes.js";

export function buildRouter() {
  const router = express.Router();
  router.use("/auth", buildAuthRouter());
  router.use("/table", buildTableRouter());
  router.use("/upload", buildUploadRouter());
  router.use("/questions", buildQuestionsRouter());
  router.use("/", buildStudentDashboardRouter());

  return router;
}
