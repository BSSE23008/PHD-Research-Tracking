/**
 * Form Model - Handles form progress and related operations
 */

class Form {
  constructor(db) {
    this.db = db;
  }

  /**
   * Save form progress for a user
   * @param {number} userId - User ID
   * @param {string} formType - Type of form
   * @param {Object} formData - Form data to save
   * @param {number} stepNumber - Current step number
   * @returns {Object} Saved progress record
   */
  async saveProgress(userId, formType, formData, stepNumber = 0) {
    try {
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
      
      const result = await this.db.query(query, [
        userId, 
        formType, 
        JSON.stringify(formData), 
        stepNumber
      ]);
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to save form progress: ${error.message}`);
    }
  }

  /**
   * Load form progress for a user
   * @param {number} userId - User ID
   * @param {string} formType - Type of form
   * @returns {Object|null} Progress record or null if not found
   */
  async loadProgress(userId, formType) {
    try {
      const query = `
        SELECT * FROM form_progress 
        WHERE user_id = $1 AND form_type = $2
        ORDER BY updated_at DESC
        LIMIT 1
      `;
      
      const result = await this.db.query(query, [userId, formType]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to load form progress: ${error.message}`);
    }
  }

  /**
   * Clear form progress for a user
   * @param {number} userId - User ID
   * @param {string} formType - Type of form
   * @returns {boolean} Success status
   */
  async clearProgress(userId, formType) {
    try {
      const query = `
        DELETE FROM form_progress 
        WHERE user_id = $1 AND form_type = $2
      `;
      
      await this.db.query(query, [userId, formType]);
      return true;
    } catch (error) {
      throw new Error(`Failed to clear form progress: ${error.message}`);
    }
  }

  /**
   * Get all progress records for a user
   * @param {number} userId - User ID
   * @returns {Array} Array of progress records
   */
  async getUserProgress(userId) {
    try {
      const query = `
        SELECT form_type, step_number, updated_at
        FROM form_progress 
        WHERE user_id = $1
        ORDER BY updated_at DESC
      `;
      
      const result = await this.db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get user progress: ${error.message}`);
    }
  }

  /**
   * Get progress statistics
   * @returns {Object} Progress statistics
   */
  async getProgressStats() {
    try {
      const query = `
        SELECT 
          form_type,
          COUNT(*) as total_progress,
          AVG(step_number) as average_step,
          MAX(step_number) as max_step
        FROM form_progress 
        GROUP BY form_type
        ORDER BY total_progress DESC
      `;
      
      const result = await this.db.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get progress statistics: ${error.message}`);
    }
  }

  /**
   * Check if user has progress for a specific form type
   * @param {number} userId - User ID
   * @param {string} formType - Type of form
   * @returns {boolean} Whether progress exists
   */
  async hasProgress(userId, formType) {
    try {
      const query = `
        SELECT 1 FROM form_progress 
        WHERE user_id = $1 AND form_type = $2
        LIMIT 1
      `;
      
      const result = await this.db.query(query, [userId, formType]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to check progress existence: ${error.message}`);
    }
  }

  /**
   * Update progress step number
   * @param {number} userId - User ID
   * @param {string} formType - Type of form
   * @param {number} stepNumber - New step number
   * @returns {Object|null} Updated progress record
   */
  async updateStep(userId, formType, stepNumber) {
    try {
      const query = `
        UPDATE form_progress 
        SET step_number = $3, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND form_type = $2
        RETURNING *
      `;
      
      const result = await this.db.query(query, [userId, formType, stepNumber]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update progress step: ${error.message}`);
    }
  }

  /**
   * Get progress by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Array of progress records
   */
  async getProgressByDateRange(startDate, endDate) {
    try {
      const query = `
        SELECT 
          fp.*,
          u.first_name,
          u.last_name,
          u.email
        FROM form_progress fp
        JOIN users u ON fp.user_id = u.id
        WHERE fp.updated_at >= $1 AND fp.updated_at <= $2
        ORDER BY fp.updated_at DESC
      `;
      
      const result = await this.db.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get progress by date range: ${error.message}`);
    }
  }

  /**
   * Clean up old progress records (older than specified days)
   * @param {number} days - Number of days to keep
   * @returns {number} Number of deleted records
   */
  async cleanupOldProgress(days = 30) {
    try {
      const query = `
        DELETE FROM form_progress 
        WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL '${days} days'
        AND user_id NOT IN (
          SELECT DISTINCT user_id FROM form_submissions 
          WHERE submitted_at > CURRENT_TIMESTAMP - INTERVAL '${days} days'
        )
      `;
      
      const result = await this.db.query(query);
      return result.rowCount;
    } catch (error) {
      throw new Error(`Failed to cleanup old progress: ${error.message}`);
    }
  }
}

module.exports = Form; 