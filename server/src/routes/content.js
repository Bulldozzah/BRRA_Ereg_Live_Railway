import { Router } from 'express';
import pool from '../db.js';
import { executePaginatedQuery, parsePagination, success, error } from '../helpers.js';

const router = Router();

// ======================== NEWS ========================

// GET /api/content/news
router.get('/news', async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const result = await executePaginatedQuery(pool, 'news', {
      ...pagination,
      searchColumns: ['title', 'article'],
      filters: { published: 1 },
    });
    return res.json(result);
  } catch (err) {
    console.error('GET /api/content/news error:', err);
    return error(res, 'Failed to fetch news', 500);
  }
});

// GET /api/content/news/:id
router.get('/news/:id', async (req, res) => {
  try {
    // Increment views
    await pool.query('UPDATE news SET hits = hits + 1 WHERE id = ?', [req.params.id]);

    const [rows] = await pool.query(
      'SELECT * FROM news WHERE id = ? AND deleted = 0',
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'Article not found', 404);
    return success(res, rows[0]);
  } catch (err) {
    console.error('GET /api/content/news/:id error:', err);
    return error(res, 'Failed to fetch article', 500);
  }
});

// ======================== FAQ ========================

// GET /api/content/faqs
router.get('/faqs', async (req, res) => {
  try {
    const site = req.query.site || 2;
    const [rows] = await pool.query(
      `SELECT * FROM faq WHERE published = 1 AND deleted = 0 AND site = ?
       ORDER BY order_level ASC, id ASC`,
      [site]
    );
    return success(res, rows);
  } catch (err) {
    console.error('GET /api/content/faqs error:', err);
    return error(res, 'Failed to fetch FAQs', 500);
  }
});

// ======================== PAGES ========================

// GET /api/content/pages
router.get('/pages', async (req, res) => {
  try {
    const site = req.query.site || 2;
    const [rows] = await pool.query(
      `SELECT id, page_title, page_breadcrumb_title, slug, page_order, menu_id, parent_id, site
       FROM page WHERE published = 1 AND deleted = 0 AND site = ?
       ORDER BY page_order ASC`,
      [site]
    );
    return success(res, rows);
  } catch (err) {
    console.error('GET /api/content/pages error:', err);
    return error(res, 'Failed to fetch pages', 500);
  }
});

// GET /api/content/pages/:slug
router.get('/pages/slug/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM page WHERE slug = ? AND deleted = 0',
      [req.params.slug]
    );
    if (rows.length === 0) return error(res, 'Page not found', 404);
    return success(res, rows[0]);
  } catch (err) {
    console.error('GET /api/content/pages/:slug error:', err);
    return error(res, 'Failed to fetch page', 500);
  }
});

// ======================== BANNERS ========================

// GET /api/content/banners
router.get('/banners', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM banner WHERE deleted = 0 ORDER BY created DESC'
    );
    return success(res, rows);
  } catch (err) {
    console.error('GET /api/content/banners error:', err);
    return error(res, 'Failed to fetch banners', 500);
  }
});

// GET /api/content/regulation-banners
router.get('/regulation-banners', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM regulation_banners WHERE deleted = 0 ORDER BY created DESC'
    );
    return success(res, rows);
  } catch (err) {
    console.error('GET /api/content/regulation-banners error:', err);
    return error(res, 'Failed to fetch regulation banners', 500);
  }
});

// ======================== POLICIES ========================

// GET /api/content/policies
router.get('/policies', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, pt.title AS policy_type_name
       FROM policies p
       LEFT JOIN policy_type pt ON p.policy_type_id = pt.id
       WHERE p.published = 1 AND p.deleted = 0
       ORDER BY p.created DESC`
    );
    return success(res, rows);
  } catch (err) {
    console.error('GET /api/content/policies error:', err);
    return error(res, 'Failed to fetch policies', 500);
  }
});

// GET /api/content/policies/:slug
router.get('/policies/slug/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, pt.title AS policy_type_name
       FROM policies p
       LEFT JOIN policy_type pt ON p.policy_type_id = pt.id
       WHERE p.slug = ? AND p.deleted = 0`,
      [req.params.slug]
    );
    if (rows.length === 0) return error(res, 'Policy not found', 404);
    return success(res, rows[0]);
  } catch (err) {
    console.error('GET /api/content/policies/:slug error:', err);
    return error(res, 'Failed to fetch policy', 500);
  }
});

// ======================== MENUS ========================

// GET /api/content/menus
router.get('/menus', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM menu WHERE published = 1 AND deleted = 0 ORDER BY id ASC'
    );
    return success(res, rows);
  } catch (err) {
    console.error('GET /api/content/menus error:', err);
    return error(res, 'Failed to fetch menus', 500);
  }
});

// ======================== FEEDBACK ========================

// POST /api/content/feedback
router.post('/feedback', async (req, res) => {
  try {
    const { subject, type, first_name, last_name, email, message, site } = req.body;
    if (!subject || !email || !message) {
      return error(res, 'Subject, email, and message are required');
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [result] = await pool.query(
      `INSERT INTO feedback (subject, type, first_name, last_name, email, message, site, replied, created, updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [subject, type || 'general', first_name || '', last_name || '', email, message, site || 2, now, now]
    );

    return success(res, { id: result.insertId }, 201);
  } catch (err) {
    console.error('POST /api/content/feedback error:', err);
    return error(res, 'Failed to submit feedback', 500);
  }
});

// ======================== BUSINESS PROCEDURES ========================

// GET /api/content/procedures
router.get('/procedures', async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM procedure_category WHERE deleted = 0 AND publish = 1 ORDER BY title ASC'
    );

    const [procedures] = await pool.query(
      'SELECT * FROM business_startup WHERE deleted = 0 AND is_published = 1 ORDER BY name ASC'
    );

    return success(res, { categories, procedures });
  } catch (err) {
    console.error('GET /api/content/procedures error:', err);
    return error(res, 'Failed to fetch procedures', 500);
  }
});

// GET /api/content/procedures/:slug
router.get('/procedures/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM business_startup WHERE slug = ? AND deleted = 0',
      [req.params.slug]
    );
    if (rows.length === 0) return error(res, 'Procedure not found', 404);
    return success(res, rows[0]);
  } catch (err) {
    console.error('GET /api/content/procedures/:slug error:', err);
    return error(res, 'Failed to fetch procedure', 500);
  }
});

// ======================== FORWARD PLANS ========================

// GET /api/content/forward-plans
router.get('/forward-plans', async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const [categories] = await pool.query(
      'SELECT * FROM forward_plans_category WHERE deleted = 0 AND published = 1 ORDER BY name ASC'
    );

    const result = await executePaginatedQuery(pool, 'forward_plans', {
      ...pagination,
      searchColumns: ['title', 'description'],
      filters: { published: 1 },
    });

    return res.json({ ...result, categories });
  } catch (err) {
    console.error('GET /api/content/forward-plans error:', err);
    return error(res, 'Failed to fetch forward plans', 500);
  }
});

// GET /api/content/forward-plans/:slug
router.get('/forward-plans/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT fp.*, a.name AS agency_name, fpc.name AS category_name
       FROM forward_plans fp
       LEFT JOIN businessagency a ON fp.agency_id = a.id
       LEFT JOIN forward_plans_category fpc ON fp.forward_plan_category_id = fpc.id
       WHERE fp.slug = ? AND fp.deleted = 0`,
      [req.params.slug]
    );
    if (rows.length === 0) return error(res, 'Forward plan not found', 404);

    const [attachments] = await pool.query(
      'SELECT * FROM forward_plans_attachments WHERE forward_plan_id = ?',
      [rows[0].id]
    );

    return success(res, { ...rows[0], attachments });
  } catch (err) {
    console.error('GET /api/content/forward-plans/:slug error:', err);
    return error(res, 'Failed to fetch forward plan', 500);
  }
});

// ======================== NEWSLETTERS ========================

// POST /api/content/newsletter/subscribe
router.post('/newsletter/subscribe', async (req, res) => {
  try {
    const { name, email, organisation } = req.body;
    if (!email) return error(res, 'Email is required');

    const skey = Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [result] = await pool.query(
      `INSERT INTO newslettersubscriber (name, email, organisation, skey, confirmed, created, updated)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [name || '', email, organisation || '', skey, now, now]
    );

    return success(res, { id: result.insertId }, 201);
  } catch (err) {
    console.error('POST /api/content/newsletter/subscribe error:', err);
    return error(res, 'Failed to subscribe', 500);
  }
});

export default router;
