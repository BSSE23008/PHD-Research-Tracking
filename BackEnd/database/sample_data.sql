-- 1. Insert Departments
INSERT INTO departments (dept_code, dept_name, dept_full_name) VALUES
('CS', 'Computer Science', 'Department of Computer Science'),
('EE', 'Electrical Engineering', 'Department of Electrical Engineering'),
('SE', 'Software Engineering', 'Department of Software Engineering'),
('AI', 'Artificial Intelligence', 'Department of Artificial Intelligence')
ON CONFLICT (dept_code) DO NOTHING;

-- 2. Insert Faculty Members
INSERT INTO faculty (
    faculty_id, first_name, last_name, email, title, designation, department_id,
    office_location, contact_no, research_interests, qualification, experience_years,
    max_phd_students, max_ms_students, hec_approved
) VALUES
-- CS Department
('CS101', 'John', 'Smith', 'john.smith@itu.edu', 'Prof.', 'Professor', 
 (SELECT id FROM departments WHERE dept_code = 'CS'),
 'CS-101', '+923001234567', 'Machine Learning, Data Mining', 'PhD in Computer Science', 15, 8, 12, true),
 
('CS102', 'Sarah', 'Johnson', 'sarah.johnson@itu.edu', 'Dr.', 'Associate Professor', 
 (SELECT id FROM departments WHERE dept_code = 'CS'),
 'CS-102', '+923001234568', 'Computer Vision, Pattern Recognition', 'PhD in Computer Vision', 10, 6, 10, true),
 
-- EE Department
('EE101', 'Michael', 'Brown', 'michael.brown@itu.edu', 'Prof.', 'Professor', 
 (SELECT id FROM departments WHERE dept_code = 'EE'),
 'EE-201', '+923001234569', 'Power Systems, Renewable Energy', 'PhD in Electrical Engineering', 20, 8, 12, true),
 
('EE102', 'Emily', 'Davis', 'emily.davis@itu.edu', 'Dr.', 'Assistant Professor', 
 (SELECT id FROM departments WHERE dept_code = 'EE'),
 'EE-202', '+923001234570', 'Signal Processing, IoT', 'PhD in Signal Processing', 5, 4, 8, true),
 
-- SE Department
('SE101', 'Robert', 'Wilson', 'robert.wilson@itu.edu', 'Prof.', 'Professor', 
 (SELECT id FROM departments WHERE dept_code = 'SE'),
 'SE-301', '+923001234571', 'Software Architecture, DevOps', 'PhD in Software Engineering', 12, 6, 10, true),
 
-- AI Department
('AI101', 'Jennifer', 'Lee', 'jennifer.lee@itu.edu', 'Dr.', 'Associate Professor', 
 (SELECT id FROM departments WHERE dept_code = 'AI'),
 'AI-401', '+923001234572', 'Deep Learning, NLP', 'PhD in Artificial Intelligence', 8, 5, 8, true)
ON CONFLICT (email) DO NOTHING;

-- 3. Assign Faculty Roles
INSERT INTO faculty_roles (faculty_id, role, department_id, assigned_by) VALUES
-- Assign HODs
((SELECT id FROM faculty WHERE email = 'john.smith@itu.edu'), 'hod', (SELECT id FROM departments WHERE dept_code = 'CS'), 1),
((SELECT id FROM faculty WHERE email = 'michael.brown@itu.edu'), 'hod', (SELECT id FROM departments WHERE dept_code = 'EE'), 1),
((SELECT id FROM faculty WHERE email = 'robert.wilson@itu.edu'), 'hod', (SELECT id FROM departments WHERE dept_code = 'SE'), 1),
((SELECT id FROM faculty WHERE email = 'jennifer.lee@itu.edu'), 'hod', (SELECT id FROM departments WHERE dept_code = 'AI'), 1),

-- Assign Chairperson (using CS HOD as example)
((SELECT id FROM faculty WHERE email = 'john.smith@itu.edu'), 'chairperson', NULL, 1),

-- Assign DEC members
((SELECT id FROM faculty WHERE email = 'sarah.johnson@itu.edu'), 'dec_member', NULL, 1),
((SELECT id FROM faculty WHERE email = 'emily.davis@itu.edu'), 'dec_member', NULL, 1);

-- 4. Insert Admin User
INSERT INTO users (
    first_name, last_name, email, password_hash, role, admin_code, admin_permissions, is_active
) VALUES (
    'Admin', 'User', 'admin@itu.edu', 
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr7JxW1EzS7gJ5Y5J5p3v6zXo5QJQbK', -- Hash for 'admin123'
    'admin', 'ADMIN001', 
    ARRAY['manage_users', 'manage_forms', 'approve_requests', 'view_reports'], 
    true
)
ON CONFLICT (email) DO NOTHING;

-- 5. Insert Sample Students
INSERT INTO users (
    first_name, last_name, email, password_hash, role, student_id, department_id,
    enrollment_year, enrollment_date, current_semester, academic_year, research_area,
    primary_supervisor_id, co_supervisor_id, is_active
) VALUES
-- CS PhD Students
('Ali', 'Khan', 'ali.khan@student.itu.edu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr7JxW1EzS7gJ5Y5J5p3v6zXo5QJQbK', 'student', 'CS-PhD-2021-01',
 (SELECT id FROM departments WHERE dept_code = 'CS'), 2021, '2021-09-01', '3rd', '2023-24', 'Machine Learning',
 (SELECT id FROM faculty WHERE email = 'john.smith@itu.edu'),
 (SELECT id FROM faculty WHERE email = 'sarah.johnson@itu.edu'), true),
 
('Sara', 'Ahmed', 'sara.ahmed@student.itu.edu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr7JxW1EzS7gJ5Y5J5p3v6zXo5QJQbK', 'student', 'CS-PhD-2022-02',
 (SELECT id FROM departments WHERE dept_code = 'CS'), 2022, '2022-09-01', '2nd', '2023-24', 'Computer Vision',
 (SELECT id FROM faculty WHERE email = 'sarah.johnson@itu.edu'), NULL, true),
 
-- EE PhD Students
('Usman', 'Malik', 'usman.malik@student.itu.edu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr7JxW1EzS7gJ5Y5J5p3v6zXo5QJQbK', 'student', 'EE-PhD-2020-01',
 (SELECT id FROM departments WHERE dept_code = 'EE'), 2020, '2020-09-01', '5th', '2023-24', 'Power Systems',
 (SELECT id FROM faculty WHERE email = 'michael.brown@itu.edu'),
 (SELECT id FROM faculty WHERE email = 'emily.davis@itu.edu'), true),
 
-- AI PhD Students
('Fatima', 'Raza', 'fatima.raza@student.itu.edu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr7JxW1EzS7gJ5Y5J5p3v6zXo5QJQbK', 'student', 'AI-PhD-2023-01',
 (SELECT id FROM departments WHERE dept_code = 'AI'), 2023, '2023-09-01', '1st', '2023-24', 'Natural Language Processing',
 (SELECT id FROM faculty WHERE email = 'jennifer.lee@itu.edu'), NULL, true)
ON CONFLICT (email) DO NOTHING;

-- 6. Insert Student Workflow Progress
INSERT INTO student_workflow_progress (
    student_id, current_stage, current_semester, academic_year,
    stage_start_date, is_stage_completed, total_forms_submitted, total_forms_approved
) VALUES
-- Ali Khan (CS PhD, 3rd semester)
((SELECT id FROM users WHERE email = 'ali.khan@student.itu.edu'), 
 'research_candidacy', '3rd', '2023-24', '2023-01-15', false, 5, 4),

-- Sara Ahmed (CS PhD, 2nd semester)
((SELECT id FROM users WHERE email = 'sara.ahmed@student.itu.edu'), 
 'course_registration', '2nd', '2023-24', '2023-09-01', false, 2, 2),

-- Usman Malik (EE PhD, 5th semester)
((SELECT id FROM users WHERE email = 'usman.malik@student.itu.edu'), 
 'thesis_writing', '5th', '2023-24', '2023-06-01', false, 8, 7),

-- Fatima Raza (AI PhD, 1st semester)
((SELECT id FROM users WHERE email = 'fatima.raza@student.itu.edu'), 
 'supervision_consent', '1st', '2023-24', '2023-09-01', false, 1, 0)
ON CONFLICT (student_id) DO NOTHING;

-- 7. Insert Sample Form Submissions
-- Supervisor Consent Form for Fatima Raza
INSERT INTO form_submissions (
    user_id, form_type_id, form_data, status, workflow_stage, semester, academic_year,
    supervisor_approval_status, supervisor_approved_by, supervisor_approved_at,
    hod_approval_status, hod_approved_by, hod_approved_at,
    chairperson_approval_status, chairperson_approved_by, chairperson_approved_at
) VALUES (
    (SELECT id FROM users WHERE email = 'fatima.raza@student.itu.edu'),
    (SELECT id FROM form_types WHERE form_code = 'PHDEE02-A'),
    '{
        "supervisor_agreement": true,
        "student_agreement": true,
        "research_topic": "Advanced Techniques in Natural Language Processing",
        "meeting_schedule": "Bi-weekly on Fridays",
        "expectations": "2 conference papers in first year"
    }',
    'submitted',
    'supervision_consent',
    '1st',
    '2023-24',
    'pending',
    NULL,
    NULL,
    'pending',
    NULL,
    NULL,
    'pending',
    NULL,
    NULL
);

-- Course Registration Form for Sara Ahmed
INSERT INTO form_submissions (
    user_id, form_type_id, form_data, status, workflow_stage, semester, academic_year,
    dec_approval_status, dec_approved_by, dec_approved_at,
    supervisor_approval_status, supervisor_approved_by, supervisor_approved_at,
    hod_approval_status, hod_approved_by, hod_approved_at
) VALUES (
    (SELECT id FROM users WHERE email = 'sara.ahmed@student.itu.edu'),
    (SELECT id FROM form_types WHERE form_code = 'PHDEE02-B'),
    '{
        "courses": [
            {"code": "CS701", "title": "Advanced Computer Vision", "credits": 3},
            {"code": "CS702", "title": "Research Methods", "credits": 3}
        ],
        "total_credits": 6,
        "semester": "Fall 2023"
    }',
    'approved',
    'course_registration',
    '2nd',
    '2023-24',
    'approved',
    (SELECT id FROM faculty WHERE email = 'sarah.johnson@itu.edu'),
    '2023-09-10 14:30:00+05',
    'approved',
    (SELECT id FROM faculty WHERE email = 'sarah.johnson@itu.edu'),
    '2023-09-08 11:15:00+05',
    'approved',
    (SELECT id FROM faculty WHERE email = 'john.smith@itu.edu'),
    '2023-09-12 10:00:00+05'
);

-- Research Proposal Submission for Ali Khan
INSERT INTO form_submissions (
    user_id, form_type_id, form_data, status, workflow_stage, semester, academic_year,
    dec_approval_status, dec_approved_by, dec_approved_at,
    supervisor_approval_status, supervisor_approved_by, supervisor_approved_at,
    gec_approval_status, gec_approved_by, gec_approved_at,
    hod_approval_status, hod_approved_by, hod_approved_at,
    chairperson_approval_status, chairperson_approved_by, chairperson_approved_at
) VALUES (
    (SELECT id FROM users WHERE email = 'ali.khan@student.itu.edu'),
    (SELECT id FROM form_types WHERE form_code = 'PHDEE-RP-001'),
    '{
        "title": "Explainable AI for Medical Diagnosis Systems",
        "objectives": ["Develop XAI techniques", "Apply to medical imaging", "Evaluate effectiveness"],
        "literature_review": "Comprehensive review of 50+ papers...",
        "methodology": "Combination of deep learning and rule-based systems...",
        "timeline": {
            "year1": "Literature review, preliminary models",
            "year2": "XAI development",
            "year3": "Medical application and evaluation"
        }
    }',
    'under_review',
    'research_candidacy',
    '3rd',
    '2023-24',
    'approved',
    (SELECT id FROM faculty WHERE email = 'sarah.johnson@itu.edu'),
    '2023-03-01 16:20:00+05',
    'approved',
    (SELECT id FROM faculty WHERE email = 'john.smith@itu.edu'),
    '2023-02-28 10:15:00+05',
    'pending',
    NULL,
    NULL,
    'approved',
    (SELECT id FROM faculty WHERE email = 'john.smith@itu.edu'),
    '2023-03-05 11:30:00+05',
    'pending',
    NULL,
    NULL
);

-- 8. Insert GEC Committees
-- GEC for Ali Khan
WITH new_gec AS (
    INSERT INTO gec_committees (
        student_user_id, committee_formed_date, formed_by, approved_by, approval_date
    ) VALUES (
        (SELECT id FROM users WHERE email = 'ali.khan@student.itu.edu'),
        '2023-01-10',
        (SELECT id FROM faculty WHERE email = 'john.smith@itu.edu'),
        (SELECT id FROM faculty WHERE email = 'john.smith@itu.edu'),
        '2023-01-15'
    ) RETURNING id
)
INSERT INTO gec_committee_members (
    committee_id, faculty_id, member_role, is_external, added_by
) VALUES
((SELECT id FROM new_gec), (SELECT id FROM faculty WHERE email = 'john.smith@itu.edu'), 'supervisor', false, 1),
((SELECT id FROM new_gec), (SELECT id FROM faculty WHERE email = 'sarah.johnson@itu.edu'), 'co_supervisor', false, 1),
((SELECT id FROM new_gec), (SELECT id FROM faculty WHERE email = 'jennifer.lee@itu.edu'), 'chairperson', false, 1),
((SELECT id FROM new_gec), (SELECT id FROM faculty WHERE email = 'emily.davis@itu.edu'), 'internal_member', false, 1),
((SELECT id FROM new_gec), NULL, 'external_member', true, 1);

-- GEC for Usman Malik
WITH new_gec AS (
    INSERT INTO gec_committees (
        student_user_id, committee_formed_date, formed_by, approved_by, approval_date
    ) VALUES (
        (SELECT id FROM users WHERE email = 'usman.malik@student.itu.edu'),
        '2022-06-15',
        (SELECT id FROM faculty WHERE email = 'michael.brown@itu.edu'),
        (SELECT id FROM faculty WHERE email = 'michael.brown@itu.edu'),
        '2022-06-20'
    ) RETURNING id
)
INSERT INTO gec_committee_members (
    committee_id, faculty_id, member_role, is_external, external_name, 
    external_designation, external_institution, added_by
) VALUES
((SELECT id FROM new_gec), (SELECT id FROM faculty WHERE email = 'michael.brown@itu.edu'), 'supervisor', false, NULL, NULL, NULL, 1),
((SELECT id FROM new_gec), (SELECT id FROM faculty WHERE email = 'emily.davis@itu.edu'), 'co_supervisor', false, NULL, NULL, NULL, 1),
((SELECT id FROM new_gec), (SELECT id FROM faculty WHERE email = 'robert.wilson@itu.edu'), 'chairperson', false, NULL, NULL, NULL, 1),
((SELECT id FROM new_gec), NULL, 'external_member', true, 'Dr. Ahmed Riaz', 'Professor', 'NUST', 1);

-- 9. Insert Sample Notifications
INSERT INTO notifications (
    recipient_id, recipient_type, title, message, notification_type, priority,
    related_form_id, related_user_id, action_required, action_url
) VALUES
-- Notification to Ali Khan about proposal review
((SELECT id FROM users WHERE email = 'ali.khan@student.itu.edu'), 'student',
 'Research Proposal Under Review',
 'Your research proposal "Explainable AI for Medical Diagnosis Systems" is currently being reviewed by the GEC.',
 'info', 'normal',
 (SELECT id FROM form_submissions WHERE user_id = (SELECT id FROM users WHERE email = 'ali.khan@student.itu.edu') 
  AND form_type_id = (SELECT id FROM form_types WHERE form_code = 'PHDEE-RP-001')),
 (SELECT id FROM users WHERE email = 'ali.khan@student.itu.edu'),
 false, NULL),

-- Notification to supervisor (John Smith) about pending approval
((SELECT id FROM faculty WHERE email = 'john.smith@itu.edu'), 'faculty',
 'Approval Required: Student Supervision Consent',
 'Fatima Raza has submitted a supervision consent form for your approval.',
 'approval_request', 'high',
 (SELECT id FROM form_submissions WHERE user_id = (SELECT id FROM users WHERE email = 'fatima.raza@student.itu.edu') 
  AND form_type_id = (SELECT id FROM form_types WHERE form_code = 'PHDEE02-A')),
 (SELECT id FROM users WHERE email = 'fatima.raza@student.itu.edu'),
 true, '/approvals/pending'),

-- Notification to HOD (John Smith) about pending approval
((SELECT id FROM faculty WHERE email = 'john.smith@itu.edu'), 'faculty',
 'Approval Required: Course Registration',
 'Sara Ahmed has submitted a course registration form for your approval.',
 'approval_request', 'normal',
 (SELECT id FROM form_submissions WHERE user_id = (SELECT id FROM users WHERE email = 'sara.ahmed@student.itu.edu') 
  AND form_type_id = (SELECT id FROM form_types WHERE form_code = 'PHDEE02-B')),
 (SELECT id FROM users WHERE email = 'sara.ahmed@student.itu.edu'),
 true, '/approvals/pending');

-- 10. Insert Sample Form Approval History
INSERT INTO form_approval_history (
    form_submission_id, approval_stage, previous_status, new_status, approved_by, comments
) VALUES
(
    (SELECT id FROM form_submissions WHERE user_id = (SELECT id FROM users WHERE email = 'sara.ahmed@student.itu.edu') 
     AND form_type_id = (SELECT id FROM form_types WHERE form_code = 'PHDEE02-B')),
    'supervisor',
    'pending',
    'approved',
    (SELECT id FROM faculty WHERE email = 'sarah.johnson@itu.edu'),
    'Courses look appropriate for research goals'
),
(
    (SELECT id FROM form_submissions WHERE user_id = (SELECT id FROM users WHERE email = 'sara.ahmed@student.itu.edu') 
     AND form_type_id = (SELECT id FROM form_types WHERE form_code = 'PHDEE02-B')),
    'dec',
    'pending',
    'approved',
    (SELECT id FROM faculty WHERE email = 'sarah.johnson@itu.edu'),
    'Meets all DEC requirements'
),
(
    (SELECT id FROM form_submissions WHERE user_id = (SELECT id FROM users WHERE email = 'sara.ahmed@student.itu.edu') 
     AND form_type_id = (SELECT id FROM form_types WHERE form_code = 'PHDEE02-B')),
    'hod',
    'pending',
    'approved',
    (SELECT id FROM faculty WHERE email = 'john.smith@itu.edu'),
    'Approved as per department guidelines'
);

-- Verification Query
SELECT 'Sample data insertion completed successfully!' as message;