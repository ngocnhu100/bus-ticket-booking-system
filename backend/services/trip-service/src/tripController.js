const tripService = require('./tripService');
const { searchTripSchema, tripIdSchema } = require('./tripValidators');

/**
 * Search trips with filters, sorting, and pagination
 * GET /trips/search
 */
async function searchTrips(req, res) {
  try {
    // Normalize query parameters
    const queryParams = { ...req.query };
    
    // Convert string arrays to actual arrays
    if (queryParams.busType && typeof queryParams.busType === 'string') {
      queryParams.busType = queryParams.busType.split(',').map(s => s.trim());
    }
    if (queryParams.departureTime && typeof queryParams.departureTime === 'string') {
      queryParams.departureTime = queryParams.departureTime.split(',').map(s => s.trim());
    }
    if (queryParams.amenities && typeof queryParams.amenities === 'string') {
      queryParams.amenities = queryParams.amenities.split(',').map(s => s.trim());
    }

    // Convert numeric strings to numbers
    if (queryParams.minPrice) queryParams.minPrice = parseFloat(queryParams.minPrice);
    if (queryParams.maxPrice) queryParams.maxPrice = parseFloat(queryParams.maxPrice);
    if (queryParams.passengers) queryParams.passengers = parseInt(queryParams.passengers);
    if (queryParams.page) queryParams.page = parseInt(queryParams.page);
    if (queryParams.limit) queryParams.limit = parseInt(queryParams.limit);

    // Validate query parameters
    const { error, value } = searchTripSchema.validate(queryParams);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        },
        timestamp: new Date().toISOString()
      });
    }

    // Search trips
    const result = await tripService.searchTrips(value);
    
    res.json(result);
  } catch (error) {
    console.error('Error in searchTrips controller:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to search trips'
      },
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get trip by ID
 * GET /trips/:tripId
 */
async function getTripById(req, res) {
  try {
    // Validate trip ID
    const { error, value } = tripIdSchema.validate({ tripId: req.params.tripId });
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        },
        timestamp: new Date().toISOString()
      });
    }

    // Get trip
    const trip = await tripService.getTripById(value.tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TRIP_NOT_FOUND',
          message: 'Trip not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: trip,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in getTripById controller:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get trip'
      },
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  searchTrips,
  getTripById
};
