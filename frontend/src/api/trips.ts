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
  bus_id: string
  bus_type: string
  license_plate: string
  total_seats: number
  amenities: Amenity[]
}

export interface Operator {
  operator_id: string
  name: string
  rating?: number
  logo?: string
}

export interface Route {
  route_id: string
  origin: string
  destination: string
  distance: number
  estimated_duration: number
}

export interface Schedule {
  schedule_id: string
  departure_time: string
  arrival_time: string
  frequency: string
}

export interface Pricing {
  base_price: number
  currency: string
  discounts?: {
    type: string
    amount: number
  }[]
}

export interface Trip {
  trip_id: string
  route: Route
  operator: Operator
  bus: Bus
  schedule: Schedule
  pricing: Pricing
  availability: {
    available_seats: number
    total_seats: number
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
  sessionId?: string
}

export interface SeatLockApiRequest {
  tripId: string
  seatCodes: string[]
  sessionId?: string
  isGuest?: boolean
}

export interface SeatLockResponse {
  success: boolean
  data: {
    locked_seats?: string[]
    transferred_seats?: string[]
    rejected_seats?: string[]
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
  request: SeatLockApiRequest
): Promise<SeatLockResponse> {
  const body: { seatCodes: string[]; sessionId?: string; isGuest?: boolean } = {
    seatCodes: request.seatCodes,
  }
  if (request.sessionId !== undefined) {
    body.sessionId = request.sessionId
  }
  if (request.isGuest !== undefined) {
    body.isGuest = request.isGuest
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
  request: SeatLockApiRequest
): Promise<SeatLockExtendResponse> {
  const body: { seatCodes: string[]; sessionId?: string; isGuest?: boolean } = {
    seatCodes: request.seatCodes,
  }
  if (request.sessionId !== undefined) {
    body.sessionId = request.sessionId
  }
  if (request.isGuest !== undefined) {
    body.isGuest = request.isGuest
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
  request: SeatLockApiRequest
): Promise<SeatLockReleaseResponse> {
  const body: { seatCodes: string[]; sessionId?: string; isGuest?: boolean } = {
    seatCodes: request.seatCodes,
  }
  if (request.sessionId !== undefined) {
    body.sessionId = request.sessionId
  }
  if (request.isGuest !== undefined) {
    body.isGuest = request.isGuest
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
  tripId: string,
  sessionId?: string,
  isGuest?: boolean
): Promise<SeatLockReleaseResponse> {
  const body: { sessionId?: string; isGuest?: boolean } = {}
  if (sessionId !== undefined) {
    body.sessionId = sessionId
  }
  if (isGuest !== undefined) {
    body.isGuest = isGuest
  }
  return await apiRequest(`/trips/${tripId}/seats/release-all`, {
    method: 'POST',
    body,
  })
}

/**
 * Get all active locks for a user for a specific trip
 */
export async function getUserLocks(
  tripId: string,
  sessionId?: string,
  isGuest?: boolean
): Promise<UserLocksResponse> {
  const queryParams = new URLSearchParams()
  if (sessionId !== undefined) {
    queryParams.append('sessionId', sessionId)
  }
  if (isGuest !== undefined) {
    queryParams.append('isGuest', isGuest.toString())
  }
  const queryString = queryParams.toString()
  const url = queryString
    ? `/trips/${encodeURIComponent(tripId)}/seats/my-locks?${queryString}`
    : `/trips/${encodeURIComponent(tripId)}/seats/my-locks`

  return await apiRequest(url, {
    method: 'GET',
  })
}

/**
 * Transfer guest locks to authenticated user
 */
export async function transferGuestLocks(
  tripId: string,
  guestSessionId: string,
  maxSeats: number = 5
): Promise<SeatLockResponse> {
  return await apiRequest(`/trips/${tripId}/seats/transfer-guest-locks`, {
    method: 'POST',
    body: { guestSessionId, maxSeats },
  })
}
