import { Router } from 'express';
import pool from '../db.js';
import { executePaginatedQuery, parsePagination, success, error } from '../helpers.js';

const router = Router();

// GET /api/industries — paginated list
router.get('/', async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const filters = {};
    if (req.query.show_in_browse) filters.show_in_browse = req.query.show_in_browse;

    const result = await executePaginatedQuery(pool, 'businessindustry', {
      ...pagination,
      searchColumns: ['name', 'description'],
      filters,
      orderBy: 'name',
      orderDir: 'ASC',
    });

    // Attach license counts per industry via: License → Activities → BusinessTypes → Industries
    for (const industry of result.data) {
      const [[{ count }]] = await pool.query(
        `SELECT COUNT(DISTINCT la.businesslicense_id) as count
         FROM businesstypes_industries bti
         INNER JOIN businesstypes_activities bta ON bti.businesstype_id = bta.businesstype_id
         INNER JOIN licenses_activities la ON bta.businessactivity_id = la.businessactivity_id
         INNER JOIN businesslicense bl ON la.businesslicense_id = bl.id
         WHERE bti.businessindustry_id = ? AND bl.deleted = 0 AND bl.status = 1`,
        [industry.id]
      );
      industry.license_count = count;
    }

    return res.json(result);
  } catch (err) {
    console.error('GET /api/industries error:', err);
    return error(res, 'Failed to fetch industries', 500);
  }
});

// GET /api/industries/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM businessindustry WHERE id = ? AND deleted = 0',
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'Industry not found', 404);

    const [agencies] = await pool.query(
      `SELECT ba.* FROM businessagency ba
       INNER JOIN businessagency_industries bai ON ba.id = bai.businessagency_id
       WHERE bai.businessindustry_id = ? AND ba.deleted = 0`,
      [req.params.id]
    );

    return success(res, { ...rows[0], agencies });
  } catch (err) {
    console.error('GET /api/industries/:id error:', err);
    return error(res, 'Failed to fetch industry', 500);
  }
});

export default router;
