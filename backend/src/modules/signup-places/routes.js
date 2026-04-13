import express from "express";
import { query } from "../../db.js";
import { adminRequired } from "../../adminAuth.js";

// ─── helpers ────────────────────────────────────────────────────────────────

async function buildPlacesMap() {
  const { rows } = await query(`
    SELECT c.name_ar AS city, t.name_ar AS town
    FROM signup_cities c
    LEFT JOIN signup_towns t ON t.city_id = c.id
    ORDER BY c.display_order ASC, c.name_ar ASC,
             t.display_order ASC, t.name_ar ASC
  `);

  const map = {};
  for (const row of rows) {
    if (!map[row.city]) map[row.city] = [];
    if (row.town) map[row.city].push(row.town);
  }
  return map;
}

async function buildAdminTree() {
  const { rows: cities } = await query(`
    SELECT id, name_ar, display_order FROM signup_cities
    ORDER BY display_order ASC, name_ar ASC
  `);
  if (!cities.length) return [];

  const cityIds = cities.map((c) => c.id);
  const placeholders = cityIds.map((_, i) => `$${i + 1}`).join(", ");
  const { rows: towns } = await query(
    `SELECT id, city_id, name_ar, display_order
     FROM signup_towns
     WHERE city_id IN (${placeholders})
     ORDER BY display_order ASC, name_ar ASC`,
    cityIds
  );

  const townsByCity = {};
  for (const t of towns) {
    if (!townsByCity[t.city_id]) townsByCity[t.city_id] = [];
    townsByCity[t.city_id].push({ id: t.id, name_ar: t.name_ar, display_order: t.display_order });
  }

  return cities.map((c) => ({
    id: c.id,
    name_ar: c.name_ar,
    display_order: c.display_order,
    towns: townsByCity[c.id] || [],
  }));
}

// ─── router ─────────────────────────────────────────────────────────────────

export function buildSignupPlacesRouter() {
  const router = express.Router();

  /**
   * GET /api/signup-places
   * قراءة عامة — خريطة مدينة → بلدات (بدون توكن)
   */
  router.get("/", async (_req, res) => {
    try {
      const places = await buildPlacesMap();
      return res.json({ data: { places } });
    } catch (error) {
      return res.status(500).json({ message: "فشل جلب الأماكن", detail: error.message });
    }
  });

  /**
   * GET /api/signup-places/admin
   * شجرة كاملة مع IDs — للمشرف فقط
   */
  router.get("/admin", adminRequired, async (_req, res) => {
    try {
      const tree = await buildAdminTree();
      return res.json({ data: { cities: tree } });
    } catch (error) {
      return res.status(500).json({ message: "فشل جلب الشجرة", detail: error.message });
    }
  });

  // ── مدن ──────────────────────────────────────────────────────────────────

  /**
   * POST /api/signup-places/cities
   * { name_ar: string, display_order?: number }
   */
  router.post("/cities", adminRequired, async (req, res) => {
    try {
      const name = (req.body?.name_ar || "").trim();
      if (!name) return res.status(400).json({ message: "name_ar مطلوب" });

      const displayOrder = Number(req.body?.display_order ?? 0);
      const { rows } = await query(
        `INSERT INTO signup_cities (name_ar, display_order)
         VALUES ($1, $2)
         RETURNING id, name_ar, display_order, created_at`,
        [name, displayOrder]
      );
      return res.status(201).json({ data: rows[0] });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({ message: "المدينة موجودة مسبقاً" });
      }
      return res.status(400).json({ message: "فشل إضافة المدينة", detail: error.message });
    }
  });

  /**
   * PATCH /api/signup-places/cities/:cityId
   * { name_ar?: string, display_order?: number }
   */
  router.patch("/cities/:cityId", adminRequired, async (req, res) => {
    try {
      const { cityId } = req.params;
      const fields = [];
      const values = [];
      let idx = 1;

      const name = (req.body?.name_ar || "").trim();
      if (name) { fields.push(`name_ar = $${idx++}`); values.push(name); }

      if (req.body?.display_order !== undefined) {
        fields.push(`display_order = $${idx++}`);
        values.push(Number(req.body.display_order));
      }

      if (!fields.length) return res.status(400).json({ message: "لا توجد حقول للتحديث" });

      fields.push(`updated_at = NOW()`);
      values.push(cityId);

      const { rows } = await query(
        `UPDATE signup_cities SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, name_ar, display_order`,
        values
      );
      if (!rows.length) return res.status(404).json({ message: "المدينة غير موجودة" });
      return res.json({ data: rows[0] });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({ message: "الاسم موجود مسبقاً" });
      }
      return res.status(400).json({ message: "فشل تعديل المدينة", detail: error.message });
    }
  });

  /**
   * DELETE /api/signup-places/cities/:cityId
   * يحذف المدينة وجميع بلداتها (CASCADE)
   */
  router.delete("/cities/:cityId", adminRequired, async (req, res) => {
    try {
      const { cityId } = req.params;
      const { rows } = await query(
        `DELETE FROM signup_cities WHERE id = $1 RETURNING id, name_ar`,
        [cityId]
      );
      if (!rows.length) return res.status(404).json({ message: "المدينة غير موجودة" });
      return res.json({ data: rows[0] });
    } catch (error) {
      return res.status(400).json({ message: "فشل حذف المدينة", detail: error.message });
    }
  });

  // ── بلدات ─────────────────────────────────────────────────────────────────

  /**
   * POST /api/signup-places/cities/:cityId/towns
   * { name_ar: string, display_order?: number }
   */
  router.post("/cities/:cityId/towns", adminRequired, async (req, res) => {
    try {
      const { cityId } = req.params;
      const name = (req.body?.name_ar || "").trim();
      if (!name) return res.status(400).json({ message: "name_ar مطلوب" });

      const displayOrder = Number(req.body?.display_order ?? 0);

      const cityCheck = await query(`SELECT id FROM signup_cities WHERE id = $1 LIMIT 1`, [cityId]);
      if (!cityCheck.rows.length) return res.status(404).json({ message: "المدينة غير موجودة" });

      const { rows } = await query(
        `INSERT INTO signup_towns (city_id, name_ar, display_order)
         VALUES ($1, $2, $3)
         RETURNING id, city_id, name_ar, display_order, created_at`,
        [cityId, name, displayOrder]
      );
      return res.status(201).json({ data: rows[0] });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({ message: "البلدة موجودة مسبقاً في هذه المدينة" });
      }
      return res.status(400).json({ message: "فشل إضافة البلدة", detail: error.message });
    }
  });

  /**
   * PATCH /api/signup-places/towns/:townId
   * { name_ar?: string, display_order?: number }
   */
  router.patch("/towns/:townId", adminRequired, async (req, res) => {
    try {
      const { townId } = req.params;
      const fields = [];
      const values = [];
      let idx = 1;

      const name = (req.body?.name_ar || "").trim();
      if (name) { fields.push(`name_ar = $${idx++}`); values.push(name); }

      if (req.body?.display_order !== undefined) {
        fields.push(`display_order = $${idx++}`);
        values.push(Number(req.body.display_order));
      }

      if (!fields.length) return res.status(400).json({ message: "لا توجد حقول للتحديث" });

      fields.push(`updated_at = NOW()`);
      values.push(townId);

      const { rows } = await query(
        `UPDATE signup_towns SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, city_id, name_ar, display_order`,
        values
      );
      if (!rows.length) return res.status(404).json({ message: "البلدة غير موجودة" });
      return res.json({ data: rows[0] });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({ message: "الاسم موجود مسبقاً في هذه المدينة" });
      }
      return res.status(400).json({ message: "فشل تعديل البلدة", detail: error.message });
    }
  });

  /**
   * DELETE /api/signup-places/towns/:townId
   */
  router.delete("/towns/:townId", adminRequired, async (req, res) => {
    try {
      const { townId } = req.params;
      const { rows } = await query(
        `DELETE FROM signup_towns WHERE id = $1 RETURNING id, city_id, name_ar`,
        [townId]
      );
      if (!rows.length) return res.status(404).json({ message: "البلدة غير موجودة" });
      return res.json({ data: rows[0] });
    } catch (error) {
      return res.status(400).json({ message: "فشل حذف البلدة", detail: error.message });
    }
  });

  return router;
}
