import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { query } from "../db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * يضمن وجود أعمدة صورة الهوية بعد التحديثات الأخيرة دون الاعتماد على تشغيل db:init يدوياً.
 */
/** يضمن وجود جدول المدربين لصفحة «مدربينا» ولوحة الإدارة. */
export async function ensureInstructorsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS instructors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name_ar TEXT NOT NULL,
      role_ar TEXT,
      bio_ar TEXT,
      image_url TEXT,
      rating_stars NUMERIC(3,1),
      students_trained INTEGER,
      success_rate NUMERIC(5,2),
      student_comments TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_visible BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`ALTER TABLE instructors ADD COLUMN IF NOT EXISTS rating_stars NUMERIC(3,1)`);
  await query(`ALTER TABLE instructors ADD COLUMN IF NOT EXISTS students_trained INTEGER`);
  await query(`ALTER TABLE instructors ADD COLUMN IF NOT EXISTS success_rate NUMERIC(5,2)`);
  await query(`ALTER TABLE instructors ADD COLUMN IF NOT EXISTS student_comments TEXT`);
}

export async function ensureProfileImageColumns() {
  await query(
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_image_status TEXT NOT NULL DEFAULT 'none'`
  );
  await query(
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_image_pinned BOOLEAN NOT NULL DEFAULT FALSE`
  );
  await query(
    `UPDATE profiles SET id_image_status = 'pending'
     WHERE COALESCE(TRIM(id_image_url), '') <> ''
       AND id_image_status = 'none'`
  );
}

/**
 * يضمن وجود سجل signup_places في site_settings عند تشغيل الخادم
 * دون الحاجة لإعادة تشغيل db:init يدوياً.
 */
export async function ensureSignupPlacesSetting() {
  const jsonPath = join(__dirname, "../data/signupPlacesDefault.json");
  let defaultValue = "{}";
  try {
    defaultValue = readFileSync(jsonPath, "utf-8").trim();
  } catch {
    // fallback: keep empty object
  }
  await query(
    `INSERT INTO site_settings (setting_key, setting_value, setting_type, description, is_public)
     VALUES ('signup_places', $1, 'json', 'خريطة المدن والبلدات لصفحة التسجيل', TRUE)
     ON CONFLICT (setting_key) DO NOTHING`,
    [defaultValue]
  );
}

/**
 * ينشئ جدولي signup_cities و signup_towns ويرحّل البيانات من
 * site_settings.signup_places إذا كانت signup_cities فارغة.
 */
export async function ensureSignupPlacesTables() {
  // إنشاء الجداول
  await query(`
    CREATE TABLE IF NOT EXISTS signup_cities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name_ar TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT signup_cities_name_ar_unique UNIQUE (name_ar)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS signup_towns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      city_id UUID NOT NULL REFERENCES signup_cities(id) ON DELETE CASCADE,
      name_ar TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT signup_towns_city_name_unique UNIQUE (city_id, name_ar)
    )
  `);

  // ترحيل من site_settings.signup_places إن كانت signup_cities فارغة
  const { rows: cityCount } = await query(
    `SELECT COUNT(*) AS cnt FROM signup_cities`
  );
  if (Number(cityCount[0].cnt) > 0) return;

  const { rows: settingRows } = await query(
    `SELECT setting_value FROM site_settings WHERE setting_key = 'signup_places' LIMIT 1`
  );
  if (!settingRows.length || !settingRows[0].setting_value) {
    // حاول قراءة ملف البذور مباشرة
    const jsonPath = join(__dirname, "../data/signupPlacesDefault.json");
    let raw = null;
    try {
      raw = readFileSync(jsonPath, "utf-8");
    } catch {
      return;
    }
    if (raw) {
      try {
        await migrateFromJson(JSON.parse(raw));
      } catch {
        // نتجاهل أخطاء الترحيل ولا نوقف الخادم
      }
    }
    return;
  }

  try {
    const places = JSON.parse(settingRows[0].setting_value);
    if (places && typeof places === "object" && !Array.isArray(places)) {
      await migrateFromJson(places);
    }
  } catch {
    // JSON تالف — لا نوقف الخادم
  }
}

async function migrateFromJson(places) {
  const entries = Object.entries(places);
  for (let cityOrder = 0; cityOrder < entries.length; cityOrder++) {
    const [cityName, towns] = entries[cityOrder];
    const { rows: cityRows } = await query(
      `INSERT INTO signup_cities (name_ar, display_order)
       VALUES ($1, $2)
       ON CONFLICT (name_ar) DO UPDATE SET display_order = EXCLUDED.display_order
       RETURNING id`,
      [cityName.trim(), cityOrder]
    );
    const cityId = cityRows[0].id;
    const townList = Array.isArray(towns) ? towns : [];
    for (let townOrder = 0; townOrder < townList.length; townOrder++) {
      const townName = String(townList[townOrder]).trim();
      if (!townName) continue;
      await query(
        `INSERT INTO signup_towns (city_id, name_ar, display_order)
         VALUES ($1, $2, $3)
         ON CONFLICT (city_id, name_ar) DO NOTHING`,
        [cityId, townName, townOrder]
      );
    }
  }
}
