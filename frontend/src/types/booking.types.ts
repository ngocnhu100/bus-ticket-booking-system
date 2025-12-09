import type { Trip } from './trip.types'

export interface Passenger {
  ticketId?: string
  bookingId?: string
  seatCode: string
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
  ticketUrl: string | null
  qrCode: string | null
}

export interface CreateBookingRequest {
  tripId: string
  passengers: Passenger[]
  contactEmail?: string
  contactPhone?: string
  isGuestCheckout: boolean
}

export interface Booking {
  bookingId: string
  bookingReference: string
  tripId: string
  userId: string | null
  contactEmail: string
  contactPhone: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'
  totalPrice?: number
  serviceFee?: number
  lockedUntil: string | null
  createdAt: string
  updatedAt: string
  passengers: Passenger[]
  pricing?: {
    subtotal: number
    serviceFee: number
    total: number
    currency: string
  }
  payment?: {
    method: string | null
    status: string
    paidAt: string | null
  }
  eTicket?: ETicket
  tripDetails?: {
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
