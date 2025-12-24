const pool = require('../database');

/**
 * Admin Repository
 * Handles all database operations for admin user management
 */
class AdminRepository {
  /**
   * Find all admin users with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (1-indexed)
   * @param {number} options.limit - Items per page
   * @param {string} options.status - Filter by status (active/inactive)
   * @param {string} options.search - Search by name or email
   * @returns {Promise<Object>} Paginated admin users
   */
  async findAllAdmins({ page = 1, limit = 10, status, search }) {
    let whereConditions = ["role = 'admin'"];
    const queryParams = [];
    let paramCounter = 1;

    // Filter by active/inactive status (checking if password_hash exists)
    if (status === 'active') {
      whereConditions.push('password_hash IS NOT NULL');
    } else if (status === 'inactive') {
      whereConditions.push('password_hash IS NULL');
    }

    // Search by name or email
    if (search) {
      whereConditions.push(`(LOWER(full_name) LIKE $${paramCounter} OR LOWER(email) LIKE $${paramCounter})`);
      queryParams.push(`%${search.toLowerCase()}%`);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count total matching records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch paginated data
    const dataQuery = `
      SELECT 
        user_id,
        email,
        phone,
        full_name,
        role,
        email_verified,
        phone_verified,
        CASE WHEN password_hash IS NOT NULL THEN true ELSE false END as is_active,
        created_at,
        updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    queryParams.push(limit, offset);
    
    const dataResult = await pool.query(dataQuery, queryParams);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find admin user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Admin user or null
   */
  async findAdminById(userId) {
    const query = `
      SELECT 
        user_id,
        email,
        phone,
        full_name,
        role,
        email_verified,
        phone_verified,
        preferences,
        CASE WHEN password_hash IS NOT NULL THEN true ELSE false END as is_active,
        created_at,
        updated_at
      FROM users
      WHERE user_id = $1 AND role = 'admin'
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Find admin user by email
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} Admin user or null
   */
  async findAdminByEmail(email) {
    const query = `
      SELECT 
        user_id,
        email,
        phone,
        password_hash,
        full_name,
        role,
        email_verified,
        phone_verified,
        preferences,
        CASE WHEN password_hash IS NOT NULL THEN true ELSE false END as is_active,
        created_at,
        updated_at
      FROM users
      WHERE email = $1 AND role = 'admin'
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Create a new admin user
   * @param {Object} adminData - Admin user data
   * @param {string} adminData.email - Email address
   * @param {string} adminData.phone - Phone number
   * @param {string} adminData.passwordHash - Hashed password
   * @param {string} adminData.fullName - Full name
   * @returns {Promise<Object>} Created admin user
   */
  async createAdmin({ email, phone, passwordHash, fullName }) {
    const query = `
      INSERT INTO users (
        email,
        phone,
        password_hash,
        full_name,
        role,
        email_verified,
        phone_verified,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, 'admin', true, false, NOW(), NOW())
      RETURNING 
        user_id,
        email,
        phone,
        full_name,
        role,
        email_verified,
        phone_verified,
        created_at,
        updated_at
    `;
    const values = [email, phone, passwordHash, fullName];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update admin user information
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @param {string} updateData.fullName - Full name
   * @param {string} updateData.phone - Phone number
   * @param {string} updateData.email - Email address
   * @returns {Promise<Object|null>} Updated admin user or null
   */
  async updateAdmin(userId, { fullName, phone, email }) {
    const updates = [];
    const values = [];
    let paramCounter = 1;

    if (fullName !== undefined) {
      updates.push(`full_name = $${paramCounter}`);
      values.push(fullName);
      paramCounter++;
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCounter}`);
      values.push(phone);
      paramCounter++;
    }

    if (email !== undefined) {
      updates.push(`email = $${paramCounter}`);
      values.push(email);
      paramCounter++;
    }

    // Always update the updated_at timestamp
    updates.push('updated_at = NOW()');

    if (updates.length === 1) {
      // Only updated_at was added, nothing to update
      return await this.findAdminById(userId);
    }

    values.push(userId);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE user_id = $${paramCounter} AND role = 'admin'
      RETURNING 
        user_id,
        email,
        phone,
        full_name,
        role,
        email_verified,
        phone_verified,
        CASE WHEN password_hash IS NOT NULL THEN true ELSE false END as is_active,
        created_at,
        updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Deactivate admin user (set password_hash to NULL)
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Deactivated admin user or null
   */
  async deactivateAdmin(userId) {
    const query = `
      UPDATE users
      SET 
        password_hash = NULL,
        updated_at = NOW()
      WHERE user_id = $1 AND role = 'admin'
      RETURNING 
        user_id,
        email,
        phone,
        full_name,
        role,
        email_verified,
        phone_verified,
        CASE WHEN password_hash IS NOT NULL THEN true ELSE false END as is_active,
        created_at,
        updated_at
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Update admin password
   * @param {string} userId - User ID
   * @param {string} passwordHash - New hashed password
   * @returns {Promise<Object|null>} Updated admin user or null
   */
  async updateAdminPassword(userId, passwordHash) {
    const query = `
      UPDATE users
      SET 
        password_hash = $1,
        updated_at = NOW()
      WHERE user_id = $2 AND role = 'admin'
      RETURNING 
        user_id,
        email,
        phone,
        full_name,
        role,
        email_verified,
        phone_verified,
        CASE WHEN password_hash IS NOT NULL THEN true ELSE false END as is_active,
        created_at,
        updated_at
    `;
    const result = await pool.query(query, [passwordHash, userId]);
    return result.rows[0] || null;
  }

  /**
   * Count total admin users
   * @returns {Promise<number>} Total admin count
   */
  async countAdmins() {
    const query = "SELECT COUNT(*) as total FROM users WHERE role = 'admin'";
    const result = await pool.query(query);
    return parseInt(result.rows[0].total);
  }

  /**
   * Count active admin users
   * @returns {Promise<number>} Active admin count
   */
  async countActiveAdmins() {
    const query = "SELECT COUNT(*) as total FROM users WHERE role = 'admin' AND password_hash IS NOT NULL";
    const result = await pool.query(query);
    return parseInt(result.rows[0].total);
  }
}

module.exports = new AdminRepository();
