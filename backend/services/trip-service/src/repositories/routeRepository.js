// repositories/routeRepository.js
const pool = require('../database');

class RouteRepository {
  // Tạo tuyến đường mới
  async create(routeData) {
    const { name, origin, destination } = routeData;
    const query = `
      INSERT INTO routes (name, origin, destination)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await pool.query(query, [name, origin, destination]);
    return result.rows[0];
  }

  // Tìm theo ID
  async findById(id) {
    const query = 'SELECT * FROM routes WHERE route_id = $1;';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Tìm tất cả tuyến đường (có phân trang)
  async findAll({ limit = 50, offset = 0 } = {}) {
    const query = `
      SELECT * FROM routes
      ORDER BY origin, destination, name
      LIMIT $1 OFFSET $2;
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  // Cập nhật tuyến đường
  async update(id, routeData) {
    const allowedFields = ['name', 'origin', 'destination'];
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(routeData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = $${index++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE routes
        routes
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE route_id = $${index}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  // Xóa tuyến đường (soft delete hoặc hard delete tùy chiến lược)
  async delete(id) {
    const query = 'DELETE FROM routes WHERE route_id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Thêm điểm dừng cho tuyến
  async addStop(route_id, stopData) {
    const { stop_name, sequence, arrival_offset_minutes, departure_offset_minutes } = stopData;
    const query = `
      INSERT INTO route_stops (route_id, stop_name, sequence, arrival_offset_minutes, departure_offset_minutes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      route_id,
      stop_name,
      sequence,
      arrival_offset_minutes || null,
      departure_offset_minutes || null
    ]);
    return result.rows[0];
  }

  // Lấy danh sách điểm dừng theo thứ tự
  async getStops(route_id) {
    const query = `
      SELECT * FROM route_stops
      WHERE route_id = $1
      ORDER BY sequence ASC;
    `;
    const result = await pool.query(query, [route_id]);
    return result.rows;
  }

  // Xóa điểm dừng
  async removeStop(stop_id) {
    const query = 'DELETE FROM route_stops WHERE route_stop_id = $1 RETURNING *;';
    const result = await pool.query(query, [stop_id]);
    return result.rows[0] || null;
  }

  // Tìm tuyến theo origin + destination (dùng cho tìm kiếm chuyến)
  async findByOriginAndDestination(origin, destination) {
    const query = `
      SELECT * FROM routes
      WHERE LOWER(origin) = LOWER($1)
        AND LOWER(destination) = LOWER($2);
    `;
    const result = await pool.query(query, [origin, destination]);
    return result.rows[0] || null;
  }
}

module.exports = new RouteRepository();