/**
 * Trip Type Conversion Utilities
 * Converts between Trip (from trip.types.ts - structured format)
 * and display-friendly format for UI components
 */

import type { Trip } from '@/types/trip.types'

/**
 * Display-friendly Trip format for UI components
 * Maps from the structured Trip type to a flattened structure
 */
export interface DisplayTrip extends Trip {
  operatorName?: string
  operatorRating?: number
  operatorLogo?: string
  departureTime?: string
  departureLocation?: string
  arrivalTime?: string
  arrivalLocation?: string
  duration?: string
  distance?: string
  totalPrice?: number
  originalPrice?: number
  discount?: number
  serviceFee?: number
  availableSeats?: number
  totalSeats?: number
  busModel?: string
  busCapacity?: number
  busType?: string
  plateNumber?: string
  amenityList?: { id: string; name: string }[]
  isBestPrice?: boolean
  isLimitedOffer?: boolean
}

/**
 * Helper type to extract display properties from Trip for filtering/sorting
 */
export interface TripDisplayProperties {
  trip_id: string
  operatorName: string
  rating: number
  price: number
  departureTime: string
  arrivalTime: string
  duration: string
  distance: string
  seatType: 'standard' | 'limousine' | 'sleeper'
  availableSeats: number
  amenities: { id: string; name: string }[]
}

/**
 * Extract display properties from structured Trip for use in filtering/sorting
 */
export const getTripDisplayProperties = (trip: Trip): TripDisplayProperties => {
  const departureDate = new Date(trip.schedule.departure_time)
  const durationMinutes = trip.schedule.duration
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60
  const durationStr =
    hours > 0
      ? minutes > 0
        ? `${hours}h${minutes}m`
        : `${hours}h`
      : `${minutes}m`

  return {
    trip_id: trip.trip_id,
    operatorName: trip.operator.name,
    rating: trip.operator.rating,
    price: trip.pricing.base_price,
    departureTime: departureDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    arrivalTime: new Date(trip.schedule.arrival_time).toLocaleTimeString(
      'en-US',
      { hour: '2-digit', minute: '2-digit', hour12: false }
    ),
    duration: durationStr,
    distance: `${trip.route.distance_km} km`,
    seatType: trip.bus.bus_type,
    availableSeats: trip.availability.available_seats,
    amenities: trip.bus.amenities.map((amenity) => ({
      id: amenity.toLowerCase().replace(/\s+/g, '-'),
      name: amenity,
    })),
  }
}

/**
 * Converts a Trip from trip.types.ts format to display-friendly format
 */
export const tripToDisplayFormat = (trip: Trip): DisplayTrip => {
  const departureDate = new Date(trip.schedule.departure_time)
  const arrivalDate = new Date(trip.schedule.arrival_time)

  const durationMinutes = trip.schedule.duration
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60
  const durationStr =
    hours > 0
      ? minutes > 0
        ? `${hours}h${minutes}m`
        : `${hours}h`
      : `${minutes}m`

  return {
    ...trip,
    operatorName: trip.operator.name,
    operatorRating: trip.operator.rating,
    operatorLogo: trip.operator.logo,
    departureTime: departureDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    departureLocation: trip.route.origin,
    arrivalTime: arrivalDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    arrivalLocation: trip.route.destination,
    duration: durationStr,
    distance: `${trip.route.distance_km} km`,
    totalPrice: trip.pricing.base_price,
    serviceFee: trip.pricing.service_fee,
    availableSeats: trip.availability.available_seats,
    totalSeats: trip.availability.total_seats,
    busModel: trip.bus.model,
    busCapacity: trip.bus.seat_capacity,
    busType: trip.bus.bus_type,
    plateNumber: trip.bus.plate_number,
    amenityList: trip.bus.amenities.map((amenity) => ({
      id: amenity.toLowerCase().replace(/\s+/g, '-'),
      name: amenity,
    })),
  }
}

type LegacyAmenity = { id: string; name: string }
type PointType = { name: string; address: string; time?: string }
type RouteDetailsType = {
  pickupPoints?: PointType[]
  dropoffPoints?: PointType[]
  stops?: PointType[]
}

/**
 * Converts legacy mock trip format to Trip format
 * For development/testing with mock data
 */
export const legacyTripToTripFormat = (legacyTrip: unknown): Trip => {
  const trip = legacyTrip as Record<string, unknown>
  const today = new Date().toISOString().split('T')[0]
  const departureTime = `${today}T${trip.departureTime}:00`
  const arrivalTime = `${today}T${trip.arrivalTime}:00`

  const durationMatch = (trip.duration as string).match(/(\d+)h?(\d+)?m?/)
  const hours = durationMatch?.[1] ? parseInt(durationMatch[1]) : 0
  const mins = durationMatch?.[2] ? parseInt(durationMatch[2]) : 0
  const durationMinutes = hours * 60 + mins

  const distanceKm = parseInt((trip.distance as string).replace(/\D/g, ''))

  const routeDetails = trip.routeDetails as RouteDetailsType | undefined

  const amenities = (trip.amenities as LegacyAmenity[]) || []

  return {
    trip_id: trip.id as string,
    route: {
      route_id: `route_${trip.id}`,
      origin: trip.departureLocation as string,
      destination: trip.arrivalLocation as string,
      distance_km: distanceKm,
      estimated_minutes: durationMinutes,
    },
    operator: {
      operator_id: `operator_${trip.id}`,
      name: trip.operatorName as string,
      rating: trip.rating as number,
      logo: trip.operatorLogo as string | undefined,
    },
    bus: {
      bus_id: `bus_${trip.id}`,
      model: (trip.busModel as string) || '',
      plate_number: (trip.plateNumber as string) || '',
      seat_capacity:
        (trip.busCapacity as number) || (trip.totalSeats as number),
      bus_type: trip.seatType as 'standard' | 'limousine' | 'sleeper',
      amenities: amenities.map((a) => a.id),
    },
    schedule: {
      departure_time: departureTime,
      arrival_time: arrivalTime,
      duration: durationMinutes,
    },
    pricing: {
      base_price: trip.price as number,
      currency: 'VND',
      service_fee: trip.serviceFee as number | undefined,
    },
    availability: {
      total_seats: trip.totalSeats as number,
      available_seats: trip.availableSeats as number,
    },
    policies: {
      cancellation_policy:
        (trip.policies as Record<string, string>)?.cancellation || '',
      modification_policy:
        (trip.policies as Record<string, string>)?.change || '',
      refund_policy: (trip.policies as Record<string, string>)?.refund || '',
    },
    pickup_points:
      routeDetails?.pickupPoints?.map((p) => ({
        point_id: `pickup_${Math.random()}`,
        name: p.name,
        address: p.address,
        time: p.time || (trip.departureTime as string),
        departure_offset_minutes: 0, // Default to 0, can be adjusted later
      })) || [],
    dropoff_points:
      routeDetails?.dropoffPoints?.map((p) => ({
        point_id: `dropoff_${Math.random()}`,
        name: p.name,
        address: p.address,
        time: p.time || (trip.arrivalTime as string),
        departure_offset_minutes: 0, // Default to 0, can be adjusted later
      })) || [],
    route_stops:
      routeDetails?.stops?.map((stop, index) => {
        // Calculate arrival offset from departure time
        let arrival_offset_minutes: number | undefined = undefined
        if (stop.time) {
          const [depHours, depMinutes] = (trip.departureTime as string)
            .split(':')
            .map(Number)
          const [stopHours, stopMinutes] = stop.time.split(':').map(Number)
          const depTotalMinutes = depHours * 60 + depMinutes
          const stopTotalMinutes = stopHours * 60 + stopMinutes
          arrival_offset_minutes = stopTotalMinutes - depTotalMinutes
          // Handle case where stop is next day (negative result)
          if (arrival_offset_minutes < 0) {
            arrival_offset_minutes += 24 * 60
          }
        }
        return {
          stop_id: `stop_${Math.random()}`,
          route_id: `route_${trip.id}`,
          stop_name: stop.name,
          sequence: index + 1,
          arrival_offset_minutes,
          departure_offset_minutes: undefined,
          address: stop.address,
        }
      }) || [],
    status: 'active',
  }
}
