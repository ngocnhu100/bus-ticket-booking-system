const mockTrips = require('./mockData');

/**
 * Get time period from time string (HH:MM format)
 * @param {string} timeString - Time in HH:MM format
 * @returns {string} - Time period: morning, afternoon, evening, or night
 */
function getTimePeriod(timeString) {
  const hour = parseInt(timeString.split(':')[0]);
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'night';
}

/**
 * Filter trips based on search criteria
 * @param {Array} trips - Array of trip objects
 * @param {Object} filters - Filter parameters
 * @returns {Array} - Filtered trips
 */
function filterTrips(trips, filters) {
  let filtered = [...trips];

  // Filter by origin (case-insensitive, partial match)
  if (filters.origin) {
    filtered = filtered.filter(trip =>
      trip.route.origin.toLowerCase().includes(filters.origin.toLowerCase())
    );
  }

  // Filter by destination (case-insensitive, partial match)
  if (filters.destination) {
    filtered = filtered.filter(trip =>
      trip.route.destination.toLowerCase().includes(filters.destination.toLowerCase())
    );
  }

  // Filter by bus type (support multiple types)
  if (filters.busType && filters.busType.length > 0) {
    filtered = filtered.filter(trip =>
      filters.busType.includes(trip.bus.busType)
    );
  }

  // Filter by departure time period (support multiple periods)
  if (filters.departureTime && filters.departureTime.length > 0) {
    filtered = filtered.filter(trip => {
      const period = getTimePeriod(trip.schedule.departureTime);
      return filters.departureTime.includes(period);
    });
  }

  // Filter by price range
  if (filters.minPrice !== undefined && filters.minPrice !== null) {
    filtered = filtered.filter(trip =>
      trip.pricing.basePrice >= filters.minPrice
    );
  }
  if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
    filtered = filtered.filter(trip =>
      trip.pricing.basePrice <= filters.maxPrice
    );
  }

  // Filter by operator
  if (filters.operatorId) {
    filtered = filtered.filter(trip =>
      trip.operator.operatorId === filters.operatorId
    );
  }

  // Filter by amenities (trip must have ALL requested amenities)
  if (filters.amenities && filters.amenities.length > 0) {
    filtered = filtered.filter(trip => {
      const tripAmenityIds = trip.bus.amenities.map(a => a.id);
      return filters.amenities.every(amenity =>
        tripAmenityIds.includes(amenity)
      );
    });
  }

  // Filter by available seats (based on passengers)
  if (filters.passengers) {
    filtered = filtered.filter(trip =>
      trip.availability.availableSeats >= filters.passengers
    );
  }

  return filtered;
}

/**
 * Paginate results
 * @param {Array} trips - Array of trip objects
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Object} - Paginated results with metadata
 */
function paginateResults(trips, page = 1, limit = 10) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedTrips = trips.slice(startIndex, endIndex);
  
  return {
    trips: paginatedTrips,
    totalCount: trips.length,
    page: page,
    limit: limit,
    totalPages: Math.ceil(trips.length / limit)
  };
}

/**
 * Get trip by ID
 * @param {string} tripId - Trip ID
 * @returns {Object|null} - Trip object or null if not found
 */
function getTripById(tripId) {
  return mockTrips.find(trip => trip.tripId === tripId) || null;
}

/**
 * Get all unique operators
 * @returns {Array} - Array of operator objects
 */
function getAllOperators() {
  const operatorsMap = new Map();
  mockTrips.forEach(trip => {
    if (!operatorsMap.has(trip.operator.operatorId)) {
      operatorsMap.set(trip.operator.operatorId, trip.operator);
    }
  });
  return Array.from(operatorsMap.values());
}

/**
 * Get all unique routes
 * @returns {Array} - Array of route objects
 */
function getAllRoutes() {
  const routesMap = new Map();
  mockTrips.forEach(trip => {
    if (!routesMap.has(trip.route.routeId)) {
      routesMap.set(trip.route.routeId, {
        routeId: trip.route.routeId,
        origin: trip.route.origin,
        destination: trip.route.destination,
        distance: trip.route.distance
      });
    }
  });
  return Array.from(routesMap.values());
}

module.exports = {
  filterTrips,
  paginateResults,
  getTimePeriod,
  getTripById,
  getAllOperators,
  getAllRoutes,
  mockTrips
};
