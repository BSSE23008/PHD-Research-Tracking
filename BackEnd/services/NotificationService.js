/**
 * NotificationService - Handles notification-related business logic
 */

const db = require('../config/database');

class NotificationService {
    // Create a new notification
    static async createNotification({
        userId,
        title,
        message,
        notificationType = 'info',
        relatedFormId = null,
        actionRequired = false,
        actionUrl = null
    }) {
        try {
            const insertQuery = `
                INSERT INTO notifications (
                    user_id, title, message, notification_type,
                    related_form_id, action_required, action_url
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const result = await db.query(insertQuery, [
                userId,
                title,
                message,
                notificationType,
                relatedFormId,
                actionRequired,
                actionUrl
            ]);

            return result.rows[0];

        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    // Get notifications for a user
    static async getUserNotifications(userId, { 
        isRead = null, 
        notificationType = null, 
        page = 1, 
        limit = 20 
    } = {}) {
        try {
            const offset = (page - 1) * limit;
            let whereClause = 'WHERE user_id = $1';
            let queryParams = [userId];
            let paramCount = 1;

            if (isRead !== null) {
                paramCount++;
                whereClause += ` AND is_read = $${paramCount}`;
                queryParams.push(isRead);
            }

            if (notificationType) {
                paramCount++;
                whereClause += ` AND notification_type = $${paramCount}`;
                queryParams.push(notificationType);
            }

            const notificationsQuery = `
                SELECT 
                    n.*,
                    fs.status as form_status,
                    ft.form_name,
                    ft.form_code
                FROM notifications n
                LEFT JOIN form_submissions fs ON n.related_form_id = fs.id
                LEFT JOIN form_types ft ON fs.form_type_id = ft.id
                ${whereClause}
                ORDER BY n.created_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;

            queryParams.push(limit, offset);

            const countQuery = `
                SELECT COUNT(*) as total
                FROM notifications 
                ${whereClause}
            `;

            const [notifications, count] = await Promise.all([
                db.query(notificationsQuery, queryParams),
                db.query(countQuery, queryParams.slice(0, -2))
            ]);

            return {
                notifications: notifications.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(count.rows[0].total),
                    pages: Math.ceil(count.rows[0].total / limit)
                }
            };

        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    }

    // Mark notification as read
    static async markAsRead(notificationId, userId) {
        try {
            const updateQuery = `
                UPDATE notifications 
                SET is_read = true, read_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND user_id = $2
                RETURNING *
            `;

            const result = await db.query(updateQuery, [notificationId, userId]);
            return result.rows[0];

        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    // Mark all notifications as read for a user
    static async markAllAsRead(userId) {
        try {
            const updateQuery = `
                UPDATE notifications 
                SET is_read = true, read_at = CURRENT_TIMESTAMP
                WHERE user_id = $1 AND is_read = false
                RETURNING COUNT(*) as updated_count
            `;

            const result = await db.query(updateQuery, [userId]);
            return result.rows[0].updated_count;

        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    // Delete notification
    static async deleteNotification(notificationId, userId) {
        try {
            const deleteQuery = `
                DELETE FROM notifications 
                WHERE id = $1 AND user_id = $2
                RETURNING id
            `;

            const result = await db.query(deleteQuery, [notificationId, userId]);
            return result.rows.length > 0;

        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }

    // Get unread count for a user
    static async getUnreadCount(userId) {
        try {
            const countQuery = `
                SELECT COUNT(*) as unread_count
                FROM notifications 
                WHERE user_id = $1 AND is_read = false
            `;

            const result = await db.query(countQuery, [userId]);
            return parseInt(result.rows[0].unread_count);

        } catch (error) {
            console.error('Error fetching unread count:', error);
            throw error;
        }
    }

    // Send bulk notifications
    static async sendBulkNotifications(notifications) {
        try {
            if (!Array.isArray(notifications) || notifications.length === 0) {
                return [];
            }

            const values = [];
            const placeholders = [];
            let paramCount = 0;

            notifications.forEach((notif, index) => {
                const baseParam = index * 7;
                placeholders.push(
                    `($${baseParam + 1}, $${baseParam + 2}, $${baseParam + 3}, $${baseParam + 4}, $${baseParam + 5}, $${baseParam + 6}, $${baseParam + 7})`
                );
                values.push(
                    notif.userId,
                    notif.title,
                    notif.message,
                    notif.notificationType || 'info',
                    notif.relatedFormId || null,
                    notif.actionRequired || false,
                    notif.actionUrl || null
                );
                paramCount += 7;
            });

            const insertQuery = `
                INSERT INTO notifications (
                    user_id, title, message, notification_type,
                    related_form_id, action_required, action_url
                ) VALUES ${placeholders.join(', ')}
                RETURNING *
            `;

            const result = await db.query(insertQuery, values);
            return result.rows;

        } catch (error) {
            console.error('Error sending bulk notifications:', error);
            throw error;
        }
    }

    // Send reminder notifications for overdue items
    static async sendReminderNotifications() {
        try {
            const reminderTasks = [];

            // Find students with pending forms that haven't been updated in 7 days
            const pendingFormsQuery = `
                SELECT DISTINCT
                    fs.user_id,
                    u.first_name || ' ' || u.last_name as student_name,
                    ft.form_name,
                    fs.submitted_at,
                    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - fs.submitted_at))/86400 as days_pending
                FROM form_submissions fs
                JOIN users u ON fs.user_id = u.id
                JOIN form_types ft ON fs.form_type_id = ft.id
                WHERE fs.status IN ('submitted', 'under_review')
                AND fs.submitted_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
                AND NOT EXISTS (
                    SELECT 1 FROM notifications n 
                    WHERE n.user_id = fs.user_id 
                    AND n.related_form_id = fs.id 
                    AND n.title LIKE '%Reminder%'
                    AND n.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
                )
            `;

            const pendingForms = await db.query(pendingFormsQuery);

            for (const form of pendingForms.rows) {
                reminderTasks.push(
                    this.createNotification({
                        userId: form.user_id,
                        title: 'Form Approval Reminder',
                        message: `Your ${form.form_name} has been pending approval for ${Math.floor(form.days_pending)} days. Please follow up if needed.`,
                        notificationType: 'warning',
                        actionRequired: false
                    })
                );
            }

            // Find students stuck in workflow stages for too long
            const stuckStudentsQuery = `
                SELECT 
                    swp.student_id,
                    u.first_name || ' ' || u.last_name as student_name,
                    swp.current_stage,
                    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - swp.stage_start_date))/86400 as days_in_stage
                FROM student_workflow_progress swp
                JOIN users u ON swp.student_id = u.id
                WHERE u.is_active = true
                AND swp.stage_start_date < CURRENT_TIMESTAMP - INTERVAL '90 days'
                AND NOT swp.is_stage_completed
                AND NOT EXISTS (
                    SELECT 1 FROM notifications n 
                    WHERE n.user_id = swp.student_id 
                    AND n.title LIKE '%Stage Reminder%'
                    AND n.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
                )
            `;

            const stuckStudents = await db.query(stuckStudentsQuery);

            for (const student of stuckStudents.rows) {
                reminderTasks.push(
                    this.createNotification({
                        userId: student.student_id,
                        title: 'Workflow Stage Reminder',
                        message: `You have been in the ${student.current_stage.replace('_', ' ')} stage for ${Math.floor(student.days_in_stage)} days. Please check if you have pending requirements to complete.`,
                        notificationType: 'reminder',
                        actionRequired: true
                    })
                );
            }

            // Send all reminder notifications
            await Promise.all(reminderTasks);

            return {
                pendingFormReminders: pendingForms.rows.length,
                stageReminders: stuckStudents.rows.length
            };

        } catch (error) {
            console.error('Error sending reminder notifications:', error);
            throw error;
        }
    }

    // Send deadline notifications
    static async sendDeadlineNotifications() {
        try {
            const deadlineNotifications = [];

            // Find upcoming comprehensive exams (within 7 days)
            const upcomingExamsQuery = `
                SELECT 
                    ce.student_id,
                    u.first_name || ' ' || u.last_name as student_name,
                    ce.exam_date,
                    ce.exam_time,
                    ce.venue,
                    EXTRACT(EPOCH FROM (ce.exam_date - CURRENT_DATE))/86400 as days_until_exam
                FROM comprehensive_exams ce
                JOIN users u ON ce.student_id = u.id
                WHERE ce.exam_status = 'scheduled'
                AND ce.exam_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
                AND NOT EXISTS (
                    SELECT 1 FROM notifications n 
                    WHERE n.user_id = ce.student_id 
                    AND n.title LIKE '%Exam Reminder%'
                    AND n.created_at > CURRENT_TIMESTAMP - INTERVAL '3 days'
                )
            `;

            const upcomingExams = await db.query(upcomingExamsQuery);

            for (const exam of upcomingExams.rows) {
                deadlineNotifications.push(
                    this.createNotification({
                        userId: exam.student_id,
                        title: 'Upcoming Comprehensive Exam',
                        message: `Your comprehensive exam is scheduled for ${exam.exam_date}${exam.exam_time ? ' at ' + exam.exam_time : ''}${exam.venue ? ' in ' + exam.venue : ''}. ${Math.floor(exam.days_until_exam)} days remaining.`,
                        notificationType: 'warning',
                        actionRequired: true
                    })
                );
            }

            // Find upcoming thesis defenses (within 7 days)
            const upcomingDefensesQuery = `
                SELECT 
                    td.student_id,
                    u.first_name || ' ' || u.last_name as student_name,
                    td.defense_type,
                    td.scheduled_date,
                    td.scheduled_time,
                    td.venue,
                    EXTRACT(EPOCH FROM (td.scheduled_date - CURRENT_DATE))/86400 as days_until_defense
                FROM thesis_defenses td
                JOIN users u ON td.student_id = u.id
                WHERE td.defense_status = 'scheduled'
                AND td.scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
                AND NOT EXISTS (
                    SELECT 1 FROM notifications n 
                    WHERE n.user_id = td.student_id 
                    AND n.title LIKE '%Defense Reminder%'
                    AND n.created_at > CURRENT_TIMESTAMP - INTERVAL '3 days'
                )
            `;

            const upcomingDefenses = await db.query(upcomingDefensesQuery);

            for (const defense of upcomingDefenses.rows) {
                deadlineNotifications.push(
                    this.createNotification({
                        userId: defense.student_id,
                        title: `Upcoming ${defense.defense_type.replace('_', ' ').toUpperCase()} Defense`,
                        message: `Your ${defense.defense_type} defense is scheduled for ${defense.scheduled_date}${defense.scheduled_time ? ' at ' + defense.scheduled_time : ''}${defense.venue ? ' in ' + defense.venue : ''}. ${Math.floor(defense.days_until_defense)} days remaining.`,
                        notificationType: 'warning',
                        actionRequired: true
                    })
                );
            }

            // Send all deadline notifications
            await Promise.all(deadlineNotifications);

            return {
                examReminders: upcomingExams.rows.length,
                defenseReminders: upcomingDefenses.rows.length
            };

        } catch (error) {
            console.error('Error sending deadline notifications:', error);
            throw error;
        }
    }

    // Clean up old read notifications (older than 30 days)
    static async cleanupOldNotifications() {
        try {
            const deleteQuery = `
                DELETE FROM notifications 
                WHERE is_read = true 
                AND read_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
                AND action_required = false
            `;

            const result = await db.query(deleteQuery);
            return result.rowCount;

        } catch (error) {
            console.error('Error cleaning up old notifications:', error);
            throw error;
        }
    }

    // Get notification statistics
    static async getNotificationStats() {
        try {
            const statsQuery = `
                SELECT 
                    notification_type,
                    COUNT(*) as total_count,
                    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
                    COUNT(CASE WHEN action_required = true THEN 1 END) as action_required_count
                FROM notifications 
                WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
                GROUP BY notification_type
            `;

            const result = await db.query(statsQuery);
            return result.rows;

        } catch (error) {
            console.error('Error fetching notification stats:', error);
            throw error;
        }
    }

    // Send system-wide announcement
    static async sendSystemAnnouncement({ 
        title, 
        message, 
        targetRole = null, 
        notificationType = 'info' 
    }) {
        try {
            let userQuery = 'SELECT id FROM users WHERE is_active = true';
            let queryParams = [];

            if (targetRole) {
                userQuery += ' AND role = $1';
                queryParams.push(targetRole);
            }

            const users = await db.query(userQuery, queryParams);
            
            const notifications = users.rows.map(user => ({
                userId: user.id,
                title,
                message,
                notificationType,
                actionRequired: false
            }));

            return await this.sendBulkNotifications(notifications);

        } catch (error) {
            console.error('Error sending system announcement:', error);
            throw error;
        }
    }
}

module.exports = NotificationService; 