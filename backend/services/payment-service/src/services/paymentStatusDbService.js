// services/paymentStatusDbService.js
// Payment status service using PostgreSQL
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function getPayment(id) {
  const res = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
  return res.rows[0];
}

async function setPayment(id, data) {
  await pool.query(
    'INSERT INTO payments (id, status, gateway_ref, metadata) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET status = $2, gateway_ref = $3, metadata = $4',
    [id, data.status, data.gatewayRef, JSON.stringify(data.metadata || {})]
  );
}

async function updatePaymentStatus(id, status, gatewayRef) {
  await pool.query(
    'UPDATE payments SET status = $2, gateway_ref = $3 WHERE id = $1',
    [id, status, gatewayRef]
  );
}

module.exports = {
  getPayment,
  setPayment,
  updatePaymentStatus,
};
