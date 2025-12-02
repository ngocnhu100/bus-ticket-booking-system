const mockTrips = require('./tripModel');

/**
 * Helper function to get time period from time string
 * @param {string} timeString - Time in HH:mm format
 * @returns {string} Time period (morning, afternoon, evening, night)
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
 * @param {Object} filters - Filter parameters
 * @returns {Array} Filtered trips
 */
function filterTrips(filters) {
  let filtered = [...mockTrips];

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
 * Sort trips based on sortBy and order
 * @param {Array} trips - Array of trips to sort
 * @param {string} sortBy - Sort field (price, time, duration)
 * @param {string} order - Sort order (asc, desc)
 * @returns {Array} Sorted trips
 */
function sortTrips(trips, sortBy = 'time', order = 'asc') {
  const sorted = [...trips];
  
  const compareFunction = (a, b) => {
    let compareValue = 0;
    
    switch (sortBy) {
      case 'price':
        compareValue = a.pricing.basePrice - b.pricing.basePrice;
        break;
        
      case 'time':
        // Compare departure times (HH:mm format)
        const timeA = a.schedule.departureTime.split(':').map(Number);
        const timeB = b.schedule.departureTime.split(':').map(Number);
        compareValue = (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        break;
        
      case 'duration':
        compareValue = a.route.estimatedDuration - b.route.estimatedDuration;
        break;
        
      default:
        // Default sort by departure time
        const defaultTimeA = a.schedule.departureTime.split(':').map(Number);
        const defaultTimeB = b.schedule.departureTime.split(':').map(Number);
        compareValue = (defaultTimeA[0] * 60 + defaultTimeA[1]) - (defaultTimeB[0] * 60 + defaultTimeB[1]);
    }
    
    // Apply order (asc or desc)
    return order === 'desc' ? -compareValue : compareValue;
  };
  
  return sorted.sort(compareFunction);
}

/**
 * Paginate results
 * @param {Array} trips - Array of trips to paginate
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} Pagination result with trips and metadata
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
 * Search trips with filters, sorting, and pagination
 * @param {Object} params - Search parameters
 * @returns {Object} Search results with metadata
 */
async function searchTrips(params) {
  const {
    origin,
    destination,
    busType,
    departureTime,
    minPrice,
    maxPrice,
    operatorId,
    amenities,
    passengers,
    sortBy = 'time',
    order = 'asc',
    page = 1,
    limit = 10
  } = params;

  // Build filters object
  const filters = {
    origin,
    destination,
    busType,
    departureTime,
    minPrice,
    maxPrice,
    operatorId,
    amenities,
    passengers
  };

  // Apply filters
  let results = filterTrips(filters);

  // Apply sorting
  results = sortTrips(results, sortBy, order);

  // Apply pagination
  const paginatedResults = paginateResults(results, page, limit);

  return {
    success: true,
    data: paginatedResults,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get trip by ID
 * @param {string} tripId - Trip ID
 * @returns {Object|null} Trip data or null if not found
 */
async function getTripById(tripId) {
  const trip = mockTrips.find(t => t.tripId === tripId);
  return trip || null;
}

module.exports = {
  searchTrips,
  getTripById,
  filterTrips,
  sortTrips,
  paginateResults,
  getTimePeriod
};
