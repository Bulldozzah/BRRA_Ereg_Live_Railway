import { Router } from 'express';
import pool from '../db.js';
import { success, error } from '../helpers.js';

const router = Router();

// GET /api/users — fetch users with optional role filter
router.get('/', async (req, res) => {
  try {
    const { role, per_page = 200 } = req.query;

    let query, params = [];

    if (role === 'admin') {
      // Legacy SQL 5: getAllAdminUsersOnly()
      // Try is_admin column first; fall back to roles LIKE if column doesn't exist
      query = `SELECT id, username,
                 COALESCE(first_name, firstname) AS firstname,
                 COALESCE(last_name, lastname) AS lastname,
                 email
               FROM users
               WHERE is_admin = 1 AND enabled = 1
               ORDER BY id DESC
               LIMIT ?`;
      params.push(parseInt(per_page));
    } else {
      query = `SELECT id, username,
                 COALESCE(first_name, firstname) AS firstname,
                 COALESCE(last_name, lastname) AS lastname,
                 email, enabled
               FROM users
               ORDER BY id DESC
               LIMIT ?`;
      params.push(parseInt(per_page));
    }

    try {
      const [users] = await pool.query(query, params);
      return success(res, users);
    } catch (colErr) {
      // Fallback: if is_admin or first_name columns don't exist, try alternative
      console.warn('Users query fallback:', colErr.message);
      const fallbackQuery = `SELECT id, username, first_name AS firstname, last_name AS lastname, email, enabled
                             FROM users WHERE enabled = 1
                             ORDER BY id DESC LIMIT ?`;
      const [users] = await pool.query(fallbackQuery, [parseInt(per_page)]);
      return success(res, users);
    }
  } catch (err) {
    console.error('GET /api/users error:', err);
    return error(res, 'Failed to fetch users', 500);
  }
});

export default router;
