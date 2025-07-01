const { Pool } = require('pg');

// Simple database connection test
const testConnection = async () => {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'phd_research_tracking',
    user: 'postgres',
    password: '', // Add your password here
  });

  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test if users table exists
    const result = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'users'");
    if (result.rows.length > 0) {
      console.log('✅ Users table exists!');
    } else {
      console.log('❌ Users table does not exist. Run the schema.sql file.');
    }
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Update the password in this file');
    console.log('3. Ensure database "phd_research_tracking" exists');
    console.log('4. Run: CREATE DATABASE phd_research_tracking;');
  }
};

testConnection(); 