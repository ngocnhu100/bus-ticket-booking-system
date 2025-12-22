const axios = require('axios');

const TRIP_SERVICE_URL = process.env.TRIP_SERVICE_URL || 'http://localhost:3002';

class TripServiceClient {
  /**
   * Search for trips
   */
  async searchTrips(params) {
    try {
      const { origin, destination, date, passengers, timeOfDay, busType, maxPrice } = params;

      const queryParams = new URLSearchParams();
      if (origin) queryParams.append('origin', origin);
      if (destination) queryParams.append('destination', destination);
      if (date) queryParams.append('date', date);
      if (passengers) queryParams.append('passengers', passengers);
      if (timeOfDay) queryParams.append('timeOfDay', timeOfDay);
      if (busType) queryParams.append('busType', busType);
      if (maxPrice) queryParams.append('maxPrice', maxPrice);

      const url = `${TRIP_SERVICE_URL}/trips/search?${queryParams.toString()}`;
      console.log('[TripServiceClient] Searching trips:', url);

      const response = await axios.get(url, {
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error('[TripServiceClient] Error searching trips:', error.message);
      throw new Error('Failed to search trips');
    }
  }

  /**
   * Get trip details by ID
   */
  async getTripById(tripId) {
    try {
      const url = `${TRIP_SERVICE_URL}/trips/${tripId}`;
      console.log('[TripServiceClient] Getting trip:', url);

      const response = await axios.get(url, {
        timeout: 5000,
      });

      return response.data;
    } catch (error) {
      console.error('[TripServiceClient] Error getting trip:', error.message);
      throw new Error('Failed to get trip details');
    }
  }

  /**
   * Get available seats for a trip
   */
  async getAvailableSeats(tripId) {
    try {
      const url = `${TRIP_SERVICE_URL}/trips/${tripId}/seats`;
      console.log('[TripServiceClient] Getting seats:', url);

      const response = await axios.get(url, {
        timeout: 5000,
      });

      return response.data;
    } catch (error) {
      console.error('[TripServiceClient] Error getting seats:', error.message);
      throw new Error('Failed to get available seats');
    }
  }
}

module.exports = new TripServiceClient();
