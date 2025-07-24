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
      departmentId,
      enrollmentYear,
      currentSemester = '1st',
      academicYear,
      researchArea,
      advisorEmail,
      // Admin fields
      adminCode,
      adminPermissions
    } = userData;

    try {
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const query = `
        INSERT INTO users (
          first_name, last_name, email, password_hash, role,
          student_id, department_id, enrollment_year, enrollment_date, current_semester, 
          academic_year, research_area,
          admin_code, admin_permissions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, first_name, last_name, email, role, created_at
      `;

      const values = [
        firstName,
        lastName,
        email.toLowerCase(),
        passwordHash,
        role,
        studentId || null,
        departmentId || null,
        enrollmentYear || null,
        enrollmentYear ? new Date(`${enrollmentYear}-09-01`) : null,
        currentSemester,
        academicYear || (enrollmentYear ? `${enrollmentYear}-${parseInt(enrollmentYear) + 1}` : null),
        researchArea || null,
        adminCode || null,
        adminPermissions ? JSON.stringify(adminPermissions) : null
      ];

      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find user by email with complete profile data
  async findByEmail(email) {
    try {
      const query = `
        SELECT 
          u.*,
          d.dept_name,
          d.dept_code,
          f1.first_name || ' ' || f1.last_name as primary_supervisor_name,
          f1.email as primary_supervisor_email,
          f2.first_name || ' ' || f2.last_name as co_supervisor_name,
          f2.email as co_supervisor_email
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN faculty f1 ON u.primary_supervisor_id = f1.id
        LEFT JOIN faculty f2 ON u.co_supervisor_id = f2.id
        WHERE u.email = $1 AND u.is_active = true
      `;
      const result = await this.db.query(query, [email.toLowerCase()]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID with complete profile data
  async findById(id) {
    try {
      const query = `
        SELECT 
          u.id, u.first_name, u.last_name, u.email, u.role,
          u.student_id, u.department_id, u.enrollment_year, u.enrollment_date,
          u.current_semester, u.academic_year, u.research_area,
          u.primary_supervisor_id, u.co_supervisor_id,
          u.admin_code, u.admin_permissions,
          u.is_active, u.last_login, u.created_at, u.updated_at,
          d.dept_name,
          d.dept_code,
          f1.first_name || ' ' || f1.last_name as primary_supervisor_name,
          f1.email as primary_supervisor_email,
          f1.designation as primary_supervisor_designation,
          f2.first_name || ' ' || f2.last_name as co_supervisor_name,
          f2.email as co_supervisor_email,
          f2.designation as co_supervisor_designation
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN faculty f1 ON u.primary_supervisor_id = f1.id
        LEFT JOIN faculty f2 ON u.co_supervisor_id = f2.id
        WHERE u.id = $1 AND u.is_active = true
      `;
      const result = await this.db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get extended profile with workflow progress (for students)
  async findByIdExtended(id) {
    try {
      const query = `
        SELECT 
          u.*,
          d.dept_name,
          d.dept_code,
          f1.first_name || ' ' || f1.last_name as primary_supervisor_name,
          f1.email as primary_supervisor_email,
          f1.designation as primary_supervisor_designation,
          f2.first_name || ' ' || f2.last_name as co_supervisor_name,
          f2.email as co_supervisor_email,
          f2.designation as co_supervisor_designation,
          swp.current_stage,
          swp.total_forms_submitted,
          swp.total_forms_approved,
          swp.has_pending_actions,
          swp.current_gpa
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN faculty f1 ON u.primary_supervisor_id = f1.id
        LEFT JOIN faculty f2 ON u.co_supervisor_id = f2.id
        LEFT JOIN student_workflow_progress swp ON u.id = swp.student_id
        WHERE u.id = $1 AND u.is_active = true
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
        'first_name', 'last_name', 'student_id', 'department_id', 'enrollment_year', 
        'current_semester', 'academic_year', 'research_area', 
        'primary_supervisor_id', 'co_supervisor_id', 'admin_permissions'
      ];

      const updateFields = [];
      const values = [];
      let valueIndex = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          if (key === 'admin_permissions' && Array.isArray(value)) {
            updateFields.push(`${key} = $${valueIndex}`);
            values.push(JSON.stringify(value));
          } else {
            updateFields.push(`${key} = $${valueIndex}`);
            values.push(value);
          }
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

  // Update last login timestamp
  async updateLastLogin(id) {
    try {
      const query = `
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
        RETURNING id
      `;
      const result = await this.db.query(query, [id]);
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

  // Get users by role with department information
  async findByRole(role) {
    try {
      const query = `
        SELECT 
          u.id, u.first_name, u.last_name, u.email, u.role, u.student_id,
          u.current_semester, u.academic_year, u.enrollment_year,
          d.dept_name, d.dept_code,
          f1.first_name || ' ' || f1.last_name as primary_supervisor_name,
          u.created_at
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN faculty f1 ON u.primary_supervisor_id = f1.id
        WHERE u.role = $1 AND u.is_active = true
        ORDER BY u.created_at DESC
      `;
      const result = await this.db.query(query, [role]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get all students with complete information
  async getAllStudents(filters = {}) {
    try {
      let whereClause = 'WHERE u.role = $1 AND u.is_active = true';
      const params = ['student'];
      let paramCount = 1;

      if (filters.department_id) {
        paramCount++;
        whereClause += ` AND u.department_id = $${paramCount}`;
        params.push(filters.department_id);
      }

      if (filters.supervisor_id) {
        paramCount++;
        whereClause += ` AND (u.primary_supervisor_id = $${paramCount} OR u.co_supervisor_id = $${paramCount})`;
        params.push(filters.supervisor_id);
      }

      if (filters.current_semester) {
        paramCount++;
        whereClause += ` AND u.current_semester = $${paramCount}`;
        params.push(filters.current_semester);
      }

      const query = `
        SELECT 
          u.id, u.first_name, u.last_name, u.email, u.student_id,
          u.current_semester, u.academic_year, u.enrollment_year, u.research_area,
          d.dept_name, d.dept_code,
          f1.first_name || ' ' || f1.last_name as primary_supervisor_name,
          f2.first_name || ' ' || f2.last_name as co_supervisor_name,
          swp.current_stage, swp.total_forms_submitted, swp.total_forms_approved,
          u.created_at
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN faculty f1 ON u.primary_supervisor_id = f1.id
        LEFT JOIN faculty f2 ON u.co_supervisor_id = f2.id
        LEFT JOIN student_workflow_progress swp ON u.id = swp.student_id
        ${whereClause}
        ORDER BY u.created_at DESC
      `;
      
      const result = await this.db.query(query, params);
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

  // Assign supervisor to student
  async assignSupervisor(studentId, supervisorId, coSupervisorId = null) {
    try {
      const query = `
        UPDATE users 
        SET primary_supervisor_id = $1, co_supervisor_id = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND role = 'student' AND is_active = true
        RETURNING id, first_name, last_name
      `;
      const result = await this.db.query(query, [supervisorId, coSupervisorId, studentId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User; 