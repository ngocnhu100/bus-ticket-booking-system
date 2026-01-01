const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
require('dotenv').config();

const tripController = require('./controllers/tripController');
const routeController = require('./controllers/routeController');
const busModelController = require('./controllers/busModelController');
const busController = require('./controllers/busController');
const adminOperatorController = require('./controllers/adminOperatorController');
const seatLockController = require('./controllers/seatLockController');
const ratingController = require('./controllers/ratingController');
const uploadRoutes = require('./routes/uploadRoutes');

const { authenticate, authorize, optionalAuthenticate } = require('./middleware/authMiddleware');
const lockCleanupService = require('./services/lockCleanupService');
const { isRedisAvailable } = require('./redis');

const app = express();
const PORT = process.env.PORT || 3002;

app.set('query parser', 'extended');

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Initialize Passport
const passport = require('passport');
app.use(passport.initialize());

// Start lock cleanup service after Redis is ready
(async () => {
  try {
    console.log('⏳ Waiting for Redis to be available...');
    const redisReady = await isRedisAvailable();
    if (redisReady) {
      lockCleanupService.start(5); // Clean up every 5 minutes
      console.log('✅ Lock cleanup service started');
    } else {
      console.error('❌ Redis not available, lock cleanup service not started');
    }
  } catch (error) {
    console.error('❌ Error checking Redis availability:', error);
  }
})();

// Start trip status update cron job
const tripStatusUpdateService = require('./services/tripStatusUpdateService');
cron.schedule('*/1 * * * *', async () => {
  // Run every minute
  try {
    await tripStatusUpdateService.updateTripStatuses();
  } catch (error) {
    console.error('❌ Error updating trip statuses:', error);
  }
});
console.log('✅ Trip status update cron job started (runs every minute)');

// Health check
app.get('/health', (req, res) => res.json({ status: 'healthy' }));

// --- Upload routes (must be before other routes) ---
app.use('/upload', uploadRoutes.router);

// --- Public routes ---
app.get('/search', tripController.search);
app.get('/autocomplete/locations', tripController.autocompleteLocations);

// --- Admin: Trip listing (must come before /:id route) ---
app.get('/', authenticate, authorize(['admin']), tripController.getAll);

// **Các route cụ thể phải đứng trước `/:id`**
app.get('/routes', routeController.getAll);
app.get('/bus-models', busModelController.getAll);
app.get('/buses', authenticate, authorize(['admin']), busController.getAll);
app.get('/popular-routes', routeController.getPopularRoutes);

// --- Alternative trip suggestions ---
app.get('/alternatives', tripController.getAlternatives);
app.get('/alternatives/dates', tripController.getAlternativeDates);
app.get('/alternatives/destinations', tripController.getAlternativeDestinations);

// --- Dynamic trip route ---
app.get('/:id/seats', tripController.getSeats);
app.get('/:id/passengers', authenticate, authorize(['admin']), tripController.getPassengers);
app.get('/:id', tripController.getById);

// --- Seat lock management ---
app.post('/:id/seats/lock', optionalAuthenticate, seatLockController.lockSeats);
app.post('/:id/seats/extend', optionalAuthenticate, seatLockController.extendLocks);
app.post('/:id/seats/release', optionalAuthenticate, seatLockController.releaseLocks);
app.post('/:id/seats/release-all', optionalAuthenticate, seatLockController.releaseAllLocks);
app.post('/:id/seats/transfer-guest-locks', authenticate, seatLockController.transferGuestLocks);
app.get('/:id/seats/my-locks', optionalAuthenticate, seatLockController.getMyLocks);

// --- Admin: Trip management ---
app.post('/', authenticate, authorize(['admin']), tripController.create);
app.put('/:id', authenticate, authorize(['admin']), tripController.update);
app.delete('/:id', authenticate, authorize(['admin']), tripController.delete);

// --- Admin: Trip advanced operations ---
app.post('/:id/assign-bus', authenticate, authorize(['admin']), tripController.assignBus);
app.post('/:id/assign-route', authenticate, authorize(['admin']), tripController.assignRoute);
app.patch('/:id/status', authenticate, authorize(['admin']), tripController.updateStatus);
app.post('/:id/mark-departed', authenticate, authorize(['admin']), tripController.markDeparted);
app.post('/:id/mark-arrived', authenticate, authorize(['admin']), tripController.markArrived);
app.post('/:id/cancel', authenticate, authorize(['admin']), tripController.cancelTrip);

// --- Admin: Route management ---
app.post('/routes', authenticate, authorize(['admin']), routeController.create);
app.get('/routes/:id', authenticate, authorize(['admin']), routeController.getById);
app.put('/routes/:id', authenticate, authorize(['admin']), routeController.update);
app.delete('/routes/:id', authenticate, authorize(['admin']), routeController.delete);
app.post('/routes/:id/stops', authenticate, authorize(['admin']), routeController.addStop);

// --- Admin: Bus model management ---
app.post('/bus-models', authenticate, authorize(['admin']), busModelController.create);
app.put('/bus-models/:id', authenticate, authorize(['admin']), busModelController.update);
app.post(
  '/bus-models/:id/seat-layout',
  authenticate,
  authorize(['admin']),
  busModelController.setSeatLayout
);
app.get('/bus-models/:id', authenticate, authorize(['admin']), busModelController.getById);

// --- Admin: Bus management ---
app.post('/buses', authenticate, authorize(['admin']), busController.create);
app.get('/buses/:id', authenticate, authorize(['admin']), busController.getById);
app.put('/buses/:id', authenticate, authorize(['admin']), busController.update);
app.put('/buses/:id/deactivate', authenticate, authorize(['admin']), busController.deactivate);
app.put('/buses/:id/activate', authenticate, authorize(['admin']), busController.activate);
app.delete('/buses/:id', authenticate, authorize(['admin']), busController.delete);

// API kiểm tra xe có trống không (rất quan trọng khi tạo chuyến)
app.get(
  '/buses/:id/availability',
  authenticate,
  authorize(['admin']),
  busController.checkAvailability
);

// Bus seat layout management (mỗi bus có seat layout riêng)
app.post('/buses/:id/seat-layout', authenticate, authorize(['admin']), busController.setSeatLayout);
app.get('/buses/:id/seat-layout', authenticate, authorize(['admin']), busController.getSeatLayout);
app.delete(
  '/buses/:id/seat-layout',
  authenticate,
  authorize(['admin']),
  busController.deleteSeatLayout
);

// ============================= ADMIN: OPERATOR MANAGEMENT (mới thêm - thẳng trong index.js) =============================

// 1. Danh sách nhà xe + filter + phân trang + thống kê số tuyến, số xe
app.get('/admin/operators', authenticate, authorize(['admin']), adminOperatorController.getList);

// 2. Duyệt / Từ chối nhà xe
app.put(
  '/admin/operators/:operatorId/approve',
  authenticate,
  authorize(['admin']),
  adminOperatorController.approveOperator
);

// 3. Tạm ngưng nhà xe
app.put(
  '/admin/operators/:operatorId/suspend',
  authenticate,
  authorize(['admin']),
  adminOperatorController.suspendOperator
);

// 4. Kích hoạt lại nhà xe
app.put(
  '/admin/operators/:operatorId/activate',
  authenticate,
  authorize(['admin']),
  adminOperatorController.activateOperator
);

// 5. Analytics
app.get(
  '/admin/operators/analytics',
  authenticate,
  authorize(['admin']),
  adminOperatorController.getAnalytics
);

// 6. Operator Analytics
app.get(
  '/admin/operators/:operatorId/analytics',
  authenticate,
  authorize(['admin']),
  adminOperatorController.getOperatorAnalytics
);

// ============================= RATINGS & REVIEWS (Customer Feedback System) =============================

// Submit a rating for a completed booking
app.post('/ratings', authenticate, ratingController.submitRating);

// Check if a booking has a rating
app.get('/ratings/check/:bookingId', ratingController.checkBookingRating);

// Get review for a specific booking (authenticated)
app.get('/ratings/booking/:bookingId', authenticate, ratingController.getBookingReview);

// Get rating stats for a trip (public)
app.get('/:tripId/ratings', ratingController.getTripRatings);

// Get reviews for a trip with pagination (public)
app.get('/:tripId/reviews', optionalAuthenticate, ratingController.getTripReviews);

// Get rating stats for an operator (public)
app.get('/operators/:operatorId/ratings', ratingController.getOperatorRatings);

// Get reviews for an operator with pagination (public)
app.get(
  '/operators/:operatorId/reviews',
  optionalAuthenticate,
  ratingController.getOperatorReviews
);

// Update a review (within 24 hours)
app.patch('/ratings/:ratingId', authenticate, ratingController.updateReview);

// Delete a review
app.delete('/ratings/:ratingId', authenticate, ratingController.deleteReview);

// Vote on review helpfulness
app.post('/ratings/:ratingId/votes', authenticate, ratingController.voteHelpful);

// --- Error handling ---
app.use((err, req, res, next) => {
  console.error('Trip Service Error:', err);
  res.status(500).json({ error: 'Internal Trip Service Error', details: err.message });
});

// Global error handlers to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Trip Service running on ${PORT}`));
}

module.exports = app;
