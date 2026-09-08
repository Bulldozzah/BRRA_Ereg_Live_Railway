import { Router } from 'express';
import pool from '../db.js';
import { executePaginatedQuery, parsePagination, success, error } from '../helpers.js';

const router = Router();

// GET /api/locations — paginated list with category names
router.get('/', async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const result = await executePaginatedQuery(pool, 'businesslocation', {
      ...pagination,
      searchColumns: ['name'],
      orderBy: 'name',
      orderDir: 'ASC',
    });
    // Attach category name to each row
    if (result.data && result.data.length > 0) {
      const parentIds = [...new Set(result.data.map((r) => r.parent).filter(Boolean))];
      if (parentIds.length > 0) {
        const [cats] = await pool.query(
          'SELECT id, name FROM businesslocation_category WHERE id IN (?)',
          [parentIds]
        );
        const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));
        result.data = result.data.map((r) => ({ ...r, category_name: catMap[r.parent] || null }));
      }
    }
    return res.json(result);
  } catch (err) {
    console.error('GET /api/locations error:', err);
    return error(res, 'Failed to fetch locations', 500);
  }
});

// --- Static routes MUST come before /:id ---

// GET /api/locations/categories/all — location categories
router.get('/categories/all', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM businesslocation_category WHERE published = 1 ORDER BY name ASC'
    );
    return success(res, rows);
  } catch (err) {
    console.error('GET /api/locations/categories error:', err);
    return error(res, 'Failed to fetch location categories', 500);
  }
});

// GET /api/locations/deleted/list — unpublished jurisdictions
router.get('/deleted/list', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT bl.*, blc.name AS category_name
       FROM businesslocation bl
       LEFT JOIN businesslocation_category blc ON bl.parent = blc.id
       WHERE bl.deleted = 1
       ORDER BY bl.name ASC`
    );
    return success(res, rows);
  } catch (err) {
    console.error('GET /api/locations/deleted/list error:', err);
    return error(res, 'Failed to fetch unpublished jurisdictions', 500);
  }
});

// POST /api/locations/batch — batch publish/unpublish
router.post('/batch', async (req, res) => {
  try {
    const { ids, action } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return error(res, 'Please select at least one jurisdiction', 400);
    }

    if (action === 'unpublish') {
      for (const id of ids) {
        const [[licCount]] = await pool.query(
          'SELECT COUNT(*) as count FROM businesslicense WHERE location_id = ? AND deleted = 0 AND status = 1',
          [id]
        );
        if (licCount.count > 0) {
          const [[loc]] = await pool.query('SELECT name FROM businesslocation WHERE id = ?', [id]);
          return error(res, `Can't unpublish "${loc?.name || id}". It has licenses associated to it.`, 409);
        }
      }
      await pool.query(
        'UPDATE businesslocation SET deleted = 1, updated = NOW() WHERE id IN (?)',
        [ids]
      );
      return success(res, { message: 'Successfully unpublished the selected jurisdictions' });
    } else if (action === 'publish') {
      await pool.query(
        'UPDATE businesslocation SET deleted = 0, updated = NOW() WHERE id IN (?)',
        [ids]
      );
      return success(res, { message: 'Successfully published the selected jurisdictions' });
    } else {
      return error(res, 'Invalid batch action', 400);
    }
  } catch (err) {
    console.error('POST /api/locations/batch error:', err);
    return error(res, 'Failed to perform batch action: ' + err.message, 500);
  }
});

// --- Dynamic /:id routes ---

// GET /api/locations/:id — single location with license count
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT bl.*, blc.name AS category_name
       FROM businesslocation bl
       LEFT JOIN businesslocation_category blc ON bl.parent = blc.id
       WHERE bl.id = ? AND bl.deleted = 0`,
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'Jurisdiction not found', 404);

    const [[licenseCount]] = await pool.query(
      'SELECT COUNT(*) as count FROM businesslicense WHERE location_id = ? AND deleted = 0',
      [req.params.id]
    );

    return success(res, {
      ...rows[0],
      license_count: licenseCount.count,
    });
  } catch (err) {
    console.error('GET /api/locations/:id error:', err);
    return error(res, 'Failed to fetch jurisdiction', 500);
  }
});

// POST /api/locations — create a new jurisdiction
router.post('/', async (req, res) => {
  try {
    const { name, parent } = req.body;
    if (!name || !name.trim()) return error(res, 'Jurisdiction name is required', 400);
    if (!parent) return error(res, 'Parent category is required', 400);

    // Check for duplicate name
    const [existing] = await pool.query(
      'SELECT id FROM businesslocation WHERE name = ? AND deleted = 0',
      [name.trim()]
    );
    if (existing.length > 0) return error(res, 'A jurisdiction with this name already exists', 409);

    const [result] = await pool.query(
      `INSERT INTO businesslocation (name, parent, is_default, deleted, created, updated, created_by)
       VALUES (?, ?, 0, 0, NOW(), NOW(), ?)`,
      [name.trim(), parent, req.body.user_id || 1]
    );

    return success(res, { id: result.insertId, name: name.trim(), parent }, 201);
  } catch (err) {
    console.error('POST /api/locations error:', err);
    return error(res, 'Failed to create jurisdiction: ' + err.message, 500);
  }
});

// PUT /api/locations/:id — update a jurisdiction
router.put('/:id', async (req, res) => {
  try {
    const { name, parent } = req.body;
    const id = req.params.id;

    if (!name || !name.trim()) return error(res, 'Jurisdiction name is required', 400);
    if (!parent) return error(res, 'Parent category is required', 400);

    // Check jurisdiction exists
    const [rows] = await pool.query(
      'SELECT * FROM businesslocation WHERE id = ? AND deleted = 0',
      [id]
    );
    if (rows.length === 0) return error(res, 'Jurisdiction not found', 404);

    // Check for duplicate name (exclude self)
    const [existing] = await pool.query(
      'SELECT id FROM businesslocation WHERE name = ? AND deleted = 0 AND id != ?',
      [name.trim(), id]
    );
    if (existing.length > 0) return error(res, 'A jurisdiction with this name already exists', 409);

    await pool.query(
      'UPDATE businesslocation SET name = ?, parent = ?, updated = NOW(), updated_by = ? WHERE id = ?',
      [name.trim(), parent, req.body.user_id || 1, id]
    );

    return success(res, { id: Number(id), name: name.trim(), parent });
  } catch (err) {
    console.error('PUT /api/locations/:id error:', err);
    return error(res, 'Failed to update jurisdiction: ' + err.message, 500);
  }
});

// DELETE /api/locations/:id — soft-delete (unpublish) a jurisdiction
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // Check if jurisdiction has published licenses
    const [[licCount]] = await pool.query(
      'SELECT COUNT(*) as count FROM businesslicense WHERE location_id = ? AND deleted = 0 AND status = 1',
      [id]
    );
    if (licCount.count > 0) {
      return error(res, "You can't delete this jurisdiction. It has licenses associated to it.", 409);
    }

    await pool.query(
      'UPDATE businesslocation SET deleted = 1, updated = NOW() WHERE id = ?',
      [id]
    );

    return success(res, { id: Number(id), message: 'Jurisdiction unpublished successfully' });
  } catch (err) {
    console.error('DELETE /api/locations/:id error:', err);
    return error(res, 'Failed to unpublish jurisdiction: ' + err.message, 500);
  }
});

export default router;
