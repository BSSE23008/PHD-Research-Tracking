require('dotenv').config();


const config = {
  // Server configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Client configuration
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // Database configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || 'phd_research_tracking',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD,
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-default-jwt-secret-change-this-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // Security configuration
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
  
  // Admin configuration
  ADMIN_CODE: process.env.ADMIN_CODE || 'ADMIN_2024_PHD_TRACKER'
};



module.exports = config; 