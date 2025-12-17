/**
 * Notifications Controller
 * Handles fetching notification history for users
 */

const pool = require('./database');

class NotificationsController {
  /**
   * Get notifications for the current user
   * Query params:
   *   - limit: number of notifications (default: 20)
   *   - offset: pagination offset (default: 0)
   *   - type: filter by type (booking, trip, update, promo, system)
   *   - channel: filter by channel (email, sms, push)
   *   - status: filter by status (sent, read, failed)
   */
  static async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0, type, channel, status } = req.query;

      // Validate pagination parameters
      const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
      const parsedOffset = Math.max(parseInt(offset) || 0, 0);

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
      params.push(parsedLimit, parsedOffset);

      // Execute query
      const result = await pool.query(query, params);

      // Format response with camelCase
      const notifications = result.rows.map((row) => this._formatNotification(row));

      res.json({
        success: true,
        data: notifications,
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          total: notifications.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'NOTIFICATION_FETCH_ERROR',
          message: 'Failed to fetch notifications',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get a single notification by ID
   */
  static async getNotification(req, res) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

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

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: 'Notification not found',
          },
          timestamp: new Date().toISOString(),
        });
      }

      const notification = this._formatNotification(result.rows[0]);

      res.json({
        success: true,
        data: notification,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching notification:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'NOTIFICATION_FETCH_ERROR',
          message: 'Failed to fetch notification',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      const query = `
        UPDATE notifications
        SET status = 'read', read_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2 AND status = 'sent'
        RETURNING id, status, read_at
      `;

      const result = await pool.query(query, [notificationId, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: 'Notification not found or already read',
          },
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: this._formatNotification(result.rows[0]),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update notification',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get notification stats for the user
   */
  static async getStats(req, res) {
    try {
      const userId = req.user.id;

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
      const stats = result.rows[0];

      // Get breakdown by type
      const typeQuery = `
        SELECT type, COUNT(*) as count
        FROM notifications
        WHERE user_id = $1
        GROUP BY type
      `;
      const typeResult = await pool.query(typeQuery, [userId]);
      const byType = {};
      typeResult.rows.forEach((row) => {
        byType[row.type] = parseInt(row.count);
      });

      // Get breakdown by channel
      const channelQuery = `
        SELECT channel, COUNT(*) as count
        FROM notifications
        WHERE user_id = $1
        GROUP BY channel
      `;
      const channelResult = await pool.query(channelQuery, [userId]);
      const byChannel = {};
      channelResult.rows.forEach((row) => {
        byChannel[row.channel] = parseInt(row.count);
      });

      res.json({
        success: true,
        data: {
          total: parseInt(stats.total),
          unread: parseInt(stats.unread),
          read: parseInt(stats.read),
          failed: parseInt(stats.failed),
          byType,
          byChannel,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Failed to fetch notification statistics',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Format database row to API response format
   */
  static _formatNotification(row) {
    return {
      id: row.id,
      userId: row.user_id,
      bookingId: row.booking_id,
      type: row.type,
      channel: row.channel,
      title: row.title,
      message: row.message,
      status: row.status,
      readAt: row.read_at,
      sentAt: row.sent_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

module.exports = NotificationsController;
