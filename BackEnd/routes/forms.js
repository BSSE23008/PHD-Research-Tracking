const express = require('express');
const router = express.Router();
const FormController = require('../controllers/FormController');
const WorkflowService = require('../services/WorkflowService');
const NotificationService = require('../services/NotificationService');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/attachments/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow common document types
        const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, PNG, and TXT files are allowed'));
        }
    }
});


// Apply authentication to all routes
router.use(authenticateToken);

// Form type management routes
router.get('/types', FormController.getFormTypes);
router.get('/available', FormController.getAvailableForms);
router.get('/schema/:formCode', FormController.getFormSchema);

// Form progress routes (auto-save functionality)
router.post('/progress', FormController.saveProgress);
router.get('/progress/:formCode', FormController.loadProgress);

// Form submission routes
router.post('/submit', FormController.submitForm);
router.post('/submit-data', FormController.submitFormData);
router.get('/submissions', FormController.getSubmissions);
router.get('/submissions/:submissionId', FormController.getSubmissionById);



// Auto-fill form data endpoint
router.get('/auto-fill/:formCode', async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Student access required'
            });
        }

        const { formCode } = req.params;
        const userId = req.user.id;

        if (formCode === 'PHDEE02-A') {
            // Get student and supervisor information for auto-filling
            const userQuery = `
                SELECT 
                    u.id as student_id,
                    u.first_name as student_first_name,
                    u.last_name as student_last_name,
                    u.email as student_email,
                    u.student_id as student_registration_id,
                    u.department_id,
                    u.current_semester,
                    u.academic_year,
                    u.research_area,
                    d.dept_name as department_name,
                    d.dept_code as department_code,
                    f.id as supervisor_id,
                    f.first_name as supervisor_first_name,
                    f.last_name as supervisor_last_name,
                    f.email as supervisor_email,
                    f.designation as supervisor_designation
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN faculty f ON u.primary_supervisor_id = f.id
                WHERE u.id = $1
            `;

            const userResult = await req.app.locals.db.query(userQuery, [userId]);
            
            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const userData = userResult.rows[0];

            // Check if supervisor is assigned
            if (!userData.supervisor_id) {
                return res.status(400).json({
                    success: false,
                    message: 'No supervisor assigned. Please contact your department to assign a supervisor first.'
                });
            }

            // Auto-fill form data with camelCase keys
            const autoFillData = {
                // Student Information
                studentId: userData.student_registration_id,
                studentName: `${userData.student_first_name} ${userData.student_last_name}`,
                studentEmail: userData.student_email,
                department: userData.department_name,
                departmentCode: userData.department_code,
                currentSemester: userData.current_semester,
                academicYear: userData.academic_year,
                researchArea: userData.research_area,

                // Supervisor Information
                supervisorId: userData.supervisor_id,
                supervisorName: `${userData.supervisor_first_name} ${userData.supervisor_last_name}`,
                supervisorEmail: userData.supervisor_email,
                supervisorDesignation: userData.supervisor_designation,

                // Form-specific fields
                consentDate: new Date().toISOString().split('T')[0],
                agreementTerms: true,
                
                // Research details (can be filled by student)
                researchTopic: userData.research_area || '',
                researchObjectives: '',
                methodology: '',
                expectedOutcomes: '',
                
                // Consent fields
                primarySupervisorConsent: true,
                studentAgreement: true,
                termsAccepted: true
            };

            res.json({
                success: true,
                message: 'Auto-fill data retrieved successfully',
                data: autoFillData
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Auto-fill not available for this form type'
            });
        }
    } catch (error) {
        console.error('Error getting auto-fill data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get auto-fill data',
            error: error.message
        });
    }
});

// File attachment routes
router.post('/submissions/:submissionId/attachments', upload.single('file'), FormController.uploadAttachment);

// Workflow-related routes
router.get('/workflow/status', async (req, res) => {
    try {
        const userId = req.user.id;
        
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can access workflow status'
            });
        }

        const workflowStatus = await WorkflowService.getStudentWorkflowStatus(userId);
        
        res.json({
            success: true,
            data: workflowStatus
        });
    } catch (error) {
        console.error('Error fetching workflow status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch workflow status',
            error: error.message
        });
    }
});

router.put('/workflow/semester', async (req, res) => {
    try {
        const userId = req.user.id;
        const { semester, academicYear } = req.body;
        
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can update semester information'
            });
        }

        if (!semester || !academicYear) {
            return res.status(400).json({
                success: false,
                message: 'Semester and academic year are required'
            });
        }

        const updatedProgress = await WorkflowService.updateStudentSemester(userId, semester, academicYear);
        
        res.json({
            success: true,
            message: 'Semester information updated successfully',
            data: updatedProgress
        });
    } catch (error) {
        console.error('Error updating semester:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update semester information',
            error: error.message
        });
    }
});

// Notification routes for forms
router.get('/notifications', async (req, res) => {
    try {
        const userId = req.user.id;
        const { isRead, notificationType, page, limit } = req.query;
        
        const notifications = await NotificationService.getUserNotifications(userId, {
            isRead: isRead !== undefined ? isRead === 'true' : null,
            notificationType,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20
        });
        
        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
});

router.put('/notifications/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;
        
        const notification = await NotificationService.markAsRead(parseInt(notificationId), userId);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Notification marked as read',
            data: notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
});

router.put('/notifications/mark-all-read', async (req, res) => {
    try {
        const userId = req.user.id;
        
        const updatedCount = await NotificationService.markAllAsRead(userId);
        
        res.json({
            success: true,
            message: 'All notifications marked as read',
            data: {
                updatedCount
            }
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message
        });
    }
});

router.delete('/notifications/:notificationId', async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;
        
        const deleted = await NotificationService.deleteNotification(parseInt(notificationId), userId);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
});

router.get('/notifications/unread-count', async (req, res) => {
    try {
        const userId = req.user.id;
        
        const unreadCount = await NotificationService.getUnreadCount(userId);
        
        res.json({
            success: true,
            data: {
                unreadCount
            }
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count',
            error: error.message
        });
    }
});

// Form analytics (for admins and supervisors)
router.get('/analytics', async (req, res) => {
    try {
        if (!['admin', 'supervisor'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Admin or supervisor access required'
            });
        }

        await FormController.getFormAnalytics(req, res);
    } catch (error) {
        console.error('Error in analytics route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics',
            error: error.message
        });
    }
});

// Supervisor-specific routes
router.get('/supervisor/pending-approvals', async (req, res) => {
    try {
        if (req.user.role !== 'faculty') {
            return res.status(403).json({
                success: false,
                message: 'Faculty access required'
            });
        }

        const supervisorUserId = req.user.id;
        
        // Get faculty ID from user ID
        const facultyQuery = await req.app.locals.db.query(`
            SELECT f.id as faculty_id 
            FROM users u 
            JOIN faculty f ON u.email = f.email 
            WHERE u.id = $1 AND u.role = 'faculty'
        `, [supervisorUserId]);
        
        if (facultyQuery.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Faculty member not found'
            });
        }

        const facultyId = facultyQuery.rows[0].faculty_id;
        
        // Get pending approvals for this supervisor's students
        const pendingQuery = `
            SELECT 
                fs.id,
                fs.status,
                fs.submitted_at,
                fs.supervisor_approval_status,
                fs.form_data,
                u.first_name || ' ' || u.last_name as student_name,
                u.email as student_email,
                u.student_id,
                ft.form_name,
                ft.form_code,
                ft.workflow_stage
            FROM form_submissions fs
            JOIN users u ON fs.user_id = u.id
            JOIN form_types ft ON fs.form_type_id = ft.id
            LEFT JOIN supervisor_consent_forms scf ON scf.student_user_id = u.id AND scf.primary_supervisor_id = $1
            WHERE (
                (fs.status IN ('awaiting_supervisor_consent', 'approved_by_dprc') AND ft.form_code = 'PHDEE02-A' AND u.primary_supervisor_id = $1)
                AND (fs.supervisor_approval_status IS NULL OR fs.supervisor_approval_status = 'pending')
            )
            ORDER BY fs.submitted_at ASC
        `;

        const result = await req.app.locals.db.query(pendingQuery, [facultyId]);

        res.json({
            success: true,
            data: {
                pendingApprovals: result.rows
            }
        });
    } catch (error) {
        console.error('Error fetching supervisor pending approvals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending approvals',
            error: error.message
        });
    }
});

router.put('/supervisor/approvals/:submissionId', async (req, res) => {
    try {
        if (req.user.role !== 'faculty') {
            return res.status(403).json({
                success: false,
                message: 'Faculty access required'
            });
        }

        const { submissionId } = req.params;
        const supervisorUserId = req.user.id;
        
        // Get faculty ID from user ID
        const facultyQuery = await req.app.locals.db.query(`
            SELECT f.id as faculty_id 
            FROM users u 
            JOIN faculty f ON u.email = f.email 
            WHERE u.id = $1 AND u.role = 'faculty'
        `, [supervisorUserId]);
        
        if (facultyQuery.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Faculty member not found'
            });
        }
        
        const facultyId = facultyQuery.rows[0].faculty_id;

        // Verify this supervisor can approve this submission
        const verifyQuery = `
            SELECT fs.id 
            FROM form_submissions fs
            JOIN users u ON fs.user_id = u.id
            JOIN supervisor_consent_forms scf ON scf.student_user_id = u.id
            JOIN form_submissions consent_fs ON scf.form_submission_id = consent_fs.id
            WHERE fs.id = $1 AND scf.primary_supervisor_id = $2 AND consent_fs.status = 'approved'
        `;

        const verifyResult = await req.app.locals.db.query(verifyQuery, [submissionId, facultyId]);

        if (verifyResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to approve this submission'
            });
        }

        // Use the admin controller method with supervisor approval type
        req.body.approvalType = 'supervisor';
        await FormController.updateFormApproval(req, res);

    } catch (error) {
        console.error('Error updating supervisor approval:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update approval',
            error: error.message
        });
    }
});

// Supervisor consent form submission route (for supervisors to fill)
router.post('/supervisor/consent', async (req, res) => {
    try {
        if (req.user.role !== 'faculty') {
            return res.status(403).json({
                success: false,
                message: 'Faculty access required'
            });
        }

        const { formSubmissionId, consentData, approved } = req.body;
        const supervisorUserId = req.user.id;
        
        // Get faculty ID from user ID
        const facultyQuery = await req.app.locals.db.query(`
            SELECT f.id as faculty_id 
            FROM users u 
            JOIN faculty f ON u.email = f.email 
            WHERE u.id = $1 AND u.role = 'faculty'
        `, [supervisorUserId]);
        
        if (facultyQuery.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Faculty member not found'
            });
        }
        
        const facultyId = facultyQuery.rows[0].faculty_id;

        if (!formSubmissionId || !consentData) {
            return res.status(400).json({
                success: false,
                message: 'Form submission ID and consent data are required'
            });
        }

        // Verify the supervisor can fill consent for this submission
        const verifyQuery = `
            SELECT fs.id, fs.user_id, fs.form_data, ft.form_code
            FROM form_submissions fs
            JOIN form_types ft ON fs.form_type_id = ft.id
            WHERE fs.id = $1 AND (ft.form_code = 'PHDEE02-A' OR ft.form_code = 'ONBOARDING-001')
        `;

        const verifyResult = await req.app.locals.db.query(verifyQuery, [formSubmissionId]);

        if (verifyResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Form submission not found'
            });
        }

        const submission = verifyResult.rows[0];
        const studentUserId = submission.user_id;

        // Insert or update supervisor consent form
        const upsertQuery = `
            INSERT INTO supervisor_consent_forms (
                form_submission_id, student_user_id, primary_supervisor_id,
                research_topic, research_objectives, methodology, expected_outcomes,
                primary_supervisor_consent, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (form_submission_id) DO UPDATE SET
                research_topic = EXCLUDED.research_topic,
                research_objectives = EXCLUDED.research_objectives,
                methodology = EXCLUDED.methodology,
                expected_outcomes = EXCLUDED.expected_outcomes,
                primary_supervisor_consent = EXCLUDED.primary_supervisor_consent,
                status = EXCLUDED.status
            RETURNING *
        `;

        const consentResult = await req.app.locals.db.query(upsertQuery, [
            formSubmissionId,
            studentUserId,
            facultyId,
            consentData.researchTopic || '',
            consentData.researchObjectives || '',
            consentData.methodology || '',
            consentData.expectedOutcomes || '',
            approved,
            approved ? 'approved' : 'pending'
        ]);

        // If approved, assign the supervisor to the student
        if (approved) {
            await req.app.locals.db.query(`
                UPDATE users 
                SET primary_supervisor_id = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [facultyId, studentUserId]);

            // Update form status to approved (not gec_ready)
            await req.app.locals.db.query(`
                UPDATE form_submissions 
                SET 
                    status = 'approved',
                    final_approval_status = 'approved',
                    supervisor_approval_status = 'approved',
                    supervisor_approved_by = $1,
                    supervisor_approved_at = CURRENT_TIMESTAMP,
                    last_updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [facultyId, formSubmissionId]);

            // Create notification for student
            await req.app.locals.db.query(`
                INSERT INTO notifications (
                    recipient_id, recipient_type, title, message, notification_type
                ) VALUES ($1, 'student', $2, $3, 'success')
            `, [
                studentUserId,
                'Supervisor Assigned Successfully',
                'Your supervisor has been assigned and you can now proceed to GEC formation. Please fill the GEC Formation Form when ready.'
            ]);
        } else {
            // If rejected, update status and remove supervisor assignment
            await req.app.locals.db.query(`
                UPDATE form_submissions 
                SET status = 'rejected_by_supervisor', 
                    supervisor_approval_status = 'rejected',
                    supervisor_approved_by = $1,
                    supervisor_approved_at = CURRENT_TIMESTAMP,
                    supervisor_comments = $2,
                    last_updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
            `, [facultyId, consentData.comments || 'Supervisor rejected the consent form', formSubmissionId]);

            // Remove supervisor assignment from student (allow them to choose another supervisor)
            await req.app.locals.db.query(`
                UPDATE users 
                SET primary_supervisor_id = NULL, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [studentUserId]);

            // Send notification to student about rejection
            await NotificationService.createNotification(
                studentUserId,
                'Supervisor Consent Rejected',
                `Your supervisor has rejected the consent form. You can now select another supervisor and resubmit the Supervisor Consent Form. Reason: ${consentData.comments || 'No specific reason provided'}`
            );
        }

        res.json({
            success: true,
            message: 'Supervisor consent form submitted successfully',
            data: {
                consentForm: consentResult.rows[0],
                approved: approved
            }
        });

    } catch (error) {
        console.error('Error submitting supervisor consent form:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit supervisor consent form',
            error: error.message
        });
    }
});

// Student dashboard summary
router.get('/dashboard/summary', async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Student access required'
            });
        }

        const userId = req.user.id;

        // Get workflow status
        const workflowStatus = await WorkflowService.getStudentWorkflowStatus(userId);
        
        // Get recent submissions with special logic for onboarding forms
        const recentSubmissionsQuery = `
            SELECT 
                fs.id,
                fs.status,
                fs.submitted_at,
                fs.dprc_approval_status,
                fs.supervisor_approval_status,
                fs.final_approval_status,
                ft.form_name,
                ft.form_code,
                u.primary_supervisor_id,
                fs.status as display_status,
                CASE 
                    WHEN fs.status = 'pending_dprc_approval' THEN 'Submitted - Waiting for DPRC review'
                    WHEN fs.status = 'approved_by_dprc' THEN 'Approved by DPRC - Ready for next step'
                    WHEN fs.status = 'awaiting_supervisor_consent' THEN 'Waiting for supervisor approval'
                    WHEN fs.status = 'supervisor_approved' THEN 'Supervisor approved - Assignment complete'
                    WHEN fs.status = 'approved' THEN 'Approved - Ready for next step'
                    WHEN fs.status = 'gec_ready' THEN 'Ready for GEC formation'
                    WHEN fs.status = 'rejected_by_dprc' THEN 'Rejected by DPRC'
                    WHEN fs.status = 'rejected_by_supervisor' THEN 'Rejected by supervisor'
                    ELSE NULL
                END as status_message
            FROM form_submissions fs
            JOIN form_types ft ON fs.form_type_id = ft.id
            JOIN users u ON fs.user_id = u.id
            WHERE fs.user_id = $1
            ORDER BY fs.submitted_at DESC
            LIMIT 5
        `;

        const recentSubmissions = await req.app.locals.db.query(recentSubmissionsQuery, [userId]);

        // Get user profile to determine available forms
        const userQuery = `
            SELECT u.*, d.dept_name, d.dept_code 
            FROM users u 
            LEFT JOIN departments d ON u.department_id = d.id 
            WHERE u.id = $1
        `;
        const userResult = await req.app.locals.db.query(userQuery, [userId]);
        const userProfile = userResult.rows[0];

        // Determine pending forms based on workflow logic
        const pendingForms = [];
        
        // Check if Initial Onboarding Form is approved
        const onboardingApproved = recentSubmissions.rows.some(sub => 
            sub.form_code === 'ONBOARDING-001' && 
            (sub.status === 'approved_by_dprc' || sub.status === 'approved')
        );
        
        // Check if Supervisor Consent Form is already submitted and not rejected
        const supervisorConsentSubmission = recentSubmissions.rows.find(sub => 
            sub.form_code === 'PHDEE02-A'
        );
        const supervisorConsentSubmitted = supervisorConsentSubmission && 
            supervisorConsentSubmission.status !== 'rejected_by_supervisor';
        
        // Add Supervisor Consent Form if onboarding is approved and (consent not submitted OR was rejected)
        if (onboardingApproved && !supervisorConsentSubmitted) {
            const isResubmission = supervisorConsentSubmission && 
                supervisorConsentSubmission.status === 'rejected_by_supervisor';
            
            pendingForms.push({
                id: 'PHDEE02-A',
                form_code: 'PHDEE02-A',
                form_name: isResubmission ? 'Supervisor Consent Form (Resubmission)' : 'Supervisor Consent Form',
                description: isResubmission ? 
                    'Previous submission was rejected. Select a new supervisor and resubmit.' : 
                    'Form for supervisor consent and student-supervisor agreement',
                priority: 'high',
                deadline: null,
                workflow_stage: 'supervision_consent',
                isResubmission: isResubmission,
                rejectionReason: isResubmission ? supervisorConsentSubmission.supervisor_comments : null
            });
        }

        // Add GEC Formation Form if supervisor consent is approved and no GEC formed
        const supervisorConsentApproved = recentSubmissions.rows.some(sub => 
            sub.form_code === 'PHDEE02-A' && 
            (sub.status === 'approved' || sub.final_approval_status === 'approved')
        );
        
        if (supervisorConsentApproved && userProfile.primary_supervisor_id) {
            // Check if GEC is already formed
            const gecQuery = `SELECT 1 FROM gec_committees WHERE student_user_id = $1`;
            const gecResult = await req.app.locals.db.query(gecQuery, [userId]);
            
            if (gecResult.rows.length === 0) {
                pendingForms.push({
                    id: 'PHDEE02-C',
                    form_code: 'PHDEE02-C',
                    form_name: 'GEC Formation Form',
                    description: 'Form to establish Graduate Evaluation Committee',
                    priority: 'high',
                    deadline: null,
                    workflow_stage: 'gec_formation'
                });
            }
        }

        // Get unread notifications count
        const unreadCount = await NotificationService.getUnreadCount(userId);

        res.json({
            success: true,
            data: {
                workflowStatus,
                recentSubmissions: recentSubmissions.rows,
                pendingForms,
                unreadNotifications: unreadCount,
                totalFormsSubmitted: recentSubmissions.rows.length,
                user: userProfile
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard summary',
            error: error.message
        });
    }
});

module.exports = router;