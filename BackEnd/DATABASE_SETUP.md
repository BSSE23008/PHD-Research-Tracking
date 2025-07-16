# Database Setup Guide

This guide will help you set up the database with sample data for testing the admin dashboard.

## Prerequisites

- PostgreSQL installed and running
- Database user with proper permissions
- `.env` file configured with database credentials

## Quick Setup

### Option 1: Complete Setup with Sample Data

```bash
# Navigate to the database directory
cd BackEnd/database

# Run the complete setup script
psql -U postgres -d phd_research_tracking -f setup_with_data.sql
```

### Option 2: Manual Setup

1. **Create the database** (if not already created):

```sql
CREATE DATABASE phd_research_tracking;
```

2. **Run the schema files**:

```bash
psql -U postgres -d phd_research_tracking -f schema.sql
psql -U postgres -d phd_research_tracking -f schema_forms.sql
```

3. **Add sample data**:

```bash
psql -U postgres -d phd_research_tracking -f sample_data.sql
```

## Test Users

After running the setup, you'll have the following test users available:

### Students

- john.doe@university.edu
- jane.smith@university.edu
- mike.johnson@university.edu
- sarah.williams@university.edu
- david.brown@university.edu

### Supervisors

- robert.wilson@university.edu
- maria.garcia@university.edu
- ahmed.hassan@university.edu
- lisa.chen@university.edu

### Admin

- admin@university.edu

### GEC Members

- james.anderson@external.edu
- emily.taylor@external.edu

**Password for all test users:** `TestPassword123!`

## What's Included

The sample data includes:

- 5 Students at different workflow stages
- 4 Supervisors with different specializations
- 1 Admin user
- 2 GEC committee members (external evaluators)
- Sample form submissions with pending approvals
- Sample comprehensive exams and thesis defenses
- Sample notifications
- Workflow progress tracking for each student

## Database Structure

The system uses a single `users` table with role-based access:

- `role` field differentiates between 'student', 'supervisor', 'admin'
- Role-specific fields are populated based on user type
- This approach maintains data integrity while supporting multiple user types

## Testing the Admin Dashboard

After setting up the database:

1. Start the backend server:

```bash
cd BackEnd
npm run dev
```

2. Start the frontend:

```bash
cd FrontEnd
npm run dev
```

3. Login as admin: `admin@university.edu` with password `TestPassword123!`

4. Navigate through the admin dashboard sections:
   - Overview: See system statistics
   - Analytics: View workflow stage distribution
   - Students: Manage student workflow stages
   - User Management: Add/manage supervisors and GEC members
   - Approvals: Review pending form submissions
   - Exams: View comprehensive exam schedules
   - Defenses: Monitor thesis defenses
   - System Logs: View system activity

## Troubleshooting

If you encounter issues:

1. **Database connection failed**: Check your `.env` file and PostgreSQL service
2. **Tables don't exist**: Run the schema files first
3. **No data showing**: Make sure sample data was inserted correctly
4. **Login fails**: Verify the test users were created with correct password hashes

## Production Notes

- Replace sample data with real data in production
- Change default passwords for all users
- Set up proper user registration flow
- Configure email notifications
- Set up proper logging and monitoring
