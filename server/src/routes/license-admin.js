import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../db.js';
import { success, error } from '../helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/license-admin/dashboard — workflow-tabbed license management dashboard
// Query params: ?stage_id=20&user_id=1
// ---------------------------------------------------------------------------
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.query.user_id || 1;
    const selectedStageId = req.query.stage_id || null;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;
    const searchQuery = req.query.q || '';

    // Step 1: Get user's agencies
    const [userAgencies] = await pool.query(
      'SELECT businessagency_id FROM users_agencies WHERE user_id = ?',
      [userId]
    );
    const agencyIds = userAgencies.map((r) => r.businessagency_id);

    // Step 2: Get user's workflow stages (via groups)
    // Users → users_groups → groups → license_workflow_groups → license_workflow
    const [userStages] = await pool.query(
      `SELECT DISTINCT w.id
       FROM license_workflow w
       INNER JOIN license_workflow_groups lwg ON w.id = lwg.workflow_id
       INNER JOIN users_groups ug ON lwg.group_id = ug.group_id
       WHERE ug.user_id = ? AND w.deleted = 0 AND w.published = 1
       ORDER BY w.id ASC`,
      [userId]
    );
    const stageIds = userStages.map((r) => r.id);

    // Step 3: Build workflow tabs
    // If user has agencies → show their permitted stages; otherwise show just published
    let tabs = [];
    if (agencyIds.length > 0 && stageIds.length > 0) {
      const [workflows] = await pool.query(
        `SELECT * FROM license_workflow
         WHERE published = 1 AND deleted = 0 AND id IN (${stageIds.map(() => '?').join(',')})
         ORDER BY FIELD(type, 'submission', 'corrections', 'assess', 'publish', 'unpublish'), id ASC`,
        stageIds
      );
      tabs = workflows;
    } else {
      // Fallback: show all published workflow stages (super admin)
      const [workflows] = await pool.query(
        `SELECT * FROM license_workflow
         WHERE published = 1 AND deleted = 0
         ORDER BY FIELD(type, 'submission', 'corrections', 'assess', 'publish', 'unpublish'), id ASC`
      );
      tabs = workflows;
    }

    // Step 4: Count licenses per stage
    for (const tab of tabs) {
      let countQuery, countParams;
      if (tab.type === 'unpublish') {
        // Unpublished: status=4 across all stages
        if (agencyIds.length > 0) {
          countQuery = `SELECT COUNT(*) AS cnt FROM businesslicense WHERE status = 4 AND deleted = 0 AND agency_id IN (${agencyIds.map(() => '?').join(',')})`;
          countParams = agencyIds;
        } else {
          countQuery = 'SELECT COUNT(*) AS cnt FROM businesslicense WHERE status = 4 AND deleted = 0';
          countParams = [];
        }
      } else {
        if (agencyIds.length > 0) {
          countQuery = `SELECT COUNT(*) AS cnt FROM businesslicense WHERE stage_id = ? AND deleted = 0 AND agency_id IN (${agencyIds.map(() => '?').join(',')})`;
          countParams = [tab.id, ...agencyIds];
        } else {
          countQuery = 'SELECT COUNT(*) AS cnt FROM businesslicense WHERE stage_id = ? AND deleted = 0';
          countParams = [tab.id];
        }
      }
      const [[{ cnt }]] = await pool.query(countQuery, countParams);
      tab.license_count = cnt;
    }

    // Step 5: "My Licenses" total count
    let totalCount = 0;
    if (agencyIds.length > 0) {
      const [[{ cnt }]] = await pool.query(
        `SELECT COUNT(*) AS cnt FROM businesslicense WHERE deleted = 0 AND agency_id IN (${agencyIds.map(() => '?').join(',')})`,
        agencyIds
      );
      totalCount = cnt;
    } else {
      const [[{ cnt }]] = await pool.query('SELECT COUNT(*) AS cnt FROM businesslicense WHERE deleted = 0');
      totalCount = cnt;
    }

    // Step 6: Load licenses for selected stage (or all) with pagination
    let licenses = [];
    let whereClause = 'bl.deleted = 0';
    let whereParams = [];

    if (selectedStageId === 'all' || !selectedStageId) {
      if (agencyIds.length > 0) {
        whereClause += ` AND bl.agency_id IN (${agencyIds.map(() => '?').join(',')})`;
        whereParams = [...agencyIds];
      }
    } else {
      const stageTab = tabs.find((t) => String(t.id) === String(selectedStageId));
      if (stageTab && stageTab.type === 'unpublish') {
        whereClause += ' AND bl.status = 4';
        if (agencyIds.length > 0) {
          whereClause += ` AND bl.agency_id IN (${agencyIds.map(() => '?').join(',')})`;
          whereParams = [...agencyIds];
        }
      } else {
        whereClause += ' AND bl.stage_id = ?';
        whereParams = [selectedStageId];
        if (agencyIds.length > 0) {
          whereClause += ` AND bl.agency_id IN (${agencyIds.map(() => '?').join(',')})`;
          whereParams.push(...agencyIds);
        }
      }
    }

    // Add search filter
    if (searchQuery) {
      whereClause += ' AND (bl.name LIKE ? OR a.name LIKE ?)';
      whereParams.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    // Get filtered count for pagination
    const [[{ filteredCount }]] = await pool.query(
      `SELECT COUNT(*) AS filteredCount FROM businesslicense bl LEFT JOIN businessagency a ON bl.agency_id = a.id WHERE ${whereClause}`,
      whereParams
    );
    const totalPages = Math.ceil(filteredCount / limit);

    // Fetch paginated licenses with stage info
    const [licenseRows] = await pool.query(
      `SELECT bl.*, a.name AS agency_name, lw.title AS stage_title, lw.type AS stage_type
       FROM businesslicense bl
       LEFT JOIN businessagency a ON bl.agency_id = a.id
       LEFT JOIN license_workflow lw ON bl.stage_id = lw.id
       WHERE ${whereClause}
       ORDER BY bl.updated DESC, bl.id DESC
       LIMIT ? OFFSET ?`,
      [...whereParams, limit, offset]
    );
    licenses = licenseRows;

    // Step 7: Find the selected tab info
    const selectedTab = selectedStageId && selectedStageId !== 'all'
      ? tabs.find((t) => String(t.id) === String(selectedStageId)) || null
      : null;

    return success(res, {
      tabs,
      total_count: totalCount,
      filtered_count: filteredCount,
      selected_stage_id: selectedStageId || 'all',
      selected_tab: selectedTab,
      licenses,
      user_agencies: agencyIds,
      pagination: {
        page,
        limit,
        total: filteredCount,
        total_pages: totalPages,
      },
    });
  } catch (err) {
    console.error('GET /api/license-admin/dashboard error:', err);
    return error(res, 'Failed to load dashboard: ' + err.message, 500);
  }
});

// ---------------------------------------------------------------------------
// POST /api/license-admin/batch — batch actions (publish, unpublish, delete, save_draft)
// ---------------------------------------------------------------------------
router.post('/batch', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { ids, action } = req.body;
    const userId = req.body.user_id || 1;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return error(res, 'No license IDs provided', 400);
    }
    if (!['publish', 'unpublish', 'delete', 'save_draft'].includes(action)) {
      return error(res, 'Invalid action. Must be: publish, unpublish, delete, or save_draft', 400);
    }

    const placeholders = ids.map(() => '?').join(',');
    let updated = 0;

    if (action === 'publish') {
      // Find publish workflow stage
      const [[publishStage]] = await conn.query(
        "SELECT * FROM license_workflow WHERE type = 'publish' AND deleted = 0 LIMIT 1"
      );
      if (!publishStage) {
        await conn.rollback();
        return error(res, 'Publish workflow stage not configured', 500);
      }
      const [result] = await conn.query(
        `UPDATE businesslicense SET status = 1, stage_id = ?, updated = NOW() WHERE id IN (${placeholders}) AND deleted = 0`,
        [publishStage.id, ...ids]
      );
      updated = result.affectedRows;

      // Create history for each
      for (const id of ids) {
        await conn.query(
          `INSERT INTO application_history (user_id, action_type, current_step, application_id)
           VALUES (?, 'Batch Published', ?, ?)`,
          [userId, publishStage.id, id]
        );
      }
    } else if (action === 'unpublish') {
      // Find unpublish workflow stage
      const [[unpublishStage]] = await conn.query(
        "SELECT * FROM license_workflow WHERE type = 'unpublish' AND deleted = 0 LIMIT 1"
      );
      if (!unpublishStage) {
        await conn.rollback();
        return error(res, 'Unpublish workflow stage not configured', 500);
      }
      const [result] = await conn.query(
        `UPDATE businesslicense SET status = 4, stage_id = ?, updated = NOW() WHERE id IN (${placeholders}) AND deleted = 0`,
        [unpublishStage.id, ...ids]
      );
      updated = result.affectedRows;

      for (const id of ids) {
        await conn.query(
          `INSERT INTO application_history (user_id, action_type, current_step, application_id)
           VALUES (?, 'Batch Unpublished', ?, ?)`,
          [userId, unpublishStage.id, id]
        );
      }
    } else if (action === 'delete') {
      // Soft delete
      const [result] = await conn.query(
        `UPDATE businesslicense SET deleted = 1, updated = NOW() WHERE id IN (${placeholders}) AND deleted = 0`,
        ids
      );
      updated = result.affectedRows;
    } else if (action === 'save_draft') {
      const [[firstStage]] = await conn.query(
        'SELECT * FROM license_workflow WHERE first_stage = 1 AND deleted = 0 LIMIT 1'
      );
      const stageId = firstStage ? firstStage.id : null;
      const [result] = await conn.query(
        `UPDATE businesslicense SET status = 2${stageId ? ', stage_id = ?' : ''}, updated = NOW() WHERE id IN (${placeholders}) AND deleted = 0`,
        stageId ? [stageId, ...ids] : ids
      );
      updated = result.affectedRows;
    }

    await conn.commit();

    return success(res, {
      action,
      updated,
      message: `${updated} license(s) ${action === 'delete' ? 'deleted' : action === 'publish' ? 'published' : action === 'unpublish' ? 'unpublished' : 'saved as draft'} successfully`,
    });
  } catch (err) {
    await conn.rollback();
    console.error('POST /api/license-admin/batch error:', err);
    return error(res, 'Batch action failed: ' + err.message, 500);
  } finally {
    conn.release();
  }
});

// ---------------------------------------------------------------------------
// GET /api/license-admin/fixed-fields — get configurable field visibility
// ---------------------------------------------------------------------------
router.get('/fixed-fields', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM licensefixedfield ORDER BY fieldlabel ASC'
    );
    return success(res, rows);
  } catch (err) {
    console.error('GET /api/license-admin/fixed-fields error:', err);
    return error(res, 'Failed to fetch fixed fields', 500);
  }
});

// ---------------------------------------------------------------------------
// GET /api/license-admin/custom-fields — get dynamic custom fields + choices
// ---------------------------------------------------------------------------
router.get('/custom-fields', async (req, res) => {
  try {
    const [fields] = await pool.query(
      'SELECT * FROM licensefield WHERE showed = 1 ORDER BY fieldorder ASC'
    );
    for (const f of fields) {
      if (f.fieldtype === 2) {
        const [choices] = await pool.query(
          'SELECT * FROM licensefieldchoice WHERE field_id = ? AND showed = 1 ORDER BY choiceorder ASC',
          [f.id]
        );
        f.choices = choices;
      } else {
        f.choices = [];
      }
    }
    return success(res, fields);
  } catch (err) {
    console.error('GET /api/license-admin/custom-fields error:', err);
    return error(res, 'Failed to fetch custom fields', 500);
  }
});

// ---------------------------------------------------------------------------
// GET /api/license-admin/workflow-first-stage — get the first workflow stage
// ---------------------------------------------------------------------------
router.get('/workflow-first-stage', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM license_workflow WHERE first_stage = 1 AND deleted = 0 LIMIT 1'
    );
    if (rows.length === 0) {
      return success(res, null);
    }
    const stage = rows[0];
    if (stage.next_stage) {
      const [next] = await pool.query(
        'SELECT * FROM license_workflow WHERE id = ? AND deleted = 0',
        [stage.next_stage]
      );
      stage.next_stage_data = next[0] || null;
    }
    return success(res, stage);
  } catch (err) {
    console.error('GET /api/license-admin/workflow-first-stage error:', err);
    return error(res, 'Failed to fetch workflow stage', 500);
  }
});

// ---------------------------------------------------------------------------
// POST /api/license-admin/create — create a new license
// ---------------------------------------------------------------------------
const createUpload = upload.fields([
  { name: 'principle_legislation_file', maxCount: 1 },
  { name: 'download_files', maxCount: 20 },
  { name: 'subsidiary_files', maxCount: 20 },
]);

router.post('/create', createUpload, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const body = req.body;
    const files = req.files || {};

    // Determine status: draft (2) or submitted (3)
    const isDraft = body.save_as_draft === 'true' || body.save_as_draft === '1';
    const status = isDraft ? '2' : '3';

    // Get first workflow stage
    const [[firstStage]] = await conn.query(
      'SELECT * FROM license_workflow WHERE first_stage = 1 AND deleted = 0 LIMIT 1'
    );
    let stageId = firstStage ? firstStage.id : 1;
    if (!isDraft && firstStage && firstStage.next_stage) {
      stageId = firstStage.next_stage;
    }

    // Generate slug
    const slug = (body.name || 'license')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Principle legislation file
    let principleLegislationAttachment = null;
    if (files.principle_legislation_file && files.principle_legislation_file[0]) {
      principleLegislationAttachment = files.principle_legislation_file[0].filename;
    }

    // Insert license
    const [result] = await conn.query(
      `INSERT INTO businesslicense (
        name, keywords, purpose, description, license_no,
        application_fee, license_fee, max_processing_time,
        gazetted_on, related_websites, validity, enactment,
        gazetting_ref, contact_office, resolution_criteria,
        universal, location_id, agency_id, status, stage_id,
        slug, principle_legislation, subsidiary_legislation,
        principle_legislation_attachment, requirements,
        deleted, created, updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
      [
        body.name || '',
        body.keywords || null,
        body.purpose || null,
        body.description || null,
        body.license_no || null,
        body.application_fee || null,
        body.license_fee || null,
        body.max_processing_time || null,
        body.gazetted_on || null,
        body.related_websites || null,
        body.validity || null,
        body.enactment || null,
        body.gazetting_ref || null,
        body.contact_office || null,
        body.resolution_criteria || null,
        body.universal === 'true' || body.universal === '1' ? 1 : 0,
        body.location_id || null,
        body.agency_id || null,
        status,
        stageId,
        slug,
        body.principle_legislation || null,
        body.subsidiary_legislation || null,
        principleLegislationAttachment,
        body.requirements || null,
      ]
    );

    const licenseId = result.insertId;

    // Save activities (ManyToMany)
    if (body.activity_ids) {
      const activityIds = typeof body.activity_ids === 'string'
        ? JSON.parse(body.activity_ids)
        : body.activity_ids;
      for (const actId of activityIds) {
        await conn.query(
          'INSERT INTO licenses_activities (businesslicense_id, businessactivity_id) VALUES (?, ?)',
          [licenseId, actId]
        );
      }
    }

    // Save custom field data
    if (body.custom_fields) {
      const customFields = typeof body.custom_fields === 'string'
        ? JSON.parse(body.custom_fields)
        : body.custom_fields;
      for (const [fieldId, fieldData] of Object.entries(customFields)) {
        await conn.query(
          `INSERT INTO licensefielddata (license_id, field_id, fielddata, created, updated)
           VALUES (?, ?, ?, NOW(), NOW())`,
          [licenseId, fieldId, fieldData || '']
        );
      }
    }

    // Save subsidiary legislation attachments
    if (body.subsidiary_items) {
      const subItems = typeof body.subsidiary_items === 'string'
        ? JSON.parse(body.subsidiary_items)
        : body.subsidiary_items;
      const subFiles = files.subsidiary_files || [];
      for (let i = 0; i < subItems.length; i++) {
        const item = subItems[i];
        const file = subFiles[i] || null;
        await conn.query(
          `INSERT INTO subsidiarylegislationattachments (license_id, name, filepath, created, updated)
           VALUES (?, ?, ?, NOW(), NOW())`,
          [licenseId, item.name || '', file ? file.filename : null]
        );
      }
    }

    // Save downloads
    if (body.download_items) {
      const dlItems = typeof body.download_items === 'string'
        ? JSON.parse(body.download_items)
        : body.download_items;
      const dlFiles = files.download_files || [];
      for (let i = 0; i < dlItems.length; i++) {
        const item = dlItems[i];
        const file = dlFiles[i] || null;
        await conn.query(
          `INSERT INTO licensedownload (license_id, name, issuing_body, filepath, filesize, type_id, created, updated)
           VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`,
          [licenseId, item.name || '', item.issuing_body || '', file ? file.filename : null, file ? file.size : 0]
        );
      }
    }

    // Create application history
    await conn.query(
      `INSERT INTO application_history (user_id, action_type, previous_stage, current_step, application_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        body.user_id || 1,
        isDraft ? 'License Saved as Draft' : 'License Details Submitted',
        firstStage ? firstStage.id : null,
        stageId,
        licenseId,
      ]
    );

    await conn.commit();

    return success(res, { id: licenseId, status, stage_id: stageId, slug }, 201);
  } catch (err) {
    await conn.rollback();
    console.error('POST /api/license-admin/create error:', err);
    return error(res, 'Failed to create license: ' + err.message, 500);
  } finally {
    conn.release();
  }
});

// Task table columns mapping:
// task_license_id = license FK, assigned_to = assignee, assigned_by = assigner

// ---------------------------------------------------------------------------
// GET /api/license-admin/:id/show — load license for review with workflow info
// ---------------------------------------------------------------------------
router.get('/:id/show', async (req, res) => {
  try {
    const licenseId = req.params.id;

    // Load the license with agency info
    const [rows] = await pool.query(
      `SELECT l.*, a.name AS agency_name, a.slug AS agency_slug,
              loc.name AS location_name
       FROM businesslicense l
       LEFT JOIN businessagency a ON l.agency_id = a.id
       LEFT JOIN businesslocation loc ON l.location_id = loc.id
       WHERE l.id = ? AND l.deleted = 0`,
      [licenseId]
    );
    if (rows.length === 0) return error(res, 'License not found', 404);

    const license = rows[0];

    // Fetch related data in parallel
    const [
      [activities],
      [fieldData],
      [downloads],
      [statutes],
      [requirements],
      [history],
      [tasks],
    ] = await Promise.all([
      pool.query(
        `SELECT ba.* FROM businessactivity ba
         INNER JOIN licenses_activities la ON ba.id = la.businessactivity_id
         WHERE la.businesslicense_id = ? AND ba.deleted = 0`,
        [licenseId]
      ),
      pool.query(
        `SELECT lfd.*, lf.fieldlabel, lf.fieldtype
         FROM licensefielddata lfd
         INNER JOIN licensefield lf ON lfd.field_id = lf.id
         WHERE lfd.license_id = ?`,
        [licenseId]
      ),
      pool.query('SELECT * FROM licensedownload WHERE license_id = ?', [licenseId]),
      pool.query('SELECT * FROM licensestatute WHERE license_id = ? AND deleted = 0', [licenseId]),
      pool.query('SELECT * FROM licenserequirement WHERE license_id = ?', [licenseId]),
      pool.query(
        `SELECT ah.*, lw_prev.title AS previous_stage_title, lw_curr.title AS current_step_title
         FROM application_history ah
         LEFT JOIN license_workflow lw_prev ON ah.previous_stage = lw_prev.id
         LEFT JOIN license_workflow lw_curr ON ah.current_step = lw_curr.id
         WHERE ah.application_id = ?
         ORDER BY ah.id DESC`,
        [licenseId]
      ),
      pool.query(
        `SELECT * FROM task WHERE task_license_id = ? ORDER BY id DESC`,
        [licenseId]
      ),
    ]);

    // Get current workflow stage info
    let workflow = null;
    let showAssessmentButtons = false;
    if (license.stage_id) {
      const [wfRows] = await pool.query(
        'SELECT * FROM license_workflow WHERE id = ? AND deleted = 0',
        [license.stage_id]
      );
      if (wfRows.length > 0) {
        workflow = wfRows[0];

        // Load next_stage and reject_stage data
        if (workflow.next_stage) {
          const [ns] = await pool.query('SELECT * FROM license_workflow WHERE id = ?', [workflow.next_stage]);
          workflow.next_stage_data = ns[0] || null;
        }
        if (workflow.reject_stage) {
          const [rs] = await pool.query('SELECT * FROM license_workflow WHERE id = ?', [workflow.reject_stage]);
          workflow.reject_stage_data = rs[0] || null;
        }

        // Load access groups for this stage
        const [groups] = await pool.query(
          `SELECT g.id, g.name FROM \`groups\` g
           INNER JOIN license_workflow_groups lwg ON g.id = lwg.group_id
           WHERE lwg.workflow_id = ?`,
          [workflow.id]
        );
        workflow.access_groups = groups;

        // Determine if assessment buttons should be shown
        // Status 3=Pending, 1=Published, 4=Unpublished, 5=Needs Corrections
        const assessableStatuses = [3, 1, 4, 5];
        if (assessableStatuses.includes(Number(license.status))) {
          // For the prototype, grant access to logged-in admin
          // In production, check user groups against workflow.access_groups
          showAssessmentButtons = true;
        }
      }
    }

    // Find active (pending) task for this license at current stage
    const activeTask = tasks.find(
      (t) => t.task_status === 'pending' && t.stage_id === license.stage_id
    ) || null;

    // Find last rejection task (decline=1) if any
    const lastRejection = tasks.find((t) => Number(t.decline) === 1) || null;

    return success(res, {
      ...license,
      activities,
      field_data: fieldData,
      downloads,
      statutes,
      requirements,
      history,
      tasks,
      workflow,
      show_assessment_buttons: showAssessmentButtons,
      active_task: activeTask,
      last_rejection: lastRejection,
    });
  } catch (err) {
    console.error('GET /api/license-admin/:id/show error:', err);
    return error(res, 'Failed to fetch license for review', 500);
  }
});

// ---------------------------------------------------------------------------
// POST /api/license-admin/:id/approve — approve a license
// ---------------------------------------------------------------------------
router.post('/:id/approve', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const licenseId = req.params.id;
    const userId = req.body.user_id || 1;
    const stageId = req.body.stage_id;

    // Load license
    const [[license]] = await conn.query(
      'SELECT * FROM businesslicense WHERE id = ? AND deleted = 0',
      [licenseId]
    );
    if (!license) {
      await conn.rollback();
      return error(res, 'License not found', 404);
    }

    // Duplicate submission check: see if last history entry is already an approval at this stage
    const [recentHistory] = await conn.query(
      `SELECT * FROM application_history
       WHERE application_id = ? AND action_type = 'License Details Approved' AND current_step = ?
       ORDER BY id DESC LIMIT 1`,
      [licenseId, stageId || license.stage_id]
    );
    if (recentHistory.length > 0) {
      await conn.rollback();
      return error(res, 'This license has already been approved at this stage', 409);
    }

    // Get current workflow stage
    const [[currentStage]] = await conn.query(
      'SELECT * FROM license_workflow WHERE id = ? AND deleted = 0',
      [license.stage_id]
    );
    if (!currentStage) {
      await conn.rollback();
      return error(res, 'Current workflow stage not found', 404);
    }

    // Mark existing pending task as complete (self-assign if none exists)
    const [existingTasks] = await conn.query(
      `SELECT * FROM task WHERE task_license_id = ? AND stage_id = ? AND task_status = 'pending' LIMIT 1`,
      [licenseId, license.stage_id]
    );
    if (existingTasks.length > 0) {
      await conn.query(
        `UPDATE task SET task_status = 'complete', task_end_date = NOW() WHERE id = ?`,
        [existingTasks[0].id]
      );
    } else {
      // Self-assign: create a completed task
      await conn.query(
        `INSERT INTO task (task_license_id, stage_id, assigned_to, assigned_by, task_description, task_status, task_start_date, task_end_date)
         VALUES (?, ?, ?, ?, ?, 'complete', NOW(), NOW())`,
        [licenseId, license.stage_id, userId, userId, 'Self-assigned approval']
      );
    }

    // Determine next stage and status
    let nextStageId = license.stage_id;
    let newStatus = 3; // default: pending
    let isPublish = false;

    if (currentStage.next_stage) {
      // Load next stage
      const [[nextStage]] = await conn.query(
        'SELECT * FROM license_workflow WHERE id = ?',
        [currentStage.next_stage]
      );

      if (nextStage && nextStage.type === 'publish') {
        // Next stage is publish → license becomes Published (status=1)
        nextStageId = nextStage.id;
        newStatus = 1;
        isPublish = true;
      } else if (nextStage) {
        // Intermediate stage → move forward, stay pending
        nextStageId = nextStage.id;
        newStatus = 3;
      }
    } else if (currentStage.type === 'publish') {
      // Already at publish stage → keep published
      nextStageId = currentStage.id;
      newStatus = 1;
      isPublish = true;
    } else {
      // No next stage defined → publish by default
      newStatus = 1;
      isPublish = true;
    }

    // Update license
    await conn.query(
      'UPDATE businesslicense SET stage_id = ?, status = ?, updated = NOW() WHERE id = ?',
      [nextStageId, newStatus, licenseId]
    );

    // Create application history
    await conn.query(
      `INSERT INTO application_history (user_id, action_type, previous_stage, current_step, application_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, 'License Details Approved', license.stage_id, nextStageId, licenseId]
    );

    // If not publish and there's a next stage with an assignee, create a task
    if (!isPublish && currentStage.next_stage) {
      const [[nextStageForTask]] = await conn.query(
        'SELECT * FROM license_workflow WHERE id = ?',
        [currentStage.next_stage]
      );
      if (nextStageForTask && nextStageForTask.assignee_id) {
        await conn.query(
          `INSERT INTO task (task_license_id, stage_id, assigned_to, assigned_by, task_description, task_status, task_start_date)
           VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
          [licenseId, nextStageForTask.id, nextStageForTask.assignee_id, userId, nextStageForTask.task_description || 'License review']
        );
      }
    }

    await conn.commit();

    return success(res, {
      id: licenseId,
      status: newStatus,
      stage_id: nextStageId,
      published: isPublish,
      message: isPublish ? 'License approved and published' : 'License approved and moved to next stage',
    });
  } catch (err) {
    await conn.rollback();
    console.error('POST /api/license-admin/:id/approve error:', err);
    return error(res, 'Failed to approve license: ' + err.message, 500);
  } finally {
    conn.release();
  }
});

// ---------------------------------------------------------------------------
// POST /api/license-admin/:id/reject — reject a license
// ---------------------------------------------------------------------------
router.post('/:id/reject', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const licenseId = req.params.id;
    const userId = req.body.user_id || 1;
    const reasons = req.body.reasons || '';

    // Load license
    const [[license]] = await conn.query(
      'SELECT * FROM businesslicense WHERE id = ? AND deleted = 0',
      [licenseId]
    );
    if (!license) {
      await conn.rollback();
      return error(res, 'License not found', 404);
    }

    // Get current workflow stage
    const [[currentStage]] = await conn.query(
      'SELECT * FROM license_workflow WHERE id = ? AND deleted = 0',
      [license.stage_id]
    );
    if (!currentStage) {
      await conn.rollback();
      return error(res, 'Current workflow stage not found', 404);
    }

    // Mark existing pending task as complete
    const [existingTasks] = await conn.query(
      `SELECT * FROM task WHERE task_license_id = ? AND stage_id = ? AND task_status = 'pending' LIMIT 1`,
      [licenseId, license.stage_id]
    );
    if (existingTasks.length > 0) {
      await conn.query(
        `UPDATE task SET task_status = 'complete', task_end_date = NOW() WHERE id = ?`,
        [existingTasks[0].id]
      );
    }

    // Determine the stage to move back to
    // Use reject_stage if defined, otherwise use the first stage (submission)
    let rejectStageId = null;
    if (currentStage.reject_stage) {
      rejectStageId = currentStage.reject_stage;
    } else {
      // Fallback: get first stage
      const [[firstStage]] = await conn.query(
        'SELECT id FROM license_workflow WHERE first_stage = 1 AND deleted = 0 LIMIT 1'
      );
      rejectStageId = firstStage ? firstStage.id : license.stage_id;
    }

    // Update license: move back, status = 5 (Needs Corrections)
    await conn.query(
      'UPDATE businesslicense SET stage_id = ?, status = 5, updated = NOW() WHERE id = ?',
      [rejectStageId, licenseId]
    );

    // Create rejection history
    await conn.query(
      `INSERT INTO application_history (user_id, action_type, previous_stage, current_step, application_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, 'License Details Rejected', license.stage_id, rejectStageId, licenseId]
    );

    // Create rejection task for the original creator
    const creatorId = license.created_by || userId;
    await conn.query(
      `INSERT INTO task (task_license_id, stage_id, assigned_to, assigned_by, task_description, task_status, decline, task_start_date, task_end_date)
       VALUES (?, ?, ?, ?, ?, 'pending', 1, NOW(), NOW())`,
      [licenseId, rejectStageId, creatorId, userId, reasons]
    );

    await conn.commit();

    return success(res, {
      id: licenseId,
      status: 5,
      stage_id: rejectStageId,
      message: 'License rejected and sent back for corrections',
    });
  } catch (err) {
    await conn.rollback();
    console.error('POST /api/license-admin/:id/reject error:', err);
    return error(res, 'Failed to reject license: ' + err.message, 500);
  } finally {
    conn.release();
  }
});

// ---------------------------------------------------------------------------
// POST /api/license-admin/:id/unpublish — unpublish a published license
// ---------------------------------------------------------------------------
router.post('/:id/unpublish', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const licenseId = req.params.id;
    const userId = req.body.user_id || 1;

    // Load license
    const [[license]] = await conn.query(
      'SELECT * FROM businesslicense WHERE id = ? AND deleted = 0',
      [licenseId]
    );
    if (!license) {
      await conn.rollback();
      return error(res, 'License not found', 404);
    }

    // Find the unpublish workflow stage
    const [[unpublishStage]] = await conn.query(
      "SELECT * FROM license_workflow WHERE type = 'unpublish' AND deleted = 0 LIMIT 1"
    );
    if (!unpublishStage) {
      await conn.rollback();
      return error(res, 'Unpublish workflow stage not configured', 500);
    }

    const previousStageId = license.stage_id;

    // Update license: status=4 (Unpublished), stage to unpublish stage
    await conn.query(
      'UPDATE businesslicense SET stage_id = ?, status = 4, updated = NOW() WHERE id = ?',
      [unpublishStage.id, licenseId]
    );

    // Create history record
    await conn.query(
      `INSERT INTO application_history (user_id, action_type, previous_stage, current_step, application_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, 'License Unpublished', previousStageId, unpublishStage.id, licenseId]
    );

    await conn.commit();

    return success(res, {
      id: licenseId,
      status: 4,
      stage_id: unpublishStage.id,
      message: 'License has been unpublished and removed from public view',
    });
  } catch (err) {
    await conn.rollback();
    console.error('POST /api/license-admin/:id/unpublish error:', err);
    return error(res, 'Failed to unpublish license: ' + err.message, 500);
  } finally {
    conn.release();
  }
});

// ---------------------------------------------------------------------------
// POST /api/license-admin/:id/publish — re-publish an unpublished license
// ---------------------------------------------------------------------------
router.post('/:id/publish', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const licenseId = req.params.id;
    const userId = req.body.user_id || 1;

    // Load license
    const [[license]] = await conn.query(
      'SELECT * FROM businesslicense WHERE id = ? AND deleted = 0',
      [licenseId]
    );
    if (!license) {
      await conn.rollback();
      return error(res, 'License not found', 404);
    }

    // Find the publish workflow stage
    const [[publishStage]] = await conn.query(
      "SELECT * FROM license_workflow WHERE type = 'publish' AND deleted = 0 LIMIT 1"
    );
    if (!publishStage) {
      await conn.rollback();
      return error(res, 'Publish workflow stage not configured', 500);
    }

    const previousStageId = license.stage_id;

    // Update license: status=1 (Published), stage to publish stage
    await conn.query(
      'UPDATE businesslicense SET stage_id = ?, status = 1, updated = NOW() WHERE id = ?',
      [publishStage.id, licenseId]
    );

    // Create history record
    await conn.query(
      `INSERT INTO application_history (user_id, action_type, previous_stage, current_step, application_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, 'License Published', previousStageId, publishStage.id, licenseId]
    );

    await conn.commit();

    return success(res, {
      id: licenseId,
      status: 1,
      stage_id: publishStage.id,
      message: 'License has been published and is now publicly visible',
    });
  } catch (err) {
    await conn.rollback();
    console.error('POST /api/license-admin/:id/publish error:', err);
    return error(res, 'Failed to publish license: ' + err.message, 500);
  } finally {
    conn.release();
  }
});

// ---------------------------------------------------------------------------
// PUT /api/license-admin/:id/update — update/edit a license
// ---------------------------------------------------------------------------
const updateUpload = upload.fields([
  { name: 'principle_legislation_file', maxCount: 1 },
  { name: 'subsidiary_files', maxCount: 20 },
  { name: 'download_files', maxCount: 20 },
]);

router.put('/:id/update', updateUpload, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const licenseId = req.params.id;
    const body = req.body;
    const files = req.files || {};
    const userId = body.user_id || 1;

    // Load current license
    const [[license]] = await conn.query(
      'SELECT * FROM businesslicense WHERE id = ? AND deleted = 0',
      [licenseId]
    );
    if (!license) {
      await conn.rollback();
      return error(res, 'License not found', 404);
    }

    const currentStatus = Number(license.status);
    const currentStageId = license.stage_id;

    // Determine post-update status and stage based on current status
    let newStatus = currentStatus;
    let newStageId = currentStageId;
    let activity = 'License Details Updated';

    if (currentStatus === 1) {
      // Published → stays published, changes live immediately
      newStatus = 1;
      newStageId = currentStageId;
      activity = 'License Details Updated Successfully';
    } else if (currentStatus === 2) {
      // Draft → move to next stage (pending assessment)
      const [[firstStage]] = await conn.query(
        'SELECT * FROM license_workflow WHERE first_stage = 1 AND deleted = 0 LIMIT 1'
      );
      if (firstStage && firstStage.next_stage) {
        newStageId = firstStage.next_stage;
      }
      newStatus = 3; // Pending Assessment
      activity = 'License Details Updated and Submitted';
    } else if (currentStatus === 5) {
      // Needs Corrections → resubmit to next assess stage
      const [[currentStage]] = await conn.query(
        'SELECT * FROM license_workflow WHERE id = ? AND deleted = 0',
        [currentStageId]
      );
      if (currentStage && currentStage.next_stage) {
        const [[nextStage]] = await conn.query(
          'SELECT * FROM license_workflow WHERE id = ?',
          [currentStage.next_stage]
        );
        if (nextStage && nextStage.type === 'publish') {
          // Don't skip directly to publish, stay at current stage's next assess
          newStageId = currentStageId;
        } else if (nextStage) {
          newStageId = nextStage.id;
        }
      }
      newStatus = 3; // Pending Assessment

      // Mark rejection task as complete
      await conn.query(
        `UPDATE task SET task_status = 'complete', task_end_date = NOW()
         WHERE task_license_id = ? AND decline = 1 AND task_status = 'pending'`,
        [licenseId]
      );

      activity = 'License Details Updated After Corrections';
    } else if (currentStatus === 4) {
      // Unpublished → stays unpublished, just update data
      newStatus = 4;
      newStageId = currentStageId;
      activity = 'Unpublished License Details Updated';
    }

    // Save as draft override
    const saveAsDraft = body.save_as_draft === 'true' || body.save_as_draft === '1';
    if (saveAsDraft) {
      newStatus = 2;
      const [[firstStage]] = await conn.query(
        'SELECT * FROM license_workflow WHERE first_stage = 1 AND deleted = 0 LIMIT 1'
      );
      newStageId = firstStage ? firstStage.id : currentStageId;
      activity = 'License Saved as Draft';
    }

    // Generate slug
    const slug = (body.name || license.name || 'license')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Principle legislation file
    let principleLegislationAttachment = license.principle_legislation_attachment;
    if (files.principle_legislation_file && files.principle_legislation_file[0]) {
      principleLegislationAttachment = files.principle_legislation_file[0].filename;
    }

    // Update license record
    await conn.query(
      `UPDATE businesslicense SET
        name = ?, keywords = ?, purpose = ?, description = ?, license_no = ?,
        application_fee = ?, license_fee = ?, max_processing_time = ?,
        gazetted_on = ?, related_websites = ?, validity = ?, enactment = ?,
        gazetting_ref = ?, contact_office = ?, resolution_criteria = ?,
        universal = ?, location_id = ?, agency_id = ?, status = ?, stage_id = ?,
        slug = ?, principle_legislation = ?, subsidiary_legislation = ?,
        principle_legislation_attachment = ?, requirements = ?,
        updated = NOW()
      WHERE id = ?`,
      [
        body.name || license.name,
        body.keywords ?? license.keywords,
        body.purpose ?? license.purpose,
        body.description ?? license.description,
        body.license_no ?? license.license_no,
        body.application_fee ?? license.application_fee,
        body.license_fee ?? license.license_fee,
        body.max_processing_time ?? license.max_processing_time,
        body.gazetted_on ? body.gazetted_on.substring(0, 10) : (license.gazetted_on || null),
        body.related_websites ?? license.related_websites,
        body.validity ?? license.validity,
        body.enactment ? body.enactment.substring(0, 10) : (license.enactment || null),
        body.gazetting_ref ?? license.gazetting_ref,
        body.contact_office ?? license.contact_office,
        body.resolution_criteria ?? license.resolution_criteria,
        body.universal === 'true' || body.universal === '1' ? 1 : 0,
        body.location_id || license.location_id,
        body.agency_id || license.agency_id,
        newStatus,
        newStageId,
        slug,
        body.principle_legislation ?? license.principle_legislation,
        body.subsidiary_legislation ?? license.subsidiary_legislation,
        principleLegislationAttachment,
        body.requirements ?? license.requirements,
        licenseId,
      ]
    );

    // Update activities (replace)
    if (body.activity_ids) {
      await conn.query('DELETE FROM licenses_activities WHERE businesslicense_id = ?', [licenseId]);
      const activityIds = typeof body.activity_ids === 'string'
        ? JSON.parse(body.activity_ids)
        : body.activity_ids;
      for (const actId of activityIds) {
        await conn.query(
          'INSERT INTO licenses_activities (businesslicense_id, businessactivity_id) VALUES (?, ?)',
          [licenseId, actId]
        );
      }
    }

    // Update custom field data (upsert)
    if (body.custom_fields) {
      const customFields = typeof body.custom_fields === 'string'
        ? JSON.parse(body.custom_fields)
        : body.custom_fields;
      for (const [fieldId, fieldData] of Object.entries(customFields)) {
        const [existing] = await conn.query(
          'SELECT id FROM licensefielddata WHERE license_id = ? AND field_id = ?',
          [licenseId, fieldId]
        );
        if (existing.length > 0) {
          await conn.query(
            'UPDATE licensefielddata SET fielddata = ?, updated = NOW() WHERE id = ?',
            [fieldData || '', existing[0].id]
          );
        } else {
          await conn.query(
            `INSERT INTO licensefielddata (license_id, field_id, fielddata, created, updated)
             VALUES (?, ?, ?, NOW(), NOW())`,
            [licenseId, fieldId, fieldData || '']
          );
        }
      }
    }

    // Update downloads (append new ones)
    if (body.download_items) {
      const dlItems = typeof body.download_items === 'string'
        ? JSON.parse(body.download_items)
        : body.download_items;
      const dlFiles = files.download_files || [];
      for (let i = 0; i < dlItems.length; i++) {
        const item = dlItems[i];
        const file = dlFiles[i] || null;
        await conn.query(
          `INSERT INTO licensedownload (license_id, name, issuing_body, filepath, filesize, type_id, created, updated)
           VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`,
          [licenseId, item.name || '', item.issuing_body || '', file ? file.filename : null, file ? file.size : 0]
        );
      }
    }

    // Create application history
    await conn.query(
      `INSERT INTO application_history (user_id, action_type, previous_stage, current_step, application_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, activity, currentStageId, newStageId, licenseId]
    );

    await conn.commit();

    return success(res, {
      id: licenseId,
      status: newStatus,
      stage_id: newStageId,
      message: activity,
    });
  } catch (err) {
    await conn.rollback();
    console.error('PUT /api/license-admin/:id/update error:', err);
    return error(res, 'Failed to update license: ' + err.message, 500);
  } finally {
    conn.release();
  }
});

export default router;
