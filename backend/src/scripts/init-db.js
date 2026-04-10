import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { query, pool } from "../db.js";

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
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    review TEXT NOT NULL,
    pass_date DATE NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL DEFAULT '',
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    image_url TEXT,
    category TEXT CHECK (category IN ('اشارات مرور', 'قوانين', 'ميكانيك')),
    sign_code TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS sign_code TEXT;`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_d TEXT NOT NULL DEFAULT '';`,
  `ALTER TABLE questions DROP COLUMN IF EXISTS question_type;`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_a_image_url TEXT;`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_b_image_url TEXT;`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_c_image_url TEXT;`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_d_image_url TEXT;`,
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
  `CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'text',
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    appointment_type TEXT NOT NULL CHECK (appointment_type IN ('theory_exam', 'practical_exam', 'lesson', 'consultation')),
    appointment_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    instructor_name TEXT,
    location TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    material_type TEXT NOT NULL CHECK (material_type IN ('video', 'pdf', 'zoom', 'article', 'quiz')),
    content_url TEXT,
    zoom_meeting_id TEXT,
    zoom_password TEXT,
    scheduled_date TIMESTAMPTZ,
    duration_minutes INTEGER,
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
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
    UNIQUE (section_key, sign_number),
    UNIQUE (sign_code)
  );`,
  `ALTER TABLE traffic_signs ADD COLUMN IF NOT EXISTS sign_number INTEGER;`,
  `ALTER TABLE traffic_signs ADD COLUMN IF NOT EXISTS sign_code TEXT;`,
  `ALTER TABLE traffic_signs ADD COLUMN IF NOT EXISTS image_url TEXT;`,
  `ALTER TABLE traffic_signs DROP COLUMN IF EXISTS display_order;`,
  `UPDATE licenses
   SET code = 'D1', name_ar = 'عمومي', display_order = 4, updated_at = NOW()
   WHERE code = 'D' AND NOT EXISTS (SELECT 1 FROM licenses WHERE code = 'D1');`,
  `INSERT INTO licenses (code, name_ar, display_order, is_active)
   VALUES
   ('B', 'خصوصي', 1, TRUE),
   ('C1', 'شحن خفيف', 2, TRUE),
   ('C', 'شحن ثقيل', 3, TRUE),
   ('D1', 'عمومي', 4, TRUE),
   ('A', 'دراجة نارية', 5, TRUE),
   ('T', 'تراكتور', 6, TRUE)
   ON CONFLICT (code) DO UPDATE
   SET name_ar = EXCLUDED.name_ar,
       display_order = EXCLUDED.display_order,
       is_active = EXCLUDED.is_active,
       updated_at = NOW();`,
  `INSERT INTO site_settings (setting_key, setting_value, setting_type, description, is_public)
   VALUES
   ('site_phone', '050-1234567', 'phone', 'رقم هاتف المدرسة', TRUE),
   ('site_email', 'info@almadina-academy.com', 'email', 'البريد الإلكتروني', TRUE),
   ('site_address', 'المدينة، فلسطين', 'text', 'عنوان المدرسة', TRUE),
   ('whatsapp_number', '972501234567', 'phone', 'رقم واتساب', TRUE),
   ('facebook_url', 'https://facebook.com/almadina', 'url', 'رابط صفحة فيسبوك', TRUE),
   ('instagram_url', 'https://instagram.com/almadina', 'url', 'رابط حساب انستغرام', TRUE)
   ON CONFLICT (setting_key) DO NOTHING;`,
];

async function seedAdmin() {
  const ADMIN_ID_NUMBER = "123456789";
  const ADMIN_PASSWORD = "123456789";

  const exists = await query("SELECT id FROM users WHERE id_number = $1 LIMIT 1", [ADMIN_ID_NUMBER]);
  if (exists.rowCount > 0) {
    // eslint-disable-next-line no-console
    console.log("Admin account already exists, skipping seed.");
    return;
  }

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const userResult = await query(
    "INSERT INTO users (id_number, password_hash) VALUES ($1, $2) RETURNING id",
    [ADMIN_ID_NUMBER, hash]
  );
  const adminId = userResult.rows[0].id;

  await query("INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin') ON CONFLICT DO NOTHING", [adminId]);
  await query(
    `INSERT INTO profiles (id, first_name, last_name) VALUES ($1, 'Admin', 'User') ON CONFLICT DO NOTHING`,
    [adminId]
  );
  // eslint-disable-next-line no-console
  console.log("Admin account seeded successfully (id_number: 123456789).");
}

async function run() {
  for (const statement of statements) {
    await query(statement);
  }
  await seedAdmin();
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
