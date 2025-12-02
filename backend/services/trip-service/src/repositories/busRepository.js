// repositories/busRepository.js
const pool = require('../database');

class BusRepository {
  // Tạo xe mới (POST /buses)
 async create(busData) {
    const { 
      operator_id, 
      bus_model_id, 
      license_plate, 
      plate_number, 
      type = 'standard', 
      amenities = [], 
      status = 'active',
      image_url 
    } = busData;

    const amenitiesJson = Array.isArray(amenities) ? JSON.stringify(amenities) : '[]';

    const query = `
      INSERT INTO buses (
        operator_id, bus_model_id, license_plate, plate_number, 
        type, amenities, status, image_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const values = [
      operator_id,
      bus_model_id,
      license_plate,
      plate_number || null,
      type,
      amenitiesJson,
      status,
      image_url || null 
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Tìm theo biển số (duy nhất)
  async findByLicensePlate(license_plate) {
    const query = 'SELECT * FROM buses WHERE license_plate = $1;';
    const result = await pool.query(query, [license_plate]);
    return result.rows[0] || null;
  }

  // Lấy tất cả xe (GET /buses)
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

  // Tìm theo ID (GET /buses/:id)
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

  // Cập nhật thông tin xe (PUT /buses/:id)
  async update(id, busData) {
    const allowedFields = ['plate_number', 'type', 'amenities', 'status', 'image_url']; // Added image_url
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(busData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'amenities') {
          const amenitiesJson = Array.isArray(value) ? JSON.stringify(value) : '[]';
          fields.push(`${key} = $${index++}`);
          values.push(amenitiesJson);
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

  // Xóa xe (hoặc đổi status thành inactive) (DELETE /buses/:id)
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