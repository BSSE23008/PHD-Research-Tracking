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

module.exports = router; 