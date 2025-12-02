// repositories/routeRepository.js
const pool = require('../database');

class RouteRepository {
  async create(routeData) {
    const { operator_id, origin, destination, distance_km, estimated_minutes } = routeData;
    const query = `
      INSERT INTO routes (operator_id, origin, destination, distance_km, estimated_minutes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await pool.query(query, [operator_id, origin, destination, distance_km, estimated_minutes]);
    return result.rows[0];
  }

  async findById(id) {
    const query = 'SELECT * FROM routes WHERE route_id = $1;';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findAll() {
    const query = `SELECT * FROM routes ORDER BY created_at DESC`;
    const result = await pool.query(query);
    return result.rows;
  }

  async update(id, routeData) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = ['origin', 'destination', 'distance_km', 'estimated_minutes'];
    for (const key of allowed) {
      if (routeData[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(routeData[key]);
      }
    }
    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE routes SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE route_id = $${idx} RETURNING *;
    `;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM route_stops WHERE route_id = $1', [id]);
      const res = await client.query('DELETE FROM routes WHERE route_id = $1 RETURNING *', [id]);
      await client.query('COMMIT');
      return res.rows[0] || null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // MỚI: Lấy stops + phân loại pickup/dropoff
  async getStopsWithTypes(routeId) {
    const query = `
      SELECT 
        stop_id,
        route_id,
        stop_name,
        address,
        sequence,
        arrival_offset_minutes,
        departure_offset_minutes,
        COALESCE(is_pickup, true) AS is_pickup,
        COALESCE(is_dropoff, true) AS is_dropoff,
        created_at,
        updated_at
      FROM route_stops
      WHERE route_id = $1
      ORDER BY sequence ASC;
    `;
    const result = await pool.query(query, [routeId]);
    return result.rows;
  }

  // MỚI: Upsert stop theo cấu trúc DB mới (dùng stop_name + 2 offset)
  async upsertStop(routeId, stopData) {
    const {
      stop_name,
      address = '',
      sequence,
      arrival_offset_minutes = 0,
      departure_offset_minutes = 0,
      is_pickup = true,
      is_dropoff = true
    } = stopData;

    const query = `
      INSERT INTO route_stops (
        route_id, 
        stop_name, 
        address, 
        sequence, 
        arrival_offset_minutes, 
        departure_offset_minutes,
        is_pickup, 
        is_dropoff
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (route_id, sequence) DO UPDATE SET
        stop_name = EXCLUDED.stop_name,
        address = EXCLUDED.address,
        arrival_offset_minutes = EXCLUDED.arrival_offset_minutes,
        departure_offset_minutes = EXCLUDED.departure_offset_minutes,
        is_pickup = EXCLUDED.is_pickup,
        is_dropoff = EXCLUDED.is_dropoff,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await pool.query(query, [
      routeId,
      stop_name,
      address,
      sequence,
      arrival_offset_minutes,
      departure_offset_minutes,
      is_pickup,
      is_dropoff
    ]);
    return result.rows[0];
  }

  // Cập nhật origin/destination từ điểm đầu và cuối (dùng stop_name)
  async updateOriginDestinationFromStops(routeId) {
    const stops = await this.getStopsWithTypes(routeId);
    if (stops.length < 2) return;

    const sorted = stops.sort((a, b) => a.sequence - b.sequence);
    const origin = sorted[0].stop_name;
    const destination = sorted[sorted.length - 1].stop_name;

    await this.update(routeId, { origin, destination });
  }
}

module.exports = new RouteRepository();