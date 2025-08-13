-- DPRC Individual Member Approval Tracking System
-- This schema enables tracking individual approvals from each DPRC member
-- and prevents double voting while providing comprehensive audit trails

-- Create DPRC member approvals table for individual tracking
CREATE TABLE IF NOT EXISTS dprc_member_approvals (
    id SERIAL PRIMARY KEY,
    form_submission_id INTEGER NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    dprc_committee_id INTEGER NOT NULL REFERENCES dprc_committees(id) ON DELETE CASCADE,
    
    -- Individual approval decision
    approval_status approval_status NOT NULL, -- 'approved', 'rejected', 'conditional'
    comments TEXT,
    decision_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate votes from same faculty for same form
    UNIQUE(form_submission_id, faculty_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dprc_member_approvals_form ON dprc_member_approvals (form_submission_id);
CREATE INDEX IF NOT EXISTS idx_dprc_member_approvals_faculty ON dprc_member_approvals (faculty_id);
CREATE INDEX IF NOT EXISTS idx_dprc_member_approvals_committee ON dprc_member_approvals (dprc_committee_id);
CREATE INDEX IF NOT EXISTS idx_dprc_member_approvals_status ON dprc_member_approvals (approval_status);

-- Create a view to get aggregated DPRC approval status for forms
CREATE OR REPLACE VIEW dprc_form_approval_summary AS
SELECT 
    fs.id as form_submission_id,
    fs.user_id as student_user_id,
    u.first_name || ' ' || u.last_name as student_name,
    u.student_id,
    ft.form_name,
    ft.form_code,
    dp.id as dprc_committee_id,
    dp.committee_name,
    d.dept_name,
    
    -- Count of approvals/rejections
    COUNT(DISTINCT CASE WHEN dma_all.approval_status = 'approved' THEN dma_all.faculty_id END) as approved_count,
    COUNT(DISTINCT CASE WHEN dma_all.approval_status = 'rejected' THEN dma_all.faculty_id END) as rejected_count,
    COUNT(DISTINCT CASE WHEN dma_all.approval_status = 'conditional' THEN dma_all.faculty_id END) as conditional_count,
    COUNT(DISTINCT dma_all.faculty_id) as total_responses,
    
    -- Total DPRC members for this committee
    (SELECT COUNT(*) FROM dprc_member_assignments dma_total 
     WHERE dma_total.dprc_committee_id = dp.id AND dma_total.is_active = true) as total_members,
    
    -- Overall status logic
    CASE 
        WHEN COUNT(DISTINCT CASE WHEN dma_all.approval_status = 'rejected' THEN dma_all.faculty_id END) > 0 THEN 'rejected'
        WHEN COUNT(DISTINCT CASE WHEN dma_all.approval_status = 'approved' THEN dma_all.faculty_id END) = (SELECT COUNT(*) FROM dprc_member_assignments dma_total 
                                       WHERE dma_total.dprc_committee_id = dp.id AND dma_total.is_active = true) 
        THEN 'approved'
        WHEN COUNT(DISTINCT dma_all.faculty_id) > 0 THEN 'pending'
        ELSE 'pending'
    END as overall_status,
    
    -- Lists of faculty who voted
    ARRAY_AGG(DISTINCT CASE WHEN dma_all.approval_status = 'approved' 
                           THEN f_approved.first_name || ' ' || f_approved.last_name END) 
                           FILTER (WHERE dma_all.approval_status = 'approved') as approved_by,
    
    ARRAY_AGG(DISTINCT CASE WHEN dma_all.approval_status = 'rejected' 
                           THEN f_rejected.first_name || ' ' || f_rejected.last_name END) 
                           FILTER (WHERE dma_all.approval_status = 'rejected') as rejected_by,
    
    -- Pending faculty list
    ARRAY_AGG(DISTINCT CASE WHEN pending_faculty.faculty_id IS NOT NULL 
                           THEN pending_faculty.first_name || ' ' || pending_faculty.last_name END) 
                           FILTER (WHERE pending_faculty.faculty_id IS NOT NULL) as pending_members,
    
    fs.submitted_at,
    MAX(dma_all.decision_date) as last_decision_date

FROM form_submissions fs
JOIN form_types ft ON fs.form_type_id = ft.id
JOIN users u ON fs.user_id = u.id
JOIN departments d ON u.department_id = d.id
JOIN dprc_committees dp ON dp.department_id = d.id AND dp.is_active = true
LEFT JOIN dprc_member_approvals dma_all ON fs.id = dma_all.form_submission_id AND dma_all.dprc_committee_id = dp.id
LEFT JOIN faculty f_approved ON dma_all.faculty_id = f_approved.id AND dma_all.approval_status = 'approved'
LEFT JOIN faculty f_rejected ON dma_all.faculty_id = f_rejected.id AND dma_all.approval_status = 'rejected'

-- Get pending faculty members (those who haven't voted yet)
LEFT JOIN (
    SELECT DISTINCT 
        dma_pending.dprc_committee_id,
        f_pending.id as faculty_id,
        f_pending.first_name,
        f_pending.last_name,
        fs_pending.id as form_submission_id
    FROM dprc_member_assignments dma_pending
    JOIN faculty f_pending ON dma_pending.faculty_id = f_pending.id
    JOIN form_submissions fs_pending ON fs_pending.user_id IN (
        SELECT u_pending.id FROM users u_pending 
        JOIN departments d_pending ON u_pending.department_id = d_pending.id
        WHERE d_pending.id = (SELECT dp_pending.department_id FROM dprc_committees dp_pending WHERE dp_pending.id = dma_pending.dprc_committee_id)
    )
    WHERE dma_pending.is_active = true
    AND NOT EXISTS (
        SELECT 1 FROM dprc_member_approvals dma_voted 
        WHERE dma_voted.form_submission_id = fs_pending.id 
        AND dma_voted.faculty_id = f_pending.id
    )
) pending_faculty ON pending_faculty.dprc_committee_id = dp.id AND pending_faculty.form_submission_id = fs.id

WHERE ft.requires_dprc_approval = true
GROUP BY fs.id, fs.user_id, u.first_name, u.last_name, u.student_id, ft.form_name, ft.form_code, 
         dp.id, dp.committee_name, d.dept_name, fs.submitted_at;

-- Function to check if faculty member can vote on a form
CREATE OR REPLACE FUNCTION can_faculty_vote_on_form(
    p_faculty_id INTEGER,
    p_form_submission_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    existing_vote_count INTEGER;
    is_dprc_member BOOLEAN;
    form_department_id INTEGER;
    faculty_dprc_dept_id INTEGER;
BEGIN
    -- Check if faculty has already voted
    SELECT COUNT(*) INTO existing_vote_count
    FROM dprc_member_approvals
    WHERE faculty_id = p_faculty_id AND form_submission_id = p_form_submission_id;
    
    IF existing_vote_count > 0 THEN
        RETURN FALSE; -- Already voted
    END IF;
    
    -- Check if faculty is DPRC member for the form's department
    SELECT u.department_id INTO form_department_id
    FROM form_submissions fs
    JOIN users u ON fs.user_id = u.id
    WHERE fs.id = p_form_submission_id;
    
    SELECT dp.department_id INTO faculty_dprc_dept_id
    FROM dprc_member_assignments dma
    JOIN dprc_committees dp ON dma.dprc_committee_id = dp.id
    WHERE dma.faculty_id = p_faculty_id 
    AND dma.is_active = true 
    AND dp.is_active = true
    AND dp.department_id = form_department_id;
    
    RETURN faculty_dprc_dept_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to record DPRC member vote
CREATE OR REPLACE FUNCTION record_dprc_member_vote(
    p_faculty_id INTEGER,
    p_form_submission_id INTEGER,
    p_approval_status approval_status,
    p_comments TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
    dprc_committee_id INTEGER;
    can_vote BOOLEAN;
BEGIN
    -- Check if faculty can vote
    SELECT can_faculty_vote_on_form(p_faculty_id, p_form_submission_id) INTO can_vote;
    
    IF NOT can_vote THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'You have already submitted your decision for this form or are not authorized to vote.'
        );
    END IF;
    
    -- Get DPRC committee ID
    SELECT dp.id INTO dprc_committee_id
    FROM form_submissions fs
    JOIN users u ON fs.user_id = u.id
    JOIN dprc_committees dp ON dp.department_id = u.department_id
    JOIN dprc_member_assignments dma ON dma.dprc_committee_id = dp.id
    WHERE fs.id = p_form_submission_id 
    AND dma.faculty_id = p_faculty_id
    AND dma.is_active = true 
    AND dp.is_active = true;
    
    -- Record the vote
    INSERT INTO dprc_member_approvals (
        form_submission_id, faculty_id, dprc_committee_id, 
        approval_status, comments, ip_address, user_agent
    ) VALUES (
        p_form_submission_id, p_faculty_id, dprc_committee_id,
        p_approval_status, p_comments, p_ip_address, p_user_agent
    );
    
    -- Update overall form status if needed
    PERFORM update_form_dprc_status(p_form_submission_id);
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Vote recorded successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update overall DPRC status based on individual votes
CREATE OR REPLACE FUNCTION update_form_dprc_status(p_form_submission_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_total_members INTEGER;
    v_approved_count INTEGER;
    v_rejected_count INTEGER;
    new_status approval_status;
BEGIN
    -- Get counts from the summary view
    SELECT 
        das.total_members, das.approved_count, das.rejected_count,
        CASE 
            WHEN das.rejected_count > 0 THEN 'rejected'::approval_status
            WHEN das.approved_count = das.total_members THEN 'approved'::approval_status
            ELSE 'pending'::approval_status
        END
    INTO v_total_members, v_approved_count, v_rejected_count, new_status
    FROM dprc_form_approval_summary das
    WHERE das.form_submission_id = p_form_submission_id;
    
    -- Update the form submission's DPRC status
    UPDATE form_submissions
    SET dprc_approval_status = new_status,
        dprc_approved_at = CASE WHEN new_status IN ('approved', 'rejected') THEN CURRENT_TIMESTAMP ELSE dprc_approved_at END,
        last_updated_at = CURRENT_TIMESTAMP
    WHERE id = p_form_submission_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update form status when votes are recorded
CREATE OR REPLACE FUNCTION trigger_update_dprc_status()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_form_dprc_status(NEW.form_submission_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dprc_vote_status_update ON dprc_member_approvals;
CREATE TRIGGER dprc_vote_status_update
    AFTER INSERT OR UPDATE ON dprc_member_approvals
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_dprc_status();

COMMENT ON TABLE dprc_member_approvals IS 'Individual DPRC member approval tracking - prevents double voting and provides audit trail';
COMMENT ON VIEW dprc_form_approval_summary IS 'Aggregated view of DPRC approval status with individual member tracking';
COMMENT ON FUNCTION can_faculty_vote_on_form IS 'Checks if a faculty member can vote on a specific form submission';
COMMENT ON FUNCTION record_dprc_member_vote IS 'Records a DPRC member vote with validation and status update'; 