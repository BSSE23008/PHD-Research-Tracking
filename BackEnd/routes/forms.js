const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Form data model (using database queries directly)
const getFormModel = (db) => ({
  // Save form progress
  async saveProgress(userId, formType, formData, stepNumber) {
    const query = `
      INSERT INTO form_progress (user_id, form_type, form_data, step_number, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, form_type)
      DO UPDATE SET 
        form_data = EXCLUDED.form_data,
        step_number = EXCLUDED.step_number,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await db.query(query, [userId, formType, JSON.stringify(formData), stepNumber]);
    return result.rows[0];
  },

  // Load form progress
  async loadProgress(userId, formType) {
    const query = `
      SELECT * FROM form_progress 
      WHERE user_id = $1 AND form_type = $2
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    
    const result = await db.query(query, [userId, formType]);
    return result.rows[0] || null;
  },

  // Submit form
  async submitForm(userId, formType, formData) {
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert form submission
      const submissionQuery = `
        INSERT INTO form_submissions (user_id, form_type, form_data, submitted_at, status)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'submitted')
        RETURNING *
      `;
      
      const submissionResult = await client.query(submissionQuery, [
        userId, 
        formType, 
        JSON.stringify(formData)
      ]);
      
      // Clear progress after successful submission
      const clearProgressQuery = `
        DELETE FROM form_progress 
        WHERE user_id = $1 AND form_type = $2
      `;
      
      await client.query(clearProgressQuery, [userId, formType]);
      
      await client.query('COMMIT');
      return submissionResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get form submissions
  async getSubmissions(userId, formType = null) {
    let query = `
      SELECT * FROM form_submissions 
      WHERE user_id = $1
    `;
    const params = [userId];
    
    if (formType) {
      query += ` AND form_type = $2`;
      params.push(formType);
    }
    
    query += ` ORDER BY submitted_at DESC`;
    
    const result = await db.query(query, params);
    return result.rows;
  }
});

// @route   POST /api/forms/save-progress
// @desc    Save form progress
// @access  Private
router.post('/save-progress', authenticateToken, async (req, res) => {
  try {
    const { formType, formData, stepNumber } = req.body;
    const userId = req.user.id;

    if (!formType || !formData) {
      return res.status(400).json({ 
        message: 'Form type and form data are required' 
      });
    }

    const formModel = getFormModel(req.app.locals.db);
    const result = await formModel.saveProgress(userId, formType, formData, stepNumber || 0);

    res.json({
      message: 'Form progress saved successfully',
      data: result
    });

  } catch (error) {
    console.error('Save progress error:', error);
    res.status(500).json({ 
      message: 'Server error while saving progress',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   GET /api/forms/load-progress
// @desc    Load form progress
// @access  Private
router.get('/load-progress', authenticateToken, async (req, res) => {
  try {
    const { formType } = req.query;
    const userId = req.user.id;

    if (!formType) {
      return res.status(400).json({ 
        message: 'Form type is required' 
      });
    }

    const formModel = getFormModel(req.app.locals.db);
    const progress = await formModel.loadProgress(userId, formType);

    if (!progress) {
      return res.status(404).json({ 
        message: 'No saved progress found for this form' 
      });
    }

    res.json({
      message: 'Form progress loaded successfully',
      formData: {
        formData: JSON.parse(progress.form_data),
        stepNumber: progress.step_number,
        lastUpdated: progress.updated_at
      }
    });

  } catch (error) {
    console.error('Load progress error:', error);
    res.status(500).json({ 
      message: 'Server error while loading progress',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   POST /api/forms/submit
// @desc    Submit completed form
// @access  Private
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { formType, formData } = req.body;
    const userId = req.user.id;

    if (!formType || !formData) {
      return res.status(400).json({ 
        message: 'Form type and form data are required' 
      });
    }

    const formModel = getFormModel(req.app.locals.db);
    const submission = await formModel.submitForm(userId, formType, formData);

    res.json({
      message: 'Form submitted successfully',
      data: {
        submissionId: submission.id,
        submittedAt: submission.submitted_at,
        status: submission.status
      }
    });

  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({ 
      message: 'Server error while submitting form',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   GET /api/forms/submissions
// @desc    Get form submissions history
// @access  Private
router.get('/submissions', authenticateToken, async (req, res) => {
  try {
    const { formType } = req.query;
    const userId = req.user.id;

    const formModel = getFormModel(req.app.locals.db);
    const submissions = await formModel.getSubmissions(userId, formType);

    // Parse JSON data for response
    const parsedSubmissions = submissions.map(submission => ({
      ...submission,
      form_data: JSON.parse(submission.form_data)
    }));

    res.json({
      message: 'Form submissions retrieved successfully',
      submissions: parsedSubmissions
    });

  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ 
      message: 'Server error while retrieving submissions',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   GET /api/forms/supervisor/pending-approvals
// @desc    Get pending student forms for supervisor approval
// @access  Private (Supervisor only)
router.get('/supervisor/pending-approvals', authenticateToken, async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const supervisorEmail = req.user.email;

    // Check if user is a supervisor
    if (req.user.role !== 'supervisor') {
      return res.status(403).json({ 
        message: 'Access denied. Supervisor role required.' 
      });
    }

    const query = `
      SELECT 
        fs.*,
        u.first_name || ' ' || u.last_name as student_name,
        u.email as student_email,
        COALESCE(
          fs.form_data->>'projectTitle',
          fs.form_data->'project'->>'title',
          fs.form_data->'projectDetails'->>'title'
        ) as project_title,
        COALESCE(
          fs.form_data->>'supervisorEmail',
          fs.form_data->'supervisorDetails'->>'email',
          fs.form_data->'supervisor'->>'email'
        ) as supervisor_email
      FROM form_submissions fs
      JOIN users u ON fs.user_id = u.id
      WHERE fs.supervisor_approval_status = 'pending'
      AND (
        fs.form_data->>'supervisorEmail' = $1 
        OR fs.form_data->'supervisorDetails'->>'email' = $1
        OR fs.form_data->'supervisor'->>'email' = $1
      )
      AND NOT EXISTS (
        SELECT 1 FROM supervisor_consent_forms scf 
        WHERE scf.form_submission_id = fs.id
      )
      ORDER BY fs.submitted_at DESC
    `;

    const result = await req.app.locals.db.query(query, [supervisorEmail]);

    res.json({
      message: 'Pending approvals retrieved successfully',
      data: result.rows
    });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ 
      message: 'Server error while retrieving pending approvals',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   POST /api/forms/supervisor/consent
// @desc    Submit supervisor consent form
// @access  Private (Supervisor only)
router.post('/supervisor/consent', authenticateToken, async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const { formSubmissionId, consentData, approved } = req.body;

    // Check if user is a supervisor
    if (req.user.role !== 'supervisor') {
      return res.status(403).json({ 
        message: 'Access denied. Supervisor role required.' 
      });
    }

    if (!formSubmissionId || !consentData) {
      return res.status(400).json({ 
        message: 'Form submission ID and consent data are required' 
      });
    }

    const client = await req.app.locals.db.connect();
    
    try {
      await client.query('BEGIN');

      // Get the original form submission
      const submissionQuery = `
        SELECT fs.*, u.id as student_id 
        FROM form_submissions fs
        JOIN users u ON fs.user_id = u.id
        WHERE fs.id = $1
      `;
      const submissionResult = await client.query(submissionQuery, [formSubmissionId]);
      
      if (submissionResult.rows.length === 0) {
        throw new Error('Form submission not found');
      }

      const submission = submissionResult.rows[0];

      // Insert supervisor consent form
      const consentQuery = `
        INSERT INTO supervisor_consent_forms (
          form_submission_id, supervisor_id, student_id,
          supervisor_name, area_of_research, contact_no, student_signature_date,
          hec_approved_supervisor_ref, num_existing_phd_students, num_existing_ms_students,
          designation, as_supervisor, as_co_supervisor,
          email, contact_number, supervisor_signature_date,
          status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        ) RETURNING *
      `;

      const consentValues = [
        formSubmissionId,
        supervisorId,
        submission.student_id,
        consentData.supervisorName,
        consentData.areaOfResearch,
        consentData.contactNo,
        consentData.studentSignatureDate || null,
        consentData.hecApprovedSupervisorRef,
        consentData.numExistingPhdStudents || 0,
        consentData.numExistingMsStudents || 0,
        consentData.designation,
        consentData.asSupervisor,
        consentData.asCoSupervisor,
        consentData.email,
        consentData.contactNumber,
        consentData.supervisorSignatureDate,
        approved ? 'approved' : 'rejected'
      ];

      const consentResult = await client.query(consentQuery, consentValues);

      // Update form submission approval status
      const updateSubmissionQuery = `
        UPDATE form_submissions 
        SET 
          supervisor_approval_status = $1,
          supervisor_approved_by = $2,
          supervisor_approved_at = CURRENT_TIMESTAMP,
          supervisor_comments = $3
        WHERE id = $4
        RETURNING *
      `;

      const updateValues = [
        approved ? 'approved' : 'rejected',
        supervisorId,
        consentData.comments || null,
        formSubmissionId
      ];

      await client.query(updateSubmissionQuery, updateValues);

      await client.query('COMMIT');

      res.json({
        message: 'Supervisor consent form submitted successfully',
        data: {
          consentFormId: consentResult.rows[0].id,
          approved,
          submittedAt: consentResult.rows[0].filled_at
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Supervisor consent submission error:', error);
    res.status(500).json({ 
      message: 'Server error while submitting consent form',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   GET /api/forms/supervisor-consent/:submissionId
// @desc    Get supervisor consent form for a submission
// @access  Private
router.get('/supervisor-consent/:submissionId', authenticateToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;

    // Get the supervisor consent form data
    const query = `
      SELECT scf.*, fs.user_id as form_owner_id
      FROM supervisor_consent_forms scf
      JOIN form_submissions fs ON scf.form_submission_id = fs.id
      WHERE scf.form_submission_id = $1
      AND (fs.user_id = $2 OR scf.supervisor_id = $2)
    `;

    const result = await req.app.locals.db.query(query, [submissionId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Supervisor consent form not found' 
      });
    }

    res.json({
      message: 'Supervisor consent form retrieved successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get supervisor consent error:', error);
    res.status(500).json({ 
      message: 'Server error while retrieving supervisor consent',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   GET /api/forms/supervisor/stats
// @desc    Get supervisor statistics
// @access  Private (Supervisor only)
router.get('/supervisor/stats', authenticateToken, async (req, res) => {
  try {
    const supervisorEmail = req.user.email;
    const supervisorId = req.user.id;

    // Check if user is a supervisor
    if (req.user.role !== 'supervisor') {
      return res.status(403).json({ 
        message: 'Access denied. Supervisor role required.' 
      });
    }

    // Get supervisor statistics using compatible SQL syntax
    const statsQuery = `
      SELECT 
        COUNT(CASE WHEN fs.supervisor_approval_status = 'pending' THEN 1 END) as pending_approvals,
        COUNT(CASE WHEN fs.supervisor_approval_status = 'approved' THEN 1 END) as approved_forms,
        COUNT(CASE WHEN fs.supervisor_approval_status = 'rejected' THEN 1 END) as rejected_forms,
        COUNT(*) as total_submissions,
        COUNT(DISTINCT fs.user_id) as total_students
      FROM form_submissions fs
      WHERE (
        fs.form_data->>'supervisorEmail' = $1 
        OR fs.form_data->'supervisorDetails'->>'email' = $1
        OR fs.form_data->'supervisor'->>'email' = $1
        OR fs.supervisor_approved_by = $2
      )
    `;

    const result = await req.app.locals.db.query(statsQuery, [supervisorEmail, supervisorId]);
    const stats = result.rows[0] || {};

    // Get recent activity count (last 30 days)
    const recentActivityQuery = `
      SELECT COUNT(*) as recent_submissions
      FROM form_submissions fs
      WHERE (
        fs.form_data->>'supervisorEmail' = $1 
        OR fs.form_data->'supervisorDetails'->>'email' = $1
        OR fs.form_data->'supervisor'->>'email' = $1
        OR fs.supervisor_approved_by = $2
      )
      AND fs.submitted_at >= CURRENT_DATE - INTERVAL '30 days'
    `;

    const recentResult = await req.app.locals.db.query(recentActivityQuery, [supervisorEmail, supervisorId]);
    const recentStats = recentResult.rows[0] || {};

    res.json({
      message: 'Supervisor statistics retrieved successfully',
      data: {
        pendingApprovals: parseInt(stats.pending_approvals) || 0,
        approvedForms: parseInt(stats.approved_forms) || 0,
        rejectedForms: parseInt(stats.rejected_forms) || 0,
        totalSubmissions: parseInt(stats.total_submissions) || 0,
        totalStudents: parseInt(stats.total_students) || 0,
        recentSubmissions: parseInt(recentStats.recent_submissions) || 0
      }
    });

  } catch (error) {
    console.error('Get supervisor stats error:', error);
    res.status(500).json({ 
      message: 'Server error while retrieving supervisor statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

module.exports = router; 