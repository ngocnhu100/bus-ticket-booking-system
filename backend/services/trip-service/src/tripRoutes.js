const express = require('express');
const router = express.Router();
const tripController = require('./tripController');
const { cacheMiddleware } = require('./cacheMiddleware');

// Trip search endpoint with caching
// Cache TTL: 10 minutes (600 seconds) by default
router.get('/search', cacheMiddleware(600), tripController.searchTrips);

// Get trip by ID (also cached)
// Cache TTL: 15 minutes (900 seconds) for individual trips
router.get('/:tripId', cacheMiddleware(900), tripController.getTripById);

// Get seat map for a trip
// Cache TTL: 5 minutes (300 seconds) for seat maps (frequently changing)
router.get('/:tripId/seats', cacheMiddleware(300), tripController.getSeats);

module.exports = router;
