const axios = require('axios');

const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:3004';

class BookingServiceClient {
  /**
   * Create a new booking
   */
  async createBooking(bookingData, authToken = null) {
    try {
      const url = `${BOOKING_SERVICE_URL}/`;
      console.log('[BookingServiceClient] Creating booking:', url);
      console.log('[BookingServiceClient] Booking payload:', JSON.stringify(bookingData, null, 2));

      const headers = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await axios.post(url, bookingData, {
        headers,
        timeout: 15000,
      });

      return response.data;
    } catch (error) {
      console.error(
        '[BookingServiceClient] Error creating booking:',
        error.response?.data || error.message
      );
      throw new Error(error.response?.data?.error?.message || 'Failed to create booking');
    }
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId, authToken = null) {
    try {
      const url = `${BOOKING_SERVICE_URL}/${bookingId}`;
      console.log('[BookingServiceClient] Getting booking:', url);

      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await axios.get(url, {
        headers,
        timeout: 5000,
      });

      return response.data;
    } catch (error) {
      console.error('[BookingServiceClient] Error getting booking:', error.message);
      throw new Error('Failed to get booking details');
    }
  }

  /**
   * Get booking by reference (for guest users)
   */
  async getBookingByReference(reference, contactInfo) {
    try {
      const url = `${BOOKING_SERVICE_URL}/reference/${reference}`;
      console.log('[BookingServiceClient] Getting booking by reference:', url);

      const queryParams = new URLSearchParams();
      if (contactInfo.phone) queryParams.append('phone', contactInfo.phone);
      if (contactInfo.email) queryParams.append('email', contactInfo.email);

      const response = await axios.get(`${url}?${queryParams.toString()}`, {
        timeout: 5000,
      });

      return response.data;
    } catch (error) {
      console.error('[BookingServiceClient] Error getting booking by reference:', error.message);
      throw new Error('Failed to get booking details');
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId, authToken = null) {
    try {
      const url = `${BOOKING_SERVICE_URL}/${bookingId}/cancel`;
      console.log('[BookingServiceClient] Cancelling booking:', url);

      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await axios.put(
        url,
        {},
        {
          headers,
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      console.error('[BookingServiceClient] Error cancelling booking:', error.message);
      throw new Error('Failed to cancel booking');
    }
  }

  /**
   * Get cancellation preview
   */
  async getCancellationPreview(bookingId, authToken = null) {
    try {
      const url = `${BOOKING_SERVICE_URL}/${bookingId}/cancellation-preview`;
      console.log('[BookingServiceClient] Getting cancellation preview:', url);

      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await axios.get(url, {
        headers,
        timeout: 5000,
      });

      return response.data;
    } catch (error) {
      console.error('[BookingServiceClient] Error getting cancellation preview:', error.message);
      throw new Error('Failed to get cancellation details');
    }
  }
}

module.exports = new BookingServiceClient();
