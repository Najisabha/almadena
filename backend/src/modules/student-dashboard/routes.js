import express from "express";
import { query } from "../../db.js";
import { authRequired } from "../../auth.js";
import { adminRequired } from "../../adminAuth.js";

const RECENT_EXAMS_LIMIT = 10;

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
           COUNT(*) AS total_exams,
           SUM(CASE WHEN passed THEN 1 ELSE 0 END) AS passed_exams,
           COALESCE(AVG(percentage), 0) AS avg_percentage
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
          total_exams: parseInt(agg.total_exams, 10),
          passed_exams: parseInt(agg.passed_exams, 10),
          avg_percentage: parseFloat(parseFloat(agg.avg_percentage).toFixed(1)),
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
        },
      }));
      return res.json({ data: rows });
    } catch (error) {
      return res.status(500).json({ message: "فشل تحميل بيانات الطلاب", detail: error.message });
    }
  });

  return router;
}
