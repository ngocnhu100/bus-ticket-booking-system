import { request as apiRequest } from '@/api/auth'

export interface TripSearchParams {
  origin: string
  destination: string
  date: string
  passengers?: number
  busType?: string[]
  departureTime?: string[]
  minPrice?: number
  maxPrice?: number
  operatorId?: string
  amenities?: string[]
  page?: number
  limit?: number
}

export interface Amenity {
  id: string
  name: string
  icon?: string
}

export interface Bus {
  busId: string
  busType: string
  licensePlate: string
  totalSeats: number
  amenities: Amenity[]
}

export interface Operator {
  operatorId: string
  name: string
  rating?: number
  logo?: string
}

export interface Route {
  routeId: string
  origin: string
  destination: string
  distance: number
  estimatedDuration: number
}

export interface Schedule {
  scheduleId: string
  departureTime: string
  arrivalTime: string
  frequency: string
}

export interface Pricing {
  basePrice: number
  currency: string
  discounts?: {
    type: string
    amount: number
  }[]
}

export interface Trip {
  tripId: string
  route: Route
  operator: Operator
  bus: Bus
  schedule: Schedule
  pricing: Pricing
  availability: {
    availableSeats: number
    totalSeats: number
  }
}

export interface TripSearchResponse {
  success: boolean
  data: {
    trips: Trip[]
    totalCount: number
    page: number
    limit: number
  }
  timestamp: string
}

export async function searchTrips(
  params: TripSearchParams
): Promise<TripSearchResponse> {
  const queryParams = new URLSearchParams()

  // Required parameters
  queryParams.append('origin', params.origin)
  queryParams.append('destination', params.destination)
  queryParams.append('date', params.date)

  // Optional parameters
  if (params.passengers) {
    queryParams.append('passengers', params.passengers.toString())
  }

  if (params.busType && params.busType.length > 0) {
    params.busType.forEach((type) => queryParams.append('busType', type))
  }

  if (params.departureTime && params.departureTime.length > 0) {
    params.departureTime.forEach((time) =>
      queryParams.append('departureTime', time)
    )
  }

  if (params.minPrice !== undefined) {
    queryParams.append('minPrice', params.minPrice.toString())
  }

  if (params.maxPrice !== undefined) {
    queryParams.append('maxPrice', params.maxPrice.toString())
  }

  if (params.operatorId) {
    queryParams.append('operatorId', params.operatorId)
  }

  if (params.amenities && params.amenities.length > 0) {
    params.amenities.forEach((amenity) =>
      queryParams.append('amenities', amenity)
    )
  }

  if (params.page) {
    queryParams.append('page', params.page.toString())
  }

  if (params.limit) {
    queryParams.append('limit', params.limit.toString())
  }

  const data = await apiRequest(`/trips/search?${queryParams.toString()}`, {
    method: 'GET',
  })

  return data
}

// ============================================================================
// SEAT LOCKING API FUNCTIONS
// ============================================================================

export interface SeatLockRequest {
  tripId: string
  seatCodes: string[]
  userId: string
}

export interface SeatLockResponse {
  success: boolean
  data: {
    locked_seats: string[]
    expires_at: string
  }
  message?: string
}

export interface SeatLockExtendResponse {
  success: boolean
  data: {
    extended_seats: string[]
    expires_at: string
  }
  message?: string
}

export interface SeatLockReleaseResponse {
  success: boolean
  data: {
    released_seats: string[]
  }
  message?: string
}

export interface UserLocksResponse {
  success: boolean
  data: {
    trip_id: string
    user_id: string
    locked_seats: {
      seat_code: string
      locked_at: string
      expires_at: string
    }[]
  }
}

/**
 * Lock seats for a user during checkout process
 */
export async function lockSeats(
  request: SeatLockRequest
): Promise<SeatLockResponse> {
  const body = {
    seatCodes: request.seatCodes,
  }
  if (request.sessionId !== undefined) {
    body.sessionId = request.sessionId
  }
  return await apiRequest(`/trips/${request.tripId}/seats/lock`, {
    method: 'POST',
    body,
  })
}

/**
 * Extend existing seat locks
 */
export async function extendSeatLocks(
  request: SeatLockRequest
): Promise<SeatLockExtendResponse> {
  const body = {
    seatCodes: request.seatCodes,
  }
  if (request.sessionId !== undefined) {
    body.sessionId = request.sessionId
  }
  return await apiRequest(`/trips/${request.tripId}/seats/extend`, {
    method: 'POST',
    body,
  })
}

/**
 * Release specific seat locks
 */
export async function releaseSeatLocks(
  request: SeatLockRequest
): Promise<SeatLockReleaseResponse> {
  const body = {
    seatCodes: request.seatCodes,
  }
  if (request.sessionId !== undefined) {
    body.sessionId = request.sessionId
  }
  return await apiRequest(`/trips/${request.tripId}/seats/release`, {
    method: 'POST',
    body,
  })
}

/**
 * Release all locks for a user
 */
export async function releaseAllSeatLocks(
  tripId: string
): Promise<SeatLockReleaseResponse> {
  return await apiRequest(`/trips/${tripId}/seats/release-all`, {
    method: 'POST',
    body: {},
  })
}

/**
 * Get all active locks for a user for a specific trip
 */
export async function getUserLocks(tripId: string): Promise<UserLocksResponse> {
  return await apiRequest(
    `/trips/${encodeURIComponent(tripId)}/seats/my-locks`,
    {
      method: 'GET',
    }
  )
}
