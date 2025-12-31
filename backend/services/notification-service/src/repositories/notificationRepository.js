const pool = require('../database');

class NotificationRepository {
  /**
   * Get notifications for a user with pagination and filters
   */
  static async getNotifications(userId, { limit = 20, offset = 0, type, channel, status }) {
    // Build dynamic query with filters
    let query = `
      SELECT
        id,
        user_id,
        booking_id,
        type,
        channel,
        title,
        message,
        status,
        read_at,
        sent_at,
        created_at,
        updated_at
      FROM notifications
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    // Add optional filters
    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (channel) {
      query += ` AND channel = $${paramIndex}`;
      params.push(channel);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Order by most recent first
    query += ` ORDER BY sent_at DESC`;

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get a single notification by ID and user ID
   */
  static async getNotification(notificationId, userId) {
    const query = `
      SELECT
        id,
        user_id,
        booking_id,
        type,
        channel,
        title,
        message,
        status,
        read_at,
        sent_at,
        created_at,
        updated_at
      FROM notifications
      WHERE id = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [notificationId, userId]);
    return result.rows[0] || null;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    const query = `
      UPDATE notifications
      SET status = 'read', read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2 AND status = 'sent'
      RETURNING id, status, read_at
    `;

    const result = await pool.query(query, [notificationId, userId]);
    return result.rows[0] || null;
  }

  /**
   * Get notification stats for a user
   */
  static async getStats(userId) {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as unread,
        COUNT(CASE WHEN status = 'read' THEN 1 END) as read,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(DISTINCT type) as types,
        COUNT(DISTINCT channel) as channels
      FROM notifications
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Get breakdown by type for stats
   */
  static async getTypeBreakdown(userId) {
    const query = `
      SELECT type, COUNT(*) as count
      FROM notifications
      WHERE user_id = $1
      GROUP BY type
    `;
    const result = await pool.query(query, [userId]);
    const byType = {};
    result.rows.forEach((row) => {
      byType[row.type] = parseInt(row.count);
    });
    return byType;
  }

  /**
   * Get breakdown by channel for stats
   */
  static async getChannelBreakdown(userId) {
    const query = `
      SELECT channel, COUNT(*) as count
      FROM notifications
      WHERE user_id = $1
      GROUP BY channel
    `;
    const result = await pool.query(query, [userId]);
    const byChannel = {};
    result.rows.forEach((row) => {
      byChannel[row.channel] = parseInt(row.count);
    });
    return byChannel;
  }

  /**
   * Find booking by booking reference
   */
  static async findBookingByReference(bookingReference) {
    const query = `
      SELECT b.booking_id, b.user_id, b.contact_email, b.contact_phone, u.preferences
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.user_id
      WHERE b.booking_reference = $1
    `;
    const result = await pool.query(query, [bookingReference]);
    const booking = result.rows[0] || null;
    if (booking) {
      booking.preferences = booking.preferences || {};
    }
    return booking;
  }

  /**
   * Create a new notification
   */
  static async createNotification(notificationData) {
    const {
      userId,
      bookingId,
      type,
      channel,
      title,
      message,
      status = 'sent',
      sentAt = new Date(),
      createdAt = new Date(),
      updatedAt = new Date(),
    } = notificationData;

    const query = `
      INSERT INTO notifications (
        user_id,
        booking_id,
        type,
        channel,
        title,
        message,
        status,
        sent_at,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

    const result = await pool.query(query, [
      userId,
      bookingId,
      type,
      channel,
      title,
      message,
      status,
      sentAt,
      createdAt,
      updatedAt,
    ]);

    return result.rows[0];
  }
}

module.exports = NotificationRepository;
