import { Router } from 'express';
import pool from '../db.js';
import { executePaginatedQuery, parsePagination, success, error } from '../helpers.js';

const router = Router();

// =====================================================================
// STATIC ROUTES — must be defined BEFORE /:id to avoid param capture
// =====================================================================

// GET /api/regulations/counts — public counts by consultation stage
router.get('/counts', async (req, res) => {
  try {
    const base = 'FROM regulations r WHERE r.deleted = 0 AND r.published = 1 AND r.is_public = 1';
    const [[{ c: all }]] = await pool.query(`SELECT COUNT(*) as c ${base}`);
    const [[{ c: open }]] = await pool.query(`SELECT COUNT(*) as c ${base} AND r.consultation_stage = 1`);
    const [[{ c: completed }]] = await pool.query(`SELECT COUNT(*) as c ${base} AND r.consultation_stage = 2`);

    // Closing soon: open + closing_date within N days
    const [[setting]] = await pool.query("SELECT value FROM settings WHERE name = 'closing_days' LIMIT 1").catch(() => [[null]]);
    const closingDays = setting ? parseInt(setting.value) : 7;
    const [[{ c: closing }]] = await pool.query(
      `SELECT COUNT(*) as c ${base} AND r.consultation_stage = 1 AND r.closing_date IS NOT NULL AND r.closing_date >= CURDATE() AND r.closing_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)`,
      [closingDays]
    );

    // Trending: regulations with 10+ comments
    const [[{ c: trending }]] = await pool.query(
      `SELECT COUNT(*) as c FROM regulations r WHERE r.deleted = 0 AND r.published = 1 AND r.is_public = 1 AND (SELECT COUNT(*) FROM comments c2 WHERE c2.regulation_id = r.id AND c2.deleted = 0 AND c2.publish = 1) >= 5`
    );

    return success(res, { all, open, closing, completed, trending });
  } catch (err) {
    console.error('GET /api/regulations/counts error:', err);
    return error(res, 'Failed to fetch counts', 500);
  }
});

// GET /api/regulations/trending — most commented/engaged regulations
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const [rows] = await pool.query(
      `SELECT r.id, r.title, r.slug, r.closing_date, r.consultation_stage, r.publish_date,
              a.name AS agency_name,
              (SELECT COUNT(*) FROM comments c WHERE c.regulation_id = r.id AND c.deleted = 0 AND c.publish = 1) AS comment_count
       FROM regulations r
       LEFT JOIN businessagency a ON r.agency_id = a.id
       WHERE r.deleted = 0 AND r.published = 1 AND r.is_public = 1
       HAVING comment_count >= 1
       ORDER BY comment_count DESC
       LIMIT ?`,
      [limit]
    );
    return success(res, rows);
  } catch (err) {
    console.error('GET /api/regulations/trending error:', err);
    return error(res, 'Failed to fetch trending', 500);
  }
});

// GET /api/regulations/closing-soon — regulations closing within N days
router.get('/closing-soon', async (req, res) => {
  try {
    const [[setting]] = await pool.query("SELECT value FROM settings WHERE name = 'closing_days' LIMIT 1").catch(() => [[null]]);
    const closingDays = setting ? parseInt(setting.value) : 7;
    const limit = parseInt(req.query.limit) || 10;

    const [rows] = await pool.query(
      `SELECT r.id, r.title, r.slug, r.closing_date, r.consultation_stage,
              a.name AS agency_name,
              DATEDIFF(r.closing_date, CURDATE()) AS days_remaining,
              (SELECT COUNT(*) FROM comments c WHERE c.regulation_id = r.id AND c.deleted = 0 AND c.publish = 1) AS comment_count
       FROM regulations r
       LEFT JOIN businessagency a ON r.agency_id = a.id
       WHERE r.deleted = 0 AND r.published = 1 AND r.is_public = 1
         AND r.consultation_stage = 1
         AND r.closing_date IS NOT NULL
         AND r.closing_date >= CURDATE()
         AND r.closing_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY r.closing_date ASC
       LIMIT ?`,
      [closingDays, limit]
    );
    return success(res, rows);
  } catch (err) {
    console.error('GET /api/regulations/closing-soon error:', err);
    return error(res, 'Failed to fetch closing-soon', 500);
  }
});

// GET /api/regulations/completed — recently completed consultations
router.get('/completed', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const [rows] = await pool.query(
      `SELECT r.id, r.title, r.slug, r.closing_date, r.consultation_stage,
              a.name AS agency_name,
              (SELECT COUNT(*) FROM comments c WHERE c.regulation_id = r.id AND c.deleted = 0 AND c.publish = 1) AS comment_count
       FROM regulations r
       LEFT JOIN businessagency a ON r.agency_id = a.id
       WHERE r.deleted = 0 AND r.published = 1 AND r.is_public = 1 AND r.consultation_stage = 2
       ORDER BY r.closing_date DESC
       LIMIT ?`,
      [limit]
    );
    return success(res, rows);
  } catch (err) {
    console.error('GET /api/regulations/completed error:', err);
    return error(res, 'Failed to fetch completed', 500);
  }
});

// GET /api/regulations/agencies — agencies that have regulations
router.get('/agencies', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT a.id, a.name, a.slug,
              (SELECT COUNT(*) FROM regulations r WHERE r.agency_id = a.id AND r.deleted = 0 AND r.published = 1 AND r.is_public = 1) AS regulation_count
       FROM businessagency a
       INNER JOIN regulations r ON r.agency_id = a.id AND r.deleted = 0 AND r.published = 1 AND r.is_public = 1
       ORDER BY a.name ASC`
    );
    return success(res, rows);
  } catch (err) {
    console.error('GET /api/regulations/agencies error:', err);
    return error(res, 'Failed to fetch agencies', 500);
  }
});

// GET /api/regulations/industries — industries that have regulations
router.get('/industries', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT bi.id, bi.name,
              (SELECT COUNT(*) FROM regulations r WHERE r.industry_id = bi.id AND r.deleted = 0 AND r.published = 1 AND r.is_public = 1) AS regulation_count
       FROM businessindustry bi
       INNER JOIN regulations r ON r.industry_id = bi.id AND r.deleted = 0 AND r.published = 1 AND r.is_public = 1
       ORDER BY bi.name ASC`
    );
    return success(res, rows);
  } catch (err) {
    console.error('GET /api/regulations/industries error:', err);
    return error(res, 'Failed to fetch industries', 500);
  }
});

// GET /api/regulations/search — advanced search
router.get('/search', async (req, res) => {
  try {
    const { agency, industry, keywords, page: pageStr } = req.query;
    const page = parseInt(pageStr) || 1;
    const perPage = 10;
    const offset = (page - 1) * perPage;

    let where = 'WHERE r.deleted = 0 AND r.published = 1 AND r.is_public = 1';
    const params = [];

    if (agency && agency !== '0') {
      where += ' AND r.agency_id = ?';
      params.push(agency);
    }
    if (industry && industry !== '0') {
      where += ' AND r.industry_id = ?';
      params.push(industry);
    }
    if (keywords && keywords.trim()) {
      where += ` AND (r.title LIKE ? OR r.description LIKE ? OR r.keywords LIKE ? OR r.tags LIKE ? OR r.specific_instructions LIKE ? OR a.name LIKE ? OR bi.name LIKE ?)`;
      const kw = `%${keywords.trim()}%`;
      params.push(kw, kw, kw, kw, kw, kw, kw);
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM regulations r LEFT JOIN businessagency a ON r.agency_id = a.id LEFT JOIN businessindustry bi ON r.industry_id = bi.id ${where}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT r.*, a.name AS agency_name, bi.name AS industry_name,
              (SELECT COUNT(*) FROM comments c WHERE c.regulation_id = r.id AND c.deleted = 0 AND c.publish = 1) AS comment_count
       FROM regulations r
       LEFT JOIN businessagency a ON r.agency_id = a.id
       LEFT JOIN businessindustry bi ON r.industry_id = bi.id
       ${where}
       ORDER BY r.id DESC
       LIMIT ? OFFSET ?`,
      [...params, perPage, offset]
    );

    return res.json({
      data: rows,
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    });
  } catch (err) {
    console.error('GET /api/regulations/search error:', err);
    return error(res, 'Failed to search regulations', 500);
  }
});

// =====================================================================
// ADMIN ROUTES — must be before /:id to avoid param capture
// =====================================================================

// GET /api/regulations/admin-stats — full admin dashboard statistics
router.get('/admin-stats', async (req, res) => {
  try {
    const [[{ all_count }]] = await pool.query('SELECT COUNT(*) as all_count FROM regulations WHERE deleted = 0');
    const [[{ published_count }]] = await pool.query('SELECT COUNT(*) as published_count FROM regulations WHERE deleted = 0 AND published = 1');
    const [[{ unpublished_count }]] = await pool.query('SELECT COUNT(*) as unpublished_count FROM regulations WHERE deleted = 0 AND published = 0');
    const [[{ open_count }]] = await pool.query('SELECT COUNT(*) as open_count FROM regulations WHERE deleted = 0 AND published = 1 AND consultation_stage = 1 AND (closing_date IS NULL OR closing_date >= CURDATE())');
    const [[{ closed_count }]] = await pool.query('SELECT COUNT(*) as closed_count FROM regulations WHERE deleted = 0 AND (consultation_stage IN (2,3) OR (closing_date IS NOT NULL AND closing_date < CURDATE()))');
    const [[{ internal_count }]] = await pool.query('SELECT COUNT(*) as internal_count FROM regulations WHERE deleted = 0 AND is_public = 0');
    const [[{ public_count }]] = await pool.query('SELECT COUNT(*) as public_count FROM regulations WHERE deleted = 0 AND published = 1 AND is_public = 1');

    const [[setting]] = await pool.query("SELECT value FROM settings WHERE name = 'closing_days' LIMIT 1").catch(() => [[null]]);
    const closingDays = setting ? parseInt(setting.value) : 7;
    const [[{ due_soon_count }]] = await pool.query(
      `SELECT COUNT(*) as due_soon_count FROM regulations
       WHERE deleted = 0 AND published = 1 AND consultation_stage = 1
       AND closing_date IS NOT NULL AND closing_date >= CURDATE()
       AND closing_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)`,
      [closingDays]
    );

    const [[{ total_comments }]] = await pool.query('SELECT COUNT(*) as total_comments FROM comments WHERE deleted = 0');
    const [[{ pending_comments }]] = await pool.query('SELECT COUNT(*) as pending_comments FROM comments WHERE deleted = 0 AND pending_review = 1');
    const [[{ abusive_comments }]] = await pool.query('SELECT COUNT(*) as abusive_comments FROM comments WHERE deleted = 0 AND check_abusive = 1');

    const [highestComments] = await pool.query(
      `SELECT r.id, r.title, COUNT(c.id) as comment_count
       FROM regulations r
       INNER JOIN comments c ON c.regulation_id = r.id AND c.deleted = 0
       WHERE r.deleted = 0
       GROUP BY r.id, r.title
       ORDER BY comment_count DESC
       LIMIT 1`
    );

    const [highestEngagement] = await pool.query(
      `SELECT c.id, SUBSTRING(c.comment, 1, 100) as excerpt, c.upvote_count, r.title as regulation_title
       FROM comments c
       LEFT JOIN regulations r ON c.regulation_id = r.id
       WHERE c.deleted = 0
       ORDER BY c.upvote_count DESC
       LIMIT 1`
    );

    const [perAgency] = await pool.query(
      `SELECT a.id, a.name, COUNT(r.id) as regulation_count
       FROM businessagency a
       INNER JOIN regulations r ON r.agency_id = a.id AND r.deleted = 0
       GROUP BY a.id, a.name
       ORDER BY regulation_count DESC
       LIMIT 20`
    );

    const [recentConsultations] = await pool.query(
      `SELECT r.*, a.name AS agency_name
       FROM regulations r
       LEFT JOIN businessagency a ON r.agency_id = a.id
       WHERE r.deleted = 0
       ORDER BY r.id DESC
       LIMIT 5`
    );

    return success(res, {
      regulation_stats: {
        all: all_count, published: published_count, unpublished: unpublished_count,
        open: open_count, closed: closed_count, due_soon: due_soon_count,
        internal: internal_count, public: public_count,
      },
      comment_stats: {
        total: total_comments, pending: pending_comments, abusive: abusive_comments,
        highest_comments: highestComments[0] || null,
        highest_engagement: highestEngagement[0] || null,
      },
      closing_days: closingDays,
      per_agency: perAgency,
      recent_consultations: recentConsultations,
    });
  } catch (err) {
    console.error('GET /api/regulations/admin-stats error:', err);
    return error(res, 'Failed to fetch admin stats', 500);
  }
});

// GET /api/regulations/admin-comments — admin comment management
router.get('/admin-comments', async (req, res) => {
  try {
    const view = req.query.view || 'all';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;
    const search = req.query.q || '';

    let where = 'c.deleted = 0';
    const params = [];

    if (view === 'pending') where += ' AND c.pending_review = 1';
    else if (view === 'approved') where += ' AND c.publish = 1 AND c.pending_review = 0';
    else if (view === 'abusive') where += ' AND c.check_abusive = 1';

    if (search) {
      where += ' AND (c.comment LIKE ? OR r.title LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countQueries = [
      pool.query('SELECT COUNT(*) as c FROM comments c WHERE c.deleted = 0'),
      pool.query('SELECT COUNT(*) as c FROM comments c WHERE c.deleted = 0 AND c.pending_review = 1'),
      pool.query('SELECT COUNT(*) as c FROM comments c WHERE c.deleted = 0 AND c.publish = 1 AND c.pending_review = 0'),
      pool.query('SELECT COUNT(*) as c FROM comments c WHERE c.deleted = 0 AND c.check_abusive = 1'),
    ];
    const [allC, pendingC, approvedC, abusiveC] = await Promise.all(countQueries);

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM comments c LEFT JOIN regulations r ON c.regulation_id = r.id WHERE ${where}`, params
    );

    const [comments] = await pool.query(
      `SELECT c.*, r.title AS regulation_title, r.id AS regulation_id, a.name AS agency_name
       FROM comments c
       LEFT JOIN regulations r ON c.regulation_id = r.id
       LEFT JOIN businessagency a ON r.agency_id = a.id
       WHERE ${where}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return success(res, {
      counts: { all: allC[0][0].c, pending: pendingC[0][0].c, approved: approvedC[0][0].c, abusive: abusiveC[0][0].c },
      comments,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('GET /api/regulations/admin-comments error:', err);
    return error(res, 'Failed to fetch comments', 500);
  }
});

// POST /api/regulations/admin-comments/batch — batch comment actions
router.post('/admin-comments/batch', async (req, res) => {
  try {
    const { ids, action } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return error(res, 'No comment IDs provided', 400);
    const placeholders = ids.map(() => '?').join(',');
    if (action === 'approve') await pool.query(`UPDATE comments SET publish = 1, pending_review = 0, check_abusive = 0 WHERE id IN (${placeholders})`, ids);
    else if (action === 'reject') await pool.query(`UPDATE comments SET publish = 0, hidden = 1, pending_review = 0 WHERE id IN (${placeholders})`, ids);
    else if (action === 'delete') await pool.query(`UPDATE comments SET deleted = 1 WHERE id IN (${placeholders})`, ids);
    else return error(res, 'Invalid action', 400);
    return success(res, { message: `${ids.length} comment(s) ${action}ed successfully` });
  } catch (err) {
    console.error('POST batch comments error:', err);
    return error(res, 'Batch action failed', 500);
  }
});

// POST /api/regulations/admin-comments/:commentId/approve
router.post('/admin-comments/:commentId/approve', async (req, res) => {
  try {
    await pool.query('UPDATE comments SET publish = 1, pending_review = 0, check_abusive = 0 WHERE id = ?', [req.params.commentId]);
    return success(res, { message: 'Comment approved' });
  } catch (err) { return error(res, 'Failed to approve comment', 500); }
});

// POST /api/regulations/admin-comments/:commentId/reject
router.post('/admin-comments/:commentId/reject', async (req, res) => {
  try {
    await pool.query('UPDATE comments SET publish = 0, hidden = 1, pending_review = 0 WHERE id = ?', [req.params.commentId]);
    return success(res, { message: 'Comment rejected' });
  } catch (err) { return error(res, 'Failed to reject comment', 500); }
});

// POST /api/regulations/admin-comments/:commentId/flag
router.post('/admin-comments/:commentId/flag', async (req, res) => {
  try {
    await pool.query('UPDATE comments SET check_abusive = 1, pending_review = 1 WHERE id = ?', [req.params.commentId]);
    return success(res, { message: 'Comment flagged as abusive' });
  } catch (err) { return error(res, 'Failed to flag comment', 500); }
});

// DELETE /api/regulations/admin-comments/:commentId
router.delete('/admin-comments/:commentId', async (req, res) => {
  try {
    await pool.query('UPDATE comments SET deleted = 1 WHERE id = ?', [req.params.commentId]);
    return success(res, { message: 'Comment deleted' });
  } catch (err) { return error(res, 'Failed to delete comment', 500); }
});

// GET /api/regulations/dashboard — dashboard view with counts + list
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.query.user_id || 1;
    const view = req.query.view || 'all'; // all, open, complete, internal, unpublished, closing

    // Get user agency IDs from users_agencies table
    const [userAgencies] = await pool.query(
      'SELECT businessagency_id FROM users_agencies WHERE user_id = ?',
      [userId]
    );
    const agencyIds = userAgencies.map((u) => u.businessagency_id);

    // Build base WHERE — if user has agencies, scope to them; otherwise show all (super admin)
    const hasAgencyScope = agencyIds.length > 0;
    const agencyClause = hasAgencyScope
      ? `r.agency_id IN (${agencyIds.map(() => '?').join(',')})`
      : '1=1';

    let where = `WHERE r.deleted = 0 AND ${agencyClause}`;
    const params = hasAgencyScope ? [...agencyIds] : [];

    if (view === 'open') {
      where += ' AND r.consultation_stage = 1 AND r.published = 1 AND (r.closing_date IS NULL OR r.closing_date >= CURDATE())';
    } else if (view === 'complete') {
      where += ' AND (r.consultation_stage IN (2, 3) OR (r.closing_date IS NOT NULL AND r.closing_date < CURDATE()))';
    } else if (view === 'internal') {
      where += ' AND r.is_public = 0';
    } else if (view === 'unpublished') {
      where = hasAgencyScope
        ? `WHERE r.deleted = 1 AND ${agencyClause}`
        : 'WHERE r.deleted = 1';
    }

    const [rows] = await pool.query(
      `SELECT r.*, a.name AS agency_name,
        (SELECT COUNT(*) FROM comments c WHERE c.regulation_id = r.id AND c.deleted = 0) AS comment_count
       FROM regulations r
       LEFT JOIN businessagency a ON r.agency_id = a.id
       ${where}
       ORDER BY r.id DESC`,
      params
    );

    // For closing-soon view, filter by days remaining
    let items = rows;
    if (view === 'closing') {
      const [[setting]] = await pool.query("SELECT value FROM settings WHERE name = 'closing_days' LIMIT 1").catch(() => [[null]]);
      const closingDays = setting ? parseInt(setting.value) : 7;
      const now = new Date();
      items = rows.filter((r) => {
        if (!r.closing_date || r.consultation_stage !== 1) return false;
        const close = new Date(r.closing_date);
        const diff = Math.ceil((close.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 && diff <= closingDays;
      });
    }

    // Count totals — scoped to user's agencies or all
    const scopeWhere = hasAgencyScope ? `r.deleted = 0 AND ${agencyClause}` : 'r.deleted = 0';
    const scopeParams = hasAgencyScope ? agencyIds : [];
    const unpubScopeWhere = hasAgencyScope ? `r.deleted = 1 AND ${agencyClause}` : 'r.deleted = 1';

    const countQueries = [
      pool.query(`SELECT COUNT(*) as c FROM regulations r WHERE ${scopeWhere}`, scopeParams),
      pool.query(`SELECT COUNT(*) as c FROM regulations r WHERE ${scopeWhere} AND r.consultation_stage = 1 AND r.published = 1 AND (r.closing_date IS NULL OR r.closing_date >= CURDATE())`, scopeParams),
      pool.query(`SELECT COUNT(*) as c FROM regulations r WHERE ${scopeWhere} AND (r.consultation_stage IN (2,3) OR (r.closing_date IS NOT NULL AND r.closing_date < CURDATE()))`, scopeParams),
      pool.query(`SELECT COUNT(*) as c FROM regulations r WHERE ${scopeWhere} AND r.is_public = 0`, scopeParams),
      pool.query(`SELECT COUNT(*) as c FROM regulations r WHERE ${unpubScopeWhere}`, hasAgencyScope ? agencyIds : []),
    ];
    const [allR, openR, completeR, internalR, unpublishedR] = await Promise.all(countQueries);

    return success(res, {
      counts: {
        all: allR[0][0].c,
        open: openR[0][0].c,
        complete: completeR[0][0].c,
        internal: internalR[0][0].c,
        unpublished: unpublishedR[0][0].c,
      },
      items,
    });
  } catch (err) {
    console.error('GET /api/regulations/dashboard error:', err);
    return error(res, 'Failed to fetch dashboard', 500);
  }
});

// POST /api/regulations/batch — batch publish/unpublish
router.post('/batch', async (req, res) => {
  try {
    const { ids, action } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return error(res, 'Please select at least one consultation', 400);
    }
    if (action === 'publish') {
      await pool.query('UPDATE regulations SET published = 1, deleted = 0 WHERE id IN (?)', [ids]);
      return success(res, { message: `${ids.length} consultation(s) published successfully` });
    } else if (action === 'unpublish') {
      await pool.query('UPDATE regulations SET published = 0, deleted = 1 WHERE id IN (?)', [ids]);
      return success(res, { message: `${ids.length} consultation(s) unpublished successfully` });
    } else {
      return error(res, 'Invalid batch action', 400);
    }
  } catch (err) {
    console.error('POST /api/regulations/batch error:', err);
    return error(res, 'Failed to perform batch action: ' + err.message, 500);
  }
});

// =====================================================================
// MAIN LIST + SINGLE ITEM ROUTES
// =====================================================================

// GET /api/regulations — paginated list
router.get('/', async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const filters = {};
    if (req.query.agency_id) filters.agency_id = req.query.agency_id;
    if (req.query.industry_id) filters.industry_id = req.query.industry_id;
    if (req.query.published !== undefined) filters.published = req.query.published;
    if (req.query.consultation_stage) filters.consultation_stage = req.query.consultation_stage;

    const result = await executePaginatedQuery(pool, 'regulations', {
      ...pagination,
      searchColumns: ['title', 'description', 'keywords', 'tags'],
      filters,
    });

    // Attach agency name and comment count
    for (const reg of result.data) {
      const [[agency]] = await pool.query(
        'SELECT name FROM businessagency WHERE id = ?',
        [reg.agency_id]
      );
      reg.agency_name = agency ? agency.name : null;

      const [[{ count }]] = await pool.query(
        'SELECT COUNT(*) as count FROM comments WHERE regulation_id = ? AND deleted = 0',
        [reg.id]
      );
      reg.comment_count = count;
    }

    return res.json(result);
  } catch (err) {
    console.error('GET /api/regulations error:', err);
    return error(res, 'Failed to fetch regulations', 500);
  }
});

// GET /api/regulations/:id — single regulation with comments
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, a.name AS agency_name, bi.name AS industry_name
       FROM regulations r
       LEFT JOIN businessagency a ON r.agency_id = a.id
       LEFT JOIN businessindustry bi ON r.industry_id = bi.id
       WHERE r.id = ? AND r.deleted = 0`,
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'Regulation not found', 404);

    const [attachments] = await pool.query(
      'SELECT * FROM regulations_attachment WHERE regulation_id = ?',
      [req.params.id]
    );

    const [comments] = await pool.query(
      `SELECT c.*, 
              CASE WHEN c.is_admin = 1 THEN 'Admin' ELSE NULL END AS user_role
       FROM comments c
       WHERE c.regulation_id = ? AND c.deleted = 0 AND c.publish = 1
       ORDER BY c.created_at DESC`,
      [req.params.id]
    );

    const [positions] = await pool.query(
      'SELECT * FROM position WHERE regulation_id = ?',
      [req.params.id]
    );

    const [fieldData] = await pool.query(
      `SELECT rfd.*, rf.fieldlabel, rf.fieldtype
       FROM regulationfielddata rfd
       INNER JOIN regulationfields rf ON rfd.field_id = rf.id
       WHERE rfd.regulation_id = ?`,
      [req.params.id]
    );

    return success(res, {
      ...rows[0],
      attachments,
      comments,
      positions,
      field_data: fieldData,
    });
  } catch (err) {
    console.error('GET /api/regulations/:id error:', err);
    return error(res, 'Failed to fetch regulation', 500);
  }
});

// POST /api/regulations — create a new consultation
router.post('/', async (req, res) => {
  try {
    const {
      title, description, expected_outcome, agency_id, industry_id,
      regulation_type, consultation_stage, closing_date, published,
      keywords, tags, specific_instructions, supporting_materials,
      offline_consultations, is_public, is_login_required,
      review_comments, enable_attachments, file_size, file_type,
    } = req.body;

    if (!title || !title.trim()) return error(res, 'Title is required', 400);
    if (!agency_id) return error(res, 'Agency is required', 400);
    if (!industry_id) return error(res, 'Industry is required', 400);

    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const publishDate = published ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;

    const [result] = await pool.query(
      `INSERT INTO regulations
       (title, description, expected_outcome, agency_id, industry_id, regulation_type,
        consultation_stage, closing_date, published, publish_date, slug, keywords, tags,
        specific_instructions, supporting_materials, offline_consultations,
        is_public, is_login_required, review_comments, enable_attachments,
        file_size, file_type, deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        title.trim(), description || null, expected_outcome || null, agency_id, industry_id,
        regulation_type || 1, consultation_stage || 1, closing_date || null,
        published ? 1 : 0, publishDate, slug, keywords || null, tags || null,
        specific_instructions || null, supporting_materials || null, offline_consultations || null,
        is_public !== undefined ? (is_public ? 1 : 0) : 1,
        is_login_required !== undefined ? (is_login_required ? 1 : 0) : 0,
        review_comments !== undefined ? (review_comments ? 1 : 0) : 1,
        enable_attachments !== undefined ? (enable_attachments ? 1 : 0) : 1,
        file_size || 1, file_type || null,
      ]
    );

    return success(res, { id: result.insertId, title: title.trim(), slug }, 201);
  } catch (err) {
    console.error('POST /api/regulations error:', err);
    return error(res, 'Failed to create consultation: ' + err.message, 500);
  }
});

// PUT /api/regulations/:id — update a consultation
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const {
      title, description, expected_outcome, agency_id, industry_id,
      regulation_type, consultation_stage, closing_date, published,
      keywords, tags, specific_instructions, supporting_materials,
      offline_consultations, is_public, is_login_required,
      review_comments, enable_attachments, file_size, file_type,
    } = req.body;

    if (!title || !title.trim()) return error(res, 'Title is required', 400);
    if (!agency_id) return error(res, 'Agency is required', 400);
    if (!industry_id) return error(res, 'Industry is required', 400);

    // Check exists
    const [rows] = await pool.query('SELECT * FROM regulations WHERE id = ?', [id]);
    if (rows.length === 0) return error(res, 'Consultation not found', 404);

    const existing = rows[0];
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Set publish_date if newly publishing
    let publishDate = existing.publish_date;
    if (published && !existing.published && !existing.publish_date) {
      publishDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    await pool.query(
      `UPDATE regulations SET
        title = ?, description = ?, expected_outcome = ?, agency_id = ?, industry_id = ?,
        regulation_type = ?, consultation_stage = ?, closing_date = ?, published = ?,
        publish_date = ?, slug = ?, keywords = ?, tags = ?,
        specific_instructions = ?, supporting_materials = ?, offline_consultations = ?,
        is_public = ?, is_login_required = ?, review_comments = ?, enable_attachments = ?,
        file_size = ?, file_type = ?
       WHERE id = ?`,
      [
        title.trim(), description || null, expected_outcome || null, agency_id, industry_id,
        regulation_type || 1, consultation_stage || 1, closing_date || null,
        published ? 1 : 0, publishDate, slug, keywords || null, tags || null,
        specific_instructions || null, supporting_materials || null, offline_consultations || null,
        is_public !== undefined ? (is_public ? 1 : 0) : 1,
        is_login_required !== undefined ? (is_login_required ? 1 : 0) : 0,
        review_comments !== undefined ? (review_comments ? 1 : 0) : 1,
        enable_attachments !== undefined ? (enable_attachments ? 1 : 0) : 1,
        file_size || 1, file_type || null, id,
      ]
    );

    return success(res, { id: Number(id), title: title.trim(), slug });
  } catch (err) {
    console.error('PUT /api/regulations/:id error:', err);
    return error(res, 'Failed to update consultation: ' + err.message, 500);
  }
});

// DELETE /api/regulations/:id — soft delete (unpublish)
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT * FROM regulations WHERE id = ?', [id]);
    if (rows.length === 0) return error(res, 'Consultation not found', 404);

    await pool.query('UPDATE regulations SET deleted = 1, published = 0 WHERE id = ?', [id]);
    return success(res, { message: 'Consultation unpublished successfully' });
  } catch (err) {
    console.error('DELETE /api/regulations/:id error:', err);
    return error(res, 'Failed to unpublish consultation', 500);
  }
});

// POST /api/regulations/:id/comments — submit a comment
router.post('/:id/comments', async (req, res) => {
  try {
    const { comment, user, parent, position, documents } = req.body;
    if (!comment) return error(res, 'Comment is required');

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [result] = await pool.query(
      `INSERT INTO comments
       (comment, regulation_id, created_at, updated_at, user, parent, position, documents,
        status, publish, hidden, deleted, pending_review, upvote_count, is_admin, check_abusive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, 0, 0, 1, 0, 0, 0)`,
      [comment, req.params.id, now, now, user || 0, parent || null, position || 1, documents || null]
    );

    return success(res, { id: result.insertId }, 201);
  } catch (err) {
    console.error('POST /api/regulations/:id/comments error:', err);
    return error(res, 'Failed to submit comment', 500);
  }
});

// POST /api/regulations/:id/position — submit position vote (support/oppose/neutral)
router.post('/:id/position', async (req, res) => {
  try {
    const { position: positionValue, user } = req.body;
    if (!positionValue) return error(res, 'Position is required', 400);

    // Check if user already voted
    if (user) {
      const [existing] = await pool.query(
        'SELECT id FROM position WHERE regulation_id = ? AND user = ?',
        [req.params.id, user]
      );
      if (existing.length > 0) {
        // Update existing vote
        await pool.query('UPDATE position SET position = ? WHERE id = ?', [positionValue, existing[0].id]);
        return success(res, { id: existing[0].id, updated: true });
      }
    }

    const [result] = await pool.query(
      'INSERT INTO position (position, regulation_id, user) VALUES (?, ?, ?)',
      [positionValue, req.params.id, user || 0]
    );
    return success(res, { id: result.insertId }, 201);
  } catch (err) {
    console.error('POST /api/regulations/:id/position error:', err);
    return error(res, 'Failed to submit position', 500);
  }
});

// POST /api/regulations/:id/comments/:commentId/like — like a comment
router.post('/:id/comments/:commentId/like', async (req, res) => {
  try {
    const { user } = req.body;
    const commentId = req.params.commentId;
    const regulationId = req.params.id;

    // Check if already liked
    if (user) {
      const [existing] = await pool.query(
        'SELECT id FROM likes WHERE comment_id = ? AND user = ? AND deleted_at IS NULL',
        [commentId, user]
      );
      if (existing.length > 0) {
        // Unlike
        await pool.query('UPDATE likes SET deleted_at = NOW() WHERE id = ?', [existing[0].id]);
        await pool.query('UPDATE comments SET upvote_count = GREATEST(upvote_count - 1, 0) WHERE id = ?', [commentId]);
        return success(res, { liked: false });
      }
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await pool.query(
      'INSERT INTO likes (comment_id, regulation_id, user, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [commentId, regulationId, user || 0, now, now]
    );
    await pool.query('UPDATE comments SET upvote_count = upvote_count + 1 WHERE id = ?', [commentId]);

    return success(res, { liked: true });
  } catch (err) {
    console.error('POST /api/regulations/:id/comments/:commentId/like error:', err);
    return error(res, 'Failed to like comment', 500);
  }
});

// GET /api/regulations/:id/comments — get comments for a regulation (threaded)
router.get('/:id/comments', async (req, res) => {
  try {
    const [comments] = await pool.query(
      `SELECT c.*,
              CASE WHEN c.is_admin = 1 THEN 'Admin' ELSE NULL END AS user_role
       FROM comments c
       WHERE c.regulation_id = ? AND c.deleted = 0 AND c.publish = 1
       ORDER BY c.parent ASC, c.created_at ASC`,
      [req.params.id]
    );
    return success(res, comments);
  } catch (err) {
    console.error('GET /api/regulations/:id/comments error:', err);
    return error(res, 'Failed to fetch comments', 500);
  }
});

export default router;
