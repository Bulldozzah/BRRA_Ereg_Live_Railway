import { Router } from 'express';
import pool from '../db.js';
import { success, error } from '../helpers.js';

const router = Router();

// Ensure the link_clicks table exists
const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS link_clicks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      license_id INT NULL,
      license_name VARCHAR(255) NULL,
      agency_id INT NULL,
      url VARCHAR(1024) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_created_at (created_at),
      INDEX idx_agency_id (agency_id),
      INDEX idx_license_id (license_id)
    )
  `);
};
ensureTable().catch(err => console.error('link_clicks table setup error:', err));

// POST /api/link-clicks — record a click
router.post('/', async (req, res) => {
  try {
    const { license_id, license_name, agency_id, url } = req.body;
    if (!url) return error(res, 'url is required');

    await pool.query(
      `INSERT INTO link_clicks (license_id, license_name, agency_id, url) VALUES (?, ?, ?, ?)`,
      [license_id || null, license_name || null, agency_id || null, url]
    );

    success(res, { recorded: true });
  } catch (err) {
    console.error('POST /api/link-clicks error:', err);
    error(res, 'Failed to record click', 500);
  }
});

// Helper: build date range WHERE clause
const dateRangeWhere = (start_date, end_date) => {
  const conditions = [];
  const params = [];
  if (start_date) {
    conditions.push('created_at >= ?');
    params.push(start_date);
  }
  if (end_date) {
    conditions.push('created_at <= ?');
    params.push(end_date + ' 23:59:59');
  }
  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
};

// GET /api/link-clicks/stats — get click stats (admin) with date range
router.get('/stats', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const { where, params } = dateRangeWhere(start_date, end_date);

    const [rows] = await pool.query(
      `SELECT lc.url, lc.license_id, lc.license_name, lc.agency_id, COUNT(*) AS click_count,
              MIN(lc.created_at) AS first_click, MAX(lc.created_at) AS last_click,
              ba.name AS agency_name
       FROM link_clicks lc
       LEFT JOIN businessagency ba ON lc.agency_id = ba.id
       ${where}
       GROUP BY lc.url, lc.license_id, lc.license_name, lc.agency_id
       ORDER BY click_count DESC
       LIMIT 100`,
      params
    );
    success(res, rows);
  } catch (err) {
    console.error('GET /api/link-clicks/stats error:', err);
    error(res, 'Failed to fetch click stats', 500);
  }
});

// GET /api/link-clicks/summary — aggregate stats for dashboard with date range
router.get('/summary', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const { where, params } = dateRangeWhere(start_date, end_date);

    const [[{ total_clicks }]] = await pool.query(
      `SELECT COALESCE(COUNT(*), 0) AS total_clicks FROM link_clicks ${where}`,
      params
    );
    const [[{ unique_links }]] = await pool.query(
      `SELECT COUNT(DISTINCT url) AS unique_links FROM link_clicks ${where}`,
      params
    );
    const [topAgencies] = await pool.query(
      `SELECT ba.name AS agency_name, COUNT(*) AS clicks
       FROM link_clicks lc
       INNER JOIN businessagency ba ON lc.agency_id = ba.id
       ${where}
       GROUP BY lc.agency_id
       ORDER BY clicks DESC
       LIMIT 10`,
      params
    );
    const [topLicenses] = await pool.query(
      `SELECT lc.license_name, COUNT(*) AS clicks
       FROM link_clicks lc
       WHERE lc.license_name IS NOT NULL
       ${where ? where.replace('WHERE', 'AND') : ''}
       GROUP BY lc.license_id, lc.license_name
       ORDER BY clicks DESC
       LIMIT 10`,
      params
    );
    const [dailyClicks] = await pool.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS clicks
       FROM link_clicks
       ${where}
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`,
      params
    );

    success(res, {
      total_clicks,
      unique_links,
      top_agencies: topAgencies,
      top_licenses: topLicenses,
      daily_clicks: dailyClicks,
    });
  } catch (err) {
    console.error('GET /api/link-clicks/summary error:', err);
    error(res, 'Failed to fetch click summary', 500);
  }
});

export default router;
