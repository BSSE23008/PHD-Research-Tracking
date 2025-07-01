# Quick Database Setup Guide

## 🔧 Fix Database Connection Issue

### Step 1: Create .env file

Create a `.env` file in the `BackEnd` directory with this content:

```env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=phd_research_tracking
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# JWT Configuration
JWT_SECRET=jwt_secret_key_for_phd_research_tracker_application_2024_make_it_long
JWT_EXPIRE=7d

# CORS Configuration
CLIENT_URL=http://localhost:5174
```

**Important:** Replace `your_postgres_password_here` with your actual PostgreSQL password!

### Step 2: Test Database Connection

```bash
cd BackEnd
node test-db.js
```

Update the password in `test-db.js` first, then run it to test the connection.

### Step 3: Create Database (if needed)

If the test shows database doesn't exist:

```sql
-- In PostgreSQL (psql or pgAdmin):
CREATE DATABASE phd_research_tracking;
```

### Step 4: Run Database Schema

```bash
psql -U postgres -d phd_research_tracking -f database/schema.sql
```

### Step 5: Start Backend

```bash
npm run dev
```

## 🧪 Test the Complete Flow

### 1. Start Backend

```bash
cd BackEnd
npm run dev
```

Should show: ✅ Connected to PostgreSQL database

### 2. Start Frontend

```bash
cd FrontEnd
npm run dev
```

### 3. Test Signup

- Go to `http://localhost:5174`
- Click "Sign Up"
- Fill the form:
  - **Name:** Test User
  - **Email:** test@example.com
  - **Password:** Test123!@
  - **Role:** PhD Student
  - **Student ID:** PHD2024001
  - **Enrollment Year:** 2024
  - **Research Area:** Computer Science

### 4. Check Database

After successful signup, check if data is stored:

```sql
SELECT * FROM users;
```

## 🐛 Troubleshooting

### Backend not connecting to database:

1. Check PostgreSQL is running
2. Verify password in `.env` file
3. Ensure database exists

### Frontend not connecting to backend:

1. Check backend is running on port 5000
2. Look for CORS errors in browser console
3. Verify API endpoints are accessible

### Signup data not saving:

1. Check backend logs for errors
2. Verify JWT_SECRET is set in `.env`
3. Check database table exists (`users`)

## 📊 Expected Results

✅ **Backend:** "✅ Connected to PostgreSQL database"  
✅ **Frontend:** Login/Signup pages working  
✅ **Dashboard:** Shows after successful login  
✅ **Database:** User data stored in `users` table
