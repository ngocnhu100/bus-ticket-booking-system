// Script: query_trips_today.js
// Tự động truy vấn các chuyến đi hôm nay từ database

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bus_ticket_dev',
  user: 'postgres',
  password: 'postgres',
});

async function main() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const res = await pool.query(
    `SELECT * FROM trips WHERE DATE(departure_time) = $1 ORDER BY departure_time`,
    [dateStr]
  );

  if (res.rows.length === 0) {
    console.log('Không có chuyến nào hôm nay:', dateStr);
  } else {
    console.log(`Danh sách chuyến đi ngày ${dateStr}:`);
    res.rows.forEach((row, i) => {
      console.log(`#${i + 1}:`, row);
    });
  }
  await pool.end();
}

main().catch(err => {
  console.error('Lỗi truy vấn:', err);
  process.exit(1);
});
