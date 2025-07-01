-- Create database (run this manually in PostgreSQL)
-- CREATE DATABASE phd_research_tracking;

-- Use the database
-- \c phd_research_tracking;

-- Create users table with role-specific fields
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_advisor_email ON users(advisor_email);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional)
-- INSERT INTO users (first_name, last_name, email, password_hash, role, student_id, enrollment_year, research_area)
-- VALUES ('John', 'Doe', 'john.doe@example.com', '$2b$10$hash_here', 'student', 'PHD2024001', 2024, 'Machine Learning'); 