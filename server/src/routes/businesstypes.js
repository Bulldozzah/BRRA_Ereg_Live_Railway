import { Router } from 'express';
import pool from '../db.js';
import { executePaginatedQuery, parsePagination, success, error } from '../helpers.js';

const router = Router();

// GET /api/businesstypes — paginated list with license & activity counts
router.get('/', async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const filters = { deleted: 0 };
    if (req.query.show_in_browse) filters.show_in_browse = req.query.show_in_browse;
    if (req.query.industry_id) {
      // Will be handled via extraWhere
    }

    const extraWhere = [];
    const extraParams = [];
    if (req.query.industry_id) {
      extraWhere.push(
        `id IN (SELECT businesstype_id FROM businesstypes_industries WHERE businessindustry_id = ?)`
      );
      extraParams.push(req.query.industry_id);
    }

    const result = await executePaginatedQuery(pool, 'businesstype', {
      ...pagination,
      searchColumns: ['name', 'description'],
      filters,
      extraWhere,
      extraParams,
      orderBy: 'name',
      orderDir: 'ASC',
    });

    for (const bt of result.data) {
      const [[{ lcount }]] = await pool.query(
        `SELECT COUNT(DISTINCT bl.id) as lcount
         FROM businesslicense bl
         INNER JOIN licenses_activities la ON bl.id = la.businesslicense_id
         INNER JOIN businesstypes_activities bta ON la.businessactivity_id = bta.businessactivity_id
         WHERE bta.businesstype_id = ? AND bl.deleted = 0 AND bl.status = 1`,
        [bt.id]
      );
      bt.license_count = lcount;

      const [[{ acount }]] = await pool.query(
        `SELECT COUNT(DISTINCT bta.businessactivity_id) as acount
         FROM businesstypes_activities bta
         INNER JOIN businessactivity ba ON bta.businessactivity_id = ba.id
         WHERE bta.businesstype_id = ? AND ba.deleted = 0`,
        [bt.id]
      );
      bt.activity_count = acount;

      // Fetch activities for this business type
      const [activities] = await pool.query(
        `SELECT ba.id, ba.name FROM businessactivity ba
         INNER JOIN businesstypes_activities bta ON ba.id = bta.businessactivity_id
         WHERE bta.businesstype_id = ? AND ba.deleted = 0
         ORDER BY ba.name ASC`,
        [bt.id]
      );
      bt.activities = activities;

      // Fetch industries for this business type
      const [industries] = await pool.query(
        `SELECT bi.id, bi.name FROM businessindustry bi
         INNER JOIN businesstypes_industries bti ON bi.id = bti.businessindustry_id
         WHERE bti.businesstype_id = ? AND bi.deleted = 0
         ORDER BY bi.name ASC`,
        [bt.id]
      );
      bt.industries = industries;
    }

    return res.json(result);
  } catch (err) {
    console.error('GET /api/businesstypes error:', err);
    return error(res, 'Failed to fetch business types', 500);
  }
});

// GET /api/businesstypes/:id/licenses — published licenses for a business type
router.get('/:id/licenses', async (req, res) => {
  try {
    const [btRows] = await pool.query(
      'SELECT * FROM businesstype WHERE id = ? AND deleted = 0',
      [req.params.id]
    );
    if (btRows.length === 0) return error(res, 'Business type not found', 404);

    const [licenses] = await pool.query(
      `SELECT DISTINCT bl.*, a.name AS agency_name, loc.name AS location_name
       FROM businesslicense bl
       INNER JOIN licenses_activities la ON bl.id = la.businesslicense_id
       INNER JOIN businesstypes_activities bta ON la.businessactivity_id = bta.businessactivity_id
       LEFT JOIN businessagency a ON bl.agency_id = a.id
       LEFT JOIN businesslocation loc ON bl.location_id = loc.id
       WHERE bta.businesstype_id = ? AND bl.deleted = 0 AND bl.status = 1
       ORDER BY bl.name ASC`,
      [req.params.id]
    );

    return success(res, {
      business_type: btRows[0],
      licenses,
      total: licenses.length,
    });
  } catch (err) {
    console.error('GET /api/businesstypes/:id/licenses error:', err);
    return error(res, 'Failed to fetch licenses for business type', 500);
  }
});

// GET /api/businesstypes/:id — single business type with activities and industries
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM businesstype WHERE id = ? AND deleted = 0',
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'Business type not found', 404);

    const [activities] = await pool.query(
      `SELECT ba.* FROM businessactivity ba
       INNER JOIN businesstypes_activities bta ON ba.id = bta.businessactivity_id
       WHERE bta.businesstype_id = ? AND ba.deleted = 0`,
      [req.params.id]
    );

    const [industries] = await pool.query(
      `SELECT bi.* FROM businessindustry bi
       INNER JOIN businesstypes_industries bti ON bi.id = bti.businessindustry_id
       WHERE bti.businesstype_id = ? AND bi.deleted = 0`,
      [req.params.id]
    );

    return success(res, { ...rows[0], activities, industries });
  } catch (err) {
    console.error('GET /api/businesstypes/:id error:', err);
    return error(res, 'Failed to fetch business type', 500);
  }
});

export default router;
