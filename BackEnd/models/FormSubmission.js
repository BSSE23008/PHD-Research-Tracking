/**
 * FormSubmission Model - Handles form submissions and related operations
 */

class FormSubmission {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create a new form submission
   * @param {number} userId - User ID
   * @param {string} formType - Type of form
   * @param {Object} formData - Form data
   * @returns {Object} Created submission record
   */
  async create(userId, formType, formData) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert form submission
      const submissionQuery = `
        INSERT INTO form_submissions (user_id, form_type, form_data, submitted_at, status)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'pending')
        RETURNING *
      `;
      
      const submissionResult = await client.query(submissionQuery, [
        userId, 
        formType, 
        JSON.stringify(formData)
      ]);
      
      await client.query('COMMIT');
      return submissionResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to create form submission: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Find submission by ID
   * @param {number} id - Submission ID
   * @returns {Object|null} Submission record or null if not found
   */
  async findById(id) {
    try {
      const query = `
        SELECT 
          fs.*,
          u.first_name,
          u.last_name,
          u.email,
          u.role,
          reviewer.first_name as reviewer_first_name,
          reviewer.last_name as reviewer_last_name
        FROM form_submissions fs
        JOIN users u ON fs.user_id = u.id
        LEFT JOIN users reviewer ON fs.reviewed_by = reviewer.id
        WHERE fs.id = $1
      `;
      
      const result = await this.db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find submission by ID: ${error.message}`);
    }
  }

  /**
   * Get user's submissions with pagination and filtering
   * @param {number} userId - User ID
   * @param {Object} options - Filter and pagination options
   * @returns {Object} Submissions and pagination data
   */
  async getUserSubmissions(userId, options = {}) {
    try {
      const { 
        formType, 
        status, 
        page = 1, 
        limit = 10 
      } = options;

      let whereClause = 'WHERE fs.user_id = $1';
      const params = [userId];
      let paramIndex = 2;

      if (formType) {
        whereClause += ` AND fs.form_type = $${paramIndex}`;
        params.push(formType);
        paramIndex++;
      }

      if (status) {
        whereClause += ` AND fs.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM form_submissions fs
        ${whereClause}
      `;
      
      const countResult = await this.db.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].total);

      // Calculate pagination
      const offset = (page - 1) * limit;
      const totalPages = Math.ceil(totalCount / limit);

      // Get submissions
      const submissionsQuery = `
        SELECT 
          fs.*,
          reviewer.first_name as reviewer_first_name,
          reviewer.last_name as reviewer_last_name
        FROM form_submissions fs
        LEFT JOIN users reviewer ON fs.reviewed_by = reviewer.id
        ${whereClause}
        ORDER BY fs.submitted_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);
      const submissionsResult = await this.db.query(submissionsQuery, params);

      return {
        submissions: submissionsResult.rows,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      };
    } catch (error) {
      throw new Error(`Failed to get user submissions: ${error.message}`);
    }
  }

  /**
   * Get all submissions (for supervisors/admins) with filtering and pagination
   * @param {Object} options - Filter and pagination options
   * @returns {Object} Submissions and pagination data
   */
  async getAllSubmissions(options = {}) {
    try {
      const { 
        formType, 
        status, 
        search,
        page = 1, 
        limit = 10,
        sortBy = 'submitted_at',
        sortOrder = 'desc'
      } = options;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (formType) {
        whereClause += ` AND fs.form_type = $${paramIndex}`;
        params.push(formType);
        paramIndex++;
      }

      if (status) {
        whereClause += ` AND fs.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (search) {
        whereClause += ` AND (
          u.first_name ILIKE $${paramIndex} OR 
          u.last_name ILIKE $${paramIndex} OR 
          u.email ILIKE $${paramIndex} OR
          fs.form_data::text ILIKE $${paramIndex}
        )`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Validate sort parameters
      const validSortFields = ['submitted_at', 'status', 'form_type', 'first_name', 'last_name'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'submitted_at';
      const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM form_submissions fs
        JOIN users u ON fs.user_id = u.id
        ${whereClause}
      `;
      
      const countResult = await this.db.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].total);

      // Calculate pagination
      const offset = (page - 1) * limit;
      const totalPages = Math.ceil(totalCount / limit);

      // Get submissions
      const submissionsQuery = `
        SELECT 
          fs.*,
          u.first_name,
          u.last_name,
          u.email,
          u.role,
          reviewer.first_name as reviewer_first_name,
          reviewer.last_name as reviewer_last_name
        FROM form_submissions fs
        JOIN users u ON fs.user_id = u.id
        LEFT JOIN users reviewer ON fs.reviewed_by = reviewer.id
        ${whereClause}
        ORDER BY ${sortField === 'first_name' || sortField === 'last_name' ? 'u.' + sortField : 'fs.' + sortField} ${sortDirection}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);
      const submissionsResult = await this.db.query(submissionsQuery, params);

      return {
        submissions: submissionsResult.rows,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      };
    } catch (error) {
      throw new Error(`Failed to get all submissions: ${error.message}`);
    }
  }

  /**
   * Get pending submissions
   * @param {Object} options - Pagination options
   * @returns {Object} Pending submissions and pagination data
   */
  async getPendingSubmissions(options = {}) {
    try {
      const { page = 1, limit = 10 } = options;

      // Count total pending submissions
      const countQuery = `
        SELECT COUNT(*) as total
        FROM form_submissions fs
        WHERE fs.status = 'pending'
      `;
      
      const countResult = await this.db.query(countQuery);
      const totalCount = parseInt(countResult.rows[0].total);

      // Calculate pagination
      const offset = (page - 1) * limit;
      const totalPages = Math.ceil(totalCount / limit);

      // Get pending submissions
      const submissionsQuery = `
        SELECT 
          fs.*,
          u.first_name,
          u.last_name,
          u.email,
          u.role
        FROM form_submissions fs
        JOIN users u ON fs.user_id = u.id
        WHERE fs.status = 'pending'
        ORDER BY fs.submitted_at ASC
        LIMIT $1 OFFSET $2
      `;

      const submissionsResult = await this.db.query(submissionsQuery, [limit, offset]);

      return {
        submissions: submissionsResult.rows,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      };
    } catch (error) {
      throw new Error(`Failed to get pending submissions: ${error.message}`);
    }
  }

  /**
   * Update submission status
   * @param {number} id - Submission ID
   * @param {string} status - New status
   * @param {number} reviewerId - Reviewer ID
   * @param {string} comments - Review comments
   * @returns {Object|null} Updated submission record
   */
  async updateStatus(id, status, reviewerId, comments = null) {
    try {
      const query = `
        UPDATE form_submissions 
        SET 
          status = $2,
          reviewed_by = $3,
          review_comments = $4,
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await this.db.query(query, [id, status, reviewerId, comments]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update submission status: ${error.message}`);
    }
  }

  /**
   * Approve submission
   * @param {number} id - Submission ID
   * @param {number} reviewerId - Reviewer ID
   * @param {string} comments - Approval comments
   * @returns {Object|null} Updated submission record
   */
  async approve(id, reviewerId, comments = null) {
    return this.updateStatus(id, 'approved', reviewerId, comments);
  }

  /**
   * Reject submission
   * @param {number} id - Submission ID
   * @param {number} reviewerId - Reviewer ID
   * @param {string} comments - Rejection comments
   * @returns {Object|null} Updated submission record
   */
  async reject(id, reviewerId, comments) {
    return this.updateStatus(id, 'rejected', reviewerId, comments);
  }

  /**
   * Delete submission (soft delete by updating status)
   * @param {number} id - Submission ID
   * @returns {boolean} Success status
   */
  async delete(id) {
    try {
      const query = `
        UPDATE form_submissions 
        SET 
          status = 'deleted',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      
      await this.db.query(query, [id]);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete submission: ${error.message}`);
    }
  }

  /**
   * Get submission analytics
   * @param {Object} options - Analytics options
   * @returns {Object} Analytics data
   */
  async getAnalytics(options = {}) {
    try {
      const { formType, startDate, endDate } = options;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (formType) {
        whereClause += ` AND form_type = $${paramIndex}`;
        params.push(formType);
        paramIndex++;
      }

      if (startDate) {
        whereClause += ` AND submitted_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereClause += ` AND submitted_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      // Overall statistics
      const overallQuery = `
        SELECT 
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
          AVG(CASE WHEN reviewed_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (reviewed_at - submitted_at))/3600 
          END) as avg_review_time_hours
        FROM form_submissions 
        ${whereClause}
      `;

      const overallResult = await this.db.query(overallQuery, params);

      // Submissions by form type
      const byFormTypeQuery = `
        SELECT 
          form_type,
          COUNT(*) as count,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
        FROM form_submissions 
        ${whereClause}
        GROUP BY form_type
        ORDER BY count DESC
      `;

      const byFormTypeResult = await this.db.query(byFormTypeQuery, params);

      // Submissions by month
      const byMonthQuery = `
        SELECT 
          DATE_TRUNC('month', submitted_at) as month,
          COUNT(*) as count
        FROM form_submissions 
        ${whereClause}
        GROUP BY DATE_TRUNC('month', submitted_at)
        ORDER BY month DESC
        LIMIT 12
      `;

      const byMonthResult = await this.db.query(byMonthQuery, params);

      return {
        overall: overallResult.rows[0],
        byFormType: byFormTypeResult.rows,
        byMonth: byMonthResult.rows
      };
    } catch (error) {
      throw new Error(`Failed to get submission analytics: ${error.message}`);
    }
  }

  /**
   * Get submission statistics for dashboard
   * @returns {Object} Dashboard statistics
   */
  async getDashboardStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
          COUNT(CASE WHEN submitted_at >= CURRENT_DATE THEN 1 END) as today,
          COUNT(CASE WHEN submitted_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as this_week,
          COUNT(CASE WHEN submitted_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as this_month
        FROM form_submissions
        WHERE status != 'deleted'
      `;

      const result = await this.db.query(query);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get dashboard statistics: ${error.message}`);
    }
  }
}

module.exports = FormSubmission; 