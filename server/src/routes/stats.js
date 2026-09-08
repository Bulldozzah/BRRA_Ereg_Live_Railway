import { Router } from 'express';
import pool from '../db.js';
import { success, error } from '../helpers.js';

const router = Router();

// GET /api/stats/counts — homepage statistics counts
router.get('/counts', async (req, res) => {
  try {
    // Count jurisdictions (locations)
    const [[{ location_count }]] = await pool.query(
      'SELECT COUNT(*) as location_count FROM businesslocation WHERE deleted = 0'
    );

    // Count business types
    const [[{ business_type_count }]] = await pool.query(
      'SELECT COUNT(*) as business_type_count FROM businesstype WHERE deleted = 0'
    );

    // Count published licenses
    const [[{ license_count }]] = await pool.query(
      'SELECT COUNT(*) as license_count FROM businesslicense WHERE deleted = 0 AND status = 1'
    );

    return success(res, {
      jurisdictions: location_count,
      business_types: business_type_count,
      licenses: license_count,
    });
  } catch (err) {
    console.error('GET /api/stats/counts error:', err);
    return error(res, 'Failed to fetch statistics', 500);
  }
});

export default router;
