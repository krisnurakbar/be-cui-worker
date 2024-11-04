const { Pool } = require('pg');  // Import the Pool class from pg

// Create a new pool for managing connections to the PostgreSQL database using the DB_URL
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:zGUSLys4T7rN@ep-floral-breeze-a110e1ui.ap-southeast-1.aws.neon.tech/neondb?sslmode=require', // Use DB_URL directly
  ssl: {
    require: true,     // This is for local development only, use SSL in production
    rejectUnauthorized: false, // Allow self-signed certificates; adjust as necessary
  },
});

// Export the pool instance
module.exports = pool;
