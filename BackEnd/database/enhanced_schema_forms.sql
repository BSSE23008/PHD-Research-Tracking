-- Enhanced PhD Research Tracking System Database Schema
-- Implements comprehensive faculty management and 5-stage approval workflow
-- Run this after the main schema.sql to add all required functionality

-- Create ENUM types for better data integrity
CREATE TYPE form_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'requires_revision');
CREATE TYPE workflow_stage AS ENUM (
    'admission', 'supervision_consent', 'course_registration', 'gec_formation', 
    'comprehensive_exam', 'synopsis_defense', 'research_candidacy', 
    'thesis_writing', 'thesis_evaluation', 'thesis_defense', 'graduation'
);
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'conditional', 'not_required');
CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE faculty_role AS ENUM (
    'supervisor', 'co_supervisor', 'hod', 'chairperson', 'gec_member', 
    'dec_member', 'external_evaluator', 'faculty_member'
);
CREATE TYPE approval_stage AS ENUM ('dec', 'supervisor', 'gec', 'hod', 'chairperson');
CREATE TYPE semester_status AS ENUM ('1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', 'graduated', 'dropped');

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    dept_code VARCHAR(20) UNIQUE NOT NULL,
    dept_name VARCHAR(255) NOT NULL,
    dept_full_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create dedicated faculty table
CREATE TABLE IF NOT EXISTS faculty (
    id SERIAL PRIMARY KEY,
    faculty_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    
    -- Professional Information
    title VARCHAR(100), -- Dr., Prof., etc.
    designation VARCHAR(200), -- Associate Professor, Professor, etc.
    department_id INTEGER REFERENCES departments(id),
    institution VARCHAR(255) DEFAULT 'ITU',
    office_location VARCHAR(255),
    contact_no VARCHAR(50),
    
    -- Academic Information
    research_interests TEXT,
    research_areas TEXT[],
    qualification TEXT,
    experience_years INTEGER,
    
    -- Supervision Capacity
    max_phd_students INTEGER DEFAULT 8,
    max_ms_students INTEGER DEFAULT 12,
    current_phd_students INTEGER DEFAULT 0,
    current_ms_students INTEGER DEFAULT 0,
    
    -- HEC Information
    hec_approved BOOLEAN DEFAULT false,
    hec_approval_ref VARCHAR(100),
    hec_approval_date DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    can_supervise BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create faculty roles assignment table
CREATE TABLE IF NOT EXISTS faculty_roles (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    role faculty_role NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    assigned_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    assigned_by INTEGER, -- Admin who assigned the role
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Updated users table (students and admin only)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    
    -- Student specific fields
    student_id VARCHAR(50) UNIQUE,
    department_id INTEGER REFERENCES departments(id),
    enrollment_year INTEGER,
    enrollment_date DATE,
    current_semester semester_status DEFAULT '1st',
    academic_year VARCHAR(10),
    research_area VARCHAR(255),
    
    -- Student Supervision
    primary_supervisor_id INTEGER REFERENCES faculty(id),
    co_supervisor_id INTEGER REFERENCES faculty(id),
    
    -- Admin specific fields
    admin_code VARCHAR(100),
    admin_permissions TEXT[],
    
    -- Status and tracking
    is_active BOOLEAN DEFAULT true,
    added_by INTEGER, -- Admin who added the user
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for main tables
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users (student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_department ON users (department_id);
CREATE INDEX IF NOT EXISTS idx_faculty_department ON faculty (department_id);
CREATE INDEX IF NOT EXISTS idx_faculty_roles_faculty ON faculty_roles (faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_roles_role ON faculty_roles (role, is_active);

-- Enhanced form types table
CREATE TABLE IF NOT EXISTS form_types (
    id SERIAL PRIMARY KEY,
    form_code VARCHAR(50) UNIQUE NOT NULL,
    form_name VARCHAR(200) NOT NULL,
    description TEXT,
    workflow_stage workflow_stage NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- 5-stage approval configuration
    requires_dec_approval BOOLEAN DEFAULT false,
    requires_supervisor_approval BOOLEAN DEFAULT false,
    requires_gec_approval BOOLEAN DEFAULT false,
    requires_hod_approval BOOLEAN DEFAULT false,
    requires_chairperson_approval BOOLEAN DEFAULT false,
    
    -- Additional configurations
    max_submissions_per_user INTEGER DEFAULT 1,
    prerequisite_forms TEXT[],
    auto_populate_fields JSONB,
    form_schema JSONB,
    document_requirements JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student workflow progress tracking (enhanced)
CREATE TABLE IF NOT EXISTS student_workflow_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_stage workflow_stage NOT NULL DEFAULT 'supervision_consent',
    current_semester semester_status DEFAULT '1st',
    academic_year VARCHAR(10),
    
    -- Timeline tracking
    stage_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expected_completion_date DATE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    is_stage_completed BOOLEAN DEFAULT false,
    
    -- Progress indicators
    total_forms_submitted INTEGER DEFAULT 0,
    total_forms_approved INTEGER DEFAULT 0,
    current_gpa DECIMAL(3,2),
    
    -- Alerts and notifications
    has_pending_actions BOOLEAN DEFAULT false,
    deadline_alerts_sent INTEGER DEFAULT 0,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(student_id)
);

-- Enhanced form submissions with 5-stage approval tracking
CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    form_type_id INTEGER NOT NULL REFERENCES form_types(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    
    -- Basic information
    status form_status DEFAULT 'submitted',
    workflow_stage workflow_stage NOT NULL,
    semester semester_status,
    academic_year VARCHAR(10),
    version INTEGER DEFAULT 1,
    parent_submission_id INTEGER REFERENCES form_submissions(id),
    
    -- Submission tracking
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Stage 1: DEC Approval
    dec_approval_status approval_status DEFAULT 'pending',
    dec_approved_by INTEGER REFERENCES faculty(id),
    dec_approved_at TIMESTAMP WITH TIME ZONE,
    dec_comments TEXT,
    
    -- Stage 2: Supervisor Approval
    supervisor_approval_status approval_status DEFAULT 'pending',
    supervisor_approved_by INTEGER REFERENCES faculty(id),
    supervisor_approved_at TIMESTAMP WITH TIME ZONE,
    supervisor_comments TEXT,
    
    -- Stage 3: GEC Approval
    gec_approval_status approval_status DEFAULT 'pending',
    gec_approved_by INTEGER REFERENCES faculty(id),
    gec_approved_at TIMESTAMP WITH TIME ZONE,
    gec_comments TEXT,
    
    -- Stage 4: HOD Approval
    hod_approval_status approval_status DEFAULT 'pending',
    hod_approved_by INTEGER REFERENCES faculty(id),
    hod_approved_at TIMESTAMP WITH TIME ZONE,
    hod_comments TEXT,
    
    -- Stage 5: Chairperson Approval
    chairperson_approval_status approval_status DEFAULT 'pending',
    chairperson_approved_by INTEGER REFERENCES faculty(id),
    chairperson_approved_at TIMESTAMP WITH TIME ZONE,
    chairperson_comments TEXT,
    
    -- Document tracking
    documents_submitted JSONB,
    documents_verified BOOLEAN DEFAULT false,
    documents_verified_by INTEGER REFERENCES faculty(id),
    documents_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Final approval
    final_approval_status approval_status DEFAULT 'pending',
    final_approved_at TIMESTAMP WITH TIME ZONE
);

-- Create comprehensive indexes for form_submissions
CREATE INDEX IF NOT EXISTS idx_form_submissions_user_type ON form_submissions (user_id, form_type_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions (status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_workflow_stage ON form_submissions (workflow_stage);
CREATE INDEX IF NOT EXISTS idx_form_submissions_dec_approval ON form_submissions (dec_approval_status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_supervisor_approval ON form_submissions (supervisor_approval_status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_gec_approval ON form_submissions (gec_approval_status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_hod_approval ON form_submissions (hod_approval_status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_chairperson_approval ON form_submissions (chairperson_approval_status);

-- Form approval tracking table (for audit trail)
CREATE TABLE IF NOT EXISTS form_approval_history (
    id SERIAL PRIMARY KEY,
    form_submission_id INTEGER NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    approval_stage approval_stage NOT NULL,
    previous_status approval_status,
    new_status approval_status NOT NULL,
    approved_by INTEGER REFERENCES faculty(id),
    comments TEXT,
    action_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Enhanced GEC committees table
CREATE TABLE IF NOT EXISTS gec_committees (
    id SERIAL PRIMARY KEY,
    student_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    committee_formed_date DATE NOT NULL,
    committee_type VARCHAR(50) DEFAULT 'regular',
    is_active BOOLEAN DEFAULT true,
    formed_by INTEGER REFERENCES faculty(id),
    approved_by INTEGER REFERENCES faculty(id),
    approval_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(student_user_id, is_active)
);

-- Enhanced GEC committee members
CREATE TABLE IF NOT EXISTS gec_committee_members (
    id SERIAL PRIMARY KEY,
    committee_id INTEGER NOT NULL REFERENCES gec_committees(id) ON DELETE CASCADE,
    faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
    member_role VARCHAR(50) CHECK (member_role IN ('chairperson', 'supervisor', 'co_supervisor', 'internal_member', 'external_member')),
    is_external BOOLEAN DEFAULT false,
    
    -- External member details (if faculty_id is null)
    external_name VARCHAR(255),
    external_designation VARCHAR(100),
    external_institution VARCHAR(255),
    external_email VARCHAR(255),
    
    added_date DATE DEFAULT CURRENT_DATE,
    added_by INTEGER REFERENCES faculty(id),
    is_active BOOLEAN DEFAULT true
);

-- GEC Committee Change Requests
CREATE TABLE IF NOT EXISTS gec_change_requests (
    id SERIAL PRIMARY KEY,
    student_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_committee_id INTEGER REFERENCES gec_committees(id),
    
    -- Request details
    request_type VARCHAR(50) CHECK (request_type IN ('add_member', 'remove_member', 'replace_member', 'change_chairperson')),
    requested_changes JSONB NOT NULL,
    justification TEXT NOT NULL,
    
    -- Approval workflow
    request_status approval_status DEFAULT 'pending',
    supervisor_approval approval_status DEFAULT 'pending',
    supervisor_approved_by INTEGER REFERENCES faculty(id),
    supervisor_approved_at TIMESTAMP WITH TIME ZONE,
    supervisor_comments TEXT,
    
    admin_approval approval_status DEFAULT 'pending',
    admin_approved_by INTEGER REFERENCES users(id),
    admin_approved_at TIMESTAMP WITH TIME ZONE,
    admin_comments TEXT,
    
    -- Final processing
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by INTEGER REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Form auto-save/progress table
CREATE TABLE IF NOT EXISTS form_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    form_type_id INTEGER NOT NULL REFERENCES form_types(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    step_number INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 1,
    auto_populated_fields JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, form_type_id)
);

-- Document attachments (enhanced)
CREATE TABLE IF NOT EXISTS form_attachments (
    id SERIAL PRIMARY KEY,
    form_submission_id INTEGER NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    upload_type VARCHAR(100),
    
    -- File metadata
    file_hash VARCHAR(64), -- For integrity checking
    mime_type VARCHAR(100),
    
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_by INTEGER REFERENCES faculty(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_comments TEXT
);

-- Comprehensive notifications system
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL, -- Can reference users or faculty
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('student', 'admin', 'faculty')),
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'info' CHECK (notification_type IN ('info', 'warning', 'success', 'error', 'reminder', 'approval_request')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Related objects
    related_form_id INTEGER REFERENCES form_submissions(id) ON DELETE SET NULL,
    related_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action tracking
    action_required BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    action_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create comprehensive indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (recipient_id, recipient_type, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications (priority, created_at DESC);

-- Insert default departments
INSERT INTO departments (dept_code, dept_name, dept_full_name) VALUES
('CS', 'Computer Science', 'Department of Computer Science'),
('EE', 'Electrical Engineering', 'Department of Electrical Engineering'),
('SE', 'Software Engineering', 'Department of Software Engineering'),
('IT', 'Information Technology', 'Department of Information Technology'),
('AI', 'Artificial Intelligence', 'Department of Artificial Intelligence'),
('CYS', 'Cyber Security', 'Department of Cyber Security')
ON CONFLICT (dept_code) DO NOTHING;

-- Insert enhanced form types with 5-stage approval configuration
INSERT INTO form_types (
    form_code, form_name, workflow_stage, 
    requires_dec_approval, requires_supervisor_approval, requires_gec_approval, 
    requires_hod_approval, requires_chairperson_approval, description
) VALUES
-- Onboarding Forms
('ONBOARDING-001', 'Initial Onboarding Form', 'supervision_consent', false, true, false, true, false, 'Initial student onboarding form with research proposal and preferences'),
-- Supervision and Registration Forms
('PHDEE02-A', 'Supervisor Consent Form', 'supervision_consent', false, true, false, true, true, 'Form for supervisor consent and student-supervisor agreement'),
('PHDEE02-B', 'Course Registration Form', 'course_registration', true, true, false, true, false, 'Semester-wise course registration form'),
('PHDEE02-C', 'GEC Formation Form', 'gec_formation', false, false, true, true, true, 'Graduate Evaluation Committee formation form'),

-- Research Proposal Forms
('RESEARCH_PROPOSAL', 'Initial Research Proposal', 'research_candidacy', false, true, false, false, false, 'Student research proposal for admin and supervisor approval'),
('PHDEE-RP-001', 'Research Proposal Submission', 'research_candidacy', true, true, true, true, true, 'Initial research proposal submission'),
('PHDEE-RP-002', 'Research Proposal Defense Request', 'research_candidacy', false, true, true, true, false, 'Request for research proposal defense'),

-- Progress Report Forms
('PHDEE-PR-001', 'Semester Progress Report', 'thesis_writing', true, true, true, true, false, 'Semester-wise progress report'),
('PHDEE-PR-002', 'Annual Progress Review', 'thesis_writing', true, true, true, true, true, 'Annual comprehensive progress review'),

-- Comprehensive Examination Forms
('PHDEE03', 'Comprehensive Examination Request', 'comprehensive_exam', true, true, true, true, true, 'Request form for comprehensive examination'),
('PHDEE1', 'Comprehensive Exam Evaluation', 'comprehensive_exam', false, false, true, false, false, 'Evaluation form for comprehensive examination'),

-- Synopsis Defense Forms
('PHDEE04-A', 'Synopsis Defense Request', 'synopsis_defense', true, true, true, true, true, 'Request form for synopsis defense'),
('PHDEE04-B', 'Synopsis Defense Scheduling', 'synopsis_defense', false, false, true, true, false, 'Scheduling form for synopsis defense'),
('PHDEE2-A', 'Synopsis Defense Evaluation', 'synopsis_defense', false, false, true, false, false, 'Evaluation form for synopsis defense'),

-- Thesis Evaluation and Defense Forms
('PHDEE05-A', 'Thesis Defense Request (In-house)', 'thesis_defense', true, true, true, true, true, 'Request for in-house thesis defense'),
('PHDEE05-B', 'Thesis Defense Request (Public)', 'thesis_defense', true, true, true, true, true, 'Request for public thesis defense'),
('PHDEE6', 'Thesis Defense Evaluation', 'thesis_defense', false, false, true, false, false, 'Evaluation form for thesis defense')

ON CONFLICT (form_code) DO UPDATE SET
    form_name = EXCLUDED.form_name,
    workflow_stage = EXCLUDED.workflow_stage,
    requires_dec_approval = EXCLUDED.requires_dec_approval,
    requires_supervisor_approval = EXCLUDED.requires_supervisor_approval,
    requires_gec_approval = EXCLUDED.requires_gec_approval,
    requires_hod_approval = EXCLUDED.requires_hod_approval,
    requires_chairperson_approval = EXCLUDED.requires_chairperson_approval,
    description = EXCLUDED.description;

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faculty_updated_at BEFORE UPDATE ON faculty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_types_updated_at BEFORE UPDATE ON form_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_workflow_updated_at BEFORE UPDATE ON student_workflow_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_progress_updated_at BEFORE UPDATE ON form_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gec_committees_updated_at BEFORE UPDATE ON gec_committees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gec_change_requests_updated_at BEFORE UPDATE ON gec_change_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Advanced Functions

-- Function to check if form can proceed to next approval stage
CREATE OR REPLACE FUNCTION can_proceed_to_next_stage(
    p_form_submission_id INTEGER,
    p_current_stage approval_stage
) RETURNS BOOLEAN AS $$
DECLARE
    form_record RECORD;
    form_type_record RECORD;
BEGIN
    SELECT * INTO form_record FROM form_submissions WHERE id = p_form_submission_id;
    SELECT * INTO form_type_record FROM form_types WHERE id = form_record.form_type_id;
    
    CASE p_current_stage
        WHEN 'dec' THEN
            RETURN (NOT form_type_record.requires_dec_approval OR form_record.dec_approval_status = 'approved');
        WHEN 'supervisor' THEN
            RETURN (NOT form_type_record.requires_supervisor_approval OR form_record.supervisor_approval_status = 'approved');
        WHEN 'gec' THEN
            RETURN (NOT form_type_record.requires_gec_approval OR form_record.gec_approval_status = 'approved');
        WHEN 'hod' THEN
            RETURN (NOT form_type_record.requires_hod_approval OR form_record.hod_approval_status = 'approved');
        WHEN 'chairperson' THEN
            RETURN (NOT form_type_record.requires_chairperson_approval OR form_record.chairperson_approval_status = 'approved');
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to update form approval status
CREATE OR REPLACE FUNCTION update_form_approval_status(
    p_form_submission_id INTEGER,
    p_stage approval_stage,
    p_status approval_status,
    p_approved_by INTEGER,
    p_comments TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    previous_status approval_status;
BEGIN
    -- Record the approval history
    CASE p_stage
        WHEN 'dec' THEN
            SELECT dec_approval_status INTO previous_status FROM form_submissions WHERE id = p_form_submission_id;
            UPDATE form_submissions SET 
                dec_approval_status = p_status,
                dec_approved_by = p_approved_by,
                dec_approved_at = CURRENT_TIMESTAMP,
                dec_comments = p_comments
            WHERE id = p_form_submission_id;
        WHEN 'supervisor' THEN
            SELECT supervisor_approval_status INTO previous_status FROM form_submissions WHERE id = p_form_submission_id;
            UPDATE form_submissions SET 
                supervisor_approval_status = p_status,
                supervisor_approved_by = p_approved_by,
                supervisor_approved_at = CURRENT_TIMESTAMP,
                supervisor_comments = p_comments
            WHERE id = p_form_submission_id;
        WHEN 'gec' THEN
            SELECT gec_approval_status INTO previous_status FROM form_submissions WHERE id = p_form_submission_id;
            UPDATE form_submissions SET 
                gec_approval_status = p_status,
                gec_approved_by = p_approved_by,
                gec_approved_at = CURRENT_TIMESTAMP,
                gec_comments = p_comments
            WHERE id = p_form_submission_id;
        WHEN 'hod' THEN
            SELECT hod_approval_status INTO previous_status FROM form_submissions WHERE id = p_form_submission_id;
            UPDATE form_submissions SET 
                hod_approval_status = p_status,
                hod_approved_by = p_approved_by,
                hod_approved_at = CURRENT_TIMESTAMP,
                hod_comments = p_comments
            WHERE id = p_form_submission_id;
        WHEN 'chairperson' THEN
            SELECT chairperson_approval_status INTO previous_status FROM form_submissions WHERE id = p_form_submission_id;
            UPDATE form_submissions SET 
                chairperson_approval_status = p_status,
                chairperson_approved_by = p_approved_by,
                chairperson_approved_at = CURRENT_TIMESTAMP,
                chairperson_comments = p_comments
            WHERE id = p_form_submission_id;
    END CASE;
    
    -- Insert approval history record
    INSERT INTO form_approval_history (
        form_submission_id, approval_stage, previous_status, new_status, approved_by, comments
    ) VALUES (
        p_form_submission_id, p_stage, previous_status, p_status, p_approved_by, p_comments
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-populate form data
CREATE OR REPLACE FUNCTION get_auto_populate_data(
    p_user_id INTEGER,
    p_form_type_id INTEGER
) RETURNS JSONB AS $$
DECLARE
    auto_data JSONB := '{}';
    user_record RECORD;
    supervisor_record RECORD;
    co_supervisor_record RECORD;
BEGIN
    -- Get user information
    SELECT u.*, d.dept_name, d.dept_code INTO user_record
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = p_user_id;
    
    -- Get supervisor information
    SELECT * INTO supervisor_record FROM faculty WHERE id = user_record.primary_supervisor_id;
    SELECT * INTO co_supervisor_record FROM faculty WHERE id = user_record.co_supervisor_id;
    
    -- Build auto-populate data
    auto_data := jsonb_build_object(
        'student_name', user_record.first_name || ' ' || user_record.last_name,
        'student_id', user_record.student_id,
        'student_email', user_record.email,
        'department', user_record.dept_name,
        'department_code', user_record.dept_code,
        'current_semester', user_record.current_semester,
        'academic_year', user_record.academic_year,
        'enrollment_year', user_record.enrollment_year,
        'research_area', user_record.research_area
    );
    
    -- Add supervisor information if available
    IF supervisor_record IS NOT NULL THEN
        auto_data := auto_data || jsonb_build_object(
            'supervisor_name', supervisor_record.first_name || ' ' || supervisor_record.last_name,
            'supervisor_email', supervisor_record.email,
            'supervisor_designation', supervisor_record.designation,
            'supervisor_department', (SELECT dept_name FROM departments WHERE id = supervisor_record.department_id)
        );
    END IF;
    
    -- Add co-supervisor information if available
    IF co_supervisor_record IS NOT NULL THEN
        auto_data := auto_data || jsonb_build_object(
            'co_supervisor_name', co_supervisor_record.first_name || ' ' || co_supervisor_record.last_name,
            'co_supervisor_email', co_supervisor_record.email,
            'co_supervisor_designation', co_supervisor_record.designation
        );
    END IF;
    
    RETURN auto_data;
END;
$$ LANGUAGE plpgsql;

-- Create comprehensive views for dashboard and reporting

-- Admin Dashboard Overview
CREATE OR REPLACE VIEW admin_dashboard_overview AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_active = true) as total_students,
    (SELECT COUNT(*) FROM faculty WHERE is_active = true) as total_faculty,
    (SELECT COUNT(*) FROM form_submissions WHERE status = 'submitted' AND DATE(submitted_at) = CURRENT_DATE) as todays_submissions,
    (SELECT COUNT(*) FROM form_submissions WHERE dec_approval_status = 'pending') as pending_dec_approvals,
    (SELECT COUNT(*) FROM form_submissions WHERE supervisor_approval_status = 'pending') as pending_supervisor_approvals,
    (SELECT COUNT(*) FROM form_submissions WHERE gec_approval_status = 'pending') as pending_gec_approvals,
    (SELECT COUNT(*) FROM form_submissions WHERE hod_approval_status = 'pending') as pending_hod_approvals,
    (SELECT COUNT(*) FROM form_submissions WHERE chairperson_approval_status = 'pending') as pending_chairperson_approvals,
    (SELECT COUNT(*) FROM gec_change_requests WHERE request_status = 'pending') as pending_gec_changes;

-- Student Progress Summary
CREATE OR REPLACE VIEW student_progress_summary AS
SELECT 
    u.id as user_id,
    u.first_name || ' ' || u.last_name as student_name,
    u.student_id,
    u.email,
    d.dept_name as department,
    u.current_semester,
    u.academic_year,
    swp.current_stage,
    f1.first_name || ' ' || f1.last_name as primary_supervisor,
    f2.first_name || ' ' || f2.last_name as co_supervisor,
    swp.total_forms_submitted,
    swp.total_forms_approved,
    swp.has_pending_actions,
    u.created_at as enrollment_date
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN student_workflow_progress swp ON u.id = swp.student_id
LEFT JOIN faculty f1 ON u.primary_supervisor_id = f1.id
LEFT JOIN faculty f2 ON u.co_supervisor_id = f2.id
WHERE u.role = 'student' AND u.is_active = true;

-- Faculty Workload View
CREATE OR REPLACE VIEW faculty_workload_summary AS
SELECT 
    f.id,
    f.first_name || ' ' || f.last_name as faculty_name,
    f.designation,
    d.dept_name as department,
    f.current_phd_students,
    f.max_phd_students,
    f.current_ms_students,
    f.max_ms_students,
    (SELECT COUNT(*) FROM form_submissions fs 
     WHERE (fs.supervisor_approved_by = f.id AND fs.supervisor_approval_status = 'pending')
        OR (fs.dec_approved_by = f.id AND fs.dec_approval_status = 'pending')
        OR (fs.gec_approved_by = f.id AND fs.gec_approval_status = 'pending')
        OR (fs.hod_approved_by = f.id AND fs.hod_approval_status = 'pending')
        OR (fs.chairperson_approved_by = f.id AND fs.chairperson_approval_status = 'pending')
    ) as pending_approvals,
    f.is_active,
    f.can_supervise
FROM faculty f
LEFT JOIN departments d ON f.department_id = d.id
WHERE f.is_active = true;

-- Comments for documentation
COMMENT ON TABLE departments IS 'Academic departments within the institution';
COMMENT ON TABLE faculty IS 'All academic faculty members with their roles and capacities';
COMMENT ON TABLE faculty_roles IS 'Role assignments for faculty (HOD, Chairperson, GEC members, etc.)';
COMMENT ON TABLE users IS 'Students and administrative users only';
COMMENT ON TABLE form_submissions IS 'Enhanced form submissions with 5-stage approval workflow';
COMMENT ON TABLE form_approval_history IS 'Complete audit trail of all approval actions';
COMMENT ON TABLE gec_change_requests IS 'Student requests for GEC committee changes';
COMMENT ON TABLE notifications IS 'Comprehensive notification system for all users';

-- Final success message
SELECT 'Enhanced PhD Tracking System schema created successfully!' as status; 