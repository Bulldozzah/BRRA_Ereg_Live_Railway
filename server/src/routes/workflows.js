import { Router } from 'express';
import pool from '../db.js';
import { executePaginatedQuery, parsePagination, success, error } from '../helpers.js';

const router = Router();

// GET /api/workflows — paginated list
router.get('/', async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const result = await executePaginatedQuery(pool, 'license_workflow', {
      ...pagination,
      searchColumns: ['title', 'task_description'],
      orderBy: 'order_level',
      orderDir: 'ASC',
    });

    for (const wf of result.data) {
      const [agencies] = await pool.query(
        `SELECT ba.id, ba.name FROM businessagency ba
         INNER JOIN license_workflow_agency lwa ON ba.id = lwa.businessagency_id
         WHERE lwa.workflow_id = ?`,
        [wf.id]
      );
      wf.agencies = agencies;

      const [groups] = await pool.query(
        `SELECT g.id, g.name FROM \`groups\` g
         INNER JOIN license_workflow_groups lwg ON g.id = lwg.group_id
         WHERE lwg.workflow_id = ?`,
        [wf.id]
      );
      wf.groups = groups;
    }

    return res.json(result);
  } catch (err) {
    console.error('GET /api/workflows error:', err);
    return error(res, 'Failed to fetch workflows', 500);
  }
});

// GET /api/workflows/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM license_workflow WHERE id = ? AND deleted = 0',
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'Workflow not found', 404);

    const [agencies] = await pool.query(
      `SELECT ba.* FROM businessagency ba
       INNER JOIN license_workflow_agency lwa ON ba.id = lwa.businessagency_id
       WHERE lwa.workflow_id = ?`,
      [req.params.id]
    );

    const [groups] = await pool.query(
      `SELECT g.* FROM \`groups\` g
       INNER JOIN license_workflow_groups lwg ON g.id = lwg.group_id
       WHERE lwg.workflow_id = ?`,
      [req.params.id]
    );

    const [users] = await pool.query(
      `SELECT lwu.user_id FROM license_workflow_users lwu
       WHERE lwu.workflow_id = ?`,
      [req.params.id]
    );

    return success(res, { ...rows[0], agencies, groups, users });
  } catch (err) {
    console.error('GET /api/workflows/:id error:', err);
    return error(res, 'Failed to fetch workflow', 500);
  }
});

export default router;
