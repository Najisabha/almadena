import express from "express";
import { query } from "../../db.js";
import { authRequired } from "../../auth.js";

const VALID_CATEGORIES = ["اشارات مرور", "قوانين", "ميكانيك"];
const VALID_DIFFICULTIES = ["easy", "medium", "hard"];
const VALID_ANSWERS = ["A", "B", "C", "D"];

const OPTION_KEYS = ["a", "b", "c", "d"];

// خيار صالح إذا احتوى نصًا أو صورة
function isOptionValid(text, imageUrl) {
  const hasText = text && String(text).trim().length > 0;
  const hasImage = imageUrl && String(imageUrl).trim().length > 0;
  return hasText || hasImage;
}

function validateQuestionPayload(payload, partial = false) {
  const { correct_answer, difficulty, category } = payload;

  if (!partial) {
    if (!payload.question_text || !String(payload.question_text).trim()) {
      throw new Error("نص السؤال مطلوب");
    }
    for (const k of OPTION_KEYS) {
      const text = payload[`option_${k}`];
      const img = payload[`option_${k}_image_url`];
      if (!isOptionValid(text, img)) {
        throw new Error(`الخيار ${k.toUpperCase()} مطلوب (نص أو صورة)`);
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
  "option_a_image_url", "option_b_image_url", "option_c_image_url", "option_d_image_url",
  "correct_answer", "difficulty", "category",
  "sign_code", "image_url", "is_active", "display_order",
];

export function buildQuestionsRouter() {
  const router = express.Router();

  // GET /api/questions
  router.get("/", async (req, res) => {
    try {
      const sql = `
        SELECT
          q.*,
          COALESCE(
            json_agg(
              json_build_object('id', l.id, 'code', l.code, 'name_ar', l.name_ar)
            ) FILTER (WHERE l.id IS NOT NULL),
            '[]'
          ) AS licenses
        FROM questions q
        LEFT JOIN question_licenses ql ON ql.question_id = q.id
        LEFT JOIN licenses l ON l.id = ql.license_id
        GROUP BY q.id
        ORDER BY q.display_order ASC
      `;
      const data = (await query(sql)).rows;
      return res.json({ data });
    } catch (error) {
      return res.status(400).json({ message: "فشل جلب الأسئلة", detail: error.message });
    }
  });

  // POST /api/questions
  router.post("/", authRequired, async (req, res) => {
    try {
      const { license_ids = [], ...payload } = req.body;
      validateQuestionPayload(payload);

      const {
        question_text,
        option_a, option_b, option_c, option_d,
        option_a_image_url, option_b_image_url, option_c_image_url, option_d_image_url,
        correct_answer, difficulty, category,
        sign_code, image_url, is_active, display_order,
      } = payload;

      const insertResult = await query(
        `INSERT INTO questions
          (question_text,
           option_a, option_b, option_c, option_d,
           option_a_image_url, option_b_image_url, option_c_image_url, option_d_image_url,
           correct_answer, difficulty, category,
           sign_code, image_url, is_active, display_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING *`,
        [
          question_text,
          option_a ?? "", option_b ?? "", option_c ?? "", option_d ?? "",
          option_a_image_url ?? null, option_b_image_url ?? null,
          option_c_image_url ?? null, option_d_image_url ?? null,
          correct_answer, difficulty ?? "medium", category ?? null,
          sign_code ?? null, image_url ?? null,
          is_active !== undefined ? is_active : true,
          display_order ?? 0,
        ]
      );
      const question = insertResult.rows[0];

      if (Array.isArray(license_ids) && license_ids.length > 0) {
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

  // PATCH /api/questions/:id
  router.patch("/:id", authRequired, async (req, res) => {
    try {
      const { id } = req.params;
      const { license_ids, ...payload } = req.body;

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

  // DELETE /api/questions/:id
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
  const sql = `
    SELECT
      q.*,
      COALESCE(
        json_agg(
          json_build_object('id', l.id, 'code', l.code, 'name_ar', l.name_ar)
        ) FILTER (WHERE l.id IS NOT NULL),
        '[]'
      ) AS licenses
    FROM questions q
    LEFT JOIN question_licenses ql ON ql.question_id = q.id
    LEFT JOIN licenses l ON l.id = ql.license_id
    WHERE q.id = $1
    GROUP BY q.id
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}
