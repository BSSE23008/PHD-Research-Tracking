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
    
    -- Index for faster queries
    INDEX idx_form_submissions_user_type (user_id, form_type),
    INDEX idx_form_submissions_status (status),
    INDEX idx_form_submissions_submitted (submitted_at DESC)
);

-- Add comments for documentation
COMMENT ON TABLE form_progress IS 'Stores auto-saved form progress for users';
COMMENT ON TABLE form_submissions IS 'Stores completed and submitted forms';

COMMENT ON COLUMN form_progress.form_type IS 'Type of form (e.g., PHDEE02-A)';
COMMENT ON COLUMN form_progress.form_data IS 'JSON data containing form field values';
COMMENT ON COLUMN form_progress.step_number IS 'Current step in multi-step forms';

COMMENT ON COLUMN form_submissions.form_type IS 'Type of form (e.g., PHDEE02-A)';
COMMENT ON COLUMN form_submissions.form_data IS 'JSON data containing submitted form values';
COMMENT ON COLUMN form_submissions.status IS 'Status: submitted, under_review, approved, rejected';

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