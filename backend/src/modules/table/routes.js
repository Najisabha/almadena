import express from "express";
import { query } from "../../db.js";
import { authRequired } from "../../auth.js";

const PUBLIC_TABLES = new Set(["questions", "pricing", "site_settings", "success_stories", "traffic_signs", "licenses"]);
const ALLOWED_TABLES = new Set([
  "profiles",
  "user_roles",
  "students",
  "questions",
  "pricing",
  "site_settings",
  "appointments",
  "study_materials",
  "success_stories",
  "traffic_signs",
  "licenses",
  "question_licenses",
]);

const TABLE_COLUMNS = {
  profiles: new Set(["id", "first_name", "last_name", "date_of_birth", "phone", "city", "town", "full_address", "id_image_url", "license_type", "avatar_url", "created_at", "updated_at"]),
  user_roles: new Set(["id", "user_id", "role", "created_at"]),
  students: new Set(["id", "user_id", "theory_score", "practical_score", "total_exams_taken", "last_exam_date", "notes", "created_at", "updated_at"]),
  questions: new Set(["id", "question_text", "option_a", "option_b", "option_c", "option_d", "option_a_image_url", "option_b_image_url", "option_c_image_url", "option_d_image_url", "correct_answer", "difficulty", "image_url", "category", "sign_code", "is_active", "display_order", "created_at", "updated_at"]),
  pricing: new Set(["id", "package_name", "package_name_ar", "description", "description_ar", "price", "currency", "lessons_count", "duration_hours", "license_type", "features", "is_active", "display_order", "created_at", "updated_at"]),
  site_settings: new Set(["id", "setting_key", "setting_value", "setting_type", "description", "is_public", "updated_at"]),
  appointments: new Set(["id", "student_id", "appointment_type", "appointment_date", "duration_minutes", "status", "instructor_name", "location", "notes", "created_by", "created_at", "updated_at"]),
  study_materials: new Set(["id", "title", "title_ar", "description", "description_ar", "material_type", "content_url", "zoom_meeting_id", "zoom_password", "scheduled_date", "duration_minutes", "thumbnail_url", "is_active", "display_order", "created_at", "updated_at"]),
  success_stories: new Set(["id", "name", "image_url", "license_type", "rating", "review", "pass_date", "display_order", "is_visible", "created_at", "updated_at"]),
  traffic_signs: new Set(["id", "section_key", "sign_number", "sign_code", "title", "description", "image_url", "is_active", "created_at", "updated_at"]),
  licenses: new Set(["id", "code", "name_ar", "is_active", "icon_url", "difficulty_level", "bg_color", "display_order", "created_at", "updated_at"]),
  question_licenses: new Set(["question_id", "license_id", "created_at"]),
};

const SITE_SETTING_KEY_MAX = 128;
const SITE_SETTING_VALUE_MAX = 12000;

function assertSafeColumn(table, columnName) {
  if (!TABLE_COLUMNS[table] || !TABLE_COLUMNS[table].has(columnName)) {
    throw new Error(`Invalid column: ${columnName}`);
  }
}

function buildWhere(table, filters = [], startAt = 1) {
  if (!filters.length) {
    return { clause: "", values: [] };
  }

  const values = [];
  const parts = filters.map((filter, idx) => {
    assertSafeColumn(table, filter.field);
    values.push(filter.value);
    return `${filter.field} = $${startAt + idx}`;
  });

  return { clause: `WHERE ${parts.join(" AND ")}`, values };
}

function buildInsert(table, payload) {
  const keys = Object.keys(payload);
  keys.forEach((key) => assertSafeColumn(table, key));
  const values = keys.map((key) => payload[key]);
  const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(", ");
  return {
    sql: `(${keys.join(", ")}) VALUES (${placeholders})`,
    values,
  };
}

function buildUpdate(table, payload, startAt = 1) {
  const keys = Object.keys(payload);
  keys.forEach((key) => assertSafeColumn(table, key));
  const values = keys.map((key) => payload[key]);
  const assignments = keys.map((key, idx) => `${key} = $${startAt + idx}`).join(", ");
  return { assignments, values };
}

function requireTable(req, res) {
  const { table } = req.params;
  if (!ALLOWED_TABLES.has(table)) {
    res.status(404).json({ message: "Unknown table" });
    return null;
  }
  return table;
}

function assertSiteSettingsPayload(payload) {
  const rows = Array.isArray(payload) ? payload : [payload];
  for (const row of rows) {
    if (typeof row?.setting_key === "string" && row.setting_key.length > SITE_SETTING_KEY_MAX) {
      throw new Error("site_settings.setting_key exceeds allowed length");
    }
    if (typeof row?.setting_value === "string" && row.setting_value.length > SITE_SETTING_VALUE_MAX) {
      throw new Error("site_settings.setting_value exceeds allowed length");
    }
  }
}

export function buildTableRouter() {
  const router = express.Router();

  router.get("/:table", async (req, res) => {
    try {
      const table = requireTable(req, res);
      if (!table) {
        return;
      }

      const isPublic = PUBLIC_TABLES.has(table);
      const authHeader = req.headers.authorization || "";
      const hasToken = authHeader.startsWith("Bearer ");
      if (!isPublic && !hasToken) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const filters = [];
      for (const [key, rawValue] of Object.entries(req.query)) {
        if (["orderBy", "ascending", "limit", "single", "maybeSingle", "inField", "inValues"].includes(key)) {
          continue;
        }
        filters.push({ field: key, value: rawValue });
      }

      if (req.query.inField && req.query.inValues) {
        const inField = String(req.query.inField);
        assertSafeColumn(table, inField);
        const values = String(req.query.inValues).split(",");
        const placeholders = values.map((_, idx) => `$${idx + 1}`).join(", ");
        const sql = `SELECT * FROM ${table} WHERE ${inField} IN (${placeholders})`;
        const data = (await query(sql, values)).rows;
        return res.json({ data });
      }

      const where = buildWhere(table, filters);
      let orderBy = "";
      if (req.query.orderBy) {
        const orderField = String(req.query.orderBy);
        assertSafeColumn(table, orderField);
        orderBy = ` ORDER BY ${orderField} ${req.query.ascending === "false" ? "DESC" : "ASC"}`;
      }

      const limit = req.query.limit ? ` LIMIT ${Math.max(1, Number(req.query.limit))}` : "";
      const sql = `SELECT * FROM ${table} ${where.clause}${orderBy}${limit}`;
      const data = (await query(sql, where.values)).rows;

      if (req.query.single === "true" || req.query.maybeSingle === "true") {
        return res.json({ data: data[0] || null });
      }

      return res.json({ data });
    } catch (error) {
      return res.status(400).json({ message: "Read failed", detail: error.message });
    }
  });

  router.post("/:table", authRequired, async (req, res) => {
    try {
      const table = requireTable(req, res);
      if (!table) {
        return;
      }
      const payload = Array.isArray(req.body) ? req.body[0] : req.body;
      if (table === "site_settings") {
        assertSiteSettingsPayload(payload);
      }
      const insert = buildInsert(table, payload);
      const sql = `INSERT INTO ${table} ${insert.sql} RETURNING *`;
      const result = await query(sql, insert.values);
      return res.json({ data: result.rows });
    } catch (error) {
      return res.status(400).json({ message: "Insert failed", detail: error.message });
    }
  });

  router.patch("/:table", authRequired, async (req, res) => {
    try {
      const table = requireTable(req, res);
      if (!table) {
        return;
      }
      const { payload, filters = [] } = req.body;
      if (table === "site_settings") {
        assertSiteSettingsPayload(payload);
      }
      const update = buildUpdate(table, payload);
      const where = buildWhere(table, filters, update.values.length + 1);
      const sql = `UPDATE ${table} SET ${update.assignments} ${where.clause} RETURNING *`;
      const result = await query(sql, [...update.values, ...where.values]);
      return res.json({ data: result.rows });
    } catch (error) {
      return res.status(400).json({ message: "Update failed", detail: error.message });
    }
  });

  router.delete("/:table", authRequired, async (req, res) => {
    try {
      const table = requireTable(req, res);
      if (!table) {
        return;
      }
      const { filters = [] } = req.body;
      const where = buildWhere(table, filters);
      const sql = `DELETE FROM ${table} ${where.clause} RETURNING *`;
      const result = await query(sql, where.values);
      return res.json({ data: result.rows });
    } catch (error) {
      return res.status(400).json({ message: "Delete failed", detail: error.message });
    }
  });

  return router;
}
