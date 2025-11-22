const { Pool } = require('pg');

let pool;

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL if provided (for production/Docker)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    max: parseInt(process.env.DB_POOL_MAX) || 10,
  });
} else {
  // Use individual environment variables (for development)
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    max: parseInt(process.env.DB_POOL_MAX) || 10,
  });
}

module.exports = pool;
