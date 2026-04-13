/**
 * شكل JSON العام للسؤال — أي مفتاح خارج القائمة يُستبعد.
 * ربط الشاخصة في أسئلة "اشارات مرور" يكون عبر `[كود]` داخل question_text وليس عمودًا منفصلًا.
 */
export const QUESTION_PUBLIC_KEYS = [
  "id",
  "question_text",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_answer",
  "difficulty",
  "category",
  "is_active",
  "display_order",
  "created_at",
  "updated_at",
  "licenses",
];

/** حقول قديمة لا تُعرض ولا تُقبل في جسم الطلب */
export const QUESTION_LEGACY_KEYS = new Set([
  "sign_code",
  "image_url",
  "option_a_image_url",
  "option_b_image_url",
  "option_c_image_url",
  "option_d_image_url",
]);

export function toPublicQuestion(row) {
  if (!row || typeof row !== "object") return row;
  const stripped = Object.fromEntries(
    Object.entries(row).filter(([k]) => !QUESTION_LEGACY_KEYS.has(k))
  );
  const out = {};
  for (const k of QUESTION_PUBLIC_KEYS) {
    if (Object.prototype.hasOwnProperty.call(stripped, k)) {
      out[k] = stripped[k];
    }
  }
  return out;
}

export function stripLegacyFromQuestionBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;
  const out = { ...body };
  for (const k of QUESTION_LEGACY_KEYS) {
    delete out[k];
  }
  return out;
}
