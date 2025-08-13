-- Comprehensive Database Fix Script
-- This script applies all the fixes for the current issues

-- 1. Create missing tables
\i missing_tables.sql

-- 2. Apply DPRC tracking system with fixes
\i apply_dprc_tracking.sql

-- 3. Verify all fixes are applied
SELECT 'Database fixes applied successfully!' as status;

-- Test DPRC view
SELECT 'Testing DPRC view...' as test;
SELECT COUNT(*) as view_count FROM dprc_form_approval_summary;

-- Test notifications table
SELECT 'Testing notifications table...' as test;
SELECT COUNT(*) as notification_count FROM notifications;

-- Test supervisor_consent_forms table
SELECT 'Testing supervisor_consent_forms table...' as test;
SELECT COUNT(*) as consent_count FROM supervisor_consent_forms;

-- Test form_submissions table
SELECT 'Testing form_submissions table...' as test;
SELECT COUNT(*) as submission_count FROM form_submissions;

-- Show current onboarding forms status
SELECT 'Current onboarding forms status:' as info;
SELECT 
    fs.id,
    fs.dprc_approval_status,
    fs.final_approval_status,
    ft.form_code,
    u.first_name || ' ' || u.last_name as student_name
FROM form_submissions fs
JOIN form_types ft ON fs.form_type_id = ft.id
JOIN users u ON fs.user_id = u.id
WHERE ft.form_code = 'ONBOARDING-001'
ORDER BY fs.submitted_at DESC; 