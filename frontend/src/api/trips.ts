const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

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

  const response = await fetch(
    `${API_BASE_URL}/trips/search?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData?.error?.message || 'Failed to search trips. Please try again.'
    )
  }

  return response.json()
}
