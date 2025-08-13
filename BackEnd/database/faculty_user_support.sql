-- Faculty User Support Schema Extension
-- Adds faculty user authentication capabilities to the PhD tracking system

-- Add 'faculty' role to user_role enum
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'faculty';
    ELSE
        CREATE TYPE user_role AS ENUM ('student', 'admin', 'faculty');
    END IF;
END$$;

-- Update users table comment to reflect faculty support
COMMENT ON TABLE users IS 'Users table supporting students, admins, and faculty members';

-- Create function to create faculty user accounts
CREATE OR REPLACE FUNCTION create_faculty_user_account(
    p_faculty_id INTEGER,
    p_password VARCHAR DEFAULT 'faculty123' -- Default password, should be changed on first login
) RETURNS INTEGER AS $$
DECLARE
    faculty_record RECORD;
    user_id INTEGER;
    hashed_password VARCHAR;
BEGIN
    -- Get faculty information
    SELECT id, first_name, last_name, email, department_id
    INTO faculty_record
    FROM faculty 
    WHERE id = p_faculty_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Faculty member with ID % not found or inactive', p_faculty_id;
    END IF;
    
    -- Check if user account already exists
    SELECT id INTO user_id
    FROM users 
    WHERE email = faculty_record.email;
    
    IF FOUND THEN
        -- Update existing user to faculty role if needed
        UPDATE users 
        SET role = 'faculty',
            department_id = faculty_record.department_id,
            is_active = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = user_id;
        
        RETURN user_id;
    ELSE
        -- Create new faculty user account
        -- Note: Password should be hashed by the application
        INSERT INTO users (
            first_name,
            last_name, 
            email,
            password_hash,
            role,
            department_id,
            is_active
        ) VALUES (
            faculty_record.first_name,
            faculty_record.last_name,
            faculty_record.email,
            p_password, -- This will be hashed by the application
            'faculty',
            faculty_record.department_id,
            true
        ) RETURNING id INTO user_id;
        
        RETURN user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to sync all faculty to user accounts
CREATE OR REPLACE FUNCTION sync_faculty_user_accounts() RETURNS INTEGER AS $$
DECLARE
    faculty_record RECORD;
    created_count INTEGER := 0;
    user_id INTEGER;
BEGIN
    -- Loop through all active faculty members
    FOR faculty_record IN 
        SELECT id, first_name, last_name, email, department_id
        FROM faculty 
        WHERE is_active = true
    LOOP
        -- Check if user account exists
        SELECT id INTO user_id
        FROM users 
        WHERE email = faculty_record.email;
        
        IF NOT FOUND THEN
            -- Create new faculty user account
            INSERT INTO users (
                first_name,
                last_name,
                email,
                password_hash,
                role,
                department_id,
                is_active
            ) VALUES (
                faculty_record.first_name,
                faculty_record.last_name,
                faculty_record.email,
                'faculty123', -- Default password, will be hashed by application
                'faculty',
                faculty_record.department_id,
                true
            );
            
            created_count := created_count + 1;
        ELSE
            -- Update existing user to ensure correct role and department
            UPDATE users 
            SET role = 'faculty',
                department_id = faculty_record.department_id,
                first_name = faculty_record.first_name,
                last_name = faculty_record.last_name,
                is_active = true,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = user_id AND (
                role != 'faculty' OR 
                department_id != faculty_record.department_id OR
                first_name != faculty_record.first_name OR
                last_name != faculty_record.last_name OR
                is_active != true
            );
        END IF;
    END LOOP;
    
    RETURN created_count;
END;
$$ LANGUAGE plpgsql;

-- Create view for faculty user management
CREATE OR REPLACE VIEW faculty_user_accounts AS
SELECT 
    f.id as faculty_id,
    f.faculty_id as faculty_code,
    f.first_name,
    f.last_name,
    f.email,
    f.designation,
    f.department_id,
    d.dept_name,
    d.dept_code,
    u.id as user_id,
    u.role as user_role,
    u.is_active as user_active,
    u.last_login,
    u.created_at as user_created_at,
    CASE 
        WHEN u.id IS NULL THEN 'No User Account'
        WHEN u.role != 'faculty' THEN 'Wrong Role: ' || u.role
        WHEN u.is_active = false THEN 'User Inactive'
        ELSE 'Active'
    END as account_status
FROM faculty f
LEFT JOIN departments d ON f.department_id = d.id
LEFT JOIN users u ON f.email = u.email
WHERE f.is_active = true
ORDER BY d.dept_name, f.last_name, f.first_name;

-- Insert some sample data if needed (commented out - run manually if required)
/*
-- Example: Create user accounts for all existing faculty
SELECT sync_faculty_user_accounts();

-- Example: Create account for specific faculty member
SELECT create_faculty_user_account(1); -- Replace 1 with actual faculty ID
*/

-- Create trigger to automatically create user accounts for new faculty
CREATE OR REPLACE FUNCTION auto_create_faculty_user() 
RETURNS TRIGGER AS $$
BEGIN
    -- Only create user account if faculty is active and doesn't have one
    IF NEW.is_active = true THEN
        PERFORM create_faculty_user_account(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Uncomment to enable automatic user creation for new faculty
-- CREATE TRIGGER trigger_auto_create_faculty_user
--     AFTER INSERT ON faculty
--     FOR EACH ROW
--     EXECUTE FUNCTION auto_create_faculty_user();

-- Grant necessary permissions
GRANT SELECT ON faculty_user_accounts TO PUBLIC;

-- Add helpful comments
COMMENT ON FUNCTION create_faculty_user_account(INTEGER, VARCHAR) IS 'Creates a user account for a faculty member with specified password';
COMMENT ON FUNCTION sync_faculty_user_accounts() IS 'Synchronizes all active faculty members with user accounts';
COMMENT ON VIEW faculty_user_accounts IS 'View showing faculty members and their corresponding user account status';

-- Show summary of faculty user accounts
DO $$
DECLARE
    total_faculty INTEGER;
    faculty_with_accounts INTEGER;
    faculty_without_accounts INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_faculty FROM faculty WHERE is_active = true;
    
    SELECT COUNT(*) INTO faculty_with_accounts 
    FROM faculty f 
    JOIN users u ON f.email = u.email 
    WHERE f.is_active = true AND u.role = 'faculty';
    
    faculty_without_accounts := total_faculty - faculty_with_accounts;
    
    RAISE NOTICE 'Faculty User Account Summary:';
    RAISE NOTICE '  Total Active Faculty: %', total_faculty;
    RAISE NOTICE '  Faculty with User Accounts: %', faculty_with_accounts;
    RAISE NOTICE '  Faculty without User Accounts: %', faculty_without_accounts;
    
    IF faculty_without_accounts > 0 THEN
        RAISE NOTICE 'Run "SELECT sync_faculty_user_accounts();" to create missing user accounts.';
    END IF;
END$$; 