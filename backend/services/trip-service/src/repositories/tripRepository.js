const pool = require('../database');  // Từ shared/database

class TripRepository {
  async create(tripData) {
    const { route_id, bus_id, departure_time, arrival_time, base_price } = tripData;
    const query = `
      INSERT INTO trips (route_id, bus_id, departure_time, arrival_time, base_price)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [route_id, bus_id, departure_time, arrival_time, base_price];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id, tripData) {
    const fields = [];
    const values = [];
    let index = 1;
    for (const [key, value] of Object.entries(tripData)) {
      fields.push(`${key} = $${index++}`);
      values.push(value);
    }
    values.push(id);
    const query = `UPDATE trips SET ${fields.join(', ')} WHERE trip_id = $${index} RETURNING *;`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id) {
    const query = 'SELECT * FROM trips WHERE trip_id = $1;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async checkOverlap(bus_id, departure_time, arrival_time, excludeTripId = null) {
    let query = `
      SELECT COUNT(*) FROM trips 
      WHERE bus_id = $1 
      AND departure_time < $3 AND arrival_time > $2;
    `;
    const values = [bus_id, departure_time, arrival_time];
    if (excludeTripId) {
      query = query.replace(';', ` AND trip_id != $4;`);
      values.push(excludeTripId);
    }
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count) > 0;
  }

  async search(filters) {
  const {
    origin,
    destination,
    date,
    priceMin,
    priceMax,
    departureStart,
    departureEnd,
    busModel,
    limit = 20,
    offset = 0,
    sort = 'departure_time ASC'
  } = filters;

  let query = `
    SELECT t.*, 
           r.name AS route_name, 
           r.origin, 
           r.destination, 
           bm.name AS bus_model_name
    FROM trips t
    JOIN routes r ON t.route_id = r.route_id
    JOIN buses b ON t.bus_id = b.bus_id
    JOIN bus_models bm ON b.bus_model_id = bm.bus_model_id
    WHERE t.status = 'active'
  `;

  const values = [];
  let index = 1;

  if (origin) { query += ` AND r.origin = $${index++}`; values.push(origin); }
  if (destination) { query += ` AND r.destination = $${index++}`; values.push(destination); }
  if (date) { query += ` AND DATE(t.departure_time) = $${index++}`; values.push(date); }
  if (priceMin) { query += ` AND t.base_price >= $${index++}`; values.push(priceMin); }
  if (priceMax) { query += ` AND t.base_price <= $${index++}`; values.push(priceMax); }
  if (departureStart) { query += ` AND t.departure_time >= $${index++}`; values.push(departureStart); }
  if (departureEnd) { query += ` AND t.departure_time <= $${index++}`; values.push(departureEnd); }
  if (busModel) { query += ` AND bm.name = $${index++}`; values.push(busModel); }

  const validSorts = ['departure_time ASC', 'departure_time DESC', 'base_price ASC', 'base_price DESC'];
  const sortClause = validSorts.includes(sort) ? sort : 'departure_time ASC';

  query += ` ORDER BY ${sortClause} LIMIT $${index++} OFFSET $${index++};`;
  values.push(limit, offset);

  const result = await pool.query(query, values);
  return result.rows;
}

  async countBookedSeats(tripId) {
  const result = await pool.query(
    `SELECT COUNT(*) FROM bookings WHERE trip_id = $1 AND status = 'confirmed'`,
    [tripId]
  );
  return parseInt(result.rows[0].count);
}

async hasConfirmedBooking(tripId) {
  const result = await pool.query(
    `SELECT 1 FROM bookings WHERE trip_id = $1 AND status = 'confirmed' LIMIT 1`,
    [tripId]
  );
  return result.rowCount > 0;
}

async softDelete(id) {
  const result = await pool.query(
    `UPDATE trips SET status = 'cancelled', updated_at = NOW() WHERE trip_id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
}
}

module.exports = new TripRepository();