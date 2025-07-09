-- Forms schema for PhD Research Tracking System
-- Run this after the main schema.sql to add form functionality

-- Table for storing form progress (auto-save)
CREATE TABLE IF NOT EXISTS form_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    form_type VARCHAR(50) NOT NULL,
    form_data JSONB NOT NULL,
    step_number INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one progress record per user per form type
    UNIQUE(user_id, form_type)
);

-- Table for storing completed form submissions
CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    form_type VARCHAR(50) NOT NULL,
    form_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'submitted',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by INTEGER REFERENCES users(id),
    review_comments TEXT,
    
    -- Supervisor approval tracking
    supervisor_approval_status VARCHAR(20) DEFAULT 'pending' CHECK (supervisor_approval_status IN ('pending', 'approved', 'rejected')),
    supervisor_approved_by INTEGER REFERENCES users(id),
    supervisor_approved_at TIMESTAMP WITH TIME ZONE,
    supervisor_comments TEXT,
    
    -- Index for faster queries
    INDEX idx_form_submissions_user_type (user_id, form_type),
    INDEX idx_form_submissions_status (status),
    INDEX idx_form_submissions_submitted (submitted_at DESC),
    INDEX idx_form_submissions_supervisor_status (supervisor_approval_status)
);

-- Table for supervisor consent forms
CREATE TABLE IF NOT EXISTS supervisor_consent_forms (
    id SERIAL PRIMARY KEY,
    form_submission_id INTEGER NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    supervisor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Supervisor consent data
    supervisor_name VARCHAR(255) NOT NULL,
    area_of_research TEXT NOT NULL,
    contact_no VARCHAR(50),
    student_signature_date DATE,
    
    -- HEC approved supervisor details
    hec_approved_supervisor_ref VARCHAR(100),
    num_existing_phd_students INTEGER DEFAULT 0,
    num_existing_ms_students INTEGER DEFAULT 0,
    
    -- Supervisor designation
    designation VARCHAR(100),
    as_supervisor VARCHAR(100),
    as_co_supervisor VARCHAR(100),
    
    -- Contact and signature
    email VARCHAR(255),
    contact_number VARCHAR(50),
    supervisor_signature_date DATE,
    
    -- Status and approval
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    filled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one consent form per submission
    UNIQUE(form_submission_id),
    
    -- Index for faster queries
    INDEX idx_supervisor_consent_supervisor (supervisor_id),
    INDEX idx_supervisor_consent_student (student_id),
    INDEX idx_supervisor_consent_status (status)
);

-- Add comments for documentation
COMMENT ON TABLE form_progress IS 'Stores auto-saved form progress for users';
COMMENT ON TABLE form_submissions IS 'Stores completed and submitted forms';
COMMENT ON TABLE supervisor_consent_forms IS 'Stores supervisor consent forms for student submissions';

COMMENT ON COLUMN form_progress.form_type IS 'Type of form (e.g., PHDEE02-A)';
COMMENT ON COLUMN form_progress.form_data IS 'JSON data containing form field values';
COMMENT ON COLUMN form_progress.step_number IS 'Current step in multi-step forms';

COMMENT ON COLUMN form_submissions.form_type IS 'Type of form (e.g., PHDEE02-A)';
COMMENT ON COLUMN form_submissions.form_data IS 'JSON data containing submitted form values';
COMMENT ON COLUMN form_submissions.supervisor_approval_status IS 'Status of supervisor approval for the form';

COMMENT ON COLUMN supervisor_consent_forms.form_submission_id IS 'References the original student form submission';
COMMENT ON COLUMN supervisor_consent_forms.supervisor_id IS 'ID of the supervisor filling the consent form';
COMMENT ON COLUMN supervisor_consent_forms.student_id IS 'ID of the student for whom consent is being given';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_progress_user_updated 
ON form_progress(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_form_submissions_user_submitted 
ON form_submissions(user_id, submitted_at DESC);

-- Insert some example form type configurations (optional)
CREATE TABLE IF NOT EXISTS form_types (
    id SERIAL PRIMARY KEY,
    form_code VARCHAR(50) UNIQUE NOT NULL,
    form_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    max_submissions_per_user INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO form_types (form_code, form_name, description, requires_approval) VALUES
('PHDEE02-A', 'PhD Research Project Registration Form', 'Form for registering and tracking PhD research projects', true)
ON CONFLICT (form_code) DO UPDATE SET
    form_name = EXCLUDED.form_name,
    description = EXCLUDED.description,
    requires_approval = EXCLUDED.requires_approval;

-- Function to clean old progress data (optional maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_form_progress()
RETURNS void AS $$
BEGIN
    -- Delete progress older than 30 days with no recent activity
    DELETE FROM form_progress 
    WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
    AND user_id NOT IN (
        SELECT DISTINCT user_id 
        FROM form_submissions 
        WHERE submitted_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
    );
END;
$$ LANGUAGE plpgsql; 