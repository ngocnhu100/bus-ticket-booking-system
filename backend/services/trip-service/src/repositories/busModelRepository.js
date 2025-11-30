// repositories/busModelRepository.js (giả sử tên file là busModelRepository.js dựa trên nội dung)
const pool = require('../database');

class BusModelRepository {
  async create(modelData) {
    const { name, total_seats } = modelData;
    const query = `
      INSERT INTO bus_models (name, total_seats)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const result = await pool.query(query, [name, total_seats]);
    return result.rows[0];
  }

  async findById(id) {
    const query = `
      SELECT bm.*, sl.layout_json
      FROM bus_models bm
      LEFT JOIN seat_layouts sl ON sl.bus_model_id = bm.bus_model_id
      WHERE bm.bus_model_id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findAll() {
    const query = `
      SELECT bm.*, sl.layout_json
      FROM bus_models bm
      LEFT JOIN seat_layouts sl ON sl.bus_model_id = bm.bus_model_id
      ORDER BY bm.name;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    let index = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(data.name);
    }

    if (data.total_seats !== undefined) {
      fields.push(`total_seats = $${index++}`);
      values.push(data.total_seats);
    }

    if (fields.length === 0) return null;

    values.push(id);

    const query = `
      UPDATE bus_models SET ${fields.join(', ')}
      WHERE bus_model_id = $${index}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async setSeatLayout(busModelId, layoutJson) {
    const query = `
      INSERT INTO seat_layouts (bus_model_id, layout_json)
      VALUES ($1, $2)
      ON CONFLICT (bus_model_id) DO UPDATE SET layout_json = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [busModelId, layoutJson]);
    return result.rows[0];
  }

  async getSeatLayout(busModelId) {
    const query = 'SELECT layout_json FROM seat_layouts WHERE bus_model_id = $1;';
    const result = await pool.query(query, [busModelId]);
    return result.rows[0]?.layout_json || null;
  }
}

module.exports = new BusModelRepository();