-- DPRC (Departmental PhD Research Committee) Schema Extension
-- This file extends the existing schema to support DPRC formation and management
-- Run this after enhanced_schema_forms.sql

-- Add DPRC role to faculty_role enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'faculty_role') THEN
        CREATE TYPE faculty_role AS ENUM (
            'supervisor', 'co_supervisor', 'hod', 'chairperson', 'gec_member', 
            'dec_member', 'dprc_member', 'dprc_chair', 'external_evaluator', 'faculty_member'
        );
    ELSE
        -- Add new values to existing enum
        ALTER TYPE faculty_role ADD VALUE IF NOT EXISTS 'dprc_member';
        ALTER TYPE faculty_role ADD VALUE IF NOT EXISTS 'dprc_chair';
    END IF;
END$$;

-- Add DPRC to approval_stage enum
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_stage') THEN
        ALTER TYPE approval_stage ADD VALUE IF NOT EXISTS 'dprc';
    END IF;
END$$;

-- Create DPRC committees table
CREATE TABLE IF NOT EXISTS dprc_committees (
    id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    committee_name VARCHAR(255) NOT NULL,
    formation_date DATE DEFAULT CURRENT_DATE,
    
    -- Committee composition
    chair_faculty_id INTEGER NOT NULL REFERENCES faculty(id),
    members JSONB NOT NULL, -- Array of faculty IDs with their roles
    
    -- Committee details
    meeting_schedule TEXT,
    responsibilities TEXT DEFAULT 'Review and approve PhD student forms and research proposals',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    formed_by INTEGER REFERENCES users(id), -- Admin who formed the committee
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(department_id, is_active) -- Only one active DPRC per department
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_dprc_department ON dprc_committees (department_id);
CREATE INDEX IF NOT EXISTS idx_dprc_active ON dprc_committees (is_active);
CREATE INDEX IF NOT EXISTS idx_dprc_chair ON dprc_committees (chair_faculty_id);

-- Create DPRC member assignments table for detailed tracking
CREATE TABLE IF NOT EXISTS dprc_member_assignments (
    id SERIAL PRIMARY KEY,
    dprc_committee_id INTEGER NOT NULL REFERENCES dprc_committees(id) ON DELETE CASCADE,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    role_in_committee VARCHAR(50) NOT NULL DEFAULT 'member', -- 'chair', 'member', 'secretary'
    assigned_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    
    -- Assignment details
    assigned_by INTEGER REFERENCES users(id),
    assignment_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(dprc_committee_id, faculty_id, is_active)
);

-- Create indexes for DPRC member assignments
CREATE INDEX IF NOT EXISTS idx_dprc_members_committee ON dprc_member_assignments (dprc_committee_id);
CREATE INDEX IF NOT EXISTS idx_dprc_members_faculty ON dprc_member_assignments (faculty_id);
CREATE INDEX IF NOT EXISTS idx_dprc_members_active ON dprc_member_assignments (is_active);

-- Add DPRC approval fields to form_submissions table if not exists
DO $$
BEGIN
    -- Add DPRC approval columns to form_submissions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'form_submissions' AND column_name = 'dprc_approval_status') THEN
        ALTER TABLE form_submissions 
        ADD COLUMN dprc_approval_status approval_status DEFAULT 'pending',
        ADD COLUMN dprc_approved_by INTEGER REFERENCES faculty(id),
        ADD COLUMN dprc_approved_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN dprc_comments TEXT;
    END IF;
END$$;

-- Update form_types to include DPRC approval requirement
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'form_types' AND column_name = 'requires_dprc_approval') THEN
        ALTER TABLE form_types 
        ADD COLUMN requires_dprc_approval BOOLEAN DEFAULT false;
    END IF;
END$$;

-- Function to get DPRC committee for a department
CREATE OR REPLACE FUNCTION get_department_dprc(p_department_id INTEGER)
RETURNS TABLE (
    dprc_id INTEGER,
    committee_name VARCHAR(255),
    chair_name TEXT,
    member_count BIGINT,
    formation_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dp.id,
        dp.committee_name,
        f.first_name || ' ' || f.last_name AS chair_name,
        (SELECT COUNT(*) FROM dprc_member_assignments dma 
         WHERE dma.dprc_committee_id = dp.id AND dma.is_active = true) AS member_count,
        dp.formation_date
    FROM dprc_committees dp
    JOIN faculty f ON dp.chair_faculty_id = f.id
    WHERE dp.department_id = p_department_id 
    AND dp.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to check if department has minimum faculty for DPRC formation
CREATE OR REPLACE FUNCTION can_form_dprc(p_department_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    faculty_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO faculty_count
    FROM faculty f
    WHERE f.department_id = p_department_id 
    AND f.is_active = true 
    AND f.can_supervise = true;
    
    RETURN faculty_count >= 4;
END;
$$ LANGUAGE plpgsql;

-- Function to get DPRC approval status for a form
CREATE OR REPLACE FUNCTION get_dprc_approval_status(
    p_form_submission_id INTEGER,
    p_department_id INTEGER
) RETURNS TABLE (
    dprc_required BOOLEAN,
    dprc_status approval_status,
    dprc_committee_name VARCHAR(255),
    approved_by_name TEXT,
    approval_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ft.requires_dprc_approval,
        fs.dprc_approval_status,
        dp.committee_name,
        f.first_name || ' ' || f.last_name AS approved_by_name,
        fs.dprc_approved_at
    FROM form_submissions fs
    JOIN form_types ft ON fs.form_type_id = ft.id
    LEFT JOIN dprc_committees dp ON dp.department_id = p_department_id AND dp.is_active = true
    LEFT JOIN faculty f ON fs.dprc_approved_by = f.id
    WHERE fs.id = p_form_submission_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update DPRC committee updated_at timestamp
CREATE OR REPLACE FUNCTION update_dprc_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dprc_updated_at
    BEFORE UPDATE ON dprc_committees
    FOR EACH ROW
    EXECUTE FUNCTION update_dprc_timestamp();

-- Insert default DPRC configuration for existing departments
-- This will be handled by the admin interface, but we can prepare sample data

-- Add sample DPRC approval requirements to existing form types
-- Update the onboarding form to require DPRC approval instead of DEC
UPDATE form_types 
SET requires_dprc_approval = true, 
    requires_dec_approval = false
WHERE form_code = 'ONBOARDING-001';

-- Update other critical forms to require DPRC approval
UPDATE form_types 
SET requires_dprc_approval = true
WHERE form_code IN ('PHDEE02-A', 'PHDEE02-B', 'PHDEE03', 'PHDEE04-A');

-- Create view for department management with DPRC status
CREATE OR REPLACE VIEW department_management_view AS
SELECT 
    d.id,
    d.dept_code,
    d.dept_name,
    d.dept_full_name,
    d.is_active,
    COUNT(DISTINCT f.id) as total_faculty,
    COUNT(DISTINCT u.id) as total_students,
    dp.id as dprc_id,
    dp.committee_name as dprc_name,
    df.first_name || ' ' || df.last_name as dprc_chair_name,
    dp.formation_date as dprc_formation_date,
    CASE 
        WHEN dp.id IS NOT NULL THEN true 
        ELSE false 
    END as has_dprc,
    CASE 
        WHEN COUNT(DISTINCT f.id) >= 4 THEN true 
        ELSE false 
    END as can_form_dprc
FROM departments d
LEFT JOIN faculty f ON d.id = f.department_id AND f.is_active = true
LEFT JOIN users u ON d.id = u.department_id AND u.role = 'student' AND u.is_active = true
LEFT JOIN dprc_committees dp ON d.id = dp.department_id AND dp.is_active = true
LEFT JOIN faculty df ON dp.chair_faculty_id = df.id
WHERE d.is_active = true
GROUP BY d.id, d.dept_code, d.dept_name, d.dept_full_name, d.is_active, 
         dp.id, dp.committee_name, df.first_name, df.last_name, dp.formation_date;

COMMENT ON TABLE dprc_committees IS 'Stores Departmental PhD Research Committee information for each department';
COMMENT ON TABLE dprc_member_assignments IS 'Tracks individual faculty assignments to DPRC committees';
COMMENT ON VIEW department_management_view IS 'Comprehensive view for department management with DPRC status'; 