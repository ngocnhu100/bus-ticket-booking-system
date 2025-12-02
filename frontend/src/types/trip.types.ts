// ============================================================================
// ADMIN ENTITY TYPES - For Management APIs
// ============================================================================

/**
 * RouteAdminData - Route information for admin management
 * Matches API:  /trips/routes
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
 * Matches API:  /trips/buses
 */
export interface BusAdminData {
  operator_id?: string
  bus_id?: string
  name: string
  model: string
  plate_number: string
  type: 'standard' | 'limousine' | 'sleeper'
  capacity: number
  amenities: string[]
  status: 'active' | 'inactive'
  image_url?: string
  created_at?: string
}

/**
 * OperatorAdminData - Operator information for admin management
 * Matches API:  /trips/operators
 * Note: Field names match API (contactEmail, contactPhone, not email/phone)
 */
export interface OperatorAdminData {
  operator_id: string
  name: string
  contact_email: string
  contact_phone: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  total_routes: number
  total_buses: number
  rating: number
  approved_at?: string
  created_at: string
}

// ============================================================================
// SEAT & SEATMAP TYPES
// ============================================================================

/**
 * Seat - Individual seat in a bus
 * Matches API: GET /trips/{tripId}/seats - seats array element
 */
export interface Seat {
  seat_id: string
  seat_code: string
  row: number
  column: number
  seat_type: 'standard' | 'vip' | 'window' | 'aisle'
  position: 'window' | 'aisle'
  price: number
  status: 'available' | 'occupied' | 'locked' | 'disabled'
}

/**
 * SeatMapData - Seat layout and availability for a trip
 * Matches API: GET /trips/{tripId}/seats response
 */
export interface SeatMapData {
  trip_id: string
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
 * Matches POST and PUT /trips request
 */

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
