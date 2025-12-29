import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/bookings'

interface RefundRequest {
  reason?: string
  amount?: number
}

interface RefundResponse {
  success: boolean
  message: string
  booking_id: string
  refund_amount: number
  refund_status: string
}

export const adminBookingService = {
  /**
   * Process automatic refund for a booking
   */
  async processRefund(
    bookingId: string,
    refundData?: RefundRequest
  ): Promise<RefundResponse> {
    try {
      const response = await axios.post<RefundResponse>(
        `${API_BASE_URL}/admin/${bookingId}/refund`,
        refundData || {},
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Failed to process refund'
        )
      }
      throw error
    }
  },

  /**
   * Get booking details
   */
  async getBooking(bookingId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/${bookingId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Failed to fetch booking'
        )
      }
      throw error
    }
  },

  /**
   * Get all bookings with filters
   */
  async getBookings(params?: {
    status?: string
    page?: number
    limit?: number
    fromDate?: string
    toDate?: string
    sortBy?: string
    sortOrder?: 'ASC' | 'DESC'
  }) {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin`, {
        params,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Failed to fetch bookings'
        )
      }
      throw error
    }
  },
}
