export interface Passenger {
  fullName: string
  idNumber?: string
  phone?: string
  seatNumber: string
  price?: number
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
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  totalPrice: number
  lockedUntil: string | null
  createdAt: string
  updatedAt: string
  passengers: Passenger[]
  eTicket?: ETicket
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
