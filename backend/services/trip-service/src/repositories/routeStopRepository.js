// repositories/routeStopRepository.js
const pool = require('../database');

class RouteStopRepository {
  // Thêm điểm dừng vào tuyến
  async create(routeId, stopData) {
    const {
      stop_name,
      sequence,
      arrival_offset_minutes = 0,
      departure_offset_minutes = 0,
      address = '',
    } = stopData;

    const query = `
      INSERT INTO route_stops (
        route_id, stop_name, sequence,
        arrival_offset_minutes, departure_offset_minutes, address
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const values = [
      routeId,
      stop_name,
      sequence,
      arrival_offset_minutes,
      departure_offset_minutes,
      address || '',
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Lấy tất cả điểm dừng của một tuyến
  async findByRouteId(routeId) {
    const query = `
      SELECT 
        stop_id,
        route_id,
        stop_name,
        sequence,
        arrival_offset_minutes,
        departure_offset_minutes,
        address,
        is_pickup,
        is_dropoff,
        created_at,
        updated_at
      FROM route_stops
      WHERE route_id = $1
      ORDER BY sequence ASC;
    `;
    const result = await pool.query(query, [routeId]);
    return result.rows;
  }

  // Cập nhật điểm dừng
  async update(stopId, stopData) {
    const {
      stop_name,
      sequence,
      arrival_offset_minutes,
      departure_offset_minutes,
      address,
    } = stopData;

    const query = `
      UPDATE route_stops
      SET 
        stop_name = $1,
        sequence = $2,
        arrival_offset_minutes = COALESCE($3, arrival_offset_minutes),
        departure_offset_minutes = COALESCE($4, departure_offset_minutes),
        address = COALESCE($5, address),
        updated_at = CURRENT_TIMESTAMP
      WHERE stop_id = $6
      RETURNING *;
    `;

    const values = [
      stop_name,
      sequence,
      arrival_offset_minutes ?? null,
      departure_offset_minutes ?? null,
      address ?? null,
      stopId,
    ];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  // Xóa điểm dừng
  async delete(stopId) {
    const query = 'DELETE FROM route_stops WHERE stop_id = $1 RETURNING *;';
    const result = await pool.query(query, [stopId]);
    return result.rows[0] || null;
  }

  // Kiểm tra sequence đã tồn tại chưa (trong cùng route)
  async isSequenceTaken(routeId, sequence, excludeStopId = null) {
    let query = `
      SELECT 1 FROM route_stops
      WHERE route_id = $1 AND sequence = $2
    `;
    const values = [routeId, sequence];

    if (excludeStopId) {
      query += ` AND stop_id != $3`;
      values.push(excludeStopId);
    }

    const result = await pool.query(query, values);
    return result.rowCount > 0;
  }
}

module.exports = new RouteStopRepository();