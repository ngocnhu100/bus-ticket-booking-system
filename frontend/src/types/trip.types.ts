/**
 * RULES:
 * 1. Use RouteAdminData, BusAdminData, OperatorAdminData for admin CRUD
 * 2. Use Trip for passenger-facing trip display
 * 3. Use TripFormData for admin trip creation/editing forms
 * 4. Use SeatMapData for seat map management
 */

// ============================================================================
// ADMIN ENTITY TYPES - For Management APIs
// ============================================================================

/**
 * TripAdminData - Admin trip creation/editing form data
 * Flattened structure (no nested objects)
 * Matches API: POST /admin/trips request body + PUT /admin/trips/{tripId}
 *
 * Use this for:
 * - Form inputs in TripFormDrawer
 * - Creating trips via useAdminTrips.createTrip()
 * - Editing trips via useAdminTrips.updateTrip()
 */
export interface TripAdminData {
  trip_id?: string
  route_id: string
  bus_id: string
  departure_time: string // ISO 8601 format
  arrival_time: string // ISO 8601 format
  base_price: number
  service_fee?: number
  status: 'active' | 'inactive'
  is_recurring?: boolean
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly'
  created_at?: string
}

/**
 * RouteAdminData - Route information for admin management
 * Matches API: POST /admin/routes response + GET /admin/routes
 * Includes pickup and dropoff points for comprehensive route management
 */
export interface RouteAdminData {
  route_id?: string
  operator_id: string
  origin: string
  destination: string
  distance_km: number
  estimated_minutes: number
  pickup_points: PickupPoint[]
  dropoff_points: DropoffPoint[]
  route_stops?: RouteStop[]
  created_at?: string
}

/**
 * BusAdminData - Bus information for admin management
 * Matches API: POST /admin/buses + GET /admin/buses response
 * Note: status limited to 'active' | 'inactive' per API
 */
export interface BusAdminData {
  busId?: string
  name: string
  model: string
  plateNumber: string
  type: 'standard' | 'limousine' | 'sleeper'
  capacity: number
  amenities: string[]
  status: 'active' | 'inactive'
  imageUrl?: string
  createdAt?: string
}

/**
 * OperatorAdminData - Operator information for admin management
 * Matches API: GET /admin/operators response
 * Note: Field names match API (contactEmail, contactPhone, not email/phone)
 */
export interface OperatorAdminData {
  operatorId: string
  name: string
  contactEmail: string
  contactPhone: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  totalRoutes: number
  totalBuses: number
  rating: number
  approvedAt?: string
  createdAt: string
}

// ============================================================================
// SEAT & SEATMAP TYPES
// ============================================================================

/**
 * Seat - Individual seat in a bus
 * Matches API: GET /trips/{tripId}/seats - seats array element
 */
export interface Seat {
  seatId: string
  seatCode: string
  row: number
  column: number
  seatType: 'standard' | 'vip' | 'window' | 'aisle'
  position: 'window' | 'aisle'
  price: number
  status: 'available' | 'occupied' | 'locked' | 'disabled'
}

/**
 * SeatMapData - Seat layout and availability for a trip
 * Matches API: GET /trips/{tripId}/seats response
 */
export interface SeatMapData {
  tripId: string
  layout: string // e.g., "2-2", "2-3"
  rows: number
  columns: number
  seats: Seat[]
}

// ============================================================================
// TRIP-RELATED TYPES - For Passenger Display
// ============================================================================

/**
 * PickupPoint - Passenger pickup location
 * Part of Trip object from API
 */
export interface PickupPoint {
  point_id: string
  name: string
  address: string
  time: string // ISO 8601 format
}

/**
 * DropoffPoint - Passenger dropoff location
 * Part of Trip object from API
 */
export interface DropoffPoint {
  point_id: string
  name: string
  address: string
  time: string // ISO 8601 format
}

/**
 * RouteStop - Intermediate stops along a route
 * Matches API: GET /admin/routes/{routeId}/stops + POST/PUT /admin/routes/{routeId}/stops
 */
export interface RouteStop {
  stop_id?: string
  route_id?: string
  stop_name: string
  sequence: number
  arrival_offset_minutes?: number
  departure_offset_minutes?: number
  address?: string
}

/**
 * Policies - Trip cancellation, modification, and refund information
 * Part of Trip object from API
 */
export interface Policies {
  cancellation_policy: string
  modification_policy: string
  refund_policy: string
}

/**
 * Trip - Complete trip information with nested objects
 * Matches API: GET /trips/search + GET /trips/{tripId} response
 *
 * IMPORTANT STRUCTURE:
 * - Use this for DISPLAYING trips to passengers
 * - Contains nested objects (route, operator, bus, schedule, pricing, etc.)
 * - DO NOT use for admin forms - use TripAdminData instead
 */
/* export interface Trip {
  origin: string
  destination: string
  date: string // ISO 8601 format
  price_min: number
  price_max: number
  departure_start: string // ISO 8601 format
  departure_end: string // ISO 8601 format
  bus_model: string
  min_seats: number
  limit?: number
  offset?: number
  sort?: string
} */

export interface Trip {
  trip_id: string
  route: {
    route_id: string
    origin: string
    destination: string
    distance_km: number
    estimated_minutes: number
  }
  operator: {
    operator_id: string
    name: string
    rating: number
    logo?: string
  }
  bus: {
    bus_id: string
    model: string
    plate_number: string
    seat_capacity: number
    bus_type: 'standard' | 'limousine' | 'sleeper'
    amenities: string[]
  }
  schedule: {
    departure_time: string // ISO 8601 format
    arrival_time: string // ISO 8601 format
    duration: number // in minutes
  }
  pricing: {
    base_price: number
    currency: string
    service_fee?: number
  }
  availability: {
    total_seats: number
    available_seats: number
    occupancy_rate?: number
  }
  policies: Policies
  pickup_points: PickupPoint[]
  dropoff_points: DropoffPoint[]
  route_stops?: RouteStop[]
  status: 'active' | 'inactive'
}

// ============================================================================
// DEPRECATED LEGACY TYPES - DO NOT USE
// ============================================================================

/**
 * @deprecated Use RouteAdminData instead
 * Kept only for backward compatibility during migration
 */
export interface Route {
  id: string
  from: string
  to: string
  distance: number
  estimatedDuration: number
  pickupPoints: string[]
  dropoffPoints: string[]
  status: 'active' | 'inactive'
}

/**
 * @deprecated Use BusAdminData instead
 * Kept only for backward compatibility during migration
 */
export interface Bus {
  id: string
  name: string
  model: string
  plateNumber: string
  type: 'standard' | 'limousine' | 'sleeper'
  capacity: number
  amenities: string[]
  status: 'active' | 'inactive'
  imageUrl?: string
}

/**
 * @deprecated Use OperatorAdminData instead
 * Kept only for backward compatibility during migration
 */
export interface Operator {
  id: string
  name: string
  email: string
  phone: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  createdAt: string
  performanceMetrics?: {
    totalTrips: number
    averageRating: number
    cancellationRate: number
  }
}

/**
 * @deprecated Use SeatMapData instead
 * Kept only for backward compatibility during migration
 */
export interface SeatMap {
  id: string
  busId: string
  name: string
  rows: number
  columns: number
  seats: Seat[]
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const WEEKDAYS = [
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
  'SUN',
] as const

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts a Trip object to TripAdminData for edit operations
 * Extracts nested properties into flat structure for form handling
 *
 * @param trip - The Trip object to convert
 * @returns TripAdminData ready for editing
 *
 * @example
 * const adminData = tripToAdminData(trip);
 * onEditTrip(adminData);
 */
export const tripToAdminData = (trip: Trip): TripAdminData => ({
  trip_id: trip.trip_id,
  route_id: trip.route.route_id,
  bus_id: trip.bus.bus_id,
  departure_time: trip.schedule.departure_time,
  arrival_time: trip.schedule.arrival_time,
  base_price: trip.pricing.base_price,
  service_fee: trip.pricing.service_fee,
  status: trip.status as 'active' | 'inactive',
})
