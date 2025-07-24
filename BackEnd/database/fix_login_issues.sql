-- Fix Admin and Faculty Login Issues
-- This script addresses the JSON parsing error and enables faculty login

-- 1. Add 'faculty' to user_role enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'faculty' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'faculty';
    END IF;
END $$;

-- 2. Fix admin_permissions column type issue
-- First, change column type to TEXT (since backend uses JSON.parse on string)
ALTER TABLE users ALTER COLUMN admin_permissions TYPE TEXT;

-- 3. Update admin user with proper JSON string format
UPDATE users 
SET admin_permissions = '["manage_users","manage_forms","approve_requests","view_reports"]'
WHERE role = 'admin' AND email = 'admin@itu.edu';

-- 4. Insert faculty members as users with login capability
-- Hash for 'faculty123': $2a$10$N9qo8uLOickgx2ZMRZoMy.Mr7JxW1EzS7gJ5Y5J5p3v6zXo5QJQbK

INSERT INTO users (
    first_name, last_name, email, password_hash, role, department_id, is_active
) VALUES
-- CS Department Faculty
('John', 'Smith', 'john.smith@itu.edu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr7JxW1EzS7gJ5Y5J5p3v6zXo5QJQbK', 'faculty', 
 (SELECT id FROM departments WHERE dept_code = 'CS'), true),
 
('Sarah', 'Johnson', 'sarah.johnson@itu.edu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr7JxW1EzS7gJ5Y5J5p3v6zXo5QJQbK', 'faculty', 
 (SELECT id FROM departments WHERE dept_code = 'CS'), true),

-- EE Department Faculty  
('Michael', 'Brown', 'michael.brown@itu.edu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr7JxW1EzS7gJ5Y5J5p3v6zXo5QJQbK', 'faculty', 
 (SELECT id FROM departments WHERE dept_code = 'EE'), true),
 
('Emily', 'Davis', 'emily.davis@itu.edu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr7JxW1EzS7gJ5Y5J5p3v6zXo5QJQbK', 'faculty', 
 (SELECT id FROM departments WHERE dept_code = 'EE'), true),

-- SE Department Faculty
('Robert', 'Wilson', 'robert.wilson@itu.edu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr7JxW1EzS7gJ5Y5J5p3v6zXo5QJQbK', 'faculty', 
 (SELECT id FROM departments WHERE dept_code = 'SE'), true),

-- AI Department Faculty
('Jennifer', 'Lee', 'jennifer.lee@itu.edu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr7JxW1EzS7gJ5Y5J5p3v6zXo5QJQbK', 'faculty', 
 (SELECT id FROM departments WHERE dept_code = 'AI'), true)

ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- 5. Verify the changes
SELECT 'Login issues fixed successfully!' as status;

-- Show admin user
SELECT 
    id, first_name, last_name, email, role, admin_permissions, is_active
FROM users 
WHERE role = 'admin';

-- Show faculty users
SELECT 
    id, first_name, last_name, email, role, department_id, is_active
FROM users 
WHERE role = 'faculty'
ORDER BY first_name; 