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
      SELECT bm.*
      FROM bus_models bm
      WHERE bm.bus_model_id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findAll() {
    const query = `
      SELECT DISTINCT bm.*
      FROM bus_models bm
      ORDER BY bm.name ASC, bm.bus_model_id ASC;
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

  async setSeatLayout(busId, layoutJson) {
    const query = `
      INSERT INTO seat_layouts (bus_id, layout_json)
      VALUES ($1, $2)
      ON CONFLICT (bus_id) DO UPDATE SET layout_json = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [busId, layoutJson]);
    return result.rows[0];
  }

  async regenerateSeatsFromLayout(busId) {
    // Delete existing seats for this bus
    await pool.query('DELETE FROM seats WHERE bus_id = $1', [busId]);

    // First, get the layout to determine rows per floor
    const layoutQuery = 'SELECT layout_json FROM seat_layouts WHERE bus_id = $1;';
    const layoutResult = await pool.query(layoutQuery, [busId]);

    if (!layoutResult.rows[0]) {
      return 0; // No layout found
    }

    const layout = layoutResult.rows[0].layout_json;
    const floors = layout.floors || 1;
    const rowsPerFloor = Math.floor(layout.rows.length / floors);

    // Generate seats based on layout_json with proper floor and row mapping
    // Use DISTINCT ON to avoid duplicate seat codes in the same INSERT
    const query = `
      INSERT INTO seats (bus_id, seat_code, seat_type, position, price, row_num, col_num, is_active)
      SELECT DISTINCT ON (seat_code)
        b.bus_id,
        CASE
          WHEN jsonb_typeof(seat_element.value) = 'string' THEN seat_element.value #>> '{}'
          WHEN jsonb_typeof(seat_element.value) = 'object' THEN seat_element.value ->> 'code'
          ELSE seat_element.value #>> '{}'
        END as seat_code,
        CASE
          WHEN jsonb_typeof(seat_element.value) = 'string' AND seat_element.value #>> '{}' LIKE 'VIP%' THEN 'vip'
          WHEN jsonb_typeof(seat_element.value) = 'object' AND seat_element.value ->> 'code' LIKE 'VIP%' THEN 'vip'
          ELSE 'standard'
        END as seat_type,
        CASE
          WHEN jsonb_typeof(seat_element.value) = 'string' AND seat_element.value #>> '{}' ~ '[A-Z]$' THEN 'window'
          WHEN jsonb_typeof(seat_element.value) = 'object' AND seat_element.value ->> 'code' ~ '[A-Z]$' THEN 'window'
          ELSE 'aisle'
        END as position,
        CASE
          WHEN jsonb_typeof(seat_element.value) = 'string' THEN
            CASE WHEN seat_element.value #>> '{}' LIKE 'VIP%' THEN 50000 ELSE 0 END
          WHEN jsonb_typeof(seat_element.value) = 'object' THEN
            COALESCE((seat_element.value ->> 'price')::numeric, 0)
          ELSE 0
        END as price,
        ((row_data->>'row')::integer - 1) % $2 as row_num,
        seat_element.column_index - 1 as col_num,
        true as is_active
      FROM buses b
      JOIN seat_layouts sl ON b.bus_id = sl.bus_id
      CROSS JOIN LATERAL jsonb_array_elements(sl.layout_json->'rows') as row_data
      CROSS JOIN LATERAL jsonb_array_elements(row_data->'seats') WITH ORDINALITY as seat_element(value, column_index)
      WHERE b.bus_id = $1
        AND seat_element.value IS NOT NULL
        AND (
          (jsonb_typeof(seat_element.value) = 'string' AND seat_element.value #>> '{}' != 'null') OR
          (jsonb_typeof(seat_element.value) = 'object' AND seat_element.value ->> 'code' IS NOT NULL)
        )
      ON CONFLICT (bus_id, seat_code) DO UPDATE SET
        seat_type = EXCLUDED.seat_type,
        position = EXCLUDED.position,
        price = EXCLUDED.price,
        row_num = EXCLUDED.row_num,
        col_num = EXCLUDED.col_num,
        is_active = EXCLUDED.is_active;
    `;
    const result = await pool.query(query, [busId, rowsPerFloor]);

    // Update seat_capacity based on actual seats generated
    const updateCapacityQuery = `
      UPDATE buses
      SET seat_capacity = (
        SELECT COUNT(*) FROM seats
        WHERE bus_id = $1 AND is_active = true
      )
      WHERE bus_id = $1;
    `;
    await pool.query(updateCapacityQuery, [busId]);

    return result.rowCount;
  }

  async getSeatLayout(busId) {
    const query = 'SELECT layout_json FROM seat_layouts WHERE bus_id = $1;';
    const result = await pool.query(query, [busId]);
    return result.rows[0]?.layout_json || null;
  }

  async deleteSeatLayout(busId) {
    // Delete the seat layout
    const deleteLayoutQuery = 'DELETE FROM seat_layouts WHERE bus_id = $1 RETURNING *;';
    const layoutResult = await pool.query(deleteLayoutQuery, [busId]);

    // Also delete all seats for this bus since they were generated from the layout
    const deleteSeatsQuery = 'DELETE FROM seats WHERE bus_id = $1;';
    await pool.query(deleteSeatsQuery, [busId]);

    return layoutResult.rowCount > 0;
  }
}

module.exports = new BusModelRepository();
