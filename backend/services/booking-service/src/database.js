const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bus_ticket_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  min: 2,
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  statement_timeout: 30000,
  keepAlive: true
});

pool.on('error', (err) => {
  console.error('⚠️ Unexpected database error:', err);
});

pool.on('connect', () => {
  console.log('🔌 Database connection established');
});

module.exports = pool;
