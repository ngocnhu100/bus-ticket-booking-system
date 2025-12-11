import type { Trip } from './trip.types'

export interface Passenger {
  ticketId?: string
  bookingId?: string
  seat_code: string
  seatNumber?: string // deprecated - use seatCode
  price?: number
  fullName?: string
  phone?: string
  passenger?: {
    fullName: string
    phone?: string
    documentId?: string
  }
  createdAt?: string
}

export interface User {
  userId: number
  email: string
  phone: string | null
  fullName: string
  role: 'passenger' | 'admin'
  emailVerified: boolean
}

export interface ETicket {
  ticket_url: string | null
  qr_code_url: string | null
}

export interface CreateBookingRequest {
  tripId: string
  passengers: Passenger[]
  contactEmail?: string
  contactPhone?: string
  isGuestCheckout: boolean
}

export interface Booking {
  booking_id: string
  booking_reference: string
  trip_id: string
  user_id: string | null
  contact_email: string
  contact_phone: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
  total_price?: number
  service_fee?: number
  locked_until: string | null
  created_at: string
  updated_at: string
  passengers: Passenger[]
  pricing?: {
    subtotal: number
    service_fee: number
    total: number
    currency: string
  }
  payment?: {
    method: string | null
    status: string
    paid_at: string | null
  }
  e_ticket?: ETicket
  trip_details?: {
    trip_id?: string
    route: {
      origin: string
      destination: string
    }
    operator: {
      name: string
    }
    schedule: {
      departure_time: string
      arrival_time: string
    }
  }
  trip?: Trip
  user?: User
}

export interface BookingResponse {
  success: boolean
  data: Booking
  message: string
}

export interface BookingError {
  error: string
  message: string
  code: string
}
