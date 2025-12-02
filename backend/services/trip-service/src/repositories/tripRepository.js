// repositories/tripRepository.js
const pool = require('../database');

class TripRepository {
  // Helper để tạo câu SELECT đầy đủ các trường theo interface Trip
  _getSelectClause() {
    return `
      SELECT 
        t.trip_id, t.departure_time, t.arrival_time, t.base_price, t.status, t.policies::jsonb AS policies,
        
        -- Route info
        r.route_id, r.origin, r.destination, r.distance_km, r.estimated_minutes,
        
        -- Operator info
        o.operator_id, o.name as operator_name, o.rating as operator_rating, o.logo_url as operator_logo,
        
        -- Bus info
        b.bus_id, b.plate_number, b.type as bus_type, bm.name as bus_model,
        bm.total_seats, b.amenities::jsonb AS amenities,
        
        -- Availability (subquery for booked seats)
        (
          SELECT COUNT(*) 
          FROM bookings bk 
          WHERE bk.trip_id = t.trip_id AND bk.status = 'confirmed'
        ) as booked_seats
        
      FROM trips t
      JOIN routes r ON t.route_id = r.route_id
      JOIN operators o ON r.operator_id = o.operator_id
      JOIN buses b ON t.bus_id = b.bus_id
      JOIN bus_models bm ON b.bus_model_id = bm.bus_model_id
    `;
  }

  // Helper để lấy pickup/dropoff points (từ route_stops, tính time dựa trên departure_time + offset)
  async _getPointsForTrip(trip_id, route_id, departure_time) {
    const query = `
      SELECT 
        stop_id as point_id, name, address, 
        (departure_time + INTERVAL '1 minute' * estimated_time_offset) AS time
      FROM route_stops 
      WHERE route_id = $1
      ORDER BY sequence
    `;
    const result = await pool.query(query, [route_id]);
    const points = result.rows.map(row => ({
      point_id: row.point_id,
      name: row.name,
      address: row.address,
      time: row.time.toISOString()
    }));
    // Giả định tất cả là pickup/dropoff tương tự, nếu cần phân biệt thì split dựa trên sequence
    return { pickup_points: points.slice(0, points.length / 2), dropoff_points: points.slice(points.length / 2) };
  }

  // Helper mapping từ DB Row sang Trip interface (snake_case)
  async _mapRowToTrip(row) {
    if (!row) return null;

    const { pickup_points, dropoff_points } = await this._getPointsForTrip(row.trip_id, row.route_id, row.departure_time);

    const total_seats = parseInt(row.total_seats);
    const booked_seats = parseInt(row.booked_seats || 0);
    const available_seats = total_seats - booked_seats;

    // Tính duration
    const dep_time = new Date(row.departure_time);
    const arr_time = new Date(row.arrival_time);
    const duration = Math.round((arr_time - dep_time) / 60000);

    return {
      trip_id: row.trip_id,
      route: {
        route_id: row.route_id,
        origin: row.origin,
        destination: row.destination,
        distance_km: parseFloat(row.distance_km),
        estimated_minutes: parseInt(row.estimated_minutes)
      },
      operator: {
        operator_id: row.operator_id,
        name: row.operator_name,
        rating: parseFloat(row.operator_rating || 0),
        logo: row.operator_logo
      },
      bus: {
        bus_id: row.bus_id,
        model: row.bus_model,
        plate_number: row.plate_number,
        seat_capacity: total_seats,
        bus_type: row.bus_type,
        amenities: row.amenities || []
      },
      schedule: {
        departure_time: row.departure_time.toISOString(),
        arrival_time: row.arrival_time.toISOString(),
        duration
      },
      pricing: {
        base_price: parseFloat(row.base_price),
        currency: 'VND', // Mặc định
        service_fee: 0 // Mặc định nếu thiếu
      },
      availability: {
        total_seats,
        available_seats: available_seats > 0 ? available_seats : 0,
        occupancy_rate: total_seats > 0 ? parseFloat((booked_seats / total_seats).toFixed(2)) : 0
      },
      policies: row.policies || {
        cancellation_policy: "Standard cancellation",
        modification_policy: "Flexible",
        refund_policy: "Refundable up to 24h"
      },
      pickup_points,
      dropoff_points,
      status: row.status === 'scheduled' ? 'active' : row.status // Map để khớp interface
    };
  }

  async create(trip_data) {
    const query = `
      INSERT INTO trips (route_id, bus_id, departure_time, arrival_time, base_price, policies, status)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'active')
      RETURNING *
    `;
    const values = [
      trip_data.route_id, trip_data.bus_id, trip_data.departure_time, trip_data.arrival_time,
      trip_data.base_price, trip_data.policies || {}
    ];
    const result = await pool.query(query, values);
    
    return await this._mapRowToTrip(result.rows[0]);
  }

  async update(id, trip_data) {
    const fields = [];
    const values = [];
    let index = 1;

    if (trip_data.departure_time) { fields.push(`departure_time = $${index++}`); values.push(trip_data.departure_time); }
    if (trip_data.arrival_time) { fields.push(`arrival_time = $${index++}`); values.push(trip_data.arrival_time); }
    if (trip_data.base_price) { fields.push(`base_price = $${index++}`); values.push(trip_data.base_price); }
    if (trip_data.bus_id) { fields.push(`bus_id = $${index++}`); values.push(trip_data.bus_id); }
    if (trip_data.policies) { fields.push(`policies = $${index++}::jsonb`); values.push(trip_data.policies); }
    if (trip_data.status) { fields.push(`status = $${index++}`); values.push(trip_data.status); }

    if (fields.length === 0) return await this.findById(id);

    const query = `UPDATE trips SET ${fields.join(', ')}, updated_at = NOW() WHERE trip_id = $${index} RETURNING *`;
    values.push(id);

    const result = await pool.query(query, values);
    
    if (result.rowCount === 0) return null;
    return await this._mapRowToTrip(result.rows[0]);
  }

  async findById(id) {
    const query = `${this._getSelectClause()} WHERE t.trip_id = $1`;
    const result = await pool.query(query, [id]);
    return this._mapRowToTrip(result.rows[0]);
  }

  async checkOverlap(bus_id, departure_time, arrival_time, exclude_trip_id = null) {
    let query = `
      SELECT COUNT(*) FROM trips 
      WHERE bus_id = $1 
      AND status = 'active'
      AND departure_time < $3 AND arrival_time > $2
    `;
    const values = [bus_id, departure_time, arrival_time];
    if (exclude_trip_id) {
      query += ` AND trip_id != $4`;
      values.push(exclude_trip_id);
    }
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count) > 0;
  }

  async search(filters) {
    const {
      origin,
      destination,
      date,
      price_min,
      price_max,
      departure_start,
      departure_end,
      bus_type,
      limit = 20,
      page = 1,
      sort
    } = filters;

    const offset = (page - 1) * limit;
    const values = [];
    let index = 1;
    let where_clauses = [`t.status = 'active'`];

    // Build filters
    if (origin) { 
      where_clauses.push(`r.origin ILIKE $${index++}`); 
      values.push(`%${origin}%`); 
    }
    if (destination) { 
      where_clauses.push(`r.destination ILIKE $${index++}`); 
      values.push(`%${destination}%`); 
    }
    if (date) { 
      where_clauses.push(`DATE(t.departure_time) = $${index++}`); 
      values.push(date); 
    }
    if (price_min) { 
      where_clauses.push(`t.base_price >= $${index++}`); 
      values.push(price_min); 
    }
    if (price_max) { 
      where_clauses.push(`t.base_price <= $${index++}`); 
      values.push(price_max); 
    }
    if (departure_start) { 
      where_clauses.push(`t.departure_time >= $${index++}`); 
      values.push(departure_start); 
    }
    if (departure_end) { 
      where_clauses.push(`t.departure_time <= $${index++}`); 
      values.push(departure_end); 
    }
    if (bus_type) { 
      where_clauses.push(`b.type = $${index++}`); 
      values.push(bus_type); 
    }

    // Sort mapping
    const sort_mapping = {
      'departure_time ASC': 't.departure_time ASC',
      'departure_time DESC': 't.departure_time DESC',
      'base_price ASC': 't.base_price ASC',
      'base_price DESC': 't.base_price DESC'
    };
    const order_by = sort_mapping[sort] || 't.departure_time ASC';

    const query = `
      ${this._getSelectClause()}
      WHERE ${where_clauses.join(' AND ')}
      ORDER BY ${order_by}
      LIMIT $${index++} OFFSET $${index++}
    `;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    
    // Map tất cả rows (parallel)
    return Promise.all(result.rows.map(row => this._mapRowToTrip(row)));
  }

  async softDelete(id) {
    const query = `UPDATE trips SET status = 'inactive', updated_at = NOW() WHERE trip_id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    if (result.rowCount === 0) return null;
    return await this._mapRowToTrip(result.rows[0]);
  }
}

module.exports = new TripRepository();