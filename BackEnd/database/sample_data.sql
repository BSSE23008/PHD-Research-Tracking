-- Sample data for PhD Research Tracking System
-- This script populates the database with test data for development and testing

-- Insert sample admin user
INSERT INTO users (first_name, last_name, email, password_hash, role, is_active) VALUES
('Admin', 'User', 'admin@itu.edu.pk', '$2b$10$hash_here', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample supervisors
INSERT INTO users (first_name, last_name, email, password_hash, role, title, department, institution, office_location, research_interests, max_students, is_active) VALUES
('Dr. Sarah', 'Ahmad', 'sarah.ahmad@itu.edu.pk', '$2b$10$hash_here', 'supervisor', 'Professor', 'Computer Science', 'Information Technology University', 'Room 301, CS Building', 'Machine Learning, AI, Data Science', 8, true),
('Dr. Ali', 'Hassan', 'ali.hassan@itu.edu.pk', '$2b$10$hash_here', 'supervisor', 'Associate Professor', 'Computer Science', 'Information Technology University', 'Room 205, CS Building', 'Software Engineering, Systems Design', 6, true),
('Dr. Fatima', 'Khan', 'fatima.khan@itu.edu.pk', '$2b$10$hash_here', 'supervisor', 'Professor', 'Computer Science', 'Information Technology University', 'Room 401, CS Building', 'Computer Vision, Image Processing', 7, true),
('Dr. Ahmed', 'Malik', 'ahmed.malik@itu.edu.pk', '$2b$10$hash_here', 'supervisor', 'Assistant Professor', 'Computer Science', 'Information Technology University', 'Room 102, CS Building', 'Cybersecurity, Network Security', 5, true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample students
INSERT INTO users (first_name, last_name, email, password_hash, role, student_id, enrollment_year, research_area, is_active) VALUES
('Ahmad', 'Raza', 'ahmad.raza@student.itu.edu.pk', '$2b$10$hash_here', 'student', 'PHD2024001', 2024, 'Machine Learning and Deep Learning', true),
('Ayesha', 'Siddique', 'ayesha.siddique@student.itu.edu.pk', '$2b$10$hash_here', 'student', 'PHD2024002', 2024, 'Computer Vision and Image Processing', true),
('Hassan', 'Ali', 'hassan.ali@student.itu.edu.pk', '$2b$10$hash_here', 'student', 'PHD2023001', 2023, 'Software Engineering and Testing', true),
('Zara', 'Ahmed', 'zara.ahmed@student.itu.edu.pk', '$2b$10$hash_here', 'student', 'PHD2023002', 2023, 'Cybersecurity and Network Security', true),
('Usman', 'Khan', 'usman.khan@student.itu.edu.pk', '$2b$10$hash_here', 'student', 'PHD2023003', 2023, 'Data Science and Analytics', true),
('Sana', 'Shahid', 'sana.shahid@student.itu.edu.pk', '$2b$10$hash_here', 'student', 'PHD2022001', 2022, 'Human-Computer Interaction', true),
('Tariq', 'Hussain', 'tariq.hussain@student.itu.edu.pk', '$2b$10$hash_here', 'student', 'PHD2022002', 2022, 'Distributed Systems', true),
('Nadia', 'Iqbal', 'nadia.iqbal@student.itu.edu.pk', '$2b$10$hash_here', 'student', 'PHD2022003', 2022, 'Natural Language Processing', true)
ON CONFLICT (email) DO NOTHING;

-- Insert student workflow progress
INSERT INTO student_workflow_progress (student_id, current_stage, semester, academic_year, stage_start_date, is_stage_completed) VALUES
-- 2024 students (new students)
((SELECT id FROM users WHERE email = 'ahmad.raza@student.itu.edu.pk'), 'supervision_consent', 1, '2024-2025', CURRENT_TIMESTAMP - INTERVAL '30 days', false),
((SELECT id FROM users WHERE email = 'ayesha.siddique@student.itu.edu.pk'), 'supervision_consent', 1, '2024-2025', CURRENT_TIMESTAMP - INTERVAL '25 days', false),

-- 2023 students (mid-stage)
((SELECT id FROM users WHERE email = 'hassan.ali@student.itu.edu.pk'), 'course_registration', 3, '2023-2024', CURRENT_TIMESTAMP - INTERVAL '45 days', false),
((SELECT id FROM users WHERE email = 'zara.ahmed@student.itu.edu.pk'), 'gec_formation', 3, '2023-2024', CURRENT_TIMESTAMP - INTERVAL '20 days', false),
((SELECT id FROM users WHERE email = 'usman.khan@student.itu.edu.pk'), 'comprehensive_exam', 4, '2023-2024', CURRENT_TIMESTAMP - INTERVAL '60 days', false),

-- 2022 students (advanced stages)
((SELECT id FROM users WHERE email = 'sana.shahid@student.itu.edu.pk'), 'synopsis_defense', 5, '2022-2023', CURRENT_TIMESTAMP - INTERVAL '15 days', false),
((SELECT id FROM users WHERE email = 'tariq.hussain@student.itu.edu.pk'), 'thesis_writing', 6, '2022-2023', CURRENT_TIMESTAMP - INTERVAL '90 days', false),
((SELECT id FROM users WHERE email = 'nadia.iqbal@student.itu.edu.pk'), 'thesis_evaluation', 7, '2022-2023', CURRENT_TIMESTAMP - INTERVAL '40 days', false)
ON CONFLICT (student_id) DO UPDATE SET
    current_stage = EXCLUDED.current_stage,
    semester = EXCLUDED.semester,
    academic_year = EXCLUDED.academic_year,
    stage_start_date = EXCLUDED.stage_start_date,
    is_stage_completed = EXCLUDED.is_stage_completed;

-- Insert sample form submissions
INSERT INTO form_submissions (user_id, form_type_id, form_data, status, workflow_stage, submitted_at, admin_approval_status, supervisor_approval_status) VALUES
-- Recent submissions
((SELECT id FROM users WHERE email = 'ahmad.raza@student.itu.edu.pk'), 
 (SELECT id FROM form_types WHERE form_code = 'PHDEE02-A'), 
 '{"studentName": "Ahmad Raza", "supervisorName": "Dr. Sarah Ahmad", "researchArea": "Machine Learning"}', 
 'submitted', 'supervision_consent', CURRENT_TIMESTAMP - INTERVAL '5 days', 'pending', 'pending'),

((SELECT id FROM users WHERE email = 'ayesha.siddique@student.itu.edu.pk'), 
 (SELECT id FROM form_types WHERE form_code = 'PHDEE02-A'), 
 '{"studentName": "Ayesha Siddique", "supervisorName": "Dr. Fatima Khan", "researchArea": "Computer Vision"}', 
 'submitted', 'supervision_consent', CURRENT_TIMESTAMP - INTERVAL '3 days', 'pending', 'approved'),

-- Approved submissions
((SELECT id FROM users WHERE email = 'hassan.ali@student.itu.edu.pk'), 
 (SELECT id FROM form_types WHERE form_code = 'PHDEE02-A'), 
 '{"studentName": "Hassan Ali", "supervisorName": "Dr. Ali Hassan", "researchArea": "Software Engineering"}', 
 'approved', 'supervision_consent', CURRENT_TIMESTAMP - INTERVAL '60 days', 'approved', 'approved'),

((SELECT id FROM users WHERE email = 'zara.ahmed@student.itu.edu.pk'), 
 (SELECT id FROM form_types WHERE form_code = 'PHDEE02-A'), 
 '{"studentName": "Zara Ahmed", "supervisorName": "Dr. Ahmed Malik", "researchArea": "Cybersecurity"}', 
 'approved', 'supervision_consent', CURRENT_TIMESTAMP - INTERVAL '50 days', 'approved', 'approved'),

((SELECT id FROM users WHERE email = 'usman.khan@student.itu.edu.pk'), 
 (SELECT id FROM form_types WHERE form_code = 'PHDEE02-A'),
 '{"studentName": "Usman Khan", "supervisorName": "Dr. Sarah Ahmad", "researchArea": "Data Science"}', 
 'approved', 'supervision_consent', CURRENT_TIMESTAMP - INTERVAL '70 days', 'approved', 'approved'),

-- Course registration forms
((SELECT id FROM users WHERE email = 'hassan.ali@student.itu.edu.pk'), 
 (SELECT id FROM form_types WHERE form_code = 'PHDEE02-B'), 
 '{"courses": ["CS701", "CS702", "CS703"], "semester": 3, "academicYear": "2023-2024"}', 
 'approved', 'course_registration', CURRENT_TIMESTAMP - INTERVAL '45 days', 'approved', 'approved'),

((SELECT id FROM users WHERE email = 'zara.ahmed@student.itu.edu.pk'), 
 (SELECT id FROM form_types WHERE form_code = 'PHDEE02-B'), 
 '{"courses": ["CS704", "CS705", "CS706"], "semester": 3, "academicYear": "2023-2024"}', 
 'approved', 'course_registration', CURRENT_TIMESTAMP - INTERVAL '40 days', 'approved', 'approved'),

-- GEC formation forms
((SELECT id FROM users WHERE email = 'zara.ahmed@student.itu.edu.pk'), 
 (SELECT id FROM form_types WHERE form_code = 'PHDEE02-C'),
 '{"chairperson": "Dr. Ahmed Malik", "members": ["Dr. Sarah Ahmad", "Dr. Ali Hassan"]}', 
 'approved', 'gec_formation', CURRENT_TIMESTAMP - INTERVAL '25 days', 'approved', 'approved');

-- Insert sample supervisor consent forms
INSERT INTO supervisor_consent_forms (form_submission_id, supervisor_id, student_user_id, supervisor_name, supervisor_designation, area_of_research, contact_no, email, supervisor_consent, status) VALUES
((SELECT id FROM form_submissions WHERE user_id = (SELECT id FROM users WHERE email = 'hassan.ali@student.itu.edu.pk') AND form_type_id = (SELECT id FROM form_types WHERE form_code = 'PHDEE02-A')),
 (SELECT id FROM users WHERE email = 'ali.hassan@itu.edu.pk'),
 (SELECT id FROM users WHERE email = 'hassan.ali@student.itu.edu.pk'),
 'Dr. Ali Hassan', 'Associate Professor', 'Software Engineering and Testing', '+92-300-1234567', 'ali.hassan@itu.edu.pk', true, 'approved'),

((SELECT id FROM form_submissions WHERE user_id = (SELECT id FROM users WHERE email = 'zara.ahmed@student.itu.edu.pk') AND form_type_id = (SELECT id FROM form_types WHERE form_code = 'PHDEE02-A')),
 (SELECT id FROM users WHERE email = 'ahmed.malik@itu.edu.pk'),
 (SELECT id FROM users WHERE email = 'zara.ahmed@student.itu.edu.pk'),
 'Dr. Ahmed Malik', 'Assistant Professor', 'Cybersecurity and Network Security', '+92-300-2345678', 'ahmed.malik@itu.edu.pk', true, 'approved'),

((SELECT id FROM form_submissions WHERE user_id = (SELECT id FROM users WHERE email = 'usman.khan@student.itu.edu.pk') AND form_type_id = (SELECT id FROM form_types WHERE form_code = 'PHDEE02-A')),
 (SELECT id FROM users WHERE email = 'sarah.ahmad@itu.edu.pk'),
 (SELECT id FROM users WHERE email = 'usman.khan@student.itu.edu.pk'),
 'Dr. Sarah Ahmad', 'Professor', 'Data Science and Analytics', '+92-300-3456789', 'sarah.ahmad@itu.edu.pk', true, 'approved');

-- Insert sample comprehensive exams
INSERT INTO comprehensive_exams (student_user_id, committee_id, exam_date, exam_status, overall_result, attempt_number) VALUES
((SELECT id FROM users WHERE email = 'usman.khan@student.itu.edu.pk'), 1, CURRENT_DATE + INTERVAL '15 days', 'scheduled', null, 1);

-- Insert sample thesis defenses
INSERT INTO thesis_defenses (student_user_id, defense_type, scheduled_date, defense_status, overall_result) VALUES
((SELECT id FROM users WHERE email = 'sana.shahid@student.itu.edu.pk'), 'synopsis', CURRENT_DATE + INTERVAL '20 days', 'scheduled', null),
((SELECT id FROM users WHERE email = 'nadia.iqbal@student.itu.edu.pk'), 'in_house', CURRENT_DATE + INTERVAL '30 days', 'scheduled', null);

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, notification_type, is_read, action_required) VALUES
((SELECT id FROM users WHERE email = 'ahmad.raza@student.itu.edu.pk'), 'Form Submitted', 'Your supervisor consent form has been submitted for review.', 'info', false, false),
((SELECT id FROM users WHERE email = 'ayesha.siddique@student.itu.edu.pk'), 'Supervisor Approved', 'Your supervisor has approved your consent form.', 'success', false, false),
((SELECT id FROM users WHERE email = 'hassan.ali@student.itu.edu.pk'), 'Course Registration Due', 'Please complete your course registration for the next semester.', 'warning', false, true),
((SELECT id FROM users WHERE email = 'zara.ahmed@student.itu.edu.pk'), 'GEC Formation Complete', 'Your Graduate Evaluation Committee has been formed successfully.', 'success', true, false),
((SELECT id FROM users WHERE email = 'usman.khan@student.itu.edu.pk'), 'Comprehensive Exam Scheduled', 'Your comprehensive exam has been scheduled for next month.', 'info', false, true),
((SELECT id FROM users WHERE email = 'admin@itu.edu.pk'), 'New Form Submission', 'A new supervisor consent form requires your approval.', 'warning', false, true),
((SELECT id FROM users WHERE email = 'sarah.ahmad@itu.edu.pk'), 'Student Progress Update', 'Your student Ahmad Raza has submitted a new form.', 'info', false, false);

-- Insert sample GEC committees
INSERT INTO gec_committees (student_user_id, committee_formed_date, is_active) VALUES
((SELECT id FROM users WHERE email = 'zara.ahmed@student.itu.edu.pk'), CURRENT_DATE - INTERVAL '25 days', true),
((SELECT id FROM users WHERE email = 'usman.khan@student.itu.edu.pk'), CURRENT_DATE - INTERVAL '35 days', true),
((SELECT id FROM users WHERE email = 'sana.shahid@student.itu.edu.pk'), CURRENT_DATE - INTERVAL '45 days', true);

-- Insert GEC committee members
INSERT INTO gec_committee_members (committee_id, member_id, member_name, member_designation, member_institution, member_email, member_role, is_external) VALUES
-- Committee for Zara Ahmed
(1, (SELECT id FROM users WHERE email = 'ahmed.malik@itu.edu.pk'), 'Dr. Ahmed Malik', 'Assistant Professor', 'Information Technology University', 'ahmed.malik@itu.edu.pk', 'chairperson', false),
(1, (SELECT id FROM users WHERE email = 'sarah.ahmad@itu.edu.pk'), 'Dr. Sarah Ahmad', 'Professor', 'Information Technology University', 'sarah.ahmad@itu.edu.pk', 'internal_member', false),
(1, NULL, 'Dr. External Expert', 'Professor', 'University of Punjab', 'external@pu.edu.pk', 'external_member', true),

-- Committee for Usman Khan
(2, (SELECT id FROM users WHERE email = 'sarah.ahmad@itu.edu.pk'), 'Dr. Sarah Ahmad', 'Professor', 'Information Technology University', 'sarah.ahmad@itu.edu.pk', 'chairperson', false),
(2, (SELECT id FROM users WHERE email = 'ali.hassan@itu.edu.pk'), 'Dr. Ali Hassan', 'Associate Professor', 'Information Technology University', 'ali.hassan@itu.edu.pk', 'internal_member', false),
(2, NULL, 'Dr. Data Expert', 'Professor', 'LUMS', 'dataexpert@lums.edu.pk', 'external_member', true);

-- Update admin statistics cache
INSERT INTO admin_statistics (stat_name, stat_value) VALUES
('dashboard_last_updated', '{"timestamp": "' || CURRENT_TIMESTAMP || '"}'),
('total_users', '{"count": ' || (SELECT COUNT(*) FROM users) || '}'),
('active_students', '{"count": ' || (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_active = true) || '}'),
('active_supervisors', '{"count": ' || (SELECT COUNT(*) FROM users WHERE role = 'supervisor' AND is_active = true) || '}'),
('pending_submissions', '{"count": ' || (SELECT COUNT(*) FROM form_submissions WHERE admin_approval_status = 'pending') || '}')
ON CONFLICT (stat_name) DO UPDATE SET
    stat_value = EXCLUDED.stat_value,
    calculated_at = CURRENT_TIMESTAMP;

-- Add some comments for documentation
COMMENT ON TABLE users IS 'Sample users including admin, supervisors, and students';
COMMENT ON TABLE student_workflow_progress IS 'Sample workflow progress for students at different stages';
COMMENT ON TABLE form_submissions IS 'Sample form submissions with various statuses';
COMMENT ON TABLE supervisor_consent_forms IS 'Sample supervisor consent forms';
COMMENT ON TABLE notifications IS 'Sample notifications for different user types';
COMMENT ON TABLE gec_committees IS 'Sample Graduate Evaluation Committees';
COMMENT ON TABLE comprehensive_exams IS 'Sample comprehensive exam schedules';
COMMENT ON TABLE thesis_defenses IS 'Sample thesis defense schedules';

-- Display summary of inserted data
SELECT 
    'Users' as table_name, 
    COUNT(*) as record_count 
FROM users
UNION ALL
SELECT 
    'Student Workflow Progress' as table_name, 
    COUNT(*) as record_count 
FROM student_workflow_progress
UNION ALL
SELECT 
    'Form Submissions' as table_name, 
    COUNT(*) as record_count 
FROM form_submissions
UNION ALL
SELECT 
    'Supervisor Consent Forms' as table_name, 
    COUNT(*) as record_count 
FROM supervisor_consent_forms
UNION ALL
SELECT 
    'Notifications' as table_name, 
    COUNT(*) as record_count 
FROM notifications
UNION ALL
SELECT 
    'GEC Committees' as table_name, 
    COUNT(*) as record_count 
FROM gec_committees
UNION ALL
SELECT 
    'Comprehensive Exams' as table_name, 
    COUNT(*) as record_count 
FROM comprehensive_exams
UNION ALL
SELECT 
    'Thesis Defenses' as table_name, 
    COUNT(*) as record_count 
FROM thesis_defenses;

-- Success message
SELECT 'Sample data has been successfully inserted!' as message; 