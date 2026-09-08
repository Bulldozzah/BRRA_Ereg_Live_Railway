import { Router } from 'express';
import pool from '../db.js';
import { success, error } from '../helpers.js';

const router = Router();

// GET /api/search?q=term — global search across licenses, regulations, agencies, news
router.get('/', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q || q.length < 2) {
      return error(res, 'Search query must be at least 2 characters');
    }

    const searchTerm = `%${q}%`;

    const [licenses] = await pool.query(
      `SELECT id, name, status, slug, 'license' AS result_type
       FROM businesslicense
       WHERE deleted = 0 AND (name LIKE ? OR keywords LIKE ? OR description LIKE ? OR license_no LIKE ?)
       ORDER BY views DESC
       LIMIT 10`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );

    const [regulations] = await pool.query(
      `SELECT id, title AS name, slug, 'regulation' AS result_type
       FROM regulations
       WHERE deleted = 0 AND published = 1 AND (title LIKE ? OR description LIKE ? OR keywords LIKE ?)
       LIMIT 10`,
      [searchTerm, searchTerm, searchTerm]
    );

    const [agencies] = await pool.query(
      `SELECT id, name, slug, 'agency' AS result_type
       FROM businessagency
       WHERE deleted = 0 AND (name LIKE ? OR title LIKE ? OR acronym LIKE ?)
       LIMIT 10`,
      [searchTerm, searchTerm, searchTerm]
    );

    const [news] = await pool.query(
      `SELECT id, title AS name, 'news' AS result_type
       FROM news
       WHERE deleted = 0 AND published = 1 AND (title LIKE ? OR article LIKE ?)
       LIMIT 10`,
      [searchTerm, searchTerm]
    );

    return success(res, {
      licenses,
      regulations,
      agencies,
      news,
      total: licenses.length + regulations.length + agencies.length + news.length,
    });
  } catch (err) {
    console.error('GET /api/search error:', err);
    return error(res, 'Search failed', 500);
  }
});

export default router;
