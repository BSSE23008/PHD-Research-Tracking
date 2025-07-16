-- Sample data for PhD Research Tracking System
-- Run this after running the main schema.sql to populate the database with test data

-- Clear existing data (optional)
-- DELETE FROM users;

-- Insert sample users
INSERT INTO users (first_name, last_name, email, password_hash, role, student_id, enrollment_year, research_area, is_active, created_at) VALUES
('John', 'Doe', 'john.doe@university.edu', '$2b$12$5f8QWKZCNGzP5jF2CpAhYejxGgJfhLVbBD7qIgqLOhbQKjWZSvKUG', 'student', 'PHD2024001', 2024, 'Machine Learning', true, NOW()),
('Jane', 'Smith', 'jane.smith@university.edu', '$2b$12$5f8QWKZCNGzP5jF2CpAhYejxGgJfhLVbBD7qIgqLOhbQKjWZSvKUG', 'student', 'PHD2024002', 2024, 'Data Science', true, NOW()),
('Mike', 'Johnson', 'mike.johnson@university.edu', '$2b$12$5f8QWKZCNGzP5jF2CpAhYejxGgJfhLVbBD7qIgqLOhbQKjWZSvKUG', 'student', 'PHD2023001', 2023, 'Computer Vision', true, NOW()),
('Sarah', 'Williams', 'sarah.williams@university.edu', '$2b$12$5f8QWKZCNGzP5jF2CpAhYejxGgJfhLVbBD7qIgqLOhbQKjWZSvKUG', 'student', 'PHD2023002', 2023, 'Natural Language Processing', true, NOW()),
('David', 'Brown', 'david.brown@university.edu', '$2b$12$5f8QWKZCNGzP5jF2CpAhYejxGgJfhLVbBD7qIgqLOhbQKjWZSvKUG', 'student', 'PHD2022001', 2022, 'Robotics', true, NOW());

-- Insert sample supervisors
INSERT INTO users (first_name, last_name, email, password_hash, role, title, department, institution, office_location, research_interests, max_students, is_active, created_at) VALUES
('Dr. Robert', 'Wilson', 'robert.wilson@university.edu', '$2b$12$5f8QWKZCNGzP5jF2CpAhYejxGgJfhLVbBD7qIgqLOhbQKjWZSvKUG', 'supervisor', 'Professor', 'Computer Science', 'Information Technology University', 'Room 301, CS Building', 'Machine Learning, Deep Learning, Computer Vision', 8, true, NOW()),
('Dr. Maria', 'Garcia', 'maria.garcia@university.edu', '$2b$12$5f8QWKZCNGzP5jF2CpAhYejxGgJfhLVbBD7qIgqLOhbQKjWZSvKUG', 'supervisor', 'Associate Professor', 'Computer Science', 'Information Technology University', 'Room 205, CS Building', 'Data Science, Natural Language Processing, AI Ethics', 6, true, NOW()),
('Dr. Ahmed', 'Hassan', 'ahmed.hassan@university.edu', '$2b$12$5f8QWKZCNGzP5jF2CpAhYejxGgJfhLVbBD7qIgqLOhbQKjWZSvKUG', 'supervisor', 'Professor', 'Computer Science', 'Information Technology University', 'Room 401, CS Building', 'Robotics, IoT, Embedded Systems', 10, true, NOW()),
('Dr. Lisa', 'Chen', 'lisa.chen@university.edu', '$2b$12$5f8QWKZCNGzP5jF2CpAhYejxGgJfhLVbBD7qIgqLOhbQKjWZSvKUG', 'supervisor', 'Assistant Professor', 'Computer Science', 'Information Technology University', 'Room 102, CS Building', 'Software Engineering, Cloud Computing', 5, true, NOW());

-- Insert admin user
INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, created_at) VALUES
('Admin', 'User', 'admin@university.edu', '$2b$12$5f8QWKZCNGzP5jF2CpAhYejxGgJfhLVbBD7qIgqLOhbQKjWZSvKUG', 'admin', true, NOW());

-- Insert sample GEC committee members (external evaluators)
INSERT INTO users (first_name, last_name, email, password_hash, role, title, department, institution, office_location, research_interests, is_active, created_at) VALUES
('Dr. James', 'Anderson', 'james.anderson@external.edu', '$2b$12$5f8QWKZCNGzP5jF2CpAhYejxGgJfhLVbBD7qIgqLOhbQKjWZSvKUG', 'supervisor', 'Professor', 'Computer Science', 'External University', 'External Office', 'Machine Learning, AI Research', true, NOW()),
('Dr. Emily', 'Taylor', 'emily.taylor@external.edu', '$2b$12$5f8QWKZCNGzP5jF2CpAhYejxGgJfhLVbBD7qIgqLOhbQKjWZSvKUG', 'supervisor', 'Associate Professor', 'Data Science', 'External University', 'External Office', 'Data Analytics, Statistics', true, NOW());

-- Note: All users have the same password hash for testing purposes
-- The actual password is: "TestPassword123!"
-- In production, each user should have a unique, secure password

-- Optional: Add some form types if they don't exist
INSERT INTO form_types (form_code, form_name, description, workflow_stage, is_active, created_at) VALUES
('PHDEE02-A', 'Supervisor Consent Form', 'Form for obtaining supervisor consent for PhD research', 'supervision_consent', true, NOW()),
('PHDEE02-C', 'GEC Formation Form', 'Form for Graduate Examination Committee formation', 'gec_formation', true, NOW()),
('PHDEE03', 'Comprehensive Examination Request Form', 'Form to request comprehensive examination', 'comprehensive_exam', true, NOW()),
('PHDEE04-A', 'Synopsis Defense Request Form', 'Form to request synopsis defense', 'synopsis_defense', true, NOW()),
('PHDEE05-A', 'Thesis Defense Request Form', 'Form to request thesis defense', 'thesis_defense', true, NOW())
ON CONFLICT (form_code) DO NOTHING;

-- Add sample workflow progress for students
INSERT INTO student_workflow_progress (student_id, current_stage, semester, academic_year, stage_start_date, is_active, created_at) VALUES
((SELECT id FROM users WHERE email = 'john.doe@university.edu'), 'supervision_consent', 'Fall', '2024-2025', NOW() - INTERVAL '30 days', true, NOW()),
((SELECT id FROM users WHERE email = 'jane.smith@university.edu'), 'gec_formation', 'Fall', '2024-2025', NOW() - INTERVAL '60 days', true, NOW()),
((SELECT id FROM users WHERE email = 'mike.johnson@university.edu'), 'comprehensive_exam', 'Fall', '2024-2025', NOW() - INTERVAL '90 days', true, NOW()),
((SELECT id FROM users WHERE email = 'sarah.williams@university.edu'), 'thesis_writing', 'Fall', '2024-2025', NOW() - INTERVAL '120 days', true, NOW()),
((SELECT id FROM users WHERE email = 'david.brown@university.edu'), 'thesis_defense', 'Fall', '2024-2025', NOW() - INTERVAL '150 days', true, NOW())
ON CONFLICT (student_id) DO NOTHING;

-- Add sample form submissions for testing approvals
INSERT INTO form_submissions (user_id, form_type_id, form_data, status, admin_approval_status, supervisor_approval_status, submitted_at, created_at) VALUES
((SELECT id FROM users WHERE email = 'john.doe@university.edu'), 
 (SELECT id FROM form_types WHERE form_code = 'PHDEE02-A'),
 '{"studentName": "John Doe", "studentId": "PHD2024001", "supervisorName": "Dr. Robert Wilson"}',
 'submitted', 'pending', 'approved', NOW() - INTERVAL '1 day', NOW()),
((SELECT id FROM users WHERE email = 'jane.smith@university.edu'), 
 (SELECT id FROM form_types WHERE form_code = 'PHDEE02-C'),
 '{"studentName": "Jane Smith", "studentId": "PHD2024002", "supervisorName": "Dr. Maria Garcia"}',
 'submitted', 'pending', 'approved', NOW() - INTERVAL '2 days', NOW()),
((SELECT id FROM users WHERE email = 'mike.johnson@university.edu'), 
 (SELECT id FROM form_types WHERE form_code = 'PHDEE03'),
 '{"studentName": "Mike Johnson", "studentId": "PHD2023001", "supervisorName": "Dr. Ahmed Hassan"}',
 'submitted', 'pending', 'approved', NOW() - INTERVAL '3 days', NOW());

-- Add sample comprehensive exams
INSERT INTO comprehensive_exams (student_id, committee_id, exam_status, exam_date, exam_result, created_at) VALUES
((SELECT id FROM users WHERE email = 'mike.johnson@university.edu'), 1, 'scheduled', NOW() + INTERVAL '7 days', NULL, NOW()),
((SELECT id FROM users WHERE email = 'sarah.williams@university.edu'), 2, 'completed', NOW() - INTERVAL '30 days', 'pass', NOW());

-- Add sample thesis defenses
INSERT INTO thesis_defenses (student_id, defense_type, defense_status, scheduled_date, thesis_title, created_at) VALUES
((SELECT id FROM users WHERE email = 'david.brown@university.edu'), 'synopsis', 'scheduled', NOW() + INTERVAL '14 days', 'Advanced Robotics in Healthcare Applications', NOW()),
((SELECT id FROM users WHERE email = 'sarah.williams@university.edu'), 'final', 'completed', NOW() - INTERVAL '45 days', 'Natural Language Processing for Social Media Analysis', NOW());

-- Add sample notifications
INSERT INTO notifications (user_id, title, message, notification_type, is_read, created_at) VALUES
((SELECT id FROM users WHERE email = 'john.doe@university.edu'), 'Form Approved', 'Your Supervisor Consent Form has been approved', 'success', false, NOW()),
((SELECT id FROM users WHERE email = 'jane.smith@university.edu'), 'GEC Formation Required', 'Please submit your GEC Formation Form', 'info', false, NOW()),
((SELECT id FROM users WHERE email = 'mike.johnson@university.edu'), 'Exam Scheduled', 'Your comprehensive exam has been scheduled', 'info', true, NOW()),
((SELECT id FROM users WHERE email = 'admin@university.edu'), 'New Form Submission', 'A new form submission requires your review', 'info', false, NOW()),
((SELECT id FROM users WHERE email = 'admin@university.edu'), 'System Update', 'System maintenance completed successfully', 'success', true, NOW());

-- The password for all test users is: "TestPassword123!"
-- You can use this to log in as any of the users for testing purposes 