import { Router } from 'express';
import pool from '../db.js';
import { executePaginatedQuery, parsePagination, success, error } from '../helpers.js';

const router = Router();

// GET /api/agencies/dashboard — active/deleted with office counts
router.get('/dashboard', async (req, res) => {
  try {
    const view = req.query.view || 'active'; // active | deleted
    const deleted = view === 'deleted' ? 1 : 0;

    const [rows] = await pool.query(
      `SELECT a.*, loc.name AS location_name,
        (SELECT COUNT(*) FROM businessagencyoffice o WHERE o.agency_id = a.id AND o.deleted = 0) AS office_count
       FROM businessagency a
       LEFT JOIN businesslocation loc ON a.location_id = loc.id
       WHERE a.deleted = ?
       ORDER BY a.id DESC`,
      [deleted]
    );

    // Count totals
    const [[activeCount]] = await pool.query('SELECT COUNT(*) AS c FROM businessagency WHERE deleted = 0');
    const [[deletedCount]] = await pool.query('SELECT COUNT(*) AS c FROM businessagency WHERE deleted = 1');

    return success(res, {
      counts: { active: activeCount.c, deleted: deletedCount.c },
      items: rows,
    });
  } catch (err) {
    console.error('GET /api/agencies/dashboard error:', err);
    return error(res, 'Failed to fetch agencies dashboard', 500);
  }
});

// POST /api/agencies/batch — batch soft-delete (unpublish)
router.post('/batch', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return error(res, 'Please select at least one issuing authority', 400);
    }

    for (const id of ids) {
      // Check licenses
      const [[lic]] = await pool.query(
        'SELECT COUNT(*) AS c FROM businesslicense WHERE agency_id = ? AND deleted = 0',
        [id]
      );
      if (lic.c > 0) {
        const [[a]] = await pool.query('SELECT title FROM businessagency WHERE id = ?', [id]);
        return error(res, `You Can't delete "${a?.title || id}". It has licenses associated to it.`, 409);
      }
      // Check regulations
      const [[reg]] = await pool.query(
        'SELECT COUNT(*) AS c FROM regulations WHERE agency_id = ? AND deleted = 0',
        [id]
      );
      if (reg.c > 0) {
        const [[a]] = await pool.query('SELECT title FROM businessagency WHERE id = ?', [id]);
        return error(res, `You Can't delete "${a?.title || id}". It has regulations associated to it.`, 409);
      }
      // Check forward plans
      const [[fp]] = await pool.query(
        'SELECT COUNT(*) AS c FROM forward_plan_main_category WHERE agency_id = ?',
        [id]
      );
      if (fp.c > 0) {
        const [[a]] = await pool.query('SELECT title FROM businessagency WHERE id = ?', [id]);
        return error(res, `You Can't delete "${a?.title || id}". It has forward plans associated to it.`, 409);
      }
    }

    await pool.query('UPDATE businessagency SET deleted = 1 WHERE id IN (?)', [ids]);
    return success(res, { message: `${ids.length} issuing authority(ies) deleted successfully` });
  } catch (err) {
    console.error('POST /api/agencies/batch error:', err);
    return error(res, 'Failed to delete agencies: ' + err.message, 500);
  }
});

// GET /api/agencies — paginated list
router.get('/', async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const result = await executePaginatedQuery(pool, 'businessagency', {
      ...pagination,
      searchColumns: ['name', 'title', 'acronym', 'email'],
    });
    return res.json(result);
  } catch (err) {
    console.error('GET /api/agencies error:', err);
    return error(res, 'Failed to fetch agencies', 500);
  }
});

// POST /api/agencies — create new issuing authority
router.post('/', async (req, res) => {
  try {
    const {
      title, acronym, fax, address, telephone, email, website,
      hours, postal_address, latitude, longitude, business_no,
      location_id, map_scan, user_ids,
    } = req.body;

    if (!title || !title.trim()) return error(res, 'Name is required', 400);
    if (!address || !address.trim()) return error(res, 'Address is required', 400);
    if (!telephone || !telephone.trim()) return error(res, 'Telephone is required', 400);
    if (!email || !email.trim()) return error(res, 'Email is required', 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error(res, 'Email is not valid', 400);
    if (!website || !website.trim()) return error(res, 'Website is required', 400);
    if (!hours || !hours.trim()) return error(res, 'Working hours is required', 400);
    if (!postal_address || !postal_address.trim()) return error(res, 'Postal address is required', 400);
    if (!location_id) return error(res, 'Location is required', 400);

    // Check unique title
    const [[dupTitle]] = await pool.query('SELECT id FROM businessagency WHERE title = ? AND deleted = 0', [title.trim()]);
    if (dupTitle) return error(res, 'An issuing authority with this name already exists', 409);

    // Check unique acronym
    if (acronym && acronym.trim()) {
      const [[dupAc]] = await pool.query('SELECT id FROM businessagency WHERE acronym = ? AND deleted = 0', [acronym.trim()]);
      if (dupAc) return error(res, 'An issuing authority with this abbreviation already exists', 409);
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const [result] = await pool.query(
      `INSERT INTO businessagency
       (title, name, acronym, fax, address, telephone, email, website, hours,
        postal_address, latitude, longitude, business_no, location_id, map_scan,
        slug, deleted, created, updated, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW(), ?)`,
      [
        title.trim(), title.trim(), acronym || null, fax || null, address.trim(), telephone.trim(),
        email.trim(), website.trim(), hours.trim(), postal_address.trim(),
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        business_no || null, location_id, map_scan || null, slug,
        req.body.user_id || 1,
      ]
    );

    const agencyId = result.insertId;

    // Assign users if provided
    if (user_ids && Array.isArray(user_ids) && user_ids.length > 0) {
      const values = user_ids.map((uid) => [agencyId, uid]);
      await pool.query('INSERT INTO users_agencies (businessagency_id, user_id) VALUES ?', [values]);
    }

    return success(res, { id: agencyId, title: title.trim(), slug }, 201);
  } catch (err) {
    console.error('POST /api/agencies error:', err);
    return error(res, 'Failed to create issuing authority: ' + err.message, 500);
  }
});

// GET /api/agencies/:id — single agency with offices, industries, and users
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, loc.name AS location_name
       FROM businessagency a
       LEFT JOIN businesslocation loc ON a.location_id = loc.id
       WHERE a.id = ? AND a.deleted = 0`,
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'Agency not found', 404);

    const [offices] = await pool.query(
      `SELECT o.*, loc.name AS location_name
       FROM businessagencyoffice o
       LEFT JOIN businesslocation loc ON o.location_id = loc.id
       WHERE o.agency_id = ? AND o.deleted = 0`,
      [req.params.id]
    );

    const [industries] = await pool.query(
      `SELECT bi.* FROM businessindustry bi
       INNER JOIN businessagency_industries bai ON bi.id = bai.businessindustry_id
       WHERE bai.businessagency_id = ? AND bi.deleted = 0`,
      [req.params.id]
    );

    const [[licenseCount]] = await pool.query(
      'SELECT COUNT(*) as count FROM businesslicense WHERE agency_id = ? AND deleted = 0',
      [req.params.id]
    );

    const [users] = await pool.query(
      `SELECT u.id, u.first_name AS firstname, u.last_name AS lastname, u.email FROM users u
       INNER JOIN users_agencies bam ON u.id = bam.user_id
       WHERE bam.businessagency_id = ?`,
      [req.params.id]
    );

    return success(res, {
      ...rows[0],
      offices,
      industries,
      users,
      license_count: licenseCount.count,
    });
  } catch (err) {
    console.error('GET /api/agencies/:id error:', err);
    return error(res, 'Failed to fetch agency', 500);
  }
});

// PUT /api/agencies/:id — update issuing authority
// Mirrors legacy Doctrine flush: SQL 6 (main UPDATE), SQL 7 (users), SQL 8 (offices)
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const {
      title, acronym, fax, address, telephone, email, website,
      hours, postal_address, latitude, longitude, business_no,
      location_id, map_scan, user_ids, offices,
    } = req.body;

    const [rows] = await pool.query('SELECT * FROM businessagency WHERE id = ?', [id]);
    if (rows.length === 0) return error(res, 'Issuing authority not found', 404);

    if (!title || !title.trim()) return error(res, 'Name is required', 400);
    if (!address || !address.trim()) return error(res, 'Address is required', 400);
    if (!telephone || !telephone.trim()) return error(res, 'Telephone is required', 400);
    if (!email || !email.trim()) return error(res, 'Email is required', 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error(res, 'Email is not valid', 400);
    if (!website || !website.trim()) return error(res, 'Website is required', 400);
    if (!hours || !hours.trim()) return error(res, 'Working hours is required', 400);
    if (!postal_address || !postal_address.trim()) return error(res, 'Postal address is required', 400);
    if (!location_id) return error(res, 'Location is required', 400);

    // Check unique title (exclude self)
    const [[dupTitle]] = await pool.query('SELECT id FROM businessagency WHERE title = ? AND deleted = 0 AND id != ?', [title.trim(), id]);
    if (dupTitle) return error(res, 'An issuing authority with this name already exists', 409);

    // Check unique acronym (exclude self)
    if (acronym && acronym.trim()) {
      const [[dupAc]] = await pool.query('SELECT id FROM businessagency WHERE acronym = ? AND deleted = 0 AND id != ?', [acronym.trim(), id]);
      if (dupAc) return error(res, 'An issuing authority with this abbreviation already exists', 409);
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const currentUserId = req.body.user_id || 1;

    // SQL 6: UPDATE main businessagency record
    await pool.query(
      `UPDATE businessagency SET
        title = ?, name = ?, acronym = ?, fax = ?, address = ?, telephone = ?, email = ?,
        website = ?, hours = ?, postal_address = ?, latitude = ?, longitude = ?, business_no = ?,
        location_id = ?, map_scan = ?, slug = ?,
        updated = NOW(), updated_by = ?,
        content_changed = NOW(), content_changed_by = ?
       WHERE id = ?`,
      [
        title.trim(), title.trim(), acronym || null, fax || null, address.trim(), telephone.trim(),
        email.trim(), website.trim(), hours.trim(), postal_address.trim(),
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        business_no || null, location_id, map_scan || null, slug,
        currentUserId, currentUserId, id,
      ]
    );

    // SQL 7: Handle users ManyToMany — delete removed, insert new
    if (Array.isArray(user_ids)) {
      await pool.query('DELETE FROM users_agencies WHERE businessagency_id = ?', [id]);
      if (user_ids.length > 0) {
        const values = user_ids.map((uid) => [id, uid]);
        await pool.query('INSERT INTO users_agencies (businessagency_id, user_id) VALUES ?', [values]);
      }
    }

    // SQL 8: Handle offices OneToMany with orphan removal
    if (Array.isArray(offices)) {
      // Load current offices to detect removals
      const [currentOffices] = await pool.query(
        'SELECT id FROM businessagencyoffice WHERE agency_id = ?', [id]
      );
      const currentIds = currentOffices.map((o) => o.id);
      const submittedIds = offices.filter((o) => o.id).map((o) => Number(o.id));

      // SQL 8a: DELETE removed offices
      const removedIds = currentIds.filter((oid) => !submittedIds.includes(oid));
      if (removedIds.length > 0) {
        await pool.query('DELETE FROM businessagencyoffice WHERE id IN (?) AND agency_id = ?', [removedIds, id]);
      }

      // SQL 8b & 8c: UPDATE existing / INSERT new offices
      for (const office of offices) {
        if (office.id && currentIds.includes(Number(office.id))) {
          // SQL 8b: UPDATE existing office
          await pool.query(
            `UPDATE businessagencyoffice SET
              name = ?, address = ?, telephone = ?, email = ?, fax = ?,
              latitude = ?, longitude = ?, map_scan = ?, location_id = ?,
              updated = NOW()
             WHERE id = ? AND agency_id = ?`,
            [
              office.title || office.name || null, office.address || null, office.telephone || null,
              office.email || null, office.fax || null,
              office.latitude ? parseFloat(office.latitude) : null,
              office.longitude ? parseFloat(office.longitude) : null,
              office.map_scan || null,
              office.location_id || null, office.id, id,
            ]
          );
        } else {
          // SQL 8c: INSERT new office
          await pool.query(
            `INSERT INTO businessagencyoffice
              (name, address, telephone, email, fax, latitude, longitude,
               map_scan, location_id, agency_id, deleted, created, updated)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
            [
              office.title || office.name || null, office.address || null, office.telephone || null,
              office.email || null, office.fax || null,
              office.latitude ? parseFloat(office.latitude) : null,
              office.longitude ? parseFloat(office.longitude) : null,
              office.map_scan || null,
              office.location_id || null, id,
            ]
          );
        }
      }
    }

    return success(res, { id: Number(id), title: title.trim(), slug });
  } catch (err) {
    console.error('PUT /api/agencies/:id error:', err);
    return error(res, 'Failed to update issuing authority: ' + err.message, 500);
  }
});

// DELETE /api/agencies/:id — soft delete with dependency check
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [[agency]] = await pool.query('SELECT title FROM businessagency WHERE id = ?', [id]);
    if (!agency) return error(res, 'Issuing authority not found', 404);

    // Check licenses
    const [[lic]] = await pool.query('SELECT COUNT(*) AS c FROM businesslicense WHERE agency_id = ? AND deleted = 0', [id]);
    if (lic.c > 0) return error(res, "You Can't delete this Issuing Authority. It has Licenses associated to it", 409);

    // Check regulations
    const [[reg]] = await pool.query('SELECT COUNT(*) AS c FROM regulations WHERE agency_id = ? AND deleted = 0', [id]);
    if (reg.c > 0) return error(res, "You Can't delete this Issuing Authority. It has Regulations associated to it", 409);

    // Check forward plans
    const [[fp]] = await pool.query('SELECT COUNT(*) AS c FROM forward_plan_main_category WHERE agency_id = ?', [id]);
    if (fp.c > 0) return error(res, "You Can't delete this Issuing Authority. It has Forward Plans associated to it", 409);

    await pool.query('UPDATE businessagency SET deleted = 1 WHERE id = ?', [id]);
    return success(res, { message: 'Issuing authority deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/agencies/:id error:', err);
    return error(res, 'Failed to delete issuing authority: ' + err.message, 500);
  }
});

// GET /api/agencies/slug/:slug — agency by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM businessagency WHERE slug = ? AND deleted = 0',
      [req.params.slug]
    );
    if (rows.length === 0) return error(res, 'Agency not found', 404);
    return success(res, rows[0]);
  } catch (err) {
    console.error('GET /api/agencies/slug/:slug error:', err);
    return error(res, 'Failed to fetch agency', 500);
  }
});

export default router;
