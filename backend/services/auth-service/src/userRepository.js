const pool = require('./database');

class UserRepository {
  async create(userData) {
    const {
      email,
      phone,
      passwordHash,
      fullName,
      role = 'passenger',
      emailVerified = false,
    } = userData;
    const query = `
      INSERT INTO users (email, phone, password_hash, full_name, role, email_verified, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING user_id, email, phone, full_name, role, email_verified, created_at
    `;
    const values = [email, phone, passwordHash, fullName, role, emailVerified];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  async findByPhone(phone) {
    const query = 'SELECT * FROM users WHERE phone = $1';
    const result = await pool.query(query, [phone]);
    return result.rows[0];
  }

  async findById(userId) {
    const query = 'SELECT * FROM users WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  async getAllUsers({ page = 1, limit = 50, status, search, role }) {
    let whereConditions = [];
    const queryParams = [];
    let paramCounter = 1;

    // Filter by active/inactive status
    if (status === 'active') {
      whereConditions.push(
        '((password_hash IS NOT NULL OR google_id IS NOT NULL) AND (account_locked_until IS NULL OR account_locked_until < NOW()))'
      );
    } else if (status === 'inactive') {
      whereConditions.push(
        '((password_hash IS NULL AND google_id IS NULL) OR (account_locked_until IS NOT NULL AND account_locked_until >= NOW()))'
      );
    }

    // Filter by role
    if (role) {
      whereConditions.push(`role = $${paramCounter}`);
      queryParams.push(role);
      paramCounter++;
    }

    // Search by name or email
    if (search) {
      whereConditions.push(
        `(LOWER(full_name) LIKE $${paramCounter} OR LOWER(email) LIKE $${paramCounter})`
      );
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
        CASE 
          WHEN (password_hash IS NOT NULL OR google_id IS NOT NULL) AND (account_locked_until IS NULL OR account_locked_until < NOW()) THEN true 
          ELSE false 
        END as is_active,
        created_at,
        updated_at,
        failed_login_attempts,
        account_locked_until
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

  async getUsersCount(search = '', role = '') {
    let query = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (email ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      query += ` AND role = $${paramIndex}`;
      values.push(role);
      paramIndex++;
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count);
  }

  async findByGoogleId(googleId) {
    const query = 'SELECT * FROM users WHERE google_id = $1';
    const result = await pool.query(query, [googleId]);
    return result.rows[0];
  }

  async updateGoogleId(userId, googleId) {
    const query = 'UPDATE users SET google_id = $1 WHERE user_id = $2 RETURNING *';
    const result = await pool.query(query, [googleId, userId]);
    return result.rows[0];
  }

  async setEmailVerificationToken(userId, token, expiresAt) {
    const query = `
      UPDATE users
      SET email_verification_token = $1, email_verification_expires = $2
      WHERE user_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [token, expiresAt, userId]);
    return result.rows[0];
  }

  async findByEmailVerificationToken(token) {
    const query = `
      SELECT * FROM users
      WHERE email_verification_token = $1
      AND email_verification_expires > NOW()
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  async verifyEmail(userId) {
    const query = `
      UPDATE users
      SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires = NULL
      WHERE user_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  async clearEmailVerificationToken(userId) {
    const query = `
      UPDATE users
      SET email_verification_token = NULL, email_verification_expires = NULL
      WHERE user_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  async setPasswordResetToken(userId, token, expiresAt) {
    const query = `
      UPDATE users
      SET password_reset_token = $1, password_reset_expires = $2
      WHERE user_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [token, expiresAt, userId]);
    return result.rows[0];
  }

  async findByPasswordResetToken(token) {
    const query = `
      SELECT * FROM users
      WHERE password_reset_token = $1
      AND password_reset_expires > NOW()
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  async updatePassword(userId, hashedPassword) {
    const query = `
      UPDATE users
      SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL
      WHERE user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [hashedPassword, userId]);
    return result.rows[0];
  }

  async clearPasswordResetToken(userId) {
    const query = `
      UPDATE users
      SET password_reset_token = NULL, password_reset_expires = NULL
      WHERE user_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  async updateFailedLoginAttempts(userId, attempts, lockUntil) {
    const query = `
      UPDATE users
      SET failed_login_attempts = $1, account_locked_until = $2
      WHERE user_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [attempts, lockUntil, userId]);
    return result.rows[0];
  }

  async update(userId, updateData) {
    const allowedFields = ['email', 'phone', 'fullName', 'avatar'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    // Map camelCase to snake_case
    const fieldMap = {
      email: 'email',
      phone: 'phone',
      fullName: 'full_name',
      avatar: 'avatar',
    };

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        const dbField = fieldMap[key];
        updates.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      // No updates to make, return current user
      return this.findById(userId);
    }

    values.push(userId);
    const query = `
      UPDATE users
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE user_id = $${paramIndex}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = new UserRepository();
