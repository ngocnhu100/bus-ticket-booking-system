// repositories/busRepository.js
const pool = require('../database');

class BusRepository {
  // Tạo xe mới
  async create(busData) {
    const { license_plate, bus_model_id, amenities = {} } = busData;
    const query = `
      INSERT INTO buses (license_plate, bus_model_id, amenities)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await pool.query(query, [license_plate, bus_model_id, JSON.stringify(amenities)]);
    return result.rows[0];
  }

  // Tìm theo ID
  async findById(id) {
    const query = `
      SELECT 
        b.*,
        bm.name as model_name,
        bm.total_seats,
        sl.layout_json
      FROM buses b
      JOIN bus_models bm ON b.bus_model_id = bm.bus_model_id
      LEFT JOIN seat_layouts sl ON sl.bus_model_id = bm.bus_model_id
      WHERE b.bus_id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Tìm theo biển số (duy nhất)
  async findByLicensePlate(license_plate) {
    const query = 'SELECT * FROM buses WHERE license_plate = $1;';
    const result = await pool.query(query, [license_plate]);
    return result.rows[0] || null;
  }

  // Lấy tất cả xe
  async findAll({ limit = 50, offset = 0, status } = {}) {
    let query = `
      SELECT 
        b.*,
        bm.name as model_name,
        bm.total_seats
      FROM buses b
      JOIN bus_models bm ON b.bus_model_id = bm.bus_model_id
    `;
    const values = [];
    let index = 1;

    if (status) {
      query += ` WHERE b.status = $${index++}`;
      values.push(status);
    }

    query += ` ORDER BY b.created_at DESC LIMIT $${index++} OFFSET $${index};`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Cập nhật thông tin xe
  async update(id, busData) {
    const allowedFields = ['license_plate', 'bus_model_id', 'amenities', 'status'];
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(busData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'amenities') {
          fields.push(`${key} = $${index++}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${index++}`);
          values.push(value);
        }
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE buses
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE bus_id = $${index}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  // Xóa xe (hoặc đổi status thành inactive)
  async delete(id) {
    const query = `
      UPDATE buses SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE bus_id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Kiểm tra xe có đang chạy trong khoảng thời gian không (dùng khi xếp lịch)
  async isBusy(bus_id, departure_time, arrival_time, excludeTripId = null) {
    let query = `
      SELECT COUNT(*) as count
      FROM trips
      WHERE bus_id = $1
        AND departure_time < $3
        AND arrival_time > $2
        AND status = 'active'
    `;
    const values = [bus_id, departure_time, arrival_time];

    if (excludeTripId) {
      query += ` AND trip_id != $4`;
      values.push(excludeTripId);
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count) > 0;
  }
}

module.exports = new BusRepository();