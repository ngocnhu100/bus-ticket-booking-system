const {
  filterTrips,
  paginateResults,
  getTripById,
  getAllOperators,
  getAllRoutes,
  mockTrips
} = require('./tripService');
const { tripSearchSchema, tripIdSchema } = require('./validation');

/**
 * Search trips with advanced filtering
 * GET /search
 */
async function searchTrips(req, res) {
  try {
    // Validate query parameters
    const { error, value } = tripSearchSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: errors
        },
        timestamp: new Date().toISOString()
      });
    }

    const {
      origin,
      destination,
      date,
      passengers,
      busType,
      departureTime,
      minPrice,
      maxPrice,
      operatorId,
      amenities,
      page,
      limit
    } = value;

    // Parse array parameters if they are strings
    const busTypeArray = busType ? (Array.isArray(busType) ? busType : [busType]) : [];
    const departureTimeArray = departureTime ? (Array.isArray(departureTime) ? departureTime : [departureTime]) : [];
    const amenitiesArray = amenities ? (Array.isArray(amenities) ? amenities : [amenities]) : [];

    // Build filter object
    const filters = {
      origin,
      destination,
      date,
      busType: busTypeArray,
      departureTime: departureTimeArray,
      minPrice,
      maxPrice,
      operatorId,
      amenities: amenitiesArray,
      passengers
    };

    console.log('🔍 Searching trips with filters:', JSON.stringify(filters, null, 2));

    // Filter trips
    const filteredTrips = filterTrips(mockTrips, filters);
    
    console.log(`✅ Found ${filteredTrips.length} trips matching filters`);

    // Paginate results
    const result = paginateResults(filteredTrips, page, limit);

    res.json({
      success: true,
      data: {
        trips: result.trips,
        totalCount: result.totalCount,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        filters: {
          origin,
          destination,
          date,
          busType: busTypeArray,
          departureTime: departureTimeArray,
          minPrice,
          maxPrice,
          operatorId,
          amenities: amenitiesArray,
          passengers
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error searching trips:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while searching trips'
      },
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get trip by ID
 * GET /:tripId
 */
async function getTrip(req, res) {
  try {
    // Validate trip ID parameter
    const { error, value } = tripIdSchema.validate(req.params);

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

    const { tripId } = value;
    const trip = getTripById(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Trip with ID ${tripId} not found`
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
    console.error('❌ Error getting trip:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching trip'
      },
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get all operators
 * GET /operators
 */
async function getOperators(req, res) {
  try {
    const operators = getAllOperators();
    res.json({
      success: true,
      data: operators,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting operators:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching operators'
      },
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get all routes
 * GET /routes
 */
async function getRoutes(req, res) {
  try {
    const routes = getAllRoutes();
    res.json({
      success: true,
      data: routes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting routes:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching routes'
      },
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  searchTrips,
  getTrip,
  getOperators,
  getRoutes
};
