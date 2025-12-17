const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const emailService = require('./services/emailService');
const smsService = require('./services/smsService');
const notificationsController = require('./notificationsController');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth middleware (extract user from token or session)
const authMiddleware = (req, res, next) => {
  // This should be replaced with actual auth logic from your API gateway
  // For now, we'll extract from headers or session
  try {
    const userId = req.headers['x-user-id'] || req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_001', message: 'Unauthorized' },
        timestamp: new Date().toISOString(),
      });
    }
    req.user = { id: userId };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_001', message: 'Unauthorized' },
      timestamp: new Date().toISOString(),
    });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'notification-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Notifications History Routes
app.get('/', authMiddleware, (req, res) => {
  notificationsController.getNotifications(req, res);
});

app.get('/stats', authMiddleware, (req, res) => {
  notificationsController.getStats(req, res);
});
app.get('/:notificationId', authMiddleware, (req, res) => {
  notificationsController.getNotification(req, res);
});

app.put('/:notificationId/read', authMiddleware, (req, res) => {
  notificationsController.markAsRead(req, res);
});

// Note: Notification Preferences are now stored in users table as JSONB
// and managed through the auth-service /auth/me endpoint

// Booking Confirmation Email Endpoint
app.post('/send-booking-confirmation', async (req, res) => {
  try {
    const { email, bookingData } = req.body;

    if (!email || !bookingData) {
      return res.status(400).json({
        success: false,
        error: { code: 'VAL_001', message: 'Email and bookingData are required' },
      });
    }

    await emailService.sendBookingConfirmationEmail(email, bookingData);

    res.json({
      success: true,
      message: 'Booking confirmation email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EMAIL_001',
        message: error.message || 'Failed to send booking confirmation email',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// Routes
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html, type } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: { code: 'VAL_001', message: 'Missing required field: to' },
        timestamp: new Date().toISOString(),
      });
    }

    switch (type) {
      case 'verification': {
        const { token } = req.body;
        if (!token) {
          return res.status(400).json({
            success: false,
            error: { code: 'VAL_001', message: 'Token required for verification emails' },
            timestamp: new Date().toISOString(),
          });
        }
        await emailService.sendVerificationEmail(to, token);
        break;
      }

      case 'password-reset': {
        const { resetToken } = req.body;
        if (!resetToken) {
          return res.status(400).json({
            success: false,
            error: { code: 'VAL_001', message: 'Reset token required for password reset emails' },
            timestamp: new Date().toISOString(),
          });
        }
        await emailService.sendPasswordResetEmail(to, resetToken);
        break;
      }

      case 'otp': {
        const { otp } = req.body;
        if (!otp) {
          return res.status(400).json({
            success: false,
            error: { code: 'VAL_001', message: 'OTP required for OTP emails' },
            timestamp: new Date().toISOString(),
          });
        }
        await emailService.sendOTPEmail(to, otp);
        break;
      }

      case 'password-changed': {
        const { userName } = req.body;
        if (!userName) {
          return res.status(400).json({
            success: false,
            error: { code: 'VAL_001', message: 'User name required for password changed emails' },
            timestamp: new Date().toISOString(),
          });
        }
        await emailService.sendPasswordChangedEmail(to, userName);
        break;
      }

      case 'booking-ticket': {
        const { bookingData, ticketUrl, qrCode } = req.body;
        if (!bookingData || !ticketUrl) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VAL_001',
              message: 'bookingData and ticketUrl required for ticket emails',
            },
            timestamp: new Date().toISOString(),
          });
        }
        await emailService.sendTicketEmail(to, bookingData, ticketUrl, qrCode);
        break;
      }

      default:
        // Generic email sending
        {
          if (!subject || !html) {
            return res.status(400).json({
              success: false,
              error: { code: 'VAL_001', message: 'Missing required fields: subject, html' },
              timestamp: new Date().toISOString(),
            });
          }
          const sgMail = require('@sendgrid/mail');
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);

          const msg = {
            to,
            from: process.env.EMAIL_FROM || 'noreply@quad-n.me',
            subject,
            html,
          };

          await sgMail.send(msg);
        }
        break;
    }

    res.json({
      success: true,
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('⚠️ Email sending error:', error);
    console.error('⚠️ SendGrid response:', error.response?.body || error.message);
    res.status(500).json({
      success: false,
      error: { code: 'EMAIL_001', message: 'Failed to send email' },
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('⚠️', err.stack);
  res.status(500).json({
    success: false,
    error: { code: 'SYS_001', message: 'Internal server error' },
    timestamp: new Date().toISOString(),
  });
});

// SMS Routes
app.post('/send-sms-booking-confirmation', async (req, res) => {
  try {
    const { phoneNumber, bookingData } = req.body;

    if (!phoneNumber || !bookingData) {
      return res.status(400).json({
        success: false,
        error: { code: 'VAL_001', message: 'Phone number and bookingData are required' },
        timestamp: new Date().toISOString(),
      });
    }

    const result = await smsService.sendBookingConfirmation(phoneNumber, bookingData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Booking confirmation SMS sent successfully',
        sid: result.sid,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'SMS_001',
          message: result.error || 'Failed to send booking confirmation SMS',
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error sending booking confirmation SMS:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SMS_001',
        message: error.message || 'Failed to send booking confirmation SMS',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

app.post('/send-sms-trip-reminder', async (req, res) => {
  try {
    const { phoneNumber, tripData, hoursUntilDeparture } = req.body;

    if (!phoneNumber || !tripData || hoursUntilDeparture === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Phone number, tripData, and hoursUntilDeparture are required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const result = await smsService.sendTripReminder(phoneNumber, tripData, hoursUntilDeparture);

    if (result.success) {
      res.json({
        success: true,
        message: 'Trip reminder SMS sent successfully',
        sid: result.sid,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'SMS_002',
          message: result.error || 'Failed to send trip reminder SMS',
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error sending trip reminder SMS:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SMS_002',
        message: error.message || 'Failed to send trip reminder SMS',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

app.post('/send-email-trip-reminder', async (req, res) => {
  try {
    const { email, tripData, hoursUntilDeparture } = req.body;

    if (!email || !tripData || hoursUntilDeparture === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Email, tripData, and hoursUntilDeparture are required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    await emailService.sendTripReminderEmail(email, tripData, hoursUntilDeparture);

    res.json({
      success: true,
      message: 'Trip reminder email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error sending trip reminder email:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EMAIL_003',
        message: error.message || 'Failed to send trip reminder email',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

app.post('/send-sms-booking-cancellation', async (req, res) => {
  try {
    const { phoneNumber, bookingData } = req.body;

    if (!phoneNumber || !bookingData) {
      return res.status(400).json({
        success: false,
        error: { code: 'VAL_001', message: 'Phone number and bookingData are required' },
        timestamp: new Date().toISOString(),
      });
    }

    const result = await smsService.sendBookingCancellation(phoneNumber, bookingData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Booking cancellation SMS sent successfully',
        sid: result.sid,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'SMS_003',
          message: result.error || 'Failed to send booking cancellation SMS',
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error sending booking cancellation SMS:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SMS_003',
        message: error.message || 'Failed to send booking cancellation SMS',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

app.post('/send-sms-payment-reminder', async (req, res) => {
  try {
    const { phoneNumber, bookingData, minutesLeft } = req.body;

    if (!phoneNumber || !bookingData || minutesLeft === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Phone number, bookingData, and minutesLeft are required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const result = await smsService.sendPaymentReminder(phoneNumber, bookingData, minutesLeft);

    if (result.success) {
      res.json({
        success: true,
        message: 'Payment reminder SMS sent successfully',
        sid: result.sid,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'SMS_004',
          message: result.error || 'Failed to send payment reminder SMS',
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error sending payment reminder SMS:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SMS_004',
        message: error.message || 'Failed to send payment reminder SMS',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Notification Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
