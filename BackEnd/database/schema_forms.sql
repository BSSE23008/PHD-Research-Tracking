-- Enhanced Forms schema for PhD Research Tracking System
-- Run this after the main schema.sql to add comprehensive form functionality


-- Create ENUM types for better data integrity
CREATE TYPE form_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'requires_revision');
CREATE TYPE workflow_stage AS ENUM (
    'admission', 'supervision_consent', 'course_registration', 'gec_formation', 
    'comprehensive_exam', 'synopsis_defense', 'research_candidacy', 
    'thesis_writing', 'thesis_evaluation', 'thesis_defense', 'graduation'
);
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'conditional');
CREATE TYPE user_role AS ENUM ('student', 'supervisor', 'admin', 'external_evaluator');

-- Create users table first (referenced by other tables)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'supervisor', 'admin')),
    
    -- Student specific fields
    student_id VARCHAR(50),
    enrollment_year INTEGER,
    research_area VARCHAR(255),
    advisor_email VARCHAR(255),
    
    -- Supervisor specific fields
    title VARCHAR(100),
    department VARCHAR(255),
    institution VARCHAR(255),
    office_location VARCHAR(255),
    research_interests TEXT,
    max_students INTEGER,
    
    -- Admin specific fields
    admin_code VARCHAR(100),
    
    -- Common fields
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users (student_id) WHERE student_id IS NOT NULL;

-- Main form types configuration table
CREATE TABLE IF NOT EXISTS form_types (
    id SERIAL PRIMARY KEY,
    form_code VARCHAR(50) UNIQUE NOT NULL,
    form_name VARCHAR(200) NOT NULL,
    description TEXT,
    workflow_stage workflow_stage NOT NULL,
    is_active BOOLEAN DEFAULT true,
    requires_supervisor_approval BOOLEAN DEFAULT false,
    requires_admin_approval BOOLEAN DEFAULT false,
    requires_gec_approval BOOLEAN DEFAULT false,
    max_submissions_per_user INTEGER DEFAULT 1,
    prerequisite_forms TEXT[], -- Array of form codes that must be completed first
    document_templates JSONB, -- Templates and required documents
    form_schema JSONB, -- JSON schema for form validation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student workflow progress tracking
CREATE TABLE IF NOT EXISTS student_workflow_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_stage workflow_stage NOT NULL DEFAULT 'supervision_consent',
    stage_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expected_completion_date DATE,
    is_stage_completed BOOLEAN DEFAULT false,
    stage_completion_date TIMESTAMP WITH TIME ZONE,
    semester INTEGER DEFAULT 1,
    academic_year VARCHAR(10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(student_id) -- One progress record per student
);

-- Table for storing form progress (auto-save)
CREATE TABLE IF NOT EXISTS form_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    form_type_id INTEGER NOT NULL REFERENCES form_types(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    step_number INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one progress record per user per form type
    UNIQUE(user_id, form_type_id)
);

-- Table for storing completed form submissions
CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    form_type_id INTEGER NOT NULL REFERENCES form_types(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL,
    status form_status DEFAULT 'submitted',
    workflow_stage workflow_stage NOT NULL,
    semester INTEGER,
    academic_year VARCHAR(10),
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Review and approval tracking
    reviewed_by INTEGER REFERENCES users(id),
    review_comments TEXT,
    admin_approval_status approval_status DEFAULT 'pending',
    admin_approved_by INTEGER REFERENCES users(id),
    admin_approved_at TIMESTAMP WITH TIME ZONE,
    admin_comments TEXT,
    
    -- Supervisor approval tracking
    supervisor_approval_status approval_status DEFAULT 'pending',
    supervisor_approved_by INTEGER REFERENCES users(id),
    supervisor_approved_at TIMESTAMP WITH TIME ZONE,
    supervisor_comments TEXT,
    
    -- GEC approval tracking (for forms requiring GEC approval)
    gec_approval_status approval_status DEFAULT 'pending',
    gec_approved_by INTEGER REFERENCES users(id),
    gec_approved_at TIMESTAMP WITH TIME ZONE,
    gec_comments TEXT,
    
    -- External evaluation tracking
    external_evaluator_1 VARCHAR(255),
    external_evaluator_2 VARCHAR(255),
    external_evaluation_1_status approval_status DEFAULT 'pending',
    external_evaluation_2_status approval_status DEFAULT 'pending',
    
    -- Document tracking
    documents_submitted JSONB,
    documents_verified BOOLEAN DEFAULT false,
    documents_verified_by INTEGER REFERENCES users(id),
    documents_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Version control
    version INTEGER DEFAULT 1,
    parent_submission_id INTEGER REFERENCES form_submissions(id)
);

-- Create indexes for form_submissions table
CREATE INDEX IF NOT EXISTS idx_form_submissions_user_type ON form_submissions (user_id, form_type_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions (status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted ON form_submissions (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_workflow_stage ON form_submissions (workflow_stage);
CREATE INDEX IF NOT EXISTS idx_form_submissions_semester ON form_submissions (semester, academic_year);

-- Table for form attachments and documents
CREATE TABLE IF NOT EXISTS form_attachments (
    id SERIAL PRIMARY KEY,
    form_submission_id INTEGER NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    upload_type VARCHAR(100), -- 'required_document', 'supporting_document', 'certificate', etc.
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT false,
    verified_by INTEGER REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for form_attachments table
CREATE INDEX IF NOT EXISTS idx_form_attachments_submission ON form_attachments (form_submission_id);
CREATE INDEX IF NOT EXISTS idx_form_attachments_type ON form_attachments (upload_type);

-- Table for supervisor consent forms (enhanced)
CREATE TABLE IF NOT EXISTS supervisor_consent_forms (
    id SERIAL PRIMARY KEY,
    form_submission_id INTEGER NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    supervisor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Supervisor details
    supervisor_name VARCHAR(255) NOT NULL,
    supervisor_designation VARCHAR(100),
    supervisor_department VARCHAR(255),
    area_of_research TEXT NOT NULL,
    contact_no VARCHAR(50),
    email VARCHAR(255),
    
    -- Student details
    student_signature_date DATE,
    research_topic TEXT,
    proposed_timeline TEXT,
    
    -- HEC approved supervisor details
    hec_approved_supervisor_ref VARCHAR(100),
    hec_approval_date DATE,
    num_existing_phd_students INTEGER DEFAULT 0,
    num_existing_ms_students INTEGER DEFAULT 0,
    max_supervision_capacity INTEGER DEFAULT 8,
    
    -- Supervision type
    supervision_type VARCHAR(50) CHECK (supervision_type IN ('main_supervisor', 'co_supervisor', 'external_supervisor')),
    
    -- Consent and approval
    supervisor_consent BOOLEAN DEFAULT false,
    supervisor_signature_date DATE,
    
    -- Status
    status approval_status DEFAULT 'pending',
    filled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one consent form per submission
    UNIQUE(form_submission_id)
);

-- Create indexes for supervisor_consent_forms table
CREATE INDEX IF NOT EXISTS idx_supervisor_consent_supervisor ON supervisor_consent_forms (supervisor_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_consent_student ON supervisor_consent_forms (student_user_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_consent_status ON supervisor_consent_forms (status);

-- Table for GEC (Graduate Evaluation Committee) management
CREATE TABLE IF NOT EXISTS gec_committees (
    id SERIAL PRIMARY KEY,
    student_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    committee_formed_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint for gec_committees
CREATE UNIQUE INDEX IF NOT EXISTS idx_gec_committees_student_active ON gec_committees (student_user_id) WHERE is_active = true;

-- Table for GEC committee members
CREATE TABLE IF NOT EXISTS gec_committee_members (
    id SERIAL PRIMARY KEY,
    committee_id INTEGER NOT NULL REFERENCES gec_committees(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    member_name VARCHAR(255) NOT NULL,
    member_designation VARCHAR(100),
    member_institution VARCHAR(255),
    member_email VARCHAR(255),
    member_role VARCHAR(50) CHECK (member_role IN ('chairperson', 'supervisor', 'co_supervisor', 'internal_member', 'external_member')),
    is_external BOOLEAN DEFAULT false,
    added_date DATE DEFAULT CURRENT_DATE
);

-- Create indexes for gec_committee_members table
CREATE INDEX IF NOT EXISTS idx_gec_members_committee ON gec_committee_members (committee_id);
CREATE INDEX IF NOT EXISTS idx_gec_members_role ON gec_committee_members (member_role);

-- Table for comprehensive exam tracking
CREATE TABLE IF NOT EXISTS comprehensive_exams (
    id SERIAL PRIMARY KEY,
    student_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    committee_id INTEGER NOT NULL REFERENCES gec_committees(id) ON DELETE CASCADE,
    exam_date DATE,
    exam_time TIME,
    venue VARCHAR(255),
    exam_status VARCHAR(50) DEFAULT 'scheduled' CHECK (exam_status IN ('scheduled', 'completed', 'passed', 'failed', 'rescheduled')),
    overall_result VARCHAR(20) CHECK (overall_result IN ('pass', 'fail', 'conditional_pass')),
    next_attempt_date DATE,
    attempt_number INTEGER DEFAULT 1,
    
    -- Exam details
    written_exam_score DECIMAL(5,2),
    oral_exam_score DECIMAL(5,2),
    total_score DECIMAL(5,2),
    passing_score DECIMAL(5,2) DEFAULT 60.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for comprehensive_exams table
CREATE INDEX IF NOT EXISTS idx_comprehensive_exams_student ON comprehensive_exams (student_user_id);
CREATE INDEX IF NOT EXISTS idx_comprehensive_exams_status ON comprehensive_exams (exam_status);

-- Table for thesis defense tracking
CREATE TABLE IF NOT EXISTS thesis_defenses (
    id SERIAL PRIMARY KEY,
    student_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    defense_type VARCHAR(50) NOT NULL CHECK (defense_type IN ('synopsis', 'in_house', 'public')),
    scheduled_date DATE,
    scheduled_time TIME,
    venue VARCHAR(255),
    defense_status VARCHAR(50) DEFAULT 'scheduled' CHECK (defense_status IN ('scheduled', 'completed', 'passed', 'failed', 'rescheduled')),
    
    -- Results
    overall_result VARCHAR(20) CHECK (overall_result IN ('pass', 'fail', 'conditional_pass', 'minor_revisions', 'major_revisions')),
    revision_deadline DATE,
    
    -- External evaluators (for public defense)
    external_evaluator_1_name VARCHAR(255),
    external_evaluator_2_name VARCHAR(255),
    external_evaluator_1_report TEXT,
    external_evaluator_2_report TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for thesis_defenses table
CREATE INDEX IF NOT EXISTS idx_thesis_defenses_student ON thesis_defenses (student_user_id);
CREATE INDEX IF NOT EXISTS idx_thesis_defenses_type ON thesis_defenses (defense_type);
CREATE INDEX IF NOT EXISTS idx_thesis_defenses_status ON thesis_defenses (defense_status);

-- Table for notifications and alerts
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'info' CHECK (notification_type IN ('info', 'warning', 'success', 'error', 'reminder')),
    is_read BOOLEAN DEFAULT false,
    related_form_id INTEGER REFERENCES form_submissions(id) ON DELETE SET NULL,
    action_required BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications (created_at DESC);

-- Table for admin dashboard statistics cache
CREATE TABLE IF NOT EXISTS admin_statistics (
    id SERIAL PRIMARY KEY,
    stat_name VARCHAR(100) NOT NULL,
    stat_value JSONB NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(stat_name)
);

-- Insert all PhD form types based on workflow
INSERT INTO form_types (form_code, form_name, workflow_stage, requires_supervisor_approval, requires_admin_approval, description) VALUES
-- Supervision and Registration Forms
('PHDEE02-A', 'Supervisor Consent Form', 'supervision_consent', true, true, 'Form for supervisor consent and student-supervisor agreement'),
('PHDEE02-B', 'Course Registration Form for Each Semester', 'course_registration', true, false, 'Semester-wise course registration form'),
('PHDEE02-C', 'GEC Formation Form', 'gec_formation', false, true, 'Graduate Evaluation Committee formation form'),

-- Comprehensive Examination Forms
('PHDEE03', 'Comprehensive Examination Request Form', 'comprehensive_exam', true, true, 'Request form for comprehensive examination'),
('PHDEE1', 'Comprehensive Exam Evaluation Form', 'comprehensive_exam', false, true, 'Evaluation form for comprehensive examination'),

-- Synopsis Defense Forms
('PHDEE04-A', 'Synopsis Defense Request Form', 'synopsis_defense', true, true, 'Request form for synopsis defense'),
('PHDEE04-B', 'Synopsis Defense Scheduling Form', 'synopsis_defense', false, true, 'Scheduling form for synopsis defense'),
('PHDEE2-A', 'Synopsis Defense Evaluation Form', 'synopsis_defense', false, true, 'Evaluation form for synopsis defense'),
('PHDEE2-B', 'Synopsis Defense Full Committee Report', 'synopsis_defense', false, true, 'Full committee report for synopsis defense'),

-- Research Candidacy
('PHDEE04-C', 'Research Candidacy Request Form', 'research_candidacy', true, true, 'Form to request research candidacy status'),

-- Progress Monitoring
('PHDEE3', 'GEC Meeting Minutes for Progress Evaluation', 'thesis_writing', false, true, 'Semester-wise progress evaluation by GEC'),

-- Thesis Evaluation Forms
('PHDEE2-C', 'PhD Thesis Plagiarism Check Form', 'thesis_evaluation', false, true, 'Plagiarism check report for PhD thesis'),
('PHDEE3-A', 'PhD Thesis Evaluation Form', 'thesis_evaluation', false, true, 'Internal thesis evaluation form'),
('PHDEE3-B', 'PhD Thesis External Evaluation Request Form', 'thesis_evaluation', false, true, 'Request form for external thesis evaluation'),
('PHDEE4', 'PhD Thesis Evaluation Form (External Evaluators)', 'thesis_evaluation', false, true, 'Evaluation form for external evaluators'),
('PHDEE4-A', 'PhD Thesis Submission Form (DPRC)', 'thesis_evaluation', false, true, 'Thesis submission form for DPRC'),

-- Defense Forms
('PHDEE05-A', 'PhD Thesis Defense Scheduling Form (In-house)', 'thesis_defense', false, true, 'Scheduling form for in-house thesis defense'),
('PHDEE5', 'In House Defense Evaluation Form', 'thesis_defense', false, true, 'Evaluation form for in-house defense'),
('PHDEE05-B', 'PhD Thesis Defense Scheduling Form (Public)', 'thesis_defense', false, true, 'Scheduling form for public thesis defense'),
('PHDEE6', 'PhD Thesis Defense Evaluation Form (Public)', 'thesis_defense', false, true, 'Evaluation form for public thesis defense'),

-- Final Graduation Forms
('PHDEE-COMPLETION', 'PhD Degree Completion Form', 'graduation', false, true, 'Final degree completion form'),
('PHDEE-TRANSCRIPT', 'Final Transcript Request', 'graduation', false, true, 'Request for final transcript')

ON CONFLICT (form_code) DO UPDATE SET
    form_name = EXCLUDED.form_name,
    workflow_stage = EXCLUDED.workflow_stage,
    requires_supervisor_approval = EXCLUDED.requires_supervisor_approval,
    requires_admin_approval = EXCLUDED.requires_admin_approval,
    description = EXCLUDED.description;

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_types_updated_at BEFORE UPDATE ON form_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_workflow_updated_at BEFORE UPDATE ON student_workflow_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_progress_updated_at BEFORE UPDATE ON form_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gec_committees_updated_at BEFORE UPDATE ON gec_committees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comprehensive_exams_updated_at BEFORE UPDATE ON comprehensive_exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_thesis_defenses_updated_at BEFORE UPDATE ON thesis_defenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for admin dashboard
CREATE OR REPLACE VIEW admin_dashboard_overview AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_active = true) as total_students,
    (SELECT COUNT(*) FROM users WHERE role = 'supervisor' AND is_active = true) as total_supervisors,
    (SELECT COUNT(*) FROM form_submissions WHERE status = 'submitted' AND DATE(submitted_at) = CURRENT_DATE) as todays_submissions,
    (SELECT COUNT(*) FROM form_submissions WHERE admin_approval_status = 'pending') as pending_approvals,
    (SELECT COUNT(*) FROM comprehensive_exams WHERE exam_status = 'scheduled' AND exam_date >= CURRENT_DATE) as upcoming_exams,
    (SELECT COUNT(*) FROM thesis_defenses WHERE defense_status = 'scheduled' AND scheduled_date >= CURRENT_DATE) as upcoming_defenses;

CREATE OR REPLACE VIEW student_progress_summary AS
SELECT 
    u.id as user_id,
    u.first_name || ' ' || u.last_name as student_name,
    u.student_id,
    u.email,
    swp.current_stage,
    swp.semester,
    swp.academic_year,
    (SELECT supervisor_name FROM supervisor_consent_forms scf 
     JOIN form_submissions fs ON scf.form_submission_id = fs.id 
     WHERE fs.user_id = u.id AND fs.status = 'approved' LIMIT 1) as supervisor_name,
    (SELECT COUNT(*) FROM form_submissions WHERE user_id = u.id AND status = 'approved') as completed_forms,
    (SELECT COUNT(*) FROM form_submissions WHERE user_id = u.id AND admin_approval_status = 'pending') as pending_forms
FROM users u
LEFT JOIN student_workflow_progress swp ON u.id = swp.student_id
WHERE u.role = 'student' AND u.is_active = true;

-- Function to update student workflow progress
CREATE OR REPLACE FUNCTION update_student_workflow_stage(
    p_student_id INTEGER,
    p_new_stage workflow_stage,
    p_semester INTEGER DEFAULT NULL,
    p_academic_year VARCHAR(10) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO student_workflow_progress (
        student_id, 
        current_stage, 
        semester, 
        academic_year
    ) VALUES (
        p_student_id, 
        p_new_stage, 
        COALESCE(p_semester, 1), 
        COALESCE(p_academic_year, EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' || (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::TEXT)
    )
    ON CONFLICT (student_id) DO UPDATE SET
        current_stage = p_new_stage,
        semester = COALESCE(p_semester, student_workflow_progress.semester),
        academic_year = COALESCE(p_academic_year, student_workflow_progress.academic_year),
        stage_start_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old progress data
CREATE OR REPLACE FUNCTION cleanup_old_form_progress()
RETURNS void AS $$
BEGIN
    DELETE FROM form_progress 
    WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
    AND user_id NOT IN (
        SELECT DISTINCT user_id 
        FROM form_submissions 
        WHERE submitted_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
    );
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE users IS 'Main users table with role-based access';
COMMENT ON TABLE form_types IS 'Configuration table for all PhD form types and their requirements';
COMMENT ON TABLE student_workflow_progress IS 'Tracks each student''s current stage in the PhD workflow';
COMMENT ON TABLE form_submissions IS 'Stores all submitted forms with approval tracking';
COMMENT ON TABLE supervisor_consent_forms IS 'Detailed supervisor consent forms';
COMMENT ON TABLE gec_committees IS 'Graduate Evaluation Committees for each student';
COMMENT ON TABLE comprehensive_exams IS 'Tracking of comprehensive examinations';
COMMENT ON TABLE thesis_defenses IS 'Tracking of thesis defenses (synopsis, in-house, public)';
COMMENT ON TABLE notifications IS 'System notifications and alerts for users';
COMMENT ON TABLE admin_statistics IS 'Cached statistics for admin dashboard performance';