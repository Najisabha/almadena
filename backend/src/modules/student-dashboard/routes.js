import express from "express";
import { query, pool } from "../../db.js";
import { authRequired } from "../../auth.js";
import { adminRequired } from "../../adminAuth.js";
import { deleteIdDocumentFileIfLocal } from "../../lib/idDocumentFiles.js";

const RECENT_EXAMS_LIMIT = 10;
const ID_IMAGE_STATUSES = new Set(["none", "pending", "waitlist", "accepted", "rejected"]);

export function buildStudentDashboardRouter() {
  const router = express.Router();

  /**
   * GET /api/dashboard
   * Returns a single payload with all student dashboard data:
   *   - theory_score, practical_score from students table (set by admin)
   *   - exam stats (total, passed, avg percentage) from mock_exam_attempts
   *   - recent exam attempts (last N)
   *   - student rank by avg exam percentage among all students
   */
  router.get("/dashboard", authRequired, async (req, res) => {
    try {
      const userId = req.user.sub;

      // Scores set by admin
      const studentRow = await query(
        "SELECT theory_score, practical_score FROM students WHERE user_id = $1 LIMIT 1",
        [userId]
      );
      const student = studentRow.rows[0] || {};

      // Exam attempt aggregates
      const aggRow = await query(
        `SELECT
           COUNT(*)::int AS total_exams,
           COALESCE(SUM(CASE WHEN passed THEN 1 ELSE 0 END), 0)::int AS passed_exams,
           COALESCE(AVG(percentage), 0)::float8 AS avg_percentage
         FROM mock_exam_attempts
         WHERE user_id = $1`,
        [userId]
      );
      const agg = aggRow.rows[0];

      // Recent exam attempts
      const attemptsRow = await query(
        `SELECT id, license_code, license_name_ar, exam_number, score, total_questions,
                percentage, passed, created_at
         FROM mock_exam_attempts
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, RECENT_EXAMS_LIMIT]
      );

      // Rank: position of this user among all students by avg exam percentage (DESC)
      // Students with no attempts are ranked after those with attempts.
      const rankRow = await query(
        `SELECT rank FROM (
           SELECT
             s.user_id,
             RANK() OVER (ORDER BY COALESCE(AVG(a.percentage), -1) DESC) AS rank
           FROM students s
           LEFT JOIN mock_exam_attempts a ON a.user_id = s.user_id
           GROUP BY s.user_id
         ) ranked
         WHERE user_id = $1`,
        [userId]
      );
      const rank = rankRow.rows[0]?.rank ?? null;

      const totalStudentsRow = await query("SELECT COUNT(*) AS total FROM students");
      const totalStudents = parseInt(totalStudentsRow.rows[0]?.total || "0", 10);

      return res.json({
        data: {
          theory_score: student.theory_score ?? null,
          practical_score: student.practical_score ?? null,
          total_exams: Number(agg.total_exams) || 0,
          passed_exams: Number(agg.passed_exams) || 0,
          avg_percentage: Number.isFinite(Number(agg.avg_percentage))
            ? parseFloat(Number(agg.avg_percentage).toFixed(1))
            : 0,
          recent_attempts: attemptsRow.rows,
          rank,
          total_students: totalStudents,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: "فشل تحميل بيانات اللوحة", detail: error.message });
    }
  });

  /**
   * GET /api/notifications
   * Returns the current student's notifications ordered by newest first.
   */
  router.get("/notifications", authRequired, async (req, res) => {
    try {
      const userId = req.user.sub;
      const result = await query(
        `SELECT id, message, is_read, created_at
         FROM student_notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 30`,
        [userId]
      );
      return res.json({ data: result.rows });
    } catch (error) {
      return res.status(500).json({ message: "فشل تحميل الإشعارات", detail: error.message });
    }
  });

  /**
   * PATCH /api/notifications/:id/read
   * Marks a notification as read.
   */
  router.patch("/notifications/:id/read", authRequired, async (req, res) => {
    try {
      const userId = req.user.sub;
      await query(
        "UPDATE student_notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2",
        [req.params.id, userId]
      );
      return res.json({ data: { ok: true } });
    } catch (error) {
      return res.status(500).json({ message: "فشل تحديث الإشعار", detail: error.message });
    }
  });

  /**
   * POST /api/exam-attempts
   * Records a completed mock exam attempt for the authenticated student.
   * Body: { license_code, license_name_ar, exam_number, score, total_questions, percentage, passed }
   */
  router.post("/exam-attempts", authRequired, async (req, res) => {
    try {
      const userId = req.user.sub;
      const { license_code, license_name_ar, exam_number, score, total_questions, percentage, passed } = req.body;

      if (!license_code || total_questions === undefined || score === undefined) {
        return res.status(400).json({ message: "بيانات الامتحان غير مكتملة" });
      }

      const result = await query(
        `INSERT INTO mock_exam_attempts
           (user_id, license_code, license_name_ar, exam_number, score, total_questions, percentage, passed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          userId,
          license_code,
          license_name_ar || license_code,
          exam_number || 1,
          score,
          total_questions,
          percentage,
          passed,
        ]
      );

      // Keep students counters in sync
      await query(
        `UPDATE students
         SET total_exams_taken = total_exams_taken + 1,
             last_exam_date = NOW(),
             updated_at = NOW()
         WHERE user_id = $1`,
        [userId]
      );

      return res.json({ data: result.rows[0] });
    } catch (error) {
      return res.status(500).json({ message: "فشل حفظ نتيجة الامتحان", detail: error.message });
    }
  });

  /**
   * POST /api/admin/notifications
   * Admin-only: sends a notification to a specific student.
   * Body: { user_id, message }
   */
  router.post("/admin/notifications", adminRequired, async (req, res) => {
    try {
      const { user_id, message } = req.body;
      if (!user_id || !message?.trim()) {
        return res.status(400).json({ message: "معرف الطالب والرسالة مطلوبان" });
      }

      const result = await query(
        `INSERT INTO student_notifications (user_id, message, created_by)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [user_id, message.trim(), req.user.sub]
      );

      return res.json({ data: result.rows[0] });
    } catch (error) {
      return res.status(500).json({ message: "فشل إرسال الإشعار", detail: error.message });
    }
  });

  /**
   * GET /api/admin/students-list
   * Admin-only: returns all students with their profile names for the notification UI.
   */
  router.get("/admin/students-list", adminRequired, async (req, res) => {
    try {
      const result = await query(
        `SELECT s.id,
                u.id AS user_id,
                COALESCE(p.first_name, '') AS first_name,
                COALESCE(p.last_name, '') AS last_name,
                p.license_type,
                p.date_of_birth,
                u.created_at AS registered_at,
                u.id_number,
                EXISTS (
                  SELECT 1 FROM user_roles ur
                  WHERE ur.user_id = u.id AND ur.role = 'admin'
                ) AS is_admin
         FROM users u
         LEFT JOIN profiles p ON p.id = u.id
         LEFT JOIN students s ON s.user_id = u.id
         ORDER BY COALESCE(NULLIF(TRIM(p.first_name || ' ' || p.last_name), ''), u.id_number)`
      );
      return res.json({ data: result.rows });
    } catch (error) {
      return res.status(500).json({ message: "فشل تحميل قائمة الطلاب", detail: error.message });
    }
  });

  /**
   * GET /api/admin/students
   * Admin-only: جميع المستخدمين من users (بما فيهم المشرفون)، مع profile وstudents إن وُجدت.
   */
  router.get("/admin/students", adminRequired, async (req, res) => {
    try {
      const result = await query(
        `SELECT s.id AS student_row_id,
                u.id AS user_id,
                u.id_number,
                s.theory_score,
                s.practical_score,
                COALESCE(s.total_exams_taken, 0) AS total_exams_taken,
                s.last_exam_date,
                s.notes,
                COALESCE(p.first_name, '') AS first_name,
                COALESCE(p.last_name, '') AS last_name,
                p.phone,
                p.license_type,
                p.id_image_url,
                COALESCE(p.id_image_status, 'none') AS id_image_status,
                COALESCE(p.id_image_pinned, FALSE) AS id_image_pinned,
                EXISTS (
                  SELECT 1 FROM user_roles ur
                  WHERE ur.user_id = u.id AND ur.role = 'admin'
                ) AS is_admin
         FROM users u
         LEFT JOIN profiles p ON p.id = u.id
         LEFT JOIN students s ON s.user_id = u.id
         ORDER BY u.created_at DESC`
      );
      const rows = result.rows.map((row) => ({
        id: row.student_row_id,
        user_id: row.user_id,
        id_number: row.id_number,
        is_admin: Boolean(row.is_admin),
        theory_score: row.theory_score,
        practical_score: row.practical_score,
        total_exams_taken: row.total_exams_taken,
        last_exam_date: row.last_exam_date,
        notes: row.notes,
        profiles: {
          first_name: row.first_name,
          last_name: row.last_name,
          phone: row.phone,
          license_type: row.license_type,
          id_image_url: row.id_image_url,
          id_image_status: row.id_image_status,
          id_image_pinned: Boolean(row.id_image_pinned),
        },
      }));
      return res.json({ data: rows });
    } catch (error) {
      return res.status(500).json({ message: "فشل تحميل بيانات الطلاب", detail: error.message });
    }
  });

  /**
   * GET /api/admin/me/is-admin
   * Authenticated: هل المستخدم الحالي لديه دور مشرف (للتحقق من الواجهة دون استخدام /table).
   */
  router.get("/admin/me/is-admin", authRequired, async (req, res) => {
    try {
      const result = await query(
        "SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin' LIMIT 1",
        [req.user.sub]
      );
      return res.json({ data: { isAdmin: result.rowCount > 0 } });
    } catch (error) {
      return res.status(500).json({ message: "فشل التحقق من الصلاحيات", detail: error.message });
    }
  });

  /**
   * GET /api/admin/users/:userId
   * Admin-only: جلب بيانات مستخدم واحد كاملة (users + profiles + students + is_admin).
   */
  router.get("/admin/users/:userId", adminRequired, async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await query(
        `SELECT u.id AS user_id,
                u.id_number,
                s.id AS student_row_id,
                s.theory_score,
                s.practical_score,
                COALESCE(s.total_exams_taken, 0) AS total_exams_taken,
                s.last_exam_date,
                s.notes,
                p.first_name,
                p.last_name,
                p.phone,
                p.license_type,
                p.city,
                p.town,
                p.full_address,
                p.date_of_birth,
                p.id_image_url,
                p.avatar_url,
                COALESCE(p.id_image_status, 'none') AS id_image_status,
                COALESCE(p.id_image_pinned, FALSE) AS id_image_pinned,
                EXISTS (
                  SELECT 1 FROM user_roles ur
                  WHERE ur.user_id = u.id AND ur.role = 'admin'
                ) AS is_admin
         FROM users u
         LEFT JOIN profiles p ON p.id = u.id
         LEFT JOIN students s ON s.user_id = u.id
         WHERE u.id = $1
         LIMIT 1`,
        [userId]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      const row = result.rows[0];
      return res.json({
        data: {
          user_id: row.user_id,
          id_number: row.id_number,
          is_admin: Boolean(row.is_admin),
          student: {
            id: row.student_row_id,
            theory_score: row.theory_score,
            practical_score: row.practical_score,
            total_exams_taken: row.total_exams_taken,
            last_exam_date: row.last_exam_date,
            notes: row.notes,
          },
          profile: {
            first_name: row.first_name ?? "",
            last_name: row.last_name ?? "",
            phone: row.phone,
            license_type: row.license_type,
            city: row.city,
            town: row.town,
            full_address: row.full_address,
            date_of_birth: row.date_of_birth,
            id_image_url: row.id_image_url,
            avatar_url: row.avatar_url,
            id_image_status: row.id_image_status,
            id_image_pinned: Boolean(row.id_image_pinned),
          },
        },
      });
    } catch (error) {
      return res.status(500).json({ message: "فشل جلب بيانات المستخدم", detail: error.message });
    }
  });

  /**
   * PATCH /api/admin/users/:userId
   * Admin-only: تحديث بيانات مستخدم بشكل موحّد داخل معاملة واحدة.
   * Body: { user?, profile?, student?, is_admin? }
   */
  router.patch("/admin/users/:userId", adminRequired, async (req, res) => {
    const { userId } = req.params;
    const { user: userPatch, profile: profilePatch, student: studentPatch, is_admin } = req.body || {};

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // ── users ──────────────────────────────────────────────────────────────
      if (userPatch && typeof userPatch === "object") {
        const USER_ALLOWED = ["id_number"];
        const keys = Object.keys(userPatch).filter((k) => USER_ALLOWED.includes(k));
        if (keys.length > 0) {
          if (userPatch.id_number !== undefined) {
            const conflict = await client.query(
              "SELECT id FROM users WHERE id_number = $1 AND id <> $2 LIMIT 1",
              [userPatch.id_number, userId]
            );
            if (conflict.rowCount > 0) {
              await client.query("ROLLBACK");
              return res.status(409).json({ message: "رقم الهوية مستخدم من قِبَل مستخدم آخر" });
            }
          }
          const assignments = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
          await client.query(
            `UPDATE users SET ${assignments} WHERE id = $${keys.length + 1}`,
            [...keys.map((k) => userPatch[k]), userId]
          );
        }
      }

      // ── profiles ───────────────────────────────────────────────────────────
      if (profilePatch && typeof profilePatch === "object") {
        if (
          profilePatch.id_image_status !== undefined &&
          !ID_IMAGE_STATUSES.has(profilePatch.id_image_status)
        ) {
          await client.query("ROLLBACK");
          return res.status(400).json({ message: "قيمة حالة صورة الهوية غير صالحة" });
        }
        const PROFILE_ALLOWED = [
          "first_name", "last_name", "phone", "license_type",
          "city", "town", "full_address", "date_of_birth", "id_image_url", "avatar_url",
          "id_image_status", "id_image_pinned",
        ];
        const keys = Object.keys(profilePatch).filter((k) => PROFILE_ALLOWED.includes(k));
        if (keys.length > 0) {
          if (keys.includes("id_image_url") && profilePatch.id_image_url === null) {
            const prevImg = await client.query(
              "SELECT id_image_url FROM profiles WHERE id = $1 LIMIT 1",
              [userId]
            );
            deleteIdDocumentFileIfLocal(prevImg.rows[0]?.id_image_url);
          }
          const existsProfile = await client.query("SELECT id FROM profiles WHERE id = $1 LIMIT 1", [userId]);
          if (existsProfile.rowCount > 0) {
            const assignments = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
            await client.query(
              `UPDATE profiles SET ${assignments}, updated_at = NOW() WHERE id = $${keys.length + 1}`,
              [...keys.map((k) => profilePatch[k]), userId]
            );
          } else {
            const allKeys = ["id", ...keys];
            const placeholders = allKeys.map((_, i) => `$${i + 1}`).join(", ");
            const defaultName = profilePatch.first_name || "";
            const insertKeys = keys.includes("first_name") ? keys : ["first_name", "last_name", ...keys.filter((k) => k !== "first_name" && k !== "last_name")];
            const finalKeys = [...new Set(["id", "first_name", "last_name", ...keys])];
            const finalPlaceholders = finalKeys.map((_, i) => `$${i + 1}`).join(", ");
            const finalValues = finalKeys.map((k) => {
              if (k === "id") return userId;
              if (k === "first_name") return profilePatch.first_name ?? defaultName;
              if (k === "last_name") return profilePatch.last_name ?? "";
              return profilePatch[k] ?? null;
            });
            await client.query(
              `INSERT INTO profiles (${finalKeys.join(", ")}) VALUES (${finalPlaceholders})`,
              finalValues
            );
          }
        }
      }

      // ── students ───────────────────────────────────────────────────────────
      if (studentPatch && typeof studentPatch === "object") {
        const STUDENT_ALLOWED = ["theory_score", "practical_score", "notes", "total_exams_taken", "last_exam_date"];
        const keys = Object.keys(studentPatch).filter((k) => STUDENT_ALLOWED.includes(k));
        if (keys.length > 0) {
          const existsStudent = await client.query("SELECT id FROM students WHERE user_id = $1 LIMIT 1", [userId]);
          if (existsStudent.rowCount > 0) {
            const assignments = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
            await client.query(
              `UPDATE students SET ${assignments}, updated_at = NOW() WHERE user_id = $${keys.length + 1}`,
              [...keys.map((k) => studentPatch[k]), userId]
            );
          } else {
            const insertKeys = ["user_id", ...keys];
            const placeholders = insertKeys.map((_, i) => `$${i + 1}`).join(", ");
            await client.query(
              `INSERT INTO students (${insertKeys.join(", ")}) VALUES (${placeholders})`,
              [userId, ...keys.map((k) => studentPatch[k])]
            );
          }
        }
      }

      // ── user_roles (is_admin) ──────────────────────────────────────────────
      if (typeof is_admin === "boolean") {
        if (is_admin) {
          await client.query(
            "INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin') ON CONFLICT DO NOTHING",
            [userId]
          );
        } else {
          const adminCount = await client.query(
            "SELECT COUNT(*) AS cnt FROM user_roles WHERE role = 'admin'"
          );
          const cnt = parseInt(adminCount.rows[0]?.cnt || "0", 10);
          if (cnt <= 1) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "لا يمكن إزالة صلاحية المشرف عن آخر مشرف في النظام" });
          }
          await client.query(
            "DELETE FROM user_roles WHERE user_id = $1 AND role = 'admin'",
            [userId]
          );
        }
      }

      await client.query("COMMIT");

      // إعادة البيانات المحدّثة
      const updated = await query(
        `SELECT u.id AS user_id,
                u.id_number,
                s.id AS student_row_id,
                s.theory_score,
                s.practical_score,
                COALESCE(s.total_exams_taken, 0) AS total_exams_taken,
                s.last_exam_date,
                s.notes,
                COALESCE(p.first_name, '') AS first_name,
                COALESCE(p.last_name, '') AS last_name,
                p.phone,
                p.license_type,
                p.city,
                p.town,
                p.full_address,
                p.date_of_birth,
                p.id_image_url,
                p.avatar_url,
                COALESCE(p.id_image_status, 'none') AS id_image_status,
                COALESCE(p.id_image_pinned, FALSE) AS id_image_pinned,
                EXISTS (
                  SELECT 1 FROM user_roles ur
                  WHERE ur.user_id = u.id AND ur.role = 'admin'
                ) AS is_admin
         FROM users u
         LEFT JOIN profiles p ON p.id = u.id
         LEFT JOIN students s ON s.user_id = u.id
         WHERE u.id = $1
         LIMIT 1`,
        [userId]
      );
      const row = updated.rows[0];
      return res.json({
        data: {
          id: row.student_row_id,
          user_id: row.user_id,
          id_number: row.id_number,
          is_admin: Boolean(row.is_admin),
          theory_score: row.theory_score,
          practical_score: row.practical_score,
          total_exams_taken: row.total_exams_taken,
          last_exam_date: row.last_exam_date,
          notes: row.notes,
          profiles: {
            first_name: row.first_name,
            last_name: row.last_name,
            phone: row.phone,
            license_type: row.license_type,
            city: row.city,
            town: row.town,
            full_address: row.full_address,
            date_of_birth: row.date_of_birth,
            id_image_url: row.id_image_url,
            avatar_url: row.avatar_url,
            id_image_status: row.id_image_status,
            id_image_pinned: Boolean(row.id_image_pinned),
          },
        },
      });
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch { /* ignore */ }
      return res.status(500).json({ message: "فشل تحديث بيانات المستخدم", detail: error.message });
    } finally {
      client.release();
    }
  });

  /**
   * DELETE /api/admin/users/:userId
   * Admin-only: حذف حساب مستخدم بالكامل (مع بياناته المرتبطة) داخل معاملة.
   */
  router.delete("/admin/users/:userId", adminRequired, async (req, res) => {
    const targetId = req.params.userId;
    const actorId = req.user.sub;

    if (targetId === actorId) {
      return res.status(403).json({ message: "لا يمكنك حذف حسابك أثناء تسجيل الدخول" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const exists = await client.query("SELECT id FROM users WHERE id = $1 LIMIT 1", [targetId]);
      if (exists.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      const isTargetAdmin = await client.query(
        "SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin' LIMIT 1",
        [targetId]
      );
      if (isTargetAdmin.rowCount > 0) {
        const adminCount = await client.query(
          "SELECT COUNT(*)::int AS cnt FROM user_roles WHERE role = 'admin'"
        );
        const cnt = parseInt(adminCount.rows[0]?.cnt ?? "0", 10);
        if (cnt <= 1) {
          await client.query("ROLLBACK");
          return res.status(400).json({ message: "لا يمكن حذف آخر مشرف في النظام" });
        }
      }

      const idDocRow = await client.query(
        "SELECT id_image_url FROM profiles WHERE id = $1 LIMIT 1",
        [targetId]
      );
      deleteIdDocumentFileIfLocal(idDocRow.rows[0]?.id_image_url);

      await client.query("DELETE FROM user_roles WHERE user_id = $1", [targetId]);
      await client.query("DELETE FROM students WHERE user_id = $1", [targetId]);
      await client.query("DELETE FROM profiles WHERE id = $1", [targetId]);
      await client.query("DELETE FROM users WHERE id = $1", [targetId]);

      await client.query("COMMIT");
      return res.json({ data: { message: "تم حذف الحساب بنجاح" } });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore */
      }
      return res.status(500).json({ message: "فشل حذف المستخدم", detail: error.message });
    } finally {
      client.release();
    }
  });

  return router;
}
