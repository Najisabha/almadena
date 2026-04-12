import { authRequired } from "./auth.js";
import { query } from "./db.js";

export async function adminRequired(req, res, next) {
  authRequired(req, res, async () => {
    try {
      const result = await query(
        "SELECT id FROM user_roles WHERE user_id = $1 AND role = 'admin' LIMIT 1",
        [req.user.sub]
      );
      if (result.rowCount === 0) {
        return res.status(403).json({ message: "غير مصرح: يتطلب صلاحيات المشرف" });
      }
      return next();
    } catch (error) {
      return res.status(500).json({ message: "فشل التحقق من الصلاحيات", detail: error.message });
    }
  });
}
