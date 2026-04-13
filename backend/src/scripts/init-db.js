import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { query, pool } from "../db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config();

const statements = [
  `CREATE EXTENSION IF NOT EXISTS pgcrypto;`,
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_number TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number TEXT UNIQUE;`,
  `ALTER TABLE users ALTER COLUMN email DROP NOT NULL;`,
  `CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    phone TEXT,
    city TEXT,
    town TEXT,
    full_address TEXT,
    id_image_url TEXT,
    license_type TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_image_status TEXT NOT NULL DEFAULT 'none';`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_image_pinned BOOLEAN NOT NULL DEFAULT FALSE;`,
  /* صور موجودة قبل إضافة الحالة: اعتبارها قيد المراجعة */
  `UPDATE profiles SET id_image_status = 'pending'
   WHERE COALESCE(TRIM(id_image_url), '') <> ''
     AND id_image_status = 'none';`,
  `CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
  );`,
  `CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    theory_score INTEGER,
    practical_score INTEGER,
    total_exams_taken INTEGER DEFAULT 0,
    last_exam_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS success_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    image_url TEXT,
    license_type TEXT NOT NULL,
    rating NUMERIC(3,1) DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    review TEXT NOT NULL,
    pass_date DATE NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS instructors (
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
  );`,
  /* ترحيل: تحويل عمود rating من INTEGER إلى NUMERIC(3,1) لدعم نصف النجمة */
  `DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'success_stories'
      AND column_name = 'rating'
      AND data_type = 'integer'
  ) THEN
    -- إسقاط قيود CHECK القائمة على العمود
    DECLARE
      v_constraint TEXT;
    BEGIN
      FOR v_constraint IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'success_stories'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%rating%'
      LOOP
        EXECUTE format('ALTER TABLE success_stories DROP CONSTRAINT IF EXISTS %I', v_constraint);
      END LOOP;
    END;
    ALTER TABLE success_stories
      ALTER COLUMN rating TYPE NUMERIC(3,1) USING rating::numeric;
    ALTER TABLE success_stories
      ADD CONSTRAINT success_stories_rating_check
      CHECK (rating >= 1 AND rating <= 5);
  END IF;
END $$;`,
  `DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'questions'
  ) THEN
    EXECUTE 'DROP VIEW public.questions CASCADE';
  END IF;
END $$;`,
  `CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL DEFAULT '',
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    category TEXT CHECK (category IN ('اشارات مرور', 'قوانين', 'ميكانيك')),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_d TEXT NOT NULL DEFAULT '';`,
  `ALTER TABLE questions DROP COLUMN IF EXISTS question_type;`,
  `ALTER TABLE questions DROP COLUMN IF EXISTS image_url;`,
  `ALTER TABLE questions DROP COLUMN IF EXISTS option_a_image_url;`,
  `ALTER TABLE questions DROP COLUMN IF EXISTS option_b_image_url;`,
  `ALTER TABLE questions DROP COLUMN IF EXISTS option_c_image_url;`,
  `ALTER TABLE questions DROP COLUMN IF EXISTS option_d_image_url;`,
  `ALTER TABLE questions DROP COLUMN IF EXISTS sign_code CASCADE;`,
  `DO $$
/* Drop non-internal triggers on questions (may reference removed columns like sign_code) */
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tg.tgname AS tgname
    FROM pg_trigger tg
    JOIN pg_class c ON c.oid = tg.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'questions'
      AND NOT tg.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.questions', r.tgname);
  END LOOP;
END $$;`,
  `CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_ar TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    icon_url TEXT,
    difficulty_level TEXT DEFAULT 'متوسط',
    bg_color TEXT DEFAULT '#FFFFFF',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  `ALTER TABLE licenses ADD COLUMN IF NOT EXISTS icon_url TEXT;`,
  `ALTER TABLE licenses ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'متوسط';`,
  `ALTER TABLE licenses ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '#FFFFFF';`,
  `CREATE TABLE IF NOT EXISTS question_licenses (
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
    license_id UUID REFERENCES licenses(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (question_id, license_id)
  );`,
  `CREATE TABLE IF NOT EXISTS pricing_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT NOT NULL,
    icon_key TEXT NOT NULL DEFAULT 'car',
    color_class TEXT NOT NULL DEFAULT 'bg-blue-500',
    show_popular_badge BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_name TEXT NOT NULL,
    package_name_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'ILS',
    lessons_count INTEGER,
    duration_hours INTEGER,
    license_type TEXT,
    features JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  `ALTER TABLE pricing ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES pricing_sections(id) ON DELETE SET NULL;`,
  `ALTER TABLE pricing ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN NOT NULL DEFAULT FALSE;`,
  `ALTER TABLE pricing ADD COLUMN IF NOT EXISTS cta_label_ar TEXT NOT NULL DEFAULT 'احجز الآن';`,
  `ALTER TABLE pricing ADD COLUMN IF NOT EXISTS cta_href TEXT NOT NULL DEFAULT '/contact';`,
  `CREATE TABLE IF NOT EXISTS pricing_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'ILS',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  `ALTER TABLE pricing ALTER COLUMN currency SET DEFAULT 'ILS';`,
  `ALTER TABLE pricing_addons ALTER COLUMN currency SET DEFAULT 'ILS';`,
  `UPDATE pricing SET currency = 'ILS' WHERE currency = 'SAR';`,
  `UPDATE pricing_addons SET currency = 'ILS' WHERE currency = 'SAR';`,
  `CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'text',
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS traffic_signs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT NOT NULL CHECK (section_key IN ('warning', 'guidance', 'inquiry', 'road-surface', 'traffic-lights', 'support')),
    sign_number INTEGER NOT NULL,
    sign_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (sign_code)
  );`,
  `ALTER TABLE traffic_signs DROP CONSTRAINT IF EXISTS traffic_signs_section_key_sign_number_key;`,
  `ALTER TABLE traffic_signs ADD COLUMN IF NOT EXISTS sign_number INTEGER;`,
  `ALTER TABLE traffic_signs ADD COLUMN IF NOT EXISTS sign_code TEXT;`,
  `ALTER TABLE traffic_signs ADD COLUMN IF NOT EXISTS image_url TEXT;`,
  `ALTER TABLE traffic_signs DROP COLUMN IF EXISTS display_order;`,
  `UPDATE licenses
   SET code = 'D1', name_ar = 'عمومي', display_order = 4, updated_at = NOW()
   WHERE code = 'D' AND NOT EXISTS (SELECT 1 FROM licenses WHERE code = 'D1');`,
  /* ربط أقسام الأسعار بالرخص + مزامنة تلقائية عند إدراج/تعديل رخصة */
  `ALTER TABLE pricing_sections ADD COLUMN IF NOT EXISTS license_id UUID REFERENCES licenses(id) ON DELETE CASCADE;`,
  `ALTER TABLE pricing_sections DROP COLUMN IF EXISTS label_emoji;`,
  `CREATE UNIQUE INDEX IF NOT EXISTS pricing_sections_license_id_key ON pricing_sections(license_id);`,
  `DROP TRIGGER IF EXISTS trg_licenses_sync_pricing_section_ins ON licenses;`,
  `DROP TRIGGER IF EXISTS trg_licenses_sync_pricing_section_upd ON licenses;`,
  `DROP FUNCTION IF EXISTS sync_pricing_section_from_license();`,
  `CREATE OR REPLACE FUNCTION sync_pricing_section_from_license()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  ic TEXT;
  cc TEXT;
  sec_id UUID;
BEGIN
  ic := CASE UPPER(TRIM(NEW.code))
    WHEN 'B' THEN 'car'
    WHEN 'C1' THEN 'truck'
    WHEN 'C' THEN 'truck'
    WHEN 'D' THEN 'tram'
    WHEN 'D1' THEN 'tram'
    WHEN 'A' THEN 'bike'
    WHEN 'T' THEN 'tractor'
    ELSE 'car'
  END;
  cc := CASE UPPER(TRIM(NEW.code))
    WHEN 'B' THEN 'bg-blue-500'
    WHEN 'C1' THEN 'bg-orange-500'
    WHEN 'C' THEN 'bg-orange-500'
    WHEN 'D' THEN 'bg-yellow-500'
    WHEN 'D1' THEN 'bg-yellow-500'
    WHEN 'A' THEN 'bg-red-500'
    WHEN 'T' THEN 'bg-green-500'
    ELSE 'bg-purple-500'
  END;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO pricing_sections (title_ar, icon_key, color_class, show_popular_badge, display_order, is_active, license_id)
    VALUES (
      NEW.name_ar,
      ic,
      cc,
      FALSE,
      COALESCE(NEW.display_order, 0),
      COALESCE(NEW.is_active, TRUE),
      NEW.id
    )
    RETURNING id INTO sec_id;

    INSERT INTO pricing (package_name, package_name_ar, price, currency, features, is_active, display_order, is_recommended, cta_label_ar, cta_href, section_id)
    VALUES (
      'auto_' || NEW.id::text,
      NEW.name_ar,
      0,
      'ILS',
      '[]'::jsonb,
      TRUE,
      0,
      FALSE,
      'احجز الآن',
      '/contact',
      sec_id
    );

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    UPDATE pricing_sections
    SET title_ar = NEW.name_ar,
        icon_key = ic,
        color_class = cc,
        display_order = COALESCE(NEW.display_order, 0),
        is_active = COALESCE(NEW.is_active, TRUE)
    WHERE license_id = NEW.id
    RETURNING id INTO sec_id;

    IF sec_id IS NULL THEN
      INSERT INTO pricing_sections (title_ar, icon_key, color_class, show_popular_badge, display_order, is_active, license_id)
      VALUES (NEW.name_ar, ic, cc, FALSE, COALESCE(NEW.display_order, 0), COALESCE(NEW.is_active, TRUE), NEW.id)
      RETURNING id INTO sec_id;

      INSERT INTO pricing (package_name, package_name_ar, price, currency, features, is_active, display_order, is_recommended, cta_label_ar, cta_href, section_id)
      VALUES (
        'auto_' || NEW.id::text,
        NEW.name_ar,
        0,
        'ILS',
        '[]'::jsonb,
        TRUE,
        0,
        FALSE,
        'احجز الآن',
        '/contact',
        sec_id
      );
    END IF;

    /* مزامنة اسم الباقة الافتراضية عند تغيير اسم الرخصة */
    UPDATE pricing
    SET package_name_ar = NEW.name_ar
    WHERE section_id = sec_id
      AND package_name = 'auto_' || NEW.id::text;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;`,
  `CREATE TRIGGER trg_licenses_sync_pricing_section_ins
    AFTER INSERT ON licenses
    FOR EACH ROW EXECUTE FUNCTION sync_pricing_section_from_license();`,
  `CREATE TRIGGER trg_licenses_sync_pricing_section_upd
    AFTER UPDATE ON licenses
    FOR EACH ROW EXECUTE FUNCTION sync_pricing_section_from_license();`,
  `INSERT INTO pricing_sections (title_ar, icon_key, color_class, show_popular_badge, display_order, is_active, license_id)
   SELECT l.name_ar,
     CASE UPPER(TRIM(l.code))
       WHEN 'B' THEN 'car' WHEN 'C1' THEN 'truck' WHEN 'C' THEN 'truck'
       WHEN 'D' THEN 'tram' WHEN 'D1' THEN 'tram' WHEN 'A' THEN 'bike' WHEN 'T' THEN 'tractor' ELSE 'car' END,
     CASE UPPER(TRIM(l.code))
       WHEN 'B' THEN 'bg-blue-500' WHEN 'C1' THEN 'bg-orange-500' WHEN 'C' THEN 'bg-orange-500'
       WHEN 'D' THEN 'bg-yellow-500' WHEN 'D1' THEN 'bg-yellow-500' WHEN 'A' THEN 'bg-red-500' WHEN 'T' THEN 'bg-green-500' ELSE 'bg-purple-500' END,
     FALSE,
     COALESCE(l.display_order, 0),
     COALESCE(l.is_active, TRUE),
     l.id
   FROM licenses l
   WHERE NOT EXISTS (SELECT 1 FROM pricing_sections ps WHERE ps.license_id = l.id);`,
  /* ترحيل: باقة افتراضية لأي قسم مرتبط برخصة وليس له باقات بعد */
  `INSERT INTO pricing (package_name, package_name_ar, price, currency, features, is_active, display_order, is_recommended, cta_label_ar, cta_href, section_id)
   SELECT
     'auto_' || l.id::text,
     l.name_ar,
     0,
     'ILS',
     '[]'::jsonb,
     TRUE,
     0,
     FALSE,
     'احجز الآن',
     '/contact',
     ps.id
   FROM pricing_sections ps
   JOIN licenses l ON l.id = ps.license_id
   WHERE NOT EXISTS (SELECT 1 FROM pricing p WHERE p.section_id = ps.id);`,
  `CREATE TABLE IF NOT EXISTS mock_exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    license_code TEXT NOT NULL,
    license_name_ar TEXT NOT NULL DEFAULT '',
    exam_number INTEGER NOT NULL DEFAULT 1,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS student_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  // Accounts created before students row was required: ensure every role=user has a students row
  `INSERT INTO students (user_id)
   SELECT ur.user_id FROM user_roles ur
   WHERE ur.role = 'user'
   AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = ur.user_id);`,
];

async function seedSignupPlaces() {
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

async function seedLicenseRequirements() {
  const jsonPath = join(__dirname, "../data/licenseRequirementsDefault.json");
  let defaultValue = "{}";
  try {
    defaultValue = readFileSync(jsonPath, "utf-8").trim();
  } catch {
    // minimal fallback
    defaultValue = '{"heroBadge":"","steps":[],"licenses":[]}';
  }
  await query(
    `INSERT INTO site_settings (setting_key, setting_value, setting_type, description, is_public)
     VALUES ('license_requirements_config', $1, 'json', 'محتوى صفحة متطلبات الرخصة', TRUE)
     ON CONFLICT (setting_key) DO NOTHING`,
    [defaultValue]
  );
}

async function run() {
  for (const statement of statements) {
    await query(statement);
  }
  await seedSignupPlaces();
  await seedLicenseRequirements();
  // eslint-disable-next-line no-console
  console.log("Database initialized successfully.");
}

run()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
