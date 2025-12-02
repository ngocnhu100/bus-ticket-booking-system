// repositories/operatorRepository.js
const pool = require('../database');

class OperatorRepository {
  async findAll({ status, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        operator_id, name, contact_email, contact_phone, status,
        rating, logo_url, approved_at, created_at
      FROM operators
    `;
    const values = [];
    let where = [];

    if (status) {
      where.push(`status = $${values.length + 1}`);
      values.push(status);
    }

    if (where.length > 0) query += ' WHERE ' + where.join(' AND ');

    query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Đếm tổng + thống kê routes & buses
    const enriched = await Promise.all(
      result.rows.map(async (op) => {
        const stats = await pool.query(
          `SELECT 
             (SELECT COUNT(*) FROM routes WHERE operator_id = $1) as total_routes,
             (SELECT COUNT(*) FROM buses WHERE operator_id = $1) as total_buses`,
          [op.operator_id]
        );
        return {
          operatorId: op.operator_id,
          name: op.name,
          contactEmail: op.contact_email,
          contactPhone: op.contact_phone,
          status: op.status,
          rating: parseFloat(op.rating),
          logoUrl: op.logo_url,
          approvedAt: op.approved_at,
          createdAt: op.created_at,
          totalRoutes: parseInt(stats.rows[0].total_routes),
          totalBuses: parseInt(stats.rows[0].total_buses),
        };
      })
    );

    const countResult = await pool.query(`SELECT COUNT(*) FROM operators ${where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''}`, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    return { data: enriched, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

    async findById(operatorId) {
        const query = `
        SELECT operator_id, name, contact_email, contact_phone, status, rating
        FROM operators 
        WHERE operator_id = $1
    `;
    const result = await pool.query(query, [operatorId]);
    return result.rowCount > 0 ? result.rows[0] : null;
  }

  async updateStatus(operatorId, { approved, notes }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const newStatus = approved ? 'approved' : 'rejected';
      const approvedAt = approved ? 'NOW()' : null;

      const query = `
        UPDATE operators 
        SET status = $1, 
            approved_at = ${approvedAt},
            updated_at = NOW()
        WHERE operator_id = $2
        RETURNING operator_id, status, approved_at
      `;
      const result = await client.query(query, [newStatus, operatorId]);

      if (result.rowCount === 0) throw new Error('Operator not found');

      // TODO: Gửi email thông báo/email cho nhà xe (có thể dùng queue)

      await client.query('COMMIT');
      return {
        operatorId: result.rows[0].operator_id,
        status: result.rows[0].status,
        approvedAt: result.rows[0].approved_at,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new OperatorRepository();