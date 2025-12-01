/**
 * Legacy Mock Data - For UI Development and Testing
 *
 * This file contains the old flattened Trip interface and mock data
 * used for UI development before migration to the structured Trip type from trip.types.ts
 *
 * DEPRECATED: This should only be used for reference and testing.
 * Production code should use Trip from @/types/trip.types.ts
 */

// Legacy flattened interface (for reference only)
export interface LegacyMockTrip {
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
  amenities: Array<{ id: string; name: string; icon?: React.ReactNode }>
  isBestPrice?: boolean
  isLimitedOffer?: boolean
  policies?: {
    cancellation: string
    refund: string
    change: string
    luggage: string
  }
  routeDetails?: {
    stops: Array<{ name: string; address: string; time?: string }>
    pickupPoints?: Array<{ name: string; address: string; time?: string }>
    dropoffPoints?: Array<{ name: string; address: string; time?: string }>
    distance: string
    duration: string
  }
  reviews?: {
    recent: Array<{ author: string; rating: number; comment: string }>
  }
  busImages?: string[]
}

// Legacy mock data (all 21 trips from original TripSearchResults.tsx)
export const legacyMockTripsData: LegacyMockTrip[] = [
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
          name: 'Pham Ngu Lao Area',
          address: 'Pham Ngu Lao Street, District 1, Ho Chi Minh City',
          time: '19:45',
        },
        {
          name: 'Tan Son Nhat Airport',
          address: 'Truong Son Road, Tan Binh District, Ho Chi Minh City',
          time: '20:00',
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
        {
          name: 'Pham Ngu Lao Area',
          address: 'Pham Ngu Lao Street, District 1, Ho Chi Minh City',
          time: '09:30',
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
          time: '11:30',
        },
        {
          name: 'Back Beach Area',
          address: 'Thuy Van Street, Vung Tau City',
          time: '11:45',
        },
      ],
    },
    reviews: {
      recent: [
        {
          author: 'Le Thi C',
          rating: 5,
          comment: 'Excellent service from airport pickup.',
        },
      ],
    },
    busImages: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
    ],
  },
  {
    id: '3',
    operatorName: 'Hoa Mai',
    rating: 4.5,
    reviewCount: 4384,
    departureTime: '14:00',
    departureLocation: 'Ben Xe Mien Dong Moi',
    arrivalTime: '16:50',
    arrivalLocation: 'Hoa Mai Vung Tau Office',
    duration: '2h50m',
    distance: '116 km',
    price: 150000,
    seatType: 'standard',
    availableSeats: 9,
    totalSeats: 10,
    amenities: [
      { id: 'ac', name: 'Air Conditioning' },
      { id: 'toilet', name: 'Restroom' },
    ],
  },
  {
    id: '4',
    operatorName: 'Huy Hoàng',
    rating: 4.4,
    reviewCount: 2780,
    departureTime: '17:30',
    departureLocation: 'District 1 Office',
    arrivalTime: '19:50',
    arrivalLocation: 'Vung Tau Office',
    duration: '2h20m',
    distance: '116 km',
    price: 190000,
    seatType: 'limousine',
    availableSeats: 9,
    totalSeats: 9,
    amenities: [
      { id: 'wifi', name: 'WiFi' },
      { id: 'ac', name: 'Air Conditioning' },
    ],
  },
  {
    id: '5',
    operatorName: 'Bến Thành Travel',
    rating: 4.6,
    reviewCount: 617,
    departureTime: '07:30',
    departureLocation: 'Airport Office',
    arrivalTime: '10:10',
    arrivalLocation: 'Vung Tau Office',
    duration: '2h40m',
    distance: '116 km',
    price: 190000,
    seatType: 'limousine',
    availableSeats: 7,
    totalSeats: 9,
    amenities: [
      { id: 'wifi', name: 'WiFi' },
      { id: 'ac', name: 'Air Conditioning' },
      { id: 'usb', name: 'USB' },
    ],
  },
  {
    id: '6',
    operatorName: 'Thanh Phong (Xuyen Moc)',
    rating: 5,
    reviewCount: 30,
    departureTime: '05:45',
    departureLocation: 'Binh Thanh Office',
    arrivalTime: '09:15',
    arrivalLocation: 'Xuyen Moc',
    duration: '3h30m',
    distance: '116 km',
    price: 119000,
    originalPrice: 140000,
    discount: 21000,
    seatType: 'standard',
    availableSeats: 32,
    totalSeats: 34,
    amenities: [{ id: 'ac', name: 'Air Conditioning' }],
    isBestPrice: true,
  },
  {
    id: '7',
    operatorName: 'Sapaco Tourist',
    rating: 4.3,
    reviewCount: 1250,
    departureTime: '06:00',
    departureLocation: 'Pham Ngu Lao Office',
    arrivalTime: '08:30',
    arrivalLocation: 'Vung Tau Center',
    duration: '2h30m',
    distance: '116 km',
    price: 135000,
    seatType: 'standard',
    availableSeats: 15,
    totalSeats: 20,
    amenities: [
      { id: 'ac', name: 'Air Conditioning' },
      { id: 'toilet', name: 'Restroom' },
    ],
  },
  {
    id: '8',
    operatorName: 'The Sinh Tourist',
    rating: 4.9,
    reviewCount: 8920,
    departureTime: '08:15',
    departureLocation: 'Tan Son Nhat Airport',
    arrivalTime: '10:45',
    arrivalLocation: 'Vung Tau Office',
    duration: '2h30m',
    distance: '116 km',
    price: 210000,
    originalPrice: 230000,
    discount: 20000,
    seatType: 'limousine',
    availableSeats: 5,
    totalSeats: 9,
    amenities: [
      { id: 'wifi', name: 'WiFi' },
      { id: 'ac', name: 'Air Conditioning' },
      { id: 'usb', name: 'USB' },
      { id: 'entertainment', name: 'Entertainment' },
    ],
    isLimitedOffer: true,
  },
  {
    id: '9',
    operatorName: 'Giant I',
    rating: 4.2,
    reviewCount: 3400,
    departureTime: '10:30',
    departureLocation: 'Ben Xe Mien Tay',
    arrivalTime: '13:00',
    arrivalLocation: 'Vung Tau Office',
    duration: '2h30m',
    distance: '116 km',
    price: 125000,
    seatType: 'standard',
    availableSeats: 22,
    totalSeats: 25,
    amenities: [
      { id: 'ac', name: 'Air Conditioning' },
      { id: 'toilet', name: 'Restroom' },
      { id: 'blanket', name: 'Blanket & Pillow' },
    ],
  },
  {
    id: '10',
    operatorName: 'Kumho Samco',
    rating: 4.7,
    reviewCount: 5670,
    departureTime: '11:45',
    departureLocation: 'District 1 Office',
    arrivalTime: '14:15',
    arrivalLocation: 'Vung Tau Center',
    duration: '2h30m',
    distance: '116 km',
    price: 180000,
    seatType: 'limousine',
    availableSeats: 8,
    totalSeats: 9,
    amenities: [
      { id: 'wifi', name: 'WiFi' },
      { id: 'ac', name: 'Air Conditioning' },
      { id: 'usb', name: 'USB' },
    ],
  },
  {
    id: '11',
    operatorName: 'Sao Việt',
    rating: 4.1,
    reviewCount: 890,
    departureTime: '13:20',
    departureLocation: 'Pham Ngu Lao Office',
    arrivalTime: '15:50',
    arrivalLocation: 'Vung Tau Office',
    duration: '2h30m',
    distance: '116 km',
    price: 110000,
    seatType: 'standard',
    availableSeats: 28,
    totalSeats: 30,
    amenities: [{ id: 'ac', name: 'Air Conditioning' }],
  },
  {
    id: '12',
    operatorName: 'Long Phuong',
    rating: 4.6,
    reviewCount: 2150,
    departureTime: '15:45',
    departureLocation: 'Tan Son Nhat Airport',
    arrivalTime: '18:15',
    arrivalLocation: 'Vung Tau Center',
    duration: '2h30m',
    distance: '116 km',
    price: 165000,
    originalPrice: 185000,
    discount: 20000,
    seatType: 'limousine',
    availableSeats: 6,
    totalSeats: 9,
    amenities: [
      { id: 'wifi', name: 'WiFi' },
      { id: 'ac', name: 'Air Conditioning' },
    ],
  },
  {
    id: '13',
    operatorName: 'Phuong Trang',
    rating: 4.8,
    reviewCount: 12450,
    departureTime: '16:30',
    departureLocation: 'Ben Xe Mien Dong Moi',
    arrivalTime: '19:00',
    arrivalLocation: 'Vung Tau Office',
    duration: '2h30m',
    distance: '116 km',
    price: 195000,
    seatType: 'sleeper',
    availableSeats: 12,
    totalSeats: 16,
    amenities: [
      { id: 'wifi', name: 'WiFi' },
      { id: 'ac', name: 'Air Conditioning' },
      { id: 'usb', name: 'USB' },
      { id: 'blanket', name: 'Blanket & Pillow' },
    ],
  },
  {
    id: '14',
    operatorName: 'Sapaco Tourist',
    rating: 4.3,
    reviewCount: 1250,
    departureTime: '18:00',
    departureLocation: 'District 1 Office',
    arrivalTime: '20:30',
    arrivalLocation: 'Vung Tau Center',
    duration: '2h30m',
    distance: '116 km',
    price: 145000,
    seatType: 'standard',
    availableSeats: 18,
    totalSeats: 20,
    amenities: [
      { id: 'ac', name: 'Air Conditioning' },
      { id: 'toilet', name: 'Restroom' },
    ],
  },
  {
    id: '15',
    operatorName: 'Futabus',
    rating: 4.4,
    reviewCount: 3200,
    departureTime: '20:15',
    departureLocation: 'Pham Ngu Lao Office',
    arrivalTime: '22:45',
    arrivalLocation: 'Vung Tau Office',
    duration: '2h30m',
    distance: '116 km',
    price: 155000,
    originalPrice: 175000,
    discount: 20000,
    seatType: 'limousine',
    availableSeats: 4,
    totalSeats: 9,
    amenities: [
      { id: 'wifi', name: 'WiFi' },
      { id: 'ac', name: 'Air Conditioning' },
      { id: 'usb', name: 'USB' },
    ],
  },
  {
    id: '16',
    operatorName: 'Hoa Mai',
    rating: 4.5,
    reviewCount: 4384,
    departureTime: '21:30',
    departureLocation: 'Ben Xe Mien Dong Moi',
    arrivalTime: '00:00',
    arrivalLocation: 'Vung Tau Office',
    duration: '2h30m',
    distance: '116 km',
    price: 140000,
    seatType: 'standard',
    availableSeats: 14,
    totalSeats: 15,
    amenities: [
      { id: 'ac', name: 'Air Conditioning' },
      { id: 'toilet', name: 'Restroom' },
    ],
  },
  {
    id: '17',
    operatorName: 'The Sinh Tourist',
    rating: 4.9,
    reviewCount: 8920,
    departureTime: '22:45',
    departureLocation: 'Tan Son Nhat Airport',
    arrivalTime: '01:15',
    arrivalLocation: 'Vung Tau Center',
    duration: '2h30m',
    distance: '116 km',
    price: 220000,
    seatType: 'sleeper',
    availableSeats: 8,
    totalSeats: 12,
    amenities: [
      { id: 'wifi', name: 'WiFi' },
      { id: 'ac', name: 'Air Conditioning' },
      { id: 'usb', name: 'USB' },
      { id: 'entertainment', name: 'Entertainment' },
      { id: 'blanket', name: 'Blanket & Pillow' },
    ],
  },
  {
    id: '18',
    operatorName: 'Bến Thành Travel',
    rating: 4.6,
    reviewCount: 617,
    departureTime: '23:30',
    departureLocation: 'District 1 Office',
    arrivalTime: '02:00',
    arrivalLocation: 'Vung Tau Office',
    duration: '2h30m',
    distance: '116 km',
    price: 130000,
    seatType: 'standard',
    availableSeats: 0,
    totalSeats: 20,
    amenities: [
      { id: 'ac', name: 'Air Conditioning' },
      { id: 'toilet', name: 'Restroom' },
    ],
  },
  {
    id: '19',
    operatorName: 'Kumho Samco',
    rating: 4.7,
    reviewCount: 5670,
    departureTime: '00:30',
    departureLocation: 'Airport Office',
    arrivalTime: '03:00',
    arrivalLocation: 'Vung Tau Center',
    duration: '2h30m',
    distance: '116 km',
    price: 175000,
    originalPrice: 195000,
    discount: 20000,
    seatType: 'limousine',
    availableSeats: 3,
    totalSeats: 9,
    amenities: [
      { id: 'wifi', name: 'WiFi' },
      { id: 'ac', name: 'Air Conditioning' },
      { id: 'usb', name: 'USB' },
    ],
  },
  {
    id: '20',
    operatorName: 'Long Phuong',
    rating: 4.6,
    reviewCount: 2150,
    departureTime: '02:15',
    departureLocation: 'Pham Ngu Lao Office',
    arrivalTime: '04:45',
    arrivalLocation: 'Vung Tau Office',
    duration: '2h30m',
    distance: '116 km',
    price: 120000,
    seatType: 'standard',
    availableSeats: 25,
    totalSeats: 28,
    amenities: [
      { id: 'ac', name: 'Air Conditioning' },
      { id: 'blanket', name: 'Blanket & Pillow' },
    ],
  },
  {
    id: '21',
    operatorName: 'Phuong Trang',
    rating: 4.8,
    reviewCount: 12450,
    departureTime: '04:00',
    departureLocation: 'Ben Xe Mien Tay',
    arrivalTime: '06:30',
    arrivalLocation: 'Vung Tau Center',
    duration: '2h30m',
    distance: '116 km',
    price: 200000,
    seatType: 'sleeper',
    availableSeats: 10,
    totalSeats: 16,
    amenities: [
      { id: 'wifi', name: 'WiFi' },
      { id: 'ac', name: 'Air Conditioning' },
      { id: 'usb', name: 'USB' },
      { id: 'entertainment', name: 'Entertainment' },
      { id: 'blanket', name: 'Blanket & Pillow' },
    ],
  },
]
