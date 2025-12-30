// repositories/busRepository.js
const pool = require('../database');

class BusRepository {
  // Tạo xe mới (POST /buses)
  async create(busData) {
    const {
      operator_id,
      name,
      model,
      plate_number,
      type = 'standard',
      capacity,
      amenities = [],
      status = 'maintenance',
      image_urls = [],
    } = busData;

    const modelResult = await pool.query(
      //'SELECT bus_model_id, total_seats FROM bus_models WHERE name ILIKE $1',
      'SELECT bus_model_id FROM bus_models WHERE name ILIKE $1',
      [model.trim()]
    );
    if (modelResult.rows.length === 0) {
      throw new Error('BUS_MODEL_NOT_FOUND');
    }
    const busModelRow = modelResult.rows[0];

    // // Kiểm tra capacity có khớp với model không (tùy chọn, có thể bỏ nếu không cần)
    // if (Number(capacity) !== Number(busModelRow.total_seats)) {
    //   throw new Error('CAPACITY_MISMATCH');
    // }

    const amenitiesJson = Array.isArray(amenities) ? JSON.stringify(amenities) : '[]';
    const imageUrlsJson = Array.isArray(image_urls) ? JSON.stringify(image_urls) : '[]';

    const query = `
    INSERT INTO buses (
      operator_id, bus_model_id, license_plate, plate_number,
      type, seat_capacity, amenities, status, image_url
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

    const values = [
      operator_id,
      busModelRow.bus_model_id,
      plate_number,
      plate_number,
      type,
      capacity,
      amenitiesJson,
      status,
      imageUrlsJson,
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
  async findAll({
    limit = 20,
    offset = 0,
    status,
    search,
    type,
    operator_id,
    has_seat_layout,
  } = {}) {
    try {
      let countQuery = `SELECT COUNT(*) as total FROM buses b JOIN bus_models bm ON b.bus_model_id = bm.bus_model_id JOIN operators o ON b.operator_id = o.operator_id LEFT JOIN seat_layouts sl ON b.bus_id = sl.bus_id`;
      let query = `SELECT
        b.bus_id,
        b.operator_id,           -- THÊM DÒNG NÀY (rất quan trọng)
        b.license_plate,
        b.plate_number,
        b.type,
        b.seat_capacity,
        b.amenities,
        b.status,
        b.image_url,
        b.created_at,
        bm.name as model_name,
        --bm.total_seats,
        o.name as operator_name,
        CASE WHEN sl.layout_json IS NOT NULL THEN true ELSE false END as has_seat_layout
      FROM buses b
      JOIN bus_models bm ON b.bus_model_id = bm.bus_model_id
      JOIN operators o ON b.operator_id = o.operator_id
      LEFT JOIN seat_layouts sl ON b.bus_id = sl.bus_id`;

      const values = [];
      let index = 1;

      // Build WHERE clause
      const whereConditions = [];

      if (status) {
        whereConditions.push(`b.status = $${index}`);
        values.push(status);
        index++;
      }

      if (type) {
        whereConditions.push(`b.type = $${index}`);
        values.push(type);
        index++;
      }

      if (operator_id) {
        whereConditions.push(`b.operator_id = $${index}`);
        values.push(operator_id);
        index++;
      }

      if (has_seat_layout !== undefined && has_seat_layout !== '') {
        const hasSeatLayout = has_seat_layout === 'true' || has_seat_layout === true;
        whereConditions.push(`(sl.layout_json IS ${hasSeatLayout ? 'NOT' : ''} NULL)`);
      }

      if (search) {
        // Search in bus name, model name, plate number, or license plate
        whereConditions.push(`(
          UPPER(b.plate_number) LIKE UPPER($${index}) OR
          UPPER(b.license_plate) LIKE UPPER($${index}) OR
          UPPER(bm.name) LIKE UPPER($${index})
        )`);
        values.push(`%${search}%`);
        index++;
      }

      if (whereConditions.length > 0) {
        const whereClause = ` WHERE ${whereConditions.join(' AND ')}`;
        countQuery += whereClause;
        query += whereClause;
      }

      // Get total count
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Add LIMIT and OFFSET with correct parameter indices
      const limitIndex = index;
      const offsetIndex = index + 1;
      query += ` ORDER BY b.created_at DESC, b.bus_id DESC LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
      values.push(limit, offset);

      const result = await pool.query(query, values);

      return {
        data: result.rows,
        total: total,
        limit: limit,
        offset: offset,
      };
    } catch (err) {
      console.error('Error in findAll buses:', err);
      throw err;
    }
  }

  // Tìm theo ID (GET /buses/:id)
  async findById(id) {
    const query = `
    SELECT 
      b.*,
      b.operator_id,           -- thêm lại cho chắc
      bm.name as model_name,
      --bm.total_seats,
      sl.layout_json
    FROM buses b
    JOIN bus_models bm ON b.bus_model_id = bm.bus_model_id
    LEFT JOIN seat_layouts sl ON sl.bus_id = b.bus_id
    WHERE b.bus_id = $1
  `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Cập nhật thông tin xe (PUT /buses/:id)
  async update(id, busData) {
    const allowedFields = [
      'plate_number',
      'type',
      'amenities',
      'status',
      'image_url',
      'image_urls',
    ];
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(busData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'amenities') {
          const amenitiesJson = Array.isArray(value) ? JSON.stringify(value) : '[]';
          fields.push(`${key} = $${index++}`);
          values.push(amenitiesJson);
        } else if (key === 'image_urls' || key === 'image_url') {
          // Store multiple images as JSON array in image_url field
          const imageUrlsJson = Array.isArray(value) ? JSON.stringify(value) : '[]';
          fields.push(`image_url = $${index++}`);
          values.push(imageUrlsJson);
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

    console.log('[BUS UPDATE]', { bus_id: id, query, values });
    const result = await pool.query(query, values);
    console.log('[BUS UPDATE RESULT]', result.rows[0]);
    return result.rows[0] || null;
  }

  // Xóa xe (hoặc đổi status thành maintenance) (DELETE /buses/:id)
  async delete(id) {
    const query = `
      UPDATE buses SET status = 'maintenance', updated_at = CURRENT_TIMESTAMP
      WHERE bus_id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Check if bus has any active trips
  async hasActiveTrips(busId) {
    const query = `
      SELECT COUNT(*) as active_trip_count 
      FROM trips 
      WHERE bus_id = $1 AND status IN ('scheduled', 'in_progress')
    `;
    const result = await pool.query(query, [busId]);
    return parseInt(result.rows[0]?.active_trip_count || 0);
  }

  // Deactivate bus (PUT /buses/:id/deactivate)
  async deactivate(id) {
    const query = `
      UPDATE buses SET status = 'maintenance', updated_at = CURRENT_TIMESTAMP
      WHERE bus_id = $1 AND status != 'maintenance'
      RETURNING *;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Activate bus (PUT /buses/:id/activate)
  async activate(id) {
    const query = `
      UPDATE buses SET status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE bus_id = $1 AND status != 'active'
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
