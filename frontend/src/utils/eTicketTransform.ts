import { Booking } from '@/types/booking.types'
import { ETicketData } from '@/components/booking/ETicket'

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
      booking.trip?.schedule?.departureTime &&
      booking.trip?.schedule?.arrivalTime
    ) {
      const departure = new Date(booking.trip.schedule.departureTime)
      const arrival = new Date(booking.trip.schedule.arrivalTime)
      return Math.floor((arrival.getTime() - departure.getTime()) / (1000 * 60))
    }
    return undefined
  }

  return {
    bookingReference: booking.bookingReference,
    status: booking.status as 'confirmed' | 'pending' | 'cancelled',
    paymentStatus: booking.paymentStatus as 'paid' | 'pending' | 'failed',
    bookingDate: booking.createdAt,
    passengers: booking.passengers.map((p) => ({
      name: p.name,
      seatNumber: p.seatNumber,
      passengerType: p.passengerType || 'adult',
    })),
    trip: {
      route: {
        originCity: booking.trip?.route?.origin?.city || 'N/A',
        destinationCity: booking.trip?.route?.destination?.city || 'N/A',
        distance: booking.trip?.route?.distance,
      },
      operator: {
        name: booking.trip?.operator?.name || 'Bus Operator',
        logo: booking.trip?.operator?.logo,
      },
      schedule: {
        departureTime:
          booking.trip?.schedule?.departureTime || booking.createdAt,
        arrivalTime: booking.trip?.schedule?.arrivalTime || booking.createdAt,
        duration: getDuration(),
      },
      bus: {
        busNumber: booking.trip?.bus?.busNumber || 'N/A',
        type: booking.trip?.bus?.type || 'Standard',
      },
    },
    pricing: {
      subtotal: booking.totalPrice - (booking.serviceFee || 0),
      serviceFee: booking.serviceFee || 0,
      total: booking.totalPrice,
    },
    contact: {
      email: booking.contactEmail || booking.user?.email,
      phone: booking.contactPhone || booking.user?.phone,
    },
    qrCode: booking.eTicket?.qrCode,
    ticketUrl: booking.eTicket?.ticketUrl,
  }
}

/**
 * Check if a booking has sufficient data to display an e-ticket
 */
export function canDisplayETicket(booking: Booking): boolean {
  return !!(
    booking.bookingReference &&
    booking.status &&
    booking.paymentStatus &&
    booking.passengers &&
    booking.passengers.length > 0 &&
    booking.totalPrice !== undefined
  )
}

/**
 * Check if e-ticket assets (QR code, PDF) are available
 */
export function hasETicketAssets(booking: Booking): boolean {
  return !!(booking.eTicket?.qrCode || booking.eTicket?.ticketUrl)
}
