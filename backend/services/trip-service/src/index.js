const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const tripController = require('./controllers/tripController');
const routeController = require('./controllers/routeController');
const busModelController = require('./controllers/busModelController');
const busController = require('./controllers/busController');
const adminOperatorController = require('./controllers/adminOperatorController');
const seatLockController = require('./controllers/seatLockController');
const ratingController = require('./controllers/ratingController');

const { authenticate, authorize, optionalAuthenticate } = require('./middleware/authMiddleware');
const lockCleanupService = require('./services/lockCleanupService');
const { isRedisAvailable } = require('./redis');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

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

// Health check
app.get('/health', (req, res) => res.json({ status: 'healthy' }));

// --- Public routes ---
app.get('/search', tripController.search);

// **Các route cụ thể phải đứng trước `/:id`**
app.get('/routes', routeController.getAll);
app.get('/bus-models', busModelController.getAll);
app.get('/buses', authenticate, authorize(['admin']), busController.getAll);
app.get('/popular-routes', routeController.getPopularRoutes);

// --- Dynamic trip route ---
app.get('/:id/seats', tripController.getSeats);
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
app.delete('/buses/:id', authenticate, authorize(['admin']), busController.delete);

// API kiểm tra xe có trống không (rất quan trọng khi tạo chuyến)
app.get(
  '/buses/:id/availability',
  authenticate,
  authorize(['admin']),
  busController.checkAvailability
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

// ============================= RATINGS & REVIEWS (Customer Feedback System) =============================

// Submit a rating for a completed booking
app.post('/ratings', authenticate, ratingController.submitRating);

// Check if a booking has a rating
app.get('/ratings/check/:bookingId', ratingController.checkBookingRating);

// Get rating stats for a trip (public)
app.get('/:tripId/ratings', ratingController.getTripRatings);

// Get reviews for a trip with pagination (public)
app.get('/:tripId/reviews', ratingController.getTripReviews);

// Get rating stats for an operator (public)
app.get('/operators/:operatorId/ratings', ratingController.getOperatorRatings);

// Get reviews for an operator with pagination (public)
app.get('/operators/:operatorId/reviews', ratingController.getOperatorReviews);

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

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Trip Service running on ${PORT}`));
}

module.exports = app;
