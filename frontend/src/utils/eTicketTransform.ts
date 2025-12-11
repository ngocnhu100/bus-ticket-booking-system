import type { Booking } from '@/types/booking.types'
import type { ETicketData } from '@/components/booking/ETicket'

/**
 * Transform a Booking object from the API into ETicketData format
 * suitable for the ETicket component
 */
export function transformBookingToETicket(booking: Booking): ETicketData {
  // Calculate duration if not provided
  const getDuration = (): number | undefined => {
    if (booking.trip?.schedule?.duration) {
      return booking.trip.schedule.duration
    }
    if (
      booking.trip?.schedule?.departure_time &&
      booking.trip?.schedule?.arrival_time
    ) {
      const departure = new Date(booking.trip.schedule.departure_time)
      const arrival = new Date(booking.trip.schedule.arrival_time)
      return Math.floor((arrival.getTime() - departure.getTime()) / (1000 * 60))
    }
    return undefined
  }

  return {
    bookingReference: booking.booking_reference,
    status: booking.status as 'confirmed' | 'pending' | 'cancelled',
    paymentStatus: booking.payment_status as 'paid' | 'pending' | 'failed',
    bookingDate: booking.created_at,
    passengers: booking.passengers.map((p) => ({
      name: p.fullName || p.passenger?.fullName || 'Unknown',
      seatNumber: p.seatNumber || p.seat_code || 'N/A',
      passengerType: 'adult',
    })),
    trip: {
      route: {
        originCity: booking.trip?.route?.origin || 'N/A',
        destinationCity: booking.trip?.route?.destination || 'N/A',
        distance: booking.trip?.route?.distance_km,
      },
      operator: {
        name: booking.trip?.operator?.name || 'Bus Operator',
        logo: booking.trip?.operator?.logo,
      },
      schedule: {
        departureTime:
          booking.trip?.schedule?.departure_time || booking.created_at,
        arrivalTime: booking.trip?.schedule?.arrival_time || booking.created_at,
        duration: getDuration(),
      },
      bus: {
        busNumber: booking.trip?.bus?.plate_number || 'N/A',
        type: booking.trip?.bus?.bus_type || 'Standard',
      },
    },
    pricing: {
      subtotal: (booking.total_price || 0) - (booking.service_fee || 0),
      serviceFee: booking.service_fee || 0,
      total: booking.total_price || 0,
    },
    contact: {
      email: booking.contact_email || booking.user?.email,
      phone: booking.contact_phone || (booking.user?.phone ?? undefined),
    },
    qrCode: booking.e_ticket?.qr_code_url || undefined,
    ticketUrl: booking.e_ticket?.ticket_url || undefined,
  }
}

/**
 * Check if a booking has sufficient data to display an e-ticket
 */
export function canDisplayETicket(booking: Booking): boolean {
  return !!(
    booking.booking_reference &&
    booking.status &&
    booking.payment_status &&
    booking.passengers &&
    booking.passengers.length > 0 &&
    booking.total_price !== undefined
  )
}

/**
 * Check if e-ticket assets (QR code, PDF) are available
 */
export function hasETicketAssets(booking: Booking): boolean {
  return !!(booking.e_ticket?.qr_code_url || booking.e_ticket?.ticket_url)
}
