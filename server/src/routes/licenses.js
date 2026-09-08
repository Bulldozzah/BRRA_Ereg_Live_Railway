import { Router } from 'express';
import pool from '../db.js';
import { executePaginatedQuery, parsePagination, success, error } from '../helpers.js';

const router = Router();

// GET /api/licenses — paginated list (PUBLIC - only published licenses)
router.get('/', async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const filters = {
      status: '1', // Only published licenses (status=1)
      deleted: 0,  // Exclude deleted licenses
    };
    // Allow additional filters but don't override status/deleted
    if (req.query.agency_id) filters.agency_id = req.query.agency_id;
    if (req.query.location_id) filters.location_id = req.query.location_id;
    if (req.query.stage_id) filters.stage_id = req.query.stage_id;

    // Industry filter: License → Activities → BusinessTypes → Industries
    // Chain: licenses_activities → businesstypes_activities → businesstypes_industries
    const extraWhere = [];
    const extraParams = [];
    if (req.query.industry_id) {
      extraWhere.push(
        `id IN (
          SELECT DISTINCT la.businesslicense_id
          FROM licenses_activities la
          INNER JOIN businesstypes_activities bta ON la.businessactivity_id = bta.businessactivity_id
          INNER JOIN businesstypes_industries bti ON bta.businesstype_id = bti.businesstype_id
          WHERE bti.businessindustry_id = ?
        )`
      );
      extraParams.push(req.query.industry_id);
    }
    // Business Type filter: License → Activities → BusinessTypes
    // Chain: licenses_activities → businesstypes_activities
    if (req.query.business_type_id) {
      extraWhere.push(
        `id IN (
          SELECT DISTINCT la.businesslicense_id
          FROM licenses_activities la
          INNER JOIN businesstypes_activities bta ON la.businessactivity_id = bta.businessactivity_id
          WHERE bta.businesstype_id = ?
        )`
      );
      extraParams.push(req.query.business_type_id);
    }

    const result = await executePaginatedQuery(pool, 'businesslicense', {
      ...pagination,
      searchColumns: ['name', 'description', 'keywords', 'purpose', 'requirements'],
      filters,
      extraWhere,
      extraParams,
    });

    // Attach agency name to each license
    const agencyIds = [...new Set(result.data.map((l) => l.agency_id).filter(Boolean))];
    if (agencyIds.length > 0) {
      const [agencies] = await pool.query(
        `SELECT id, name FROM businessagency WHERE id IN (${agencyIds.map(() => '?').join(',')})`,
        agencyIds
      );
      const agencyMap = Object.fromEntries(agencies.map((a) => [a.id, a.name]));
      for (const lic of result.data) {
        lic.agency_name = agencyMap[lic.agency_id] || null;
      }
    }

    return res.json(result);
  } catch (err) {
    console.error('GET /api/licenses error:', err);
    return error(res, 'Failed to fetch licenses', 500);
  }
});

// GET /api/licenses/:id — single license with related data (PUBLIC - only published)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.*, a.name AS agency_name, a.slug AS agency_slug, 
              loc.name AS location_name
       FROM businesslicense l
       LEFT JOIN businessagency a ON l.agency_id = a.id
       LEFT JOIN businesslocation loc ON l.location_id = loc.id
       WHERE l.id = ? AND l.deleted = 0 AND l.status = 1`,
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'License not found', 404);

    // Increment view counter
    await pool.query('UPDATE businesslicense SET views = COALESCE(views, 0) + 1 WHERE id = ?', [req.params.id]);

    const license = rows[0];

    // Fetch related data in parallel
    const [
      [requirements],
      [statutes],
      [downloads],
      [activities],
      [fieldData],
      [fixedFields],
    ] = await Promise.all([
      pool.query('SELECT * FROM licenserequirement WHERE license_id = ?', [req.params.id]),
      pool.query('SELECT * FROM licensestatute WHERE license_id = ? AND deleted = 0', [req.params.id]),
      pool.query('SELECT * FROM licensedownload WHERE license_id = ?', [req.params.id]),
      pool.query(
        `SELECT ba.* FROM businessactivity ba
         INNER JOIN licenses_activities la ON ba.id = la.businessactivity_id
         WHERE la.businesslicense_id = ? AND ba.deleted = 0`,
        [req.params.id]
      ),
      pool.query(
        `SELECT lfd.*, lf.fieldlabel, lf.fieldtype
         FROM licensefielddata lfd
         INNER JOIN licensefield lf ON lfd.field_id = lf.id
         WHERE lfd.license_id = ?`,
        [req.params.id]
      ),
      pool.query('SELECT * FROM licensefixedfield WHERE showed = 1 ORDER BY fieldlabel DESC'),
    ]);

    // Fetch full agency details + offices if agency exists
    let agency = null;
    let agencyOffices = [];
    if (license.agency_id) {
      const [agencyRows] = await pool.query(
        `SELECT a.*, loc.name AS location_name
         FROM businessagency a
         LEFT JOIN businesslocation loc ON a.location_id = loc.id
         WHERE a.id = ? AND a.deleted = 0`,
        [license.agency_id]
      );
      if (agencyRows.length > 0) {
        agency = agencyRows[0];
        const [offices] = await pool.query(
          `SELECT o.*, loc.name AS location_name
           FROM businessagencyoffice o
           LEFT JOIN businesslocation loc ON o.location_id = loc.id
           WHERE o.agency_id = ? AND o.deleted = 0`,
          [license.agency_id]
        );
        agencyOffices = offices;
      }
    }

    return success(res, {
      ...license,
      requirements,
      statutes,
      downloads,
      activities,
      field_data: fieldData,
      fixed_fields: fixedFields,
      agency,
      agency_offices: agencyOffices,
    });
  } catch (err) {
    console.error('GET /api/licenses/:id error:', err);
    return error(res, 'Failed to fetch license', 500);
  }
});

// GET /api/licenses/agency/:slug — licenses by agency slug
router.get('/agency/:slug', async (req, res) => {
  try {
    const [agency] = await pool.query(
      'SELECT id, name FROM businessagency WHERE slug = ? AND deleted = 0',
      [req.params.slug]
    );
    if (agency.length === 0) return error(res, 'Agency not found', 404);

    const pagination = parsePagination(req.query);
    const result = await executePaginatedQuery(pool, 'businesslicense', {
      ...pagination,
      searchColumns: ['name', 'keywords', 'description'],
      filters: { agency_id: agency[0].id },
    });
    return res.json({ ...result, agency: agency[0] });
  } catch (err) {
    console.error('GET /api/licenses/agency/:slug error:', err);
    return error(res, 'Failed to fetch licenses by agency', 500);
  }
});

// GET /api/licenses/location/:id — licenses by location
router.get('/location/:id', async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const result = await executePaginatedQuery(pool, 'businesslicense', {
      ...pagination,
      searchColumns: ['name', 'keywords', 'description'],
      filters: { location_id: req.params.id },
    });
    return res.json(result);
  } catch (err) {
    console.error('GET /api/licenses/location/:id error:', err);
    return error(res, 'Failed to fetch licenses by location', 500);
  }
});

export default router;
