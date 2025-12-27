// ============================================================================
// ADMIN TRIP SERVICE
// ============================================================================
// API functions for trip management using request from auth.js
import { request } from '@/api/auth'
import type { BusAdminData, RouteAdminData } from '@/types/trip.types'
import type {
  TripFilterParams,
  TripListResponse,
  TripData,
  TripCreateRequest,
  TripUpdateRequest,
  TripCancelRequest,
  AssignBusRequest,
  AssignRouteRequest,
  TripStatusUpdateRequest,
} from '@/types/adminTripTypes'

const API_BASE = '/trips'

class AdminTripService {
  /**
   * List all trips with filters and pagination (frontend-based)
   * GET /trips
   * Note: Filtering and pagination are done on the frontend
   * Backend API only supports origin/destination/date for customer search
   */
  async listTrips(params?: TripFilterParams): Promise<TripListResponse> {
    try {
      const response = await request(`${API_BASE}`, {
        method: 'GET',
      })

      // Handle response format
      let allTrips = response.data?.trips || response.data || []
      if (!Array.isArray(allTrips)) {
        allTrips = []
      }

      // Frontend filtering
      let filtered = allTrips

      if (params) {
        if (params.route_id) {
          filtered = filtered.filter(
            (t: TripData) => t.route?.route_id === params.route_id
          )
        }
        if (params.bus_id) {
          filtered = filtered.filter(
            (t: TripData) => t.bus?.bus_id === params.bus_id
          )
        }
        if (params.operator_id) {
          filtered = filtered.filter(
            (t: TripData) => t.operator?.operator_id === params.operator_id
          )
        }
        if (params.status) {
          filtered = filtered.filter(
            (t: TripData) => t.status === params.status
          )
        }
        if (params.search) {
          const searchLower = params.search.toLowerCase()
          filtered = filtered.filter(
            (t: TripData) =>
              t.route?.origin?.toLowerCase().includes(searchLower) ||
              t.route?.destination?.toLowerCase().includes(searchLower)
          )
        }

        // Frontend sorting
        if (params.sort_by) {
          filtered.sort((a: TripData, b: TripData) => {
            let aVal: string | number | Date | undefined
            let bVal: string | number | Date | undefined

            // Handle nested properties
            if (params.sort_by === 'departure_time') {
              aVal = a.schedule?.departure_time
              bVal = b.schedule?.departure_time
            } else {
              aVal = a[params.sort_by as keyof TripData]
              bVal = b[params.sort_by as keyof TripData]
            }

            if (aVal == null) return 1
            if (bVal == null) return -1

            const compared = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
            return params.sort_order === 'desc' ? -compared : compared
          })
        }
      }

      // Frontend pagination
      const page = params?.page || 1
      const limit = params?.limit || 20
      const start = (page - 1) * limit
      const paginatedTrips = filtered.slice(start, start + limit)

      return {
        success: true,
        data: {
          trips: paginatedTrips,
          total: filtered.length,
          page,
          limit,
          total_pages: Math.ceil(filtered.length / limit),
        },
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
      // Return empty result on error
      return {
        success: false,
        data: {
          trips: [],
          total: 0,
          page: 1,
          limit: 20,
          total_pages: 0,
        },
      }
    }
  }

  /**
   * Create a new trip
   * POST /trips
   */
  async createTrip(tripData: TripCreateRequest): Promise<TripData> {
    const response = await request(API_BASE, {
      method: 'POST',
      body: tripData,
    })
    return response.data as TripData
  }

  /**
   * Update trip details
   * PUT /trips/{tripId}
   */
  async updateTrip(
    tripId: string,
    tripData: TripUpdateRequest
  ): Promise<TripData> {
    const response = await request(`${API_BASE}/${tripId}`, {
      method: 'PUT',
      body: tripData,
    })
    return response.data as TripData
  }

  /**
   * Assign bus to a trip
   * POST /trips/{tripId}/assign-bus
   */
  async assignBusToTrip(
    tripId: string,
    busData: AssignBusRequest
  ): Promise<TripData> {
    const response = await request(`${API_BASE}/${tripId}/assign-bus`, {
      method: 'POST',
      body: busData,
    })
    return response.data as TripData
  }

  /**
   * Assign route to a trip
   * POST /trips/{tripId}/assign-route
   */
  async assignRouteToTrip(
    tripId: string,
    routeData: AssignRouteRequest
  ): Promise<TripData> {
    const response = await request(`${API_BASE}/${tripId}/assign-route`, {
      method: 'POST',
      body: routeData,
    })
    return response.data as TripData
  }

  /**
   * Update trip status
   * PATCH /trips/{tripId}/status
   */
  async updateTripStatus(
    tripId: string,
    statusData: TripStatusUpdateRequest
  ): Promise<TripData> {
    const response = await request(`${API_BASE}/${tripId}/status`, {
      method: 'PATCH',
      body: statusData,
    })
    return response.data as TripData
  }

  /**
   * Cancel a trip with automatic refund processing
   * POST /trips/{tripId}/cancel
   */
  async cancelTrip(
    tripId: string,
    cancelData: TripCancelRequest = {}
  ): Promise<TripData> {
    const response = await request(`${API_BASE}/${tripId}/cancel`, {
      method: 'POST',
      body: cancelData,
    })
    return response.data as TripData
  }

  /**
   * Validate trip data before creation
   * This implements frontend validation based on backend admin_create_trip_schema
   */
  validateTripData(tripData: TripCreateRequest): string[] {
    const errors: string[] = []

    // Validate required fields (from admin_create_trip_schema)
    if (!tripData.route_id) errors.push('Route is required')
    if (!tripData.bus_id) errors.push('Bus is required')
    if (!tripData.departure_time) errors.push('Departure time is required')
    if (!tripData.arrival_time) errors.push('Arrival time is required')

    // Validate prices
    if (typeof tripData.base_price !== 'number' || tripData.base_price < 0) {
      errors.push('Valid base price (≥ 0) is required')
    }
    if (tripData.service_fee !== undefined && tripData.service_fee < 0) {
      errors.push('Service fee must be ≥ 0')
    }

    // Validate times
    if (tripData.departure_time && tripData.arrival_time) {
      const depTime = new Date(tripData.departure_time)
      const arrTime = new Date(tripData.arrival_time)

      // Validate date parsing
      if (isNaN(depTime.getTime())) {
        errors.push('Invalid departure time format')
      }
      if (isNaN(arrTime.getTime())) {
        errors.push('Invalid arrival time format')
      }

      // Check departure < arrival
      if (depTime >= arrTime) {
        errors.push('Arrival time must be after departure time')
      }
    }

    return errors
  }

  /**
   * Validate trip update data
   * This implements frontend validation based on backend admin_update_trip_schema
   * Specific rules for trip updates:
   * - Cannot change route if status is cancelled, in_progress, or completed
   * - Bus is required if status is scheduled
   * - Price fields must be >= 0
   */
  validateTripUpdateData(
    tripData: TripUpdateRequest,
    currentTrip?: TripData
  ): string[] {
    const errors: string[] = []

    // Validate optional fields if provided
    if (tripData.base_price !== undefined && tripData.base_price < 0) {
      errors.push('Base price must be ≥ 0')
    }
    if (tripData.service_fee !== undefined && tripData.service_fee < 0) {
      errors.push('Service fee must be ≥ 0')
    }

    // Validate times if provided
    if (tripData.departure_time || tripData.arrival_time) {
      if (tripData.departure_time && tripData.arrival_time) {
        const depTime = new Date(tripData.departure_time)
        const arrTime = new Date(tripData.arrival_time)

        if (depTime >= arrTime) {
          errors.push('Arrival time must be after departure time')
        }
      }
    }

    // Validate status if provided
    if (tripData.status) {
      const validStatuses = [
        'scheduled',
        'in_progress',
        'completed',
        'cancelled',
        'active',
        'inactive',
      ]
      if (!validStatuses.includes(tripData.status)) {
        errors.push(`Status must be one of: ${validStatuses.join(', ')}`)
      }

      // Rule: Cannot change route if status is cancelled, in_progress, or completed
      const restrictedStatuses = ['cancelled', 'in_progress', 'completed']
      if (restrictedStatuses.includes(tripData.status) && tripData.route_id) {
        errors.push(`Cannot change route for ${tripData.status} trips`)
      }

      // Rule: Bus is required if changing to scheduled status
      if (
        tripData.status === 'scheduled' &&
        !tripData.bus_id &&
        currentTrip &&
        !currentTrip.bus?.bus_id
      ) {
        errors.push('Bus is required for scheduled trips')
      }
    }

    // Bus assignment validation
    if (tripData.bus_id && currentTrip) {
      // Bus can be assigned if trip is scheduled or inactive
      const currentStatus = currentTrip.status || 'scheduled'
      const allowedStatuses = ['scheduled', 'inactive']
      if (!allowedStatuses.includes(currentStatus)) {
        errors.push(`Cannot change bus for ${currentStatus} trips`)
      }
    }

    return errors
  }

  /**
   * Get all available buses for trip assignment
   * GET /trips/buses
   */
  async getAvailableBuses(): Promise<BusAdminData[]> {
    const response = await request('/trips/buses?status=active', {
      method: 'GET',
    })
    return response.data?.buses || response.data || []
  }

  /**
   * Get all routes for trip creation
   * GET /trips/routes
   */
  async getAllRoutes(): Promise<RouteAdminData[]> {
    const response = await request('/trips/routes', {
      method: 'GET',
    })
    return response.data?.routes || response.data || []
  }
}

export const adminTripService = new AdminTripService()
