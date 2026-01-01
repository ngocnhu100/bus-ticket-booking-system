/**
 * Notifications Controller
 * Handles fetching notification history for users
 */

const NotificationRepository = require('./repositories/notificationRepository');

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
      // Handle both JWT payload structures from auth service
      const userId = req.user.id || req.user.userId || req.user.sub;
      console.log('🔍 User from JWT token:', { userId, user: req.user });
      const { limit = 20, offset = 0, type, channel, status } = req.query;

      // Validate pagination parameters
      const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
      const parsedOffset = Math.max(parseInt(offset) || 0, 0);

      // Get notifications from repository
      const notifications = await NotificationRepository.getNotifications(userId, {
        limit: parsedLimit,
        offset: parsedOffset,
        type,
        channel,
        status,
      });

      // Format response with camelCase
      const formattedNotifications = notifications.map((row) => this._formatNotification(row));

      res.json({
        success: true,
        data: formattedNotifications,
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          total: formattedNotifications.length,
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
      const userId = req.user.id || req.user.userId || req.user.sub;
      const { notificationId } = req.params;

      const notification = await NotificationRepository.getNotification(notificationId, userId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: 'Notification not found',
          },
          timestamp: new Date().toISOString(),
        });
      }

      const formattedNotification = this._formatNotification(notification);

      res.json({
        success: true,
        data: formattedNotification,
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
      const userId = req.user.id || req.user.userId || req.user.sub;
      const { notificationId } = req.params;

      const notification = await NotificationRepository.markAsRead(notificationId, userId);

      if (!notification) {
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
        data: this._formatNotification(notification),
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
      const userId = req.user.id || req.user.userId || req.user.sub;

      const stats = await NotificationRepository.getStats(userId);

      // Get breakdown by type
      const byType = await NotificationRepository.getTypeBreakdown(userId);

      // Get breakdown by channel
      const byChannel = await NotificationRepository.getChannelBreakdown(userId);

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

  /**
   * Send trip update notifications to all passengers of a trip
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async sendTripUpdateNotifications(req, res) {
    try {
      const { email, updateData } = req.body;

      if (!email || !updateData) {
        console.log('❌ Missing required fields - email:', !!email, 'updateData:', !!updateData);
        return res.status(400).json({
          success: false,
          error: { code: 'VAL_001', message: 'email and updateData are required' },
          timestamp: new Date().toISOString(),
        });
      }

      const emailService = require('./services/emailService');

      try {
        console.log(`📧 Sending trip update email to ${email}`);
        console.log(`📧 Full updateData being sent to email:`, JSON.stringify(updateData, null, 2));

        // Get booking details to ensure we have customer contact info for booking lookup
        const booking = await NotificationRepository.findBookingByReference(
          updateData.bookingReference
        );

        if (booking) {
          // Ensure updateData has customer contact info for booking lookup URL
          updateData.customerEmail = updateData.customerEmail || booking.contact_email;
          updateData.customerPhone = updateData.customerPhone || booking.contact_phone;
          console.log(
            `📧 Using customer contact: ${updateData.customerEmail}, ${updateData.customerPhone}`
          );
        } else {
          console.warn(
            `⚠️ Booking ${updateData.bookingReference} not found for customer contact lookup`
          );
        }

        // Extract user preferences (with defaults for guest bookings)
        const userPreferences = booking?.preferences || {};
        console.log(
          `📧 [sendTripUpdateNotifications] User preferences:`,
          JSON.stringify(userPreferences, null, 2)
        );
        const notificationPrefs = userPreferences.notifications || {
          tripUpdates: { email: true, sms: false },
        };
        const tripUpdatePrefs = notificationPrefs.tripUpdates || { email: true, sms: false };

        // Check if user has enabled email updates
        // Critical updates (cancellation, delay) always send, schedule updates check preference
        const isCriticalUpdate =
          updateData.updateType === 'cancellation' || updateData.updateType === 'delay';
        const shouldSendEmail = isCriticalUpdate || tripUpdatePrefs.email === true;

        // Send Email update if user preference enabled and email exists
        if (shouldSendEmail && email) {
          // Send email
          await emailService.sendTripUpdateEmail(email, updateData);

          // Create notification record (booking was already fetched above)
          const notificationTitles = {
            cancellation: 'Trip Cancelled',
            delay: 'Trip Delayed',
            schedule_change: 'Trip Schedule Updated',
          };

          const notificationMessages = {
            cancellation: `Your trip has been cancelled. ${updateData.reason || ''}`,
            delay: `Your trip has been delayed. Please check your email for updated departure time.`,
            schedule_change: `Your trip schedule has been updated. Please check your email for details.`,
          };

          const title = notificationTitles[updateData.updateType] || 'Trip Schedule Updated';
          const message =
            notificationMessages[updateData.updateType] ||
            `Your trip schedule has been updated. Please check your email for details.`;

          // Use the booking data we already fetched above
          if (booking) {
            await NotificationRepository.createNotification({
              userId: booking.user_id,
              bookingId: booking.booking_id,
              type: 'update',
              channel: 'email',
              title,
              message,
              status: 'sent',
              sentAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }

          res.json({
            success: true,
            message: 'Trip update notification sent successfully',
            timestamp: new Date().toISOString(),
          });
        } else if (!shouldSendEmail) {
          console.log(
            `📧 Skipping email update for booking ${updateData.bookingReference} - user opted out`
          );
          res.json({
            success: true,
            message: 'Trip update notification skipped - user preferences disabled',
            timestamp: new Date().toISOString(),
          });
        } else {
          console.log(
            `📧 Skipping email update for booking ${updateData.bookingReference} - no email address`
          );
          res.status(400).json({
            success: false,
            error: { code: 'VAL_002', message: 'Email address required for notification' },
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`Error sending notification to ${email}:`, error);
        res.status(500).json({
          success: false,
          error: {
            code: 'NOTIF_001',
            message: error.message || 'Failed to send trip update notification',
          },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error sending trip update notifications:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'NOTIF_001',
          message: error.message || 'Failed to send trip update notifications',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = NotificationsController;
