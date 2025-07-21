const { pool } = require('../config/database');

class GECController {
    // Get student's GEC committee
    static async getMyCommittee(req, res) {
        try {
            const student_id = req.user.id;

            const query = `
                SELECT 
                    gc.*,
                    f.first_name || ' ' || f.last_name as formed_by_name
                FROM gec_committees gc
                LEFT JOIN faculty f ON gc.formed_by = f.id
                WHERE gc.student_user_id = $1 AND gc.is_active = true
            `;

            const committee = await pool.query(query, [student_id]);

            if (committee.rows.length === 0) {
                return res.json({
                    success: true,
                    data: null,
                    message: 'No GEC committee found for this student'
                });
            }

            // Get committee members
            const membersQuery = `
                SELECT 
                    gcm.*,
                    COALESCE(f.first_name || ' ' || f.last_name, gcm.external_name) as member_name,
                    COALESCE(f.designation, gcm.external_designation) as designation,
                    COALESCE(f.email, gcm.external_email) as email,
                    COALESCE(d.dept_name, gcm.external_institution) as institution
                FROM gec_committee_members gcm
                LEFT JOIN faculty f ON gcm.faculty_id = f.id
                LEFT JOIN departments d ON f.department_id = d.id
                WHERE gcm.committee_id = $1 AND gcm.is_active = true
                ORDER BY 
                    CASE gcm.member_role 
                        WHEN 'chairperson' THEN 1 
                        WHEN 'supervisor' THEN 2 
                        WHEN 'co_supervisor' THEN 3 
                        ELSE 4 
                    END
            `;

            const members = await pool.query(membersQuery, [committee.rows[0].id]);

            res.json({
                success: true,
                data: {
                    committee: committee.rows[0],
                    members: members.rows
                }
            });

        } catch (error) {
            console.error('Error fetching GEC committee:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching GEC committee',
                error: error.message
            });
        }
    }

    // Get all GEC committees (Admin only)
    static async getAllCommittees(req, res) {
        try {
            const { page = 1, limit = 20, department, search } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = 'WHERE gc.is_active = true';
            const params = [];
            let paramCount = 0;

            if (department) {
                paramCount++;
                whereClause += ` AND u.department_id = $${paramCount}`;
                params.push(department);
            }

            if (search) {
                paramCount++;
                whereClause += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.student_id ILIKE $${paramCount})`;
                params.push(`%${search}%`);
            }

            const query = `
                SELECT 
                    gc.*,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.student_id,
                    d.dept_name,
                    f.first_name || ' ' || f.last_name as formed_by_name,
                    COUNT(gcm.id) as member_count
                FROM gec_committees gc
                JOIN users u ON gc.student_user_id = u.id
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN faculty f ON gc.formed_by = f.id
                LEFT JOIN gec_committee_members gcm ON gc.id = gcm.committee_id AND gcm.is_active = true
                ${whereClause}
                GROUP BY gc.id, u.id, d.dept_name, f.id
                ORDER BY gc.committee_formed_date DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            params.push(limit, offset);
            const result = await pool.query(query, params);

            // Get total count
            const countQuery = `
                SELECT COUNT(*)
                FROM gec_committees gc
                JOIN users u ON gc.student_user_id = u.id
                ${whereClause}
            `;
            const countResult = await pool.query(countQuery, params.slice(0, -2));

            res.json({
                success: true,
                data: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(countResult.rows[0].count),
                    pages: Math.ceil(countResult.rows[0].count / limit)
                }
            });

        } catch (error) {
            console.error('Error fetching GEC committees:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching GEC committees',
                error: error.message
            });
        }
    }

    // Get GEC committee by ID with members
    static async getCommitteeById(req, res) {
        try {
            const { id } = req.params;

            const committeeQuery = `
                SELECT 
                    gc.*,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.student_id,
                    u.email as student_email,
                    d.dept_name,
                    f.first_name || ' ' || f.last_name as formed_by_name
                FROM gec_committees gc
                JOIN users u ON gc.student_user_id = u.id
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN faculty f ON gc.formed_by = f.id
                WHERE gc.id = $1
            `;

            const committee = await pool.query(committeeQuery, [id]);

            if (committee.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'GEC committee not found'
                });
            }

            // Get committee members
            const membersQuery = `
                SELECT 
                    gcm.*,
                    COALESCE(f.first_name || ' ' || f.last_name, gcm.external_name) as member_name,
                    COALESCE(f.designation, gcm.external_designation) as designation,
                    COALESCE(f.email, gcm.external_email) as email,
                    COALESCE(d.dept_name, gcm.external_institution) as institution
                FROM gec_committee_members gcm
                LEFT JOIN faculty f ON gcm.faculty_id = f.id
                LEFT JOIN departments d ON f.department_id = d.id
                WHERE gcm.committee_id = $1 AND gcm.is_active = true
                ORDER BY 
                    CASE gcm.member_role 
                        WHEN 'chairperson' THEN 1 
                        WHEN 'supervisor' THEN 2 
                        WHEN 'co_supervisor' THEN 3 
                        ELSE 4 
                    END
            `;

            const members = await pool.query(membersQuery, [id]);

            res.json({
                success: true,
                data: {
                    committee: committee.rows[0],
                    members: members.rows
                }
            });

        } catch (error) {
            console.error('Error fetching GEC committee:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching GEC committee',
                error: error.message
            });
        }
    }

    // Create new GEC committee
    static async createCommittee(req, res) {
        try {
            const { student_user_id, committee_formed_date, committee_type = 'regular', members = [] } = req.body;

            if (!student_user_id || !committee_formed_date) {
                return res.status(400).json({
                    success: false,
                    message: 'Student ID and formation date are required'
                });
            }

            // Check if student exists
            const studentCheck = await pool.query(
                'SELECT id FROM users WHERE id = $1 AND role = $2',
                [student_user_id, 'student']
            );

            if (studentCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            // Check if active committee already exists
            const existingCheck = await pool.query(
                'SELECT id FROM gec_committees WHERE student_user_id = $1 AND is_active = true',
                [student_user_id]
            );

            if (existingCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Active GEC committee already exists for this student'
                });
            }

            // Create committee
            const committeeResult = await pool.query(`
                INSERT INTO gec_committees (student_user_id, committee_formed_date, committee_type, formed_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `, [student_user_id, committee_formed_date, committee_type, req.user.faculty_id || req.user.id]);

            const committeeId = committeeResult.rows[0].id;

            // Add committee members
            for (const member of members) {
                if (member.faculty_id) {
                    // Internal faculty member
                    await pool.query(`
                        INSERT INTO gec_committee_members (committee_id, faculty_id, member_role, is_external, added_by)
                        VALUES ($1, $2, $3, false, $4)
                    `, [committeeId, member.faculty_id, member.member_role, req.user.faculty_id || req.user.id]);
                } else {
                    // External member
                    await pool.query(`
                        INSERT INTO gec_committee_members (
                            committee_id, member_role, is_external, external_name, 
                            external_designation, external_institution, external_email, added_by
                        ) VALUES ($1, $2, true, $3, $4, $5, $6, $7)
                    `, [
                        committeeId, member.member_role, member.external_name,
                        member.external_designation, member.external_institution,
                        member.external_email, req.user.faculty_id || req.user.id
                    ]);
                }
            }

            res.status(201).json({
                success: true,
                message: 'GEC committee created successfully',
                data: committeeResult.rows[0]
            });

        } catch (error) {
            console.error('Error creating GEC committee:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating GEC committee',
                error: error.message
            });
        }
    }

    // Update GEC committee
    static async updateCommittee(req, res) {
        try {
            const { id } = req.params;
            const { committee_formed_date, committee_type } = req.body;

            if (!committee_formed_date && !committee_type) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one field to update is required'
                });
            }

            // Build update query dynamically
            const updates = [];
            const values = [];
            let paramCount = 1;

            if (committee_formed_date) {
                updates.push(`committee_formed_date = $${paramCount}`);
                values.push(committee_formed_date);
                paramCount++;
            }

            if (committee_type) {
                updates.push(`committee_type = $${paramCount}`);
                values.push(committee_type);
                paramCount++;
            }

            values.push(id);
            
            const result = await pool.query(`
                UPDATE gec_committees 
                SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = $${paramCount} AND is_active = true
                RETURNING *
            `, values);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'GEC committee not found'
                });
            }

            res.json({
                success: true,
                message: 'GEC committee updated successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error updating GEC committee:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating GEC committee',
                error: error.message
            });
        }
    }

    // Add member to GEC committee
    static async addMember(req, res) {
        try {
            const { id } = req.params; // committee id
            const { 
                faculty_id, 
                member_role, 
                external_name, 
                external_designation, 
                external_institution, 
                external_email 
            } = req.body;

            if (!member_role) {
                return res.status(400).json({
                    success: false,
                    message: 'Member role is required'
                });
            }

            // Check if committee exists
            const committeeCheck = await pool.query(
                'SELECT id FROM gec_committees WHERE id = $1 AND is_active = true',
                [id]
            );

            if (committeeCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'GEC committee not found'
                });
            }

            if (faculty_id) {
                // Internal faculty member
                const facultyCheck = await pool.query(
                    'SELECT id FROM faculty WHERE id = $1 AND is_active = true',
                    [faculty_id]
                );

                if (facultyCheck.rows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Faculty member not found'
                    });
                }

                // Check if faculty is already a member
                const existingMember = await pool.query(
                    'SELECT id FROM gec_committee_members WHERE committee_id = $1 AND faculty_id = $2 AND is_active = true',
                    [id, faculty_id]
                );

                if (existingMember.rows.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Faculty member is already on this committee'
                    });
                }

                const result = await pool.query(`
                    INSERT INTO gec_committee_members (committee_id, faculty_id, member_role, is_external, added_by)
                    VALUES ($1, $2, $3, false, $4)
                    RETURNING *
                `, [id, faculty_id, member_role, req.user.faculty_id || req.user.id]);

                res.status(201).json({
                    success: true,
                    message: 'Faculty member added to committee successfully',
                    data: result.rows[0]
                });

            } else {
                // External member
                if (!external_name || !external_email) {
                    return res.status(400).json({
                        success: false,
                        message: 'External member name and email are required'
                    });
                }

                const result = await pool.query(`
                    INSERT INTO gec_committee_members (
                        committee_id, member_role, is_external, external_name, 
                        external_designation, external_institution, external_email, added_by
                    ) VALUES ($1, $2, true, $3, $4, $5, $6, $7)
                    RETURNING *
                `, [
                    id, member_role, external_name, external_designation, 
                    external_institution, external_email, req.user.faculty_id || req.user.id
                ]);

                res.status(201).json({
                    success: true,
                    message: 'External member added to committee successfully',
                    data: result.rows[0]
                });
            }

        } catch (error) {
            console.error('Error adding committee member:', error);
            res.status(500).json({
                success: false,
                message: 'Error adding committee member',
                error: error.message
            });
        }
    }

    // Remove member from GEC committee
    static async removeMember(req, res) {
        try {
            const { committee_id, member_id } = req.params;

            // Check if committee exists
            const committeeCheck = await pool.query(
                'SELECT id FROM gec_committees WHERE id = $1 AND is_active = true',
                [committee_id]
            );

            if (committeeCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'GEC committee not found'
                });
            }

            // Check if member exists and is active
            const memberCheck = await pool.query(
                'SELECT id, member_role FROM gec_committee_members WHERE id = $1 AND committee_id = $2 AND is_active = true',
                [member_id, committee_id]
            );

            if (memberCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Committee member not found'
                });
            }

            // Don't allow removal of chairperson without replacement
            if (memberCheck.rows[0].member_role === 'chairperson') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot remove chairperson. Please assign a new chairperson first.'
                });
            }

            // Soft delete the member
            const result = await pool.query(`
                UPDATE gec_committee_members 
                SET is_active = false, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND committee_id = $2
                RETURNING id, member_role
            `, [member_id, committee_id]);

            res.json({
                success: true,
                message: 'Committee member removed successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error removing committee member:', error);
            res.status(500).json({
                success: false,
                message: 'Error removing committee member',
                error: error.message
            });
        }
    }

    // Create GEC committee change request
    static async createChangeRequest(req, res) {
        try {
            const student_user_id = req.user.id;
            const { request_type, requested_changes, justification } = req.body;

            if (!request_type || !requested_changes || !justification) {
                return res.status(400).json({
                    success: false,
                    message: 'Request type, requested changes, and justification are required'
                });
            }

            // Get current committee
            const currentCommittee = await pool.query(
                'SELECT id FROM gec_committees WHERE student_user_id = $1 AND is_active = true',
                [student_user_id]
            );

            if (currentCommittee.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No active GEC committee found for this student'
                });
            }

            // Create change request
            const result = await pool.query(`
                INSERT INTO gec_change_requests (
                    student_user_id, current_committee_id, request_type, 
                    requested_changes, justification
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [
                student_user_id, currentCommittee.rows[0].id, 
                request_type, JSON.stringify(requested_changes), justification
            ]);

            // Create notifications for supervisor and admin
            const studentInfo = await pool.query(
                'SELECT primary_supervisor_id FROM users WHERE id = $1',
                [student_user_id]
            );

            if (studentInfo.rows[0].primary_supervisor_id) {
                await pool.query(`
                    INSERT INTO notifications (recipient_id, recipient_type, title, message, notification_type, action_required)
                    VALUES ($1, 'faculty', $2, $3, 'approval_request', true)
                `, [
                    studentInfo.rows[0].primary_supervisor_id,
                    'GEC Committee Change Request',
                    `Your student has requested changes to their GEC committee. Please review and approve.`
                ]);
            }

            res.status(201).json({
                success: true,
                message: 'GEC committee change request submitted successfully',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error creating change request:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating change request',
                error: error.message
            });
        }
    }

    // Get change requests
    static async getChangeRequests(req, res) {
        try {
            const { status, student_id } = req.query;
            
            let whereClause = 'WHERE 1=1';
            const params = [];
            let paramCount = 0;

            if (status) {
                paramCount++;
                whereClause += ` AND gcr.request_status = $${paramCount}`;
                params.push(status);
            }

            if (student_id) {
                paramCount++;
                whereClause += ` AND gcr.student_user_id = $${paramCount}`;
                params.push(student_id);
            }

            const query = `
                SELECT 
                    gcr.*,
                    u.first_name || ' ' || u.last_name as student_name,
                    u.student_id,
                    f1.first_name || ' ' || f1.last_name as supervisor_approver,
                    a.first_name || ' ' || a.last_name as admin_approver
                FROM gec_change_requests gcr
                JOIN users u ON gcr.student_user_id = u.id
                LEFT JOIN faculty f1 ON gcr.supervisor_approved_by = f1.id
                LEFT JOIN users a ON gcr.admin_approved_by = a.id
                ${whereClause}
                ORDER BY gcr.created_at DESC
            `;

            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching change requests:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching change requests',
                error: error.message
            });
        }
    }

    // Get student's change requests
    static async getMyChangeRequests(req, res) {
        try {
            const student_user_id = req.user.id;

            const query = `
                SELECT 
                    gcr.*,
                    f1.first_name || ' ' || f1.last_name as supervisor_approver,
                    a.first_name || ' ' || a.last_name as admin_approver
                FROM gec_change_requests gcr
                LEFT JOIN faculty f1 ON gcr.supervisor_approved_by = f1.id
                LEFT JOIN users a ON gcr.admin_approved_by = a.id
                WHERE gcr.student_user_id = $1
                ORDER BY gcr.created_at DESC
            `;

            const result = await pool.query(query, [student_user_id]);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('Error fetching change requests:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching change requests',
                error: error.message
            });
        }
    }

    // Approve/Reject change request
    static async approveChangeRequest(req, res) {
        try {
            const { id } = req.params;
            const { approval_type, status, comments } = req.body; // approval_type: 'supervisor' or 'admin'
            const user_id = req.user.id;

            if (!approval_type || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'Approval type and status are required'
                });
            }

            let updateFields = {};
            if (approval_type === 'supervisor') {
                updateFields = {
                    supervisor_approval: status,
                    supervisor_approved_by: user_id,
                    supervisor_approved_at: 'CURRENT_TIMESTAMP',
                    supervisor_comments: comments
                };
            } else if (approval_type === 'admin') {
                updateFields = {
                    admin_approval: status,
                    admin_approved_by: user_id,
                    admin_approved_at: 'CURRENT_TIMESTAMP',
                    admin_comments: comments
                };
            }

            // Update the change request
            const result = await pool.query(`
                UPDATE gec_change_requests 
                SET ${Object.keys(updateFields).map((key, index) => 
                    key.includes('_at') ? `${key} = ${updateFields[key]}` : `${key} = $${index + 1}`
                ).join(', ')}
                WHERE id = $${Object.keys(updateFields).filter(key => !key.includes('_at')).length + 1}
                RETURNING *
            `, [
                ...Object.entries(updateFields).filter(([key]) => !key.includes('_at')).map(([, value]) => value),
                id
            ]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Change request not found'
                });
            }

            // Check if both approvals are complete and approved
            const updatedRequest = result.rows[0];
            if (updatedRequest.supervisor_approval === 'approved' && updatedRequest.admin_approval === 'approved') {
                // Process the change request
                await this.processChangeRequest(updatedRequest);
                
                await pool.query(
                    'UPDATE gec_change_requests SET request_status = $1, processed_at = CURRENT_TIMESTAMP, processed_by = $2 WHERE id = $3',
                    ['approved', user_id, id]
                );
            } else if (status === 'rejected') {
                await pool.query(
                    'UPDATE gec_change_requests SET request_status = $1 WHERE id = $2',
                    ['rejected', id]
                );
            }

            res.json({
                success: true,
                message: `Change request ${status} successfully`
            });

        } catch (error) {
            console.error('Error approving change request:', error);
            res.status(500).json({
                success: false,
                message: 'Error processing approval',
                error: error.message
            });
        }
    }

    // Helper method to process approved change requests
    static async processChangeRequest(changeRequest) {
        const changes = JSON.parse(changeRequest.requested_changes);
        const committeeId = changeRequest.current_committee_id;

        try {
            switch (changeRequest.request_type) {
                case 'add_member':
                    if (changes.faculty_id) {
                        await pool.query(`
                            INSERT INTO gec_committee_members (committee_id, faculty_id, member_role, is_external)
                            VALUES ($1, $2, $3, false)
                        `, [committeeId, changes.faculty_id, changes.member_role]);
                    } else {
                        await pool.query(`
                            INSERT INTO gec_committee_members (
                                committee_id, member_role, is_external, external_name, 
                                external_designation, external_institution, external_email
                            ) VALUES ($1, $2, true, $3, $4, $5, $6)
                        `, [
                            committeeId, changes.member_role, changes.external_name,
                            changes.external_designation, changes.external_institution, changes.external_email
                        ]);
                    }
                    break;

                case 'remove_member':
                    await pool.query(
                        'UPDATE gec_committee_members SET is_active = false WHERE id = $1 AND committee_id = $2',
                        [changes.member_id, committeeId]
                    );
                    break;

                case 'replace_member':
                    // Deactivate old member
                    await pool.query(
                        'UPDATE gec_committee_members SET is_active = false WHERE id = $1 AND committee_id = $2',
                        [changes.old_member_id, committeeId]
                    );
                    
                    // Add new member
                    if (changes.new_faculty_id) {
                        await pool.query(`
                            INSERT INTO gec_committee_members (committee_id, faculty_id, member_role, is_external)
                            VALUES ($1, $2, $3, false)
                        `, [committeeId, changes.new_faculty_id, changes.member_role]);
                    } else {
                        await pool.query(`
                            INSERT INTO gec_committee_members (
                                committee_id, member_role, is_external, external_name, 
                                external_designation, external_institution, external_email
                            ) VALUES ($1, $2, true, $3, $4, $5, $6)
                        `, [
                            committeeId, changes.member_role, changes.new_external_name,
                            changes.new_external_designation, changes.new_external_institution, changes.new_external_email
                        ]);
                    }
                    break;

                case 'change_chairperson':
                    // Remove chairperson role from current chairperson
                    await pool.query(
                        'UPDATE gec_committee_members SET member_role = $1 WHERE committee_id = $2 AND member_role = $3',
                        ['internal_member', committeeId, 'chairperson']
                    );
                    
                    // Assign chairperson role to new member
                    await pool.query(
                        'UPDATE gec_committee_members SET member_role = $1 WHERE id = $2 AND committee_id = $3',
                        ['chairperson', changes.new_chairperson_id, committeeId]
                    );
                    break;
            }
        } catch (error) {
            console.error('Error processing change request:', error);
            throw error;
        }
    }

    // Get GEC committee statistics
    static async getStatistics(req, res) {
        try {
            const stats = await pool.query(`
                SELECT 
                    COUNT(DISTINCT gc.id) as total_committees,
                    COUNT(DISTINCT CASE WHEN gc.is_active = true THEN gc.id END) as active_committees,
                    COUNT(DISTINCT gcm.id) as total_members,
                    COUNT(DISTINCT gcm.faculty_id) FILTER (WHERE gcm.is_external = false) as internal_members,
                    COUNT(DISTINCT gcm.id) FILTER (WHERE gcm.is_external = true) as external_members,
                    COUNT(DISTINCT gcr.id) as total_change_requests,
                    COUNT(DISTINCT gcr.id) FILTER (WHERE gcr.request_status = 'pending') as pending_change_requests
                FROM gec_committees gc
                LEFT JOIN gec_committee_members gcm ON gc.id = gcm.committee_id AND gcm.is_active = true
                LEFT JOIN gec_change_requests gcr ON gc.student_user_id = gcr.student_user_id
            `);

            // Get department-wise statistics
            const deptStats = await pool.query(`
                SELECT 
                    d.dept_name,
                    COUNT(DISTINCT gc.id) as committees_count,
                    AVG(member_counts.member_count) as avg_members_per_committee
                FROM departments d
                LEFT JOIN users u ON d.id = u.department_id
                LEFT JOIN gec_committees gc ON u.id = gc.student_user_id AND gc.is_active = true
                LEFT JOIN (
                    SELECT committee_id, COUNT(*) as member_count
                    FROM gec_committee_members
                    WHERE is_active = true
                    GROUP BY committee_id
                ) member_counts ON gc.id = member_counts.committee_id
                WHERE d.is_active = true
                GROUP BY d.id, d.dept_name
                ORDER BY d.dept_name
            `);

            res.json({
                success: true,
                data: {
                    overview: stats.rows[0],
                    department_wise: deptStats.rows
                }
            });

        } catch (error) {
            console.error('Error fetching GEC statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching GEC statistics',
                error: error.message
            });
        }
    }
}

module.exports = GECController; 