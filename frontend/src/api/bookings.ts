import { request } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export interface PassengerInfo {
  fullName: string
  phone?: string
  documentId?: string
  seatCode: string
}

export interface CreateBookingRequest {
  tripId: string
  seats: string[]
  passengers: PassengerInfo[]
  contactEmail: string
  contactPhone: string
  isGuestCheckout?: boolean
}

export interface Pricing {
  subtotal: number
  serviceFee: number
  total: number
  currency: string
}

export interface Payment {
  method?: string
  status: string
  paidAt?: string
}

export interface Booking {
  booking_id: string
  booking_reference: string
  trip_id: string
  user_id?: string
  contact_email: string
  contact_phone: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  locked_until?: string | null
  pricing: Pricing
  payment: Payment
  passengers?: PassengerInfo[]
  passengersCount?: number
  seatCodes?: string[]
  trip_details?: {
    route?: { origin: string; destination: string }
    operator?: { name: string }
    schedule?: { departure_time: string; arrival_time: string }
  }
  cancellation?: {
    reason?: string
    refund_amount?: number
  } | null
  e_ticket?: {
    ticket_url?: string | null
    qr_code_url?: string | null
  }
  created_at?: string
  updated_at?: string
  createdAt?: string
  updatedAt?: string
}

export interface BookingResponse {
  success: boolean
  data: Booking
  message?: string
  timestamp?: string
}

export interface BookingListResponse {
  success: boolean
  data: Booking[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CancelBookingRequest {
  reason?: string
  requestRefund?: boolean
}

export interface BookingFilters {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'all'
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'totalPrice'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Create a new booking
 */
export async function createBooking(
  bookingData: CreateBookingRequest
): Promise<BookingResponse> {
  try {
    const response = await request('/bookings', {
      method: 'POST',
      body: bookingData,
    })
    return response
  } catch (error) {
    console.error('Error creating booking:', error)
    throw error
  }
}

/**
 * Get booking by ID
 */
export async function getBookingById(
  bookingId: string
): Promise<BookingResponse> {
  try {
    const response = await request(`/bookings/${bookingId}`, {
      method: 'GET',
    })
    return response
  } catch (error) {
    console.error('Error getting booking:', error)
    throw error
  }
}

/**
 * Get booking by reference (for guest checkout)
 */
export async function getBookingByReference(
  reference: string,
  email: string
): Promise<BookingResponse> {
  try {
    const url = `${API_BASE_URL}/bookings/reference/${reference}?email=${encodeURIComponent(
      email
    )}`
    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get booking')
    }

    return data
  } catch (error) {
    console.error('Error getting booking by reference:', error)
    throw error
  }
}

/**
 * Get user bookings with filters
 */
export async function getUserBookings(
  filters?: BookingFilters
): Promise<BookingListResponse> {
  try {
    const queryParams = new URLSearchParams()

    if (filters) {
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate)
      if (filters.toDate) queryParams.append('toDate', filters.toDate)
      if (filters.page) queryParams.append('page', filters.page.toString())
      if (filters.limit) queryParams.append('limit', filters.limit.toString())
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy)
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder)
    }

    const queryString = queryParams.toString()
    const url = `/bookings${queryString ? `?${queryString}` : ''}`

    const response = await request(url, {
      method: 'GET',
    })
    return response
  } catch (error) {
    console.error('Error getting user bookings:', error)
    throw error
  }
}

/**
 * Confirm payment for a booking
 */
export async function confirmPayment(
  bookingId: string,
  paymentData: {
    paymentMethod: string
    transactionRef?: string
    amount: number
  }
): Promise<BookingResponse> {
  try {
    const response = await request(`/bookings/${bookingId}/confirm-payment`, {
      method: 'POST',
      body: paymentData,
    })
    return response
  } catch (error) {
    console.error('Error confirming payment:', error)
    throw error
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(
  bookingId: string,
  reason: string
): Promise<BookingResponse> {
  try {
    const response = await request(`/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      body: { reason },
    })
    return response
  } catch (error) {
    console.error('Error cancelling booking:', error)
    throw error
  }
}

/**
 * Get cancellation preview (refund calculation)
 */
export async function getCancellationPreview(
  bookingId: string
): Promise<BookingResponse> {
  try {
    const response = await request(
      `/bookings/${bookingId}/cancellation-preview`,
      {
        method: 'GET',
      }
    )
    return response
  } catch (error) {
    console.error('Error getting cancellation preview:', error)
    throw error
  }
}

/**
 * Get modification preview (fees and current data)
 */
export async function getModificationPreview(
  bookingId: string
): Promise<BookingResponse> {
  try {
    const response = await request(
      `/bookings/${bookingId}/modification-preview`,
      {
        method: 'GET',
      }
    )
    return response
  } catch (error) {
    console.error('Error getting modification preview:', error)
    throw error
  }
}

/**
 * Modify a booking (update passenger info or change seats)
 */
export async function modifyBooking(
  bookingId: string,
  modifications: {
    passengerUpdates?: Array<{
      ticketId: string
      fullName?: string
      phone?: string
      documentId?: string
    }>
    seatChanges?: Array<{
      ticketId: string
      oldSeatCode: string
      newSeatCode: string
    }>
  }
): Promise<BookingResponse> {
  try {
    const response = await request(`/bookings/${bookingId}/modify`, {
      method: 'PUT',
      body: modifications,
    })
    return response
  } catch (error) {
    console.error('Error modifying booking:', error)
    throw error
  }
}
