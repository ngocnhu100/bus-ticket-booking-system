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
 * RouteAdminData - Route information for admin management
 * Matches API: POST /admin/routes response + GET /admin/routes
 * Includes pickup and dropoff points for comprehensive route management
 */
export interface RouteAdminData {
  routeId?: string
  operatorId: string
  origin: string
  destination: string
  distanceKm: number
  estimatedMinutes: number
  pickupPoints: PickupPoint[]
  dropoffPoints: DropoffPoint[]
  createdAt?: string
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
  pointId: string
  name: string
  address: string
  time: string // ISO 8601 format
}

/**
 * DropoffPoint - Passenger dropoff location
 * Part of Trip object from API
 */
export interface DropoffPoint {
  pointId: string
  name: string
  address: string
  time: string // ISO 8601 format
}

/**
 * Policies - Trip cancellation, modification, and refund information
 * Part of Trip object from API
 */
export interface Policies {
  cancellationPolicy: string
  modificationPolicy: string
  refundPolicy: string
}

/**
 * Trip - Complete trip information with nested objects
 * Matches API: GET /trips/search + GET /trips/{tripId} response
 *
 * IMPORTANT STRUCTURE:
 * - Use this for DISPLAYING trips to passengers
 * - Contains nested objects (route, operator, bus, schedule, pricing, etc.)
 * - DO NOT use for admin forms - use TripFormData instead
 */
export interface Trip {
  tripId: string
  route: {
    routeId: string
    origin: string
    destination: string
    distanceKm: number
    estimatedMinutes: number
  }
  operator: {
    operatorId: string
    name: string
    rating: number
    logo?: string
  }
  bus: {
    busId: string
    model: string
    plateNumber: string
    seatCapacity: number
    busType: 'standard' | 'limousine' | 'sleeper'
    amenities: string[]
  }
  schedule: {
    departureTime: string // ISO 8601 format
    arrivalTime: string // ISO 8601 format
    duration: number // in minutes
  }
  pricing: {
    basePrice: number
    currency: string
    serviceFee?: number
  }
  availability: {
    totalSeats: number
    availableSeats: number
    occupancyRate: number
  }
  policies: Policies
  pickupPoints: PickupPoint[]
  dropoffPoints: DropoffPoint[]
  status: 'active' | 'inactive'
}

/**
 * TripFormData - Admin trip creation/editing form data
 * Flattened structure (no nested objects)
 * Matches API: POST /admin/trips request body + PUT /admin/trips/{tripId}
 *
 * Use this for:
 * - Form inputs in TripFormDrawer
 * - Creating trips via useAdminTrips.createTrip()
 * - Editing trips via useAdminTrips.updateTrip()
 */
export interface TripFormData {
  tripId?: string
  routeId: string
  busId: string
  departureTime: string // ISO 8601 format
  arrivalTime: string // ISO 8601 format
  basePrice: number
  status: 'active' | 'inactive'
  isRecurring?: boolean
  recurrencePattern?: 'daily' | 'weekly' | 'monthly'
  createdAt?: string
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
