const { Pool } = require('pg');

let pool;

if (process.env.DATABASE_URL) {
  console.log('🔌 Using DATABASE_URL:', process.env.DATABASE_URL);
  // Use DATABASE_URL if provided (for production/Docker)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    min: 1,
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    connectionTimeoutMillis: 10000, // 10 seconds
    query_timeout: 10000, // 10 seconds
    idleTimeoutMillis: 30000, // 30 seconds
  });
} else {
  console.log('🔌 Using individual env vars');
  // Use individual environment variables (for development)
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: true, // Required for Neon
    min: 1,
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    connectionTimeoutMillis: 10000, // 10 seconds
    query_timeout: 10000, // 10 seconds
    idleTimeoutMillis: 30000, // 30 seconds
  });
}

module.exports = pool;
