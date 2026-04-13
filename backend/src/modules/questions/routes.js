import express from "express";
import { query } from "../../db.js";
import { authRequired } from "../../auth.js";
import { stripLegacyFromQuestionBody, toPublicQuestion } from "../../lib/questionPublicJson.js";

const VALID_CATEGORIES = ["اشارات مرور", "قوانين", "ميكانيك"];
const VALID_DIFFICULTIES = ["easy", "medium", "hard"];
const VALID_ANSWERS = ["A", "B", "C", "D"];

const OPTION_KEYS = ["a", "b", "c", "d"];

function validateQuestionPayload(payload, partial = false) {
  const { correct_answer, difficulty, category } = payload;

  if (!partial) {
    if (!payload.question_text || !String(payload.question_text).trim()) {
      throw new Error("نص السؤال مطلوب");
    }
    for (const k of OPTION_KEYS) {
      const text = payload[`option_${k}`];
      if (!text || !String(text).trim()) {
        throw new Error(`الخيار ${k.toUpperCase()} مطلوب`);
      }
    }
    if (!correct_answer || !VALID_ANSWERS.includes(correct_answer)) {
      throw new Error("الإجابة الصحيحة يجب أن تكون A أو B أو C أو D");
    }
  }

  if (correct_answer && !VALID_ANSWERS.includes(correct_answer)) {
    throw new Error("الإجابة الصحيحة يجب أن تكون A أو B أو C أو D");
  }
  if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
    throw new Error("مستوى الصعوبة غير صالح");
  }
  if (category && !VALID_CATEGORIES.includes(category)) {
    throw new Error("التصنيف غير صالح");
  }
}

const ALLOWED_UPDATE_FIELDS = [
  "question_text",
  "option_a", "option_b", "option_c", "option_d",
  "correct_answer", "difficulty", "category",
  "is_active", "display_order",
];

const LIST_SQL = `
  SELECT
    q.id,
    q.question_text,
    q.option_a,
    q.option_b,
    q.option_c,
    q.option_d,
    q.correct_answer,
    q.difficulty,
    q.category,
    q.is_active,
    q.display_order,
    q.created_at,
    q.updated_at,
    COALESCE(lic.licenses, '[]') AS licenses
  FROM questions q
  LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object('id', l.id, 'code', l.code, 'name_ar', l.name_ar)) AS licenses
    FROM question_licenses ql
    JOIN licenses l ON l.id = ql.license_id
    WHERE ql.question_id = q.id
  ) lic ON true
  ORDER BY q.display_order ASC
`;

const SINGLE_SQL = `
  SELECT
    q.id,
    q.question_text,
    q.option_a,
    q.option_b,
    q.option_c,
    q.option_d,
    q.correct_answer,
    q.difficulty,
    q.category,
    q.is_active,
    q.display_order,
    q.created_at,
    q.updated_at,
    COALESCE(lic.licenses, '[]') AS licenses
  FROM questions q
  LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object('id', l.id, 'code', l.code, 'name_ar', l.name_ar)) AS licenses
    FROM question_licenses ql
    JOIN licenses l ON l.id = ql.license_id
    WHERE ql.question_id = q.id
  ) lic ON true
  WHERE q.id = $1
`;

const QUESTION_RETURNING_SQL = `
  id,
  question_text,
  option_a,
  option_b,
  option_c,
  option_d,
  correct_answer,
  difficulty,
  category,
  is_active,
  display_order,
  created_at,
  updated_at
`.trim();

export function buildQuestionsRouter() {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const rows = (await query(LIST_SQL)).rows;
      const data = rows.map(toPublicQuestion);
      res.set("Cache-Control", "no-store");
      return res.json({ data });
    } catch (error) {
      return res.status(400).json({ message: "فشل جلب الأسئلة", detail: error.message });
    }
  });

  router.post("/", authRequired, async (req, res) => {
    try {
      const body = { ...(stripLegacyFromQuestionBody(req.body || {}) || {}) };
      const license_ids = Array.isArray(body.license_ids) ? body.license_ids : [];
      delete body.license_ids;

      validateQuestionPayload(body);

      const {
        question_text,
        option_a, option_b, option_c, option_d,
        correct_answer, difficulty, category,
        is_active, display_order,
      } = body;

      const insertResult = await query(
        `INSERT INTO questions
          (question_text,
           option_a, option_b, option_c, option_d,
           correct_answer, difficulty, category,
           is_active, display_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING ${QUESTION_RETURNING_SQL}`,
        [
          question_text,
          option_a ?? "", option_b ?? "", option_c ?? "", option_d ?? "",
          correct_answer, difficulty ?? "medium", category ?? null,
          is_active !== undefined ? is_active : true,
          display_order ?? 0,
        ]
      );

      const question = insertResult.rows[0];

      if (license_ids.length > 0) {
        for (const lid of license_ids) {
          await query(
            `INSERT INTO question_licenses (question_id, license_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [question.id, lid]
          );
        }
      }

      const withLicenses = await fetchQuestionWithLicenses(question.id);
      return res.json({ data: withLicenses });
    } catch (error) {
      return res.status(400).json({ message: "فشل إنشاء السؤال", detail: error.message });
    }
  });

  router.patch("/:id", authRequired, async (req, res) => {
    try {
      const { id } = req.params;
      const rawBody = stripLegacyFromQuestionBody(req.body || {}) || {};
      const license_ids = rawBody.license_ids;
      const { license_ids: _l, ...payload } = rawBody;

      if (Object.keys(payload).length > 0) {
        validateQuestionPayload(payload, true);

        const keys = Object.keys(payload).filter((k) => ALLOWED_UPDATE_FIELDS.includes(k));
        if (keys.length > 0) {
          const assignments = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
          const values = keys.map((k) => payload[k]);

          await query(
            `UPDATE questions SET ${assignments}, updated_at = NOW() WHERE id = $${keys.length + 1}`,
            [...values, id]
          );
        }
      }

      if (Array.isArray(license_ids)) {
        await query(`DELETE FROM question_licenses WHERE question_id = $1`, [id]);
        for (const lid of license_ids) {
          await query(
            `INSERT INTO question_licenses (question_id, license_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, lid]
          );
        }
      }

      const withLicenses = await fetchQuestionWithLicenses(id);
      return res.json({ data: withLicenses });
    } catch (error) {
      return res.status(400).json({ message: "فشل تحديث السؤال", detail: error.message });
    }
  });

  router.delete("/:id", authRequired, async (req, res) => {
    try {
      const { id } = req.params;
      await query(`DELETE FROM questions WHERE id = $1`, [id]);
      return res.json({ data: { id } });
    } catch (error) {
      return res.status(400).json({ message: "فشل حذف السؤال", detail: error.message });
    }
  });

  return router;
}

async function fetchQuestionWithLicenses(id) {
  const result = await query(SINGLE_SQL, [id]);
  const row = result.rows[0];
  return row ? toPublicQuestion(row) : null;
}