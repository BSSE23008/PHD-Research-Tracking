const bcrypt = require('bcryptjs');

class User {
  constructor(db) {
    this.db = db;
  }

  // Create a new user
  async create(userData) {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      // Student fields
      studentId,
      enrollmentYear,
      researchArea,
      advisorEmail,
      // Supervisor fields
      title,
      department,
      institution,
      officeLocation,
      researchInterests,
      maxStudents,
      // Admin fields
      adminCode
    } = userData;

    try {
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const query = `
        INSERT INTO users (
          first_name, last_name, email, password_hash, role,
          student_id, enrollment_year, research_area, advisor_email,
          title, department, institution, office_location, research_interests, max_students,
          admin_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id, first_name, last_name, email, role, created_at
      `;

      const values = [
        firstName,
        lastName,
        email.toLowerCase(),
        passwordHash,
        role,
        studentId || null,
        enrollmentYear || null,
        researchArea || null,
        advisorEmail || null,
        title || null,
        department || null,
        institution || null,
        officeLocation || null,
        researchInterests || null,
        maxStudents || null,
        adminCode || null
      ];

      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
      const result = await this.db.query(query, [email.toLowerCase()]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  async findById(id) {
    try {
      const query = `
        SELECT id, first_name, last_name, email, role,
               student_id, enrollment_year, research_area, advisor_email,
               title, department, institution, office_location, research_interests, max_students,
               admin_code, is_active, created_at, updated_at
        FROM users 
        WHERE id = $1 AND is_active = true
      `;
      const result = await this.db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw error;
    }
  }

  // Update user
  async update(id, updateData) {
    try {
      const allowedFields = [
        'first_name', 'last_name', 'student_id', 'enrollment_year', 
        'research_area', 'advisor_email', 'title', 'department', 
        'institution', 'office_location', 'research_interests', 'max_students'
      ];

      const updateFields = [];
      const values = [];
      let valueIndex = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = $${valueIndex}`);
          values.push(value);
          valueIndex++;
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(id);
      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${valueIndex} AND is_active = true
        RETURNING id, first_name, last_name, email, role, updated_at
      `;

      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Soft delete user
  async delete(id) {
    try {
      const query = `
        UPDATE users 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `;
      const result = await this.db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Check if email exists
  async emailExists(email) {
    try {
      const query = 'SELECT id FROM users WHERE email = $1';
      const result = await this.db.query(query, [email.toLowerCase()]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get users by role
  async findByRole(role) {
    try {
      const query = `
        SELECT id, first_name, last_name, email, role, created_at
        FROM users 
        WHERE role = $1 AND is_active = true
        ORDER BY created_at DESC
      `;
      const result = await this.db.query(query, [role]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Change password
  async changePassword(id, newPassword) {
    try {
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);
      
      const query = `
        UPDATE users 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND is_active = true
        RETURNING id
      `;
      const result = await this.db.query(query, [passwordHash, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User; 