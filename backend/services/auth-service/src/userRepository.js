const pool = require('./database');

class UserRepository {
  async create(userData) {
    const { email, phone, passwordHash, fullName, role = 'passenger', emailVerified = false } = userData;
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
    const query = 'SELECT user_id, email, phone, password_hash, full_name, role, google_id, email_verified, created_at FROM users WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
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
}

module.exports = new UserRepository();