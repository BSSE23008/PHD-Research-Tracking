# PhD Research Tracking Backend Setup

## Prerequisites

1. **Node.js** (v14 or higher)
2. **PostgreSQL** (v12 or higher)
3. **npm** or **yarn**

## Installation Steps

### 1. Install Dependencies

All dependencies should already be installed. If not, run:

```bash
npm install
```

### 2. Database Setup

#### Create PostgreSQL Database

1. Open PostgreSQL command line or pgAdmin
2. Create a new database:

```sql
CREATE DATABASE phd_research_tracking;
```

#### Run Database Schema

1. Navigate to the `database` folder
2. Execute the `schema.sql` file in your PostgreSQL database:

```bash
psql -U postgres -d phd_research_tracking -f database/schema.sql
```

### 3. Environment Configuration

Create a `.env` file in the BackEnd directory with the following variables:

```env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=phd_research_tracking
DB_USER=postgres
DB_PASSWORD=your_actual_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex_at_least_64_characters
JWT_EXPIRE=7d

# CORS Configuration
CLIENT_URL=http://localhost:5174
```

**Important Security Notes:**

- Replace `your_actual_password` with your PostgreSQL password
- Generate a strong JWT secret (at least 64 characters)
- In production, use environment-specific values

### 4. Admin Access Code

The default admin access code is: `ADMIN_2024_PHD_TRACKER`

**For production:** Change this in `routes/auth.js` line 29, or better yet, move it to environment variables.

## Running the Server

### Development Mode (with auto-restart)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `GET /api/health` - Health check

### Testing the API

#### Health Check

```bash
curl http://localhost:5000/api/health
```

#### Register a Student

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@university.edu",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "role": "student",
    "studentId": "PHD2024001",
    "enrollmentYear": 2024,
    "researchArea": "Machine Learning",
    "agreeToTerms": true
  }'
```

#### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@university.edu",
    "password": "SecurePass123!"
  }'
```

## Database Schema

The database includes a `users` table with:

- Basic user information (name, email, password)
- Role-based fields for students, supervisors, and admins
- Timestamps and activity status
- Proper indexing for performance

## Security Features

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Comprehensive validation using express-validator
- **CORS Protection**: Configured for specific frontend origin
- **SQL Injection Prevention**: Parameterized queries
- **Role-based Access**: Different permissions for different user types

## Troubleshooting

### Common Issues

1. **Database Connection Error**

   - Check PostgreSQL is running
   - Verify database credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**

   - Change PORT in `.env` file
   - Kill process using the port: `lsof -ti:5000 | xargs kill`

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set in `.env`
   - Check token format in frontend requests

### Development Tips

- Use Postman or similar tool for API testing
- Check server logs for detailed error messages
- Enable development mode for detailed error responses
