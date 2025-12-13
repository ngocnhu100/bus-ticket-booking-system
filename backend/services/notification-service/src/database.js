const { Pool } = require('pg');

let pool;

if (process.env.DATABASE_URL) {
  console.log('🔌 Using DATABASE_URL:', process.env.DATABASE_URL);
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    min: 1,
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
    idleTimeoutMillis: 30000,
  });
} else {
  console.log('🔌 Using individual env vars');
  const isNeonConnection = process.env.DB_HOST && process.env.DB_HOST.includes('neon.tech');
  const sslConfig = isNeonConnection
    ? { rejectUnauthorized: false }
    : process.env.NODE_ENV === 'production';

  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: sslConfig,
    min: 1,
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
    idleTimeoutMillis: 60000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
  });
}

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle database client:', err.message);
});

pool.on('connect', () => {
  console.log('🔌 New database client connected');
});

pool.on('remove', () => {
  console.log('🔌 Database client removed from pool');
});

module.exports = pool;
