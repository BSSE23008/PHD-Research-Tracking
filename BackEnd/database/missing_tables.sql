-- Missing Tables Fix
-- This script creates tables that are referenced in the code but missing from the database

-- Create supervisor_consent_forms table
CREATE TABLE IF NOT EXISTS supervisor_consent_forms (
    id SERIAL PRIMARY KEY,
    student_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    primary_supervisor_id INTEGER REFERENCES faculty(id),
    co_supervisor_id INTEGER REFERENCES faculty(id),
    
    -- Consent details
    primary_supervisor_consent BOOLEAN DEFAULT false,
    co_supervisor_consent BOOLEAN DEFAULT false,
    primary_supervisor_consent_date TIMESTAMP WITH TIME ZONE,
    co_supervisor_consent_date TIMESTAMP WITH TIME ZONE,
    
    -- Form data
    research_topic TEXT,
    research_objectives TEXT,
    methodology TEXT,
    expected_outcomes TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_supervisor_consent_forms_student ON supervisor_consent_forms (student_user_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_consent_forms_primary ON supervisor_consent_forms (primary_supervisor_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_consent_forms_co ON supervisor_consent_forms (co_supervisor_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_consent_forms_status ON supervisor_consent_forms (status);

-- Add comments
COMMENT ON TABLE supervisor_consent_forms IS 'Supervisor consent forms for student research proposals';
COMMENT ON COLUMN supervisor_consent_forms.primary_supervisor_consent IS 'Whether primary supervisor has given consent';
COMMENT ON COLUMN supervisor_consent_forms.co_supervisor_consent IS 'Whether co-supervisor has given consent';

-- Verify tables were created
SELECT 'supervisor_consent_forms table created successfully' as status; 