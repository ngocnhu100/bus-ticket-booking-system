const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const emailService = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'notification-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html, type } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: { code: 'VAL_001', message: 'Missing required field: to' },
        timestamp: new Date().toISOString()
      });
    }

    switch (type) {
      case 'verification': {
        const { token } = req.body;
        if (!token) {
          return res.status(400).json({
            success: false,
            error: { code: 'VAL_001', message: 'Token required for verification emails' },
            timestamp: new Date().toISOString()
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
            timestamp: new Date().toISOString()
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
            timestamp: new Date().toISOString()
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
            timestamp: new Date().toISOString()
          });
        }
        await emailService.sendPasswordChangedEmail(to, userName);
        break;
      }

      default:
        // Generic email sending
        {
          if (!subject || !html) {
            return res.status(400).json({
              success: false,
              error: { code: 'VAL_001', message: 'Missing required fields: subject, html' },
              timestamp: new Date().toISOString()
            });
          }
          const sgMail = require('@sendgrid/mail');
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);

          const msg = {
            to,
            from: process.env.EMAIL_FROM || 'noreply@quad-n.me',
            subject,
            html
          };

          await sgMail.send(msg);
        }
        break;
    }

    res.json({
      success: true,
      message: 'Email sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('⚠️ Email sending error:', error);
    console.error('⚠️ SendGrid response:', error.response?.body || error.message);
    res.status(500).json({
      success: false,
      error: { code: 'EMAIL_001', message: 'Failed to send email' },
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('⚠️', err.stack);
  res.status(500).json({
    success: false,
    error: { code: 'SYS_001', message: 'Internal server error' },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Notification Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;