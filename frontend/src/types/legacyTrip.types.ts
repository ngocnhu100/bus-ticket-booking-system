// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Trip } from '@/types/trip.types'

// Legacy Trip interface for display components
// This interface is flattened for easier display in UI components
export interface LegacyTrip {
  id: string
  operatorName: string
  operatorLogo?: string
  rating: number
  reviewCount: number
  departureTime: string
  departureLocation: string
  arrivalTime: string
  arrivalLocation: string
  duration: string
  distance: string
  price: number
  originalPrice?: number
  discount?: number
  serviceFee?: number
  seatType: 'standard' | 'limousine' | 'sleeper'
  availableSeats: number
  totalSeats: number
  busModel?: string
  busCapacity?: number
  busType?: string
  plateNumber?: string
  amenities: Amenity[]
  isBestPrice?: boolean
  isLimitedOffer?: boolean
  policies?: {
    cancellation: string
    refund: string
    change: string
    luggage: string
  }
  routeDetails?: {
    stops: { name: string; address: string; time?: string }[]
    pickupPoints?: { name: string; address: string; time?: string }[]
    dropoffPoints?: { name: string; address: string; time?: string }[]
    distance: string
    duration: string
  }
  reviews?: {
    recent: { author: string; rating: number; comment: string }[]
  }
  busImages?: string[]
}

export interface Amenity {
  id: string
  name: string
  icon?: React.ReactNode
}

// Mock data - in production, this would come from the API\
/* 
export const mockLegacyTrips: LegacyTrip[] = [
  {
    id: '1',
    operatorName: 'Vie Limousine',
    rating: 4.7,
    reviewCount: 4836,
    departureTime: '19:30',
    departureLocation: 'District 1 Office',
    arrivalTime: '21:30',
    arrivalLocation: 'Vung Tau Office',
    duration: '2h',
    distance: '116 km',
    price: 170000,
    originalPrice: 190000,
    discount: 20000,
    serviceFee: 10000,
    seatType: 'limousine',
    availableSeats: 9,
    totalSeats: 9,
    busModel: 'Mercedes-Benz Sprinter',
    busCapacity: 16,
    busType: 'VIP Limousine',
    plateNumber: '51B-12345',
    amenities: [
      { id: 'wifi', name: 'WiFi' },
      { id: 'ac', name: 'Air Conditioning' },
      { id: 'usb', name: 'USB' },
    ],
    isLimitedOffer: true,
    isBestPrice: true,
    policies: {
      cancellation:
        'Free cancellation up to 2 hours before departure. 50% refund within 2 hours.',
      refund:
        'Full refund if cancelled 24 hours before. Partial refund for later cancellations.',
      change:
        'Date/time changes allowed up to 4 hours before with 10,000đ fee.',
      luggage:
        'Free luggage allowance: 1 suitcase (20kg) + 1 carry-on. Additional luggage 50,000đ per piece.',
    },
    routeDetails: {
      stops: [
        {
          name: 'District 1 Office',
          address: '123 Nguyen Trai St, District 1, Ho Chi Minh City',
          time: '19:45',
        },
        {
          name: 'Highway Rest Area',
          address: 'Long Thanh Highway, Dong Nai Province',
          time: '20:30',
        },
        {
          name: 'Vung Tau Office',
          address: '456 Le Hong Phong St, Vung Tau City',
          time: '21:15',
        },
      ],
      distance: '116 km',
      duration: '2h',
      pickupPoints: [
        {
          name: 'District 1 Office',
          address: '123 Nguyen Trai St, District 1, Ho Chi Minh City',
          time: '19:30',
        },
        {
          name: 'Tan Son Nhat Airport',
          address: 'Truong Son Road, Tan Binh District, Ho Chi Minh City',
          time: '20:00',
        },
        {
          name: 'Pham Ngu Lao Area',
          address: 'Pham Ngu Lao Street, District 1, Ho Chi Minh City',
          time: '19:45',
        },
      ],
      dropoffPoints: [
        {
          name: 'Vung Tau Center',
          address: 'Tran Phu Boulevard, Vung Tau City',
          time: '21:30',
        },
        {
          name: 'Vung Tau Office',
          address: '456 Le Hong Phong St, Vung Tau City',
          time: '21:30',
        },
        {
          name: 'Back Beach Area',
          address: 'Thuy Van Street, Vung Tau City',
          time: '21:45',
        },
      ],
    },
    reviews: {
      recent: [
        {
          author: 'Nguyen Van A',
          rating: 5,
          comment: 'Very comfortable limousine, driver was professional.',
        },
        {
          author: 'Tran Thi B',
          rating: 4,
          comment: 'Good service, but WiFi was slow.',
        },
      ],
    },
    busImages: [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    ],
  },
  {
    id: '2',
    operatorName: 'Anh Quốc Limousine',
    rating: 4.8,
    reviewCount: 3615,
    departureTime: '09:00',
    departureLocation: 'Tan Son Nhat Airport',
    arrivalTime: '11:30',
    arrivalLocation: 'Vung Tau Office',
    duration: '2h30m',
    distance: '116 km',
    price: 190000,
    seatType: 'limousine',
    availableSeats: 9,
    totalSeats: 9,
    busModel: 'Toyota Hiace',
    busCapacity: 16,
    busType: 'Premium Limousine',
    plateNumber: '30A-67890',
    amenities: [
      { id: 'wifi', name: 'WiFi' },
      { id: 'ac', name: 'Air Conditioning' },
    ],
    policies: {
      cancellation: 'Free cancellation up to 3 hours before departure.',
      refund:
        'Full refund if cancelled 12 hours before. No refund within 2 hours.',
      change: 'Changes allowed up to 6 hours before with no fee.',
      luggage:
        'Free luggage allowance: 15kg. Oversized luggage (over 30kg) will incur additional charges of 30,000đ per piece. Pets are not allowed.',
    },
    routeDetails: {
      stops: [
        {
          name: 'Tan Son Nhat Airport',
          address: 'Truong Son Road, Tan Binh District, Ho Chi Minh City',
          time: '09:15',
        },
        {
          name: 'Highway Rest Area',
          address: 'Long Thanh Highway, Dong Nai Province',
          time: '10:00',
        },
        {
          name: 'Vung Tau Office',
          address: '456 Le Hong Phong St, Vung Tau City',
          time: '11:00',
        },
      ],
      distance: '116 km',
      duration: '2h30m',
      pickupPoints: [
        {
          name: 'Tan Son Nhat Airport',
          address: 'Truong Son Road, Tan Binh District, Ho Chi Minh City',
          time: '09:00',
        },
        {
          name: 'District 1 Office',
          address: '123 Nguyen Trai St, District 1, Ho Chi Minh City',
          time: '09:15',
        },
      ],
      dropoffPoints: [
        {
          name: 'Vung Tau Office',
          address: '456 Le Hong Phong St, Vung Tau City',
          time: '11:30',
        },
        {
          name: 'Vung Tau Center',
          address: 'Tran Phu Boulevard, Vung Tau City',
          time: '11:45',
        },
      ],
    },
    reviews: {
      recent: [
        {
          author: 'Le Van C',
          rating: 5,
          comment: 'Excellent service and very comfortable seats.',
        },
        {
          author: 'Pham Thi D',
          rating: 4,
          comment: 'Good experience overall.',
        },
      ],
    },
    busImages: [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=300&fit=crop',
    ],
  },
]

// Utility function to convert Trip (API format) to LegacyTrip (display format)
export const convertTripToLegacy = (trip: Trip): LegacyTrip => {
  return {
    id: trip.trip_id,
    operatorName: trip.operator.name,
    operatorLogo: trip.operator.logo,
    rating: trip.operator.rating,
    reviewCount: 0, // This would need to be fetched separately
    departureTime: new Date(trip.schedule.departure_time).toLocaleTimeString(
      'en-US',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }
    ),
    departureLocation: trip.route.origin,
    arrivalTime: new Date(trip.schedule.arrival_time).toLocaleTimeString(
      'en-US',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }
    ),
    arrivalLocation: trip.route.destination,
    duration: `${Math.floor(trip.schedule.duration / 60)}h${trip.schedule.duration % 60}m`,
    distance: `${trip.route.distance_km} km`,
    price: trip.pricing.base_price,
    serviceFee: trip.pricing.service_fee,
    seatType: trip.bus.bus_type,
    availableSeats: trip.availability.available_seats,
    totalSeats: trip.availability.total_seats,
    busModel: trip.bus.model,
    busCapacity: trip.bus.seat_capacity,
    busType: trip.bus.bus_type,
    plateNumber: trip.bus.plate_number,
    amenities: trip.bus.amenities.map((amenity) => ({
      id: amenity,
      name: amenity.charAt(0).toUpperCase() + amenity.slice(1),
    })),
    policies: {
      cancellation: trip.policies.cancellation_policy,
      refund: trip.policies.refund_policy,
      change: trip.policies.modification_policy,
      luggage: 'Standard luggage policy applies.', // This would need to be added to the Trip type
    },
    routeDetails: {
      stops: [], // This would need route_stops to be added to Trip type
      pickupPoints: trip.pickup_points.map((point) => ({
        name: point.name,
        address: point.address,
        time: point.time,
      })),
      dropoffPoints: trip.dropoff_points.map((point) => ({
        name: point.name,
        address: point.address,
        time: point.time,
      })),
      distance: `${trip.route.distance_km} km`,
      duration: `${Math.floor(trip.schedule.duration / 60)}h${trip.schedule.duration % 60}m`,
    },
  }
}
*/
