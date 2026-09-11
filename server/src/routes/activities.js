import { Router } from 'express';
import pool from '../db.js';
import { executePaginatedQuery, parsePagination, success, error } from '../helpers.js';

const router = Router();

// GET /api/activities — paginated list
router.get('/', async (req, res) => {
  try {
    const pagination = parsePagination(req.query);

    // Business type filter: Activities → BusinessTypes via businesstypes_activities
    const extraWhere = [];
    const extraParams = [];
    if (req.query.business_type_id) {
      extraWhere.push(
        `id IN (SELECT businessactivity_id FROM businesstypes_activities WHERE businesstype_id = ?)`
      );
      extraParams.push(req.query.business_type_id);
    }
    // has_licenses=1 drops options that lead nowhere (no published licenses), so
    // cascading filter dropdowns never offer a dead end.
    if (req.query.has_licenses) {
      extraWhere.push(
        `id IN (
          SELECT DISTINCT la.businessactivity_id
          FROM licenses_activities la
          INNER JOIN businesslicense bl ON la.businesslicense_id = bl.id
          WHERE bl.deleted = 0 AND bl.status = 1
        )`
      );
      extraParams.push([]);
    }

    const result = await executePaginatedQuery(pool, 'businessactivity', {
      ...pagination,
      searchColumns: ['name', 'description'],
      extraWhere,
      extraParams,
      orderBy: 'name',
      orderDir: 'ASC',
    });

    for (const act of result.data) {
      const [[{ count }]] = await pool.query(
        `SELECT COUNT(DISTINCT bl.id) as count
         FROM businesslicense bl
         INNER JOIN licenses_activities la ON bl.id = la.businesslicense_id
         WHERE la.businessactivity_id = ? AND bl.deleted = 0 AND bl.status = 1`,
        [act.id]
      );
      act.license_count = count;
    }

    return res.json(result);
  } catch (err) {
    console.error('GET /api/activities error:', err);
    return error(res, 'Failed to fetch activities', 500);
  }
});

// GET /api/activities/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM businessactivity WHERE id = ? AND deleted = 0',
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'Activity not found', 404);

    const [licenses] = await pool.query(
      `SELECT bl.id, bl.name, bl.status, bl.agency_id
       FROM businesslicense bl
       INNER JOIN licenses_activities la ON bl.id = la.businesslicense_id
       WHERE la.businessactivity_id = ? AND bl.deleted = 0`,
      [req.params.id]
    );

    return success(res, { ...rows[0], licenses });
  } catch (err) {
    console.error('GET /api/activities/:id error:', err);
    return error(res, 'Failed to fetch activity', 500);
  }
});

export default router;
