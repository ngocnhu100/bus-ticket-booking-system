// ============================================================================
// ADMIN ENTITY TYPES - For Management APIs
// ============================================================================

// Layout structure types for seat maps
export type SeatItemType =
  | string
  | null
  | { code: string; floor?: number; price?: number }

export type LayoutRow = {
  row: number
  seats: SeatItemType[]
}

/**
 * RouteAdminData - Route information for admin management
 * Matches API:  /trips/routes
 */
export interface RouteAdminData {
  route_id?: string
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
  operator_name?: string
  bus_id?: string
  name: string
  model: string
  plate_number: string
  type: 'standard' | 'limousine' | 'sleeper'
  capacity: number
  amenities: string[]
  status: 'active' | 'inactive' | 'maintenance'
  image_url?: string
  image_urls?: string[]
  has_seat_layout?: boolean
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
  rating_count: number
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
  seat_id?: string
  bus_id?: string
  seat_code: string
  row: number
  column: number
  seat_type: 'standard' | 'vip'
  position: 'window' | 'aisle'
  price: number
  status: 'available' | 'occupied' | 'locked'
  locked_by?: string
  locked_until?: string
  created_at?: string
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
  driver?: DriverPosition | null
  doors?: DoorPosition[]
  seats: Seat[]
  layout_structure?: {
    rows: LayoutRow[]
  }
}

/**
 * DriverPosition - Location of the driver seat
 * Not part of the row/col grid - uses position types
 */
export interface DriverPosition {
  position: 'front-left' | 'front-right' | 'front-center'
  label: string
}

/**
 * DoorPosition - Location of bus entrances/exits
 * Not part of the row/col grid - uses position types
 */
export interface DoorPosition {
  position:
    | 'front-left'
    | 'front-right'
    | 'rear-left'
    | 'rear-right'
    | 'middle-left'
    | 'middle-right'
  label: string
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
  time?: string // ISO 8601 format - optional for backward compatibility
  departure_offset_minutes: number
}

/**
 * DropoffPoint - Passenger dropoff location
 * Part of Trip object from API
 */
export interface DropoffPoint {
  point_id: string
  name: string
  address: string
  time?: string // ISO 8601 format - optional for backward compatibility
  departure_offset_minutes: number
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

// ============================================================================
// TRIP CREATION AND UPDATE REQUESTS
// ============================================================================

export interface TripCreateRequest {
  route_id: string
  bus_id: string
  operator_id: string
  departure_time: string // ISO 8601 format
  arrival_time?: string // ISO 8601 format (optional - calculated by backend)
  base_price: number
  service_fee?: number
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  policies?: {
    cancellation_policy: string
    refund_policy: string
    modification_policy: string
  }
}

export interface TripUpdateRequest {
  route_id?: string
  bus_id?: string
  operator_id?: string
  departure_time?: string
  arrival_time?: string
  base_price?: number
  service_fee?: number
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  policies?: {
    cancellation_policy: string
    refund_policy: string
    modification_policy: string
  }
}

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
    image_urls?: string[]
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
  bookings?: number // Number of confirmed bookings
  policies: Policies
  pickup_points: PickupPoint[]
  dropoff_points: DropoffPoint[]
  route_stops?: RouteStop[]
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

/**
 * BookingAdminData - Booking information for admin management
 * Matches API: GET /bookings/admin response
 */
export interface BookingAdminData {
  booking_id: string
  booking_reference: string
  trip_id: string
  user_id?: string
  contact_email: string
  contact_phone: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'unpaid' | 'paid' | 'refunded'
  total_price: number
  subtotal?: number
  service_fee?: number
  refund_amount?: number
  cancellation_reason?: string
  currency: string
  created_at: string
  updated_at: string
  user?: {
    email: string
    name: string
  }
  passengerCount?: number
  passengers?: BookingPassenger[]
  trip?: BookingTripDetails
}

/**
 * BookingPassenger - Passenger information in a booking
 */
export interface BookingPassenger {
  passenger_id: string
  full_name: string
  phone: string
  document_id: string
  seat_code: string
}

/**
 * BookingTripDetails - Trip details in booking
 */
export interface BookingTripDetails {
  trip_id: string
  route: {
    origin: string
    destination: string
  }
  schedule: {
    departure_time: string
    arrival_time: string
  }
  pricing: {
    basePrice: number
  }
}

// ============================================================================
// ALTERNATIVE TRIP SUGGESTIONS
// ============================================================================

/**
 * AlternativeDate - Alternative date suggestion for same route
 * Matches API: GET /trips/alternatives response.alternativeDates[]
 */
export interface AlternativeDate {
  date: string // YYYY-MM-DD format
  dayName: string // e.g., "Mon", "Tue"
  monthDay: string // e.g., "Dec 30"
  daysAhead: number // Days from original date
  tripCount: number // Number of available trips
}

/**
 * AlternativeDestination - Alternative destination from origin
 * Matches API: GET /trips/alternatives response.alternativeDestinations[]
 */
export interface AlternativeDestination {
  destination: string
  tripCount: number // Number of available trips
}

/**
 * FlexibleSearch - Flexible search option
 * Matches API: GET /trips/alternatives response.flexibleSearch
 */
export interface FlexibleSearch {
  trips: Trip[]
  totalCount: number
  page: number
  totalPages: number
  limit: number
  description: string // e.g., "Search next 7 days"
}

/**
 * AlternativeTrips - Complete alternative trip suggestions
 * Matches API: GET /trips/alternatives response
 */
export interface AlternativeTrips {
  alternativeDates: AlternativeDate[]
  alternativeDestinations: AlternativeDestination[]
  flexibleSearch: FlexibleSearch | null
}
