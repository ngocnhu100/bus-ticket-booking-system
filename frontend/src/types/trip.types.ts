// Trip Domain Types

export interface Route {
  id: string
  from: string
  to: string
  distance: number // in kilometers
  estimatedDuration: number // in minutes
  pickupPoints: string[]
  dropoffPoints: string[]
  status: 'ACTIVE' | 'INACTIVE'
}

export interface Bus {
  id: string
  name: string
  model: string
  plateNumber: string
  type: 'STANDARD' | 'LIMOUSINE' | 'SLEEPER'
  capacity: number
  amenities: string[]
  status: 'ACTIVE' | 'INACTIVE'
  imageUrl?: string
}

export interface Seat {
  id: string
  row: number
  column: number
  type: 'STANDARD' | 'VIP' | 'WINDOW' | 'AISLE'
  price: number
  isAvailable: boolean
}

export interface SeatMap {
  id: string
  busId: string
  name: string
  rows: number
  columns: number
  seats: Seat[]
}

export interface Operator {
  id: string
  name: string
  email: string
  phone: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  createdAt: string
  performanceMetrics?: {
    totalTrips: number
    averageRating: number
    cancellationRate: number
  }
}

export interface Trip {
  id: string
  routeId: string
  routeLabel: string
  busId: string
  busLabel: string
  date: string // ISO format YYYY-MM-DD
  departureTime: string // HH:MM format
  arrivalTime: string // HH:MM format
  basePrice: number
  status: 'ACTIVE' | 'INACTIVE'
}

export interface TripFormData {
  id?: string
  routeId: string
  busId: string
  date: string
  departureTime: string
  arrivalTime: string
  basePrice: number | string
  status: 'ACTIVE' | 'INACTIVE'
  isRecurring: boolean
  recurrenceType: 'NONE' | 'DAILY' | 'WEEKLY'
  recurrenceDays: string[]
  recurrenceEndDate: string
}

export const WEEKDAYS = [
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
  'SUN',
] as const
