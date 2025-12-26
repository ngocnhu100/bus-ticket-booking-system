const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const bookingController = require('./controllers/bookingController');
const { authenticate, authorize, optionalAuthenticate } = require('./middleware/authMiddleware');
const bookingExpirationJob = require('./jobs/bookingExpirationJob');
const tripReminderJob = require('./jobs/tripReminderJob');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', bookingController.healthCheck);

// Admin routes (require admin role) - MUST come BEFORE /:id routes
app.get('/admin', authenticate, authorize(['admin']), bookingController.getAllBookings);
app.get('/admin/:id', authenticate, authorize(['admin']), bookingController.getBookingDetailsAdmin);
app.put('/admin/:id/status', authenticate, authorize(['admin']), bookingController.updateBookingStatus);
app.post('/admin/:id/refund', authenticate, authorize(['admin']), bookingController.processRefundAdmin);

// Public routes (no authentication required)
// Guest booking lookup - accepts phone OR email
app.get('/guest/lookup', bookingController.guestLookup);

// Public routes (guest checkout) - MUST come before /:id route
app.get('/reference/:reference', bookingController.getByReference);

// Share ticket (public endpoint with validation)
app.post('/:bookingReference/share', bookingController.shareTicket);

// Internal idempotent confirm-payment endpoint for payment-service webhook
app.post('/internal/:id/confirm-payment', bookingController.internalConfirmPayment);

// Protected routes (require authentication)
app.get('/', authenticate, bookingController.getUserBookings);
app.post('/', optionalAuthenticate, bookingController.create);
app.get('/:id', authenticate, bookingController.getById);
app.get('/:id/cancellation-preview', optionalAuthenticate, bookingController.getCancellationPreview);
app.get('/:id/modification-preview', optionalAuthenticate, bookingController.getModificationPreview);
app.post('/:id/confirm-payment', authenticate, bookingController.confirmPayment);
app.put('/:id/cancel', optionalAuthenticate, bookingController.cancel);
app.put('/:id/modify', optionalAuthenticate, bookingController.modifyBooking);

// Serve ticket files (static)
app.use('/tickets', express.static('tickets'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'SYS_001',
      message: 'Internal server error',
    },
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_001',
      message: 'Route not found',
    },
    timestamp: new Date().toISOString(),
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Booking Service running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);

    // Start background jobs
    bookingExpirationJob.start();
    tripReminderJob.start();
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  bookingExpirationJob.stop();
  tripReminderJob.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  bookingExpirationJob.stop();
  tripReminderJob.stop();
  process.exit(0);
});

module.exports = app;
