import { useState, useMemo, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FilterPanel, type Filters } from '@/components/landing/FilterPanel'
import {
  SortDropdown,
  type SortOption,
} from '@/components/landing/SortDropdown'
import { Pagination } from '@/components/landing/Pagination'
import { TripResultsCard } from '@/components/landing/TripResultsCard'
import { Header } from '@/components/landing/Header'
import type { Trip } from '@/components/landing/TripResultsCard'
import {
  seatAvailabilityOptions,
  timeSlots,
  busTypes,
  amenities,
} from '@/constants/filterConstants'
import '@/styles/admin.css'

// Mock data - in production, this would come from the API
const mockTrips: Trip[] = [
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
    seatType: 'limousine',
    availableSeats: 9,
    totalSeats: 9,
    busModel: 'Mercedes-Benz Sprinter',
    busCapacity: 16,
    busType: 'VIP Limousine',
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

export function TripSearchResults() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)

  const from = searchParams.get('from') || 'TPHCM'
  const to = searchParams.get('to') || 'Vũng Tàu'
  const date = searchParams.get('date') || '29-11-2025'
  const passengers = searchParams.get('passengers') || '1'

  // State for trips data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [trips, setTrips] = useState<Trip[]>(mockTrips)

  // TODO: Fetch trips from GET /trips/search API
  useEffect(() => {
    // TODO: Implement API call to GET /trips/search
    // const fetchTrips = async () => {
    //   try {
    //     const response = await fetch(`/api/trips/search?origin=${from}&destination=${to}&date=${date}&passengers=${passengers}`);
    //     const data = await response.json();
    //     setTrips(data.data); // Assuming API response structure
    //   } catch (error) {
    //     console.error('Failed to fetch trips:', error);
    //     // Fallback to mock data
    //     setTrips(mockTrips);
    //   }
    // };
    // fetchTrips();
    // For now, using mock data (no API call)
  }, [from, to, date, passengers])

  // State management
  const [filters, setFilters] = useState<Filters>({
    departureTimeSlots: [],
    priceRange: [0, 5000000],
    operators: [],
    busTypes: [],
    amenities: [],
    seatLocations: [],
    minRating: 0,
    minSeatsAvailable: 0,
  })

  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [useLoadMore, setUseLoadMore] = useState(false) // Toggle between pagination and load more
  const [loadedItemsCount, setLoadedItemsCount] = useState(10) // For load more mode
  const [isLoadingMore, setIsLoadingMore] = useState(false) // Loading state for load more
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null) // Selected trip for shadow effect

  // Extract available operators from trips data
  const availableOperators = useMemo(
    () => Array.from(new Set(trips.map((trip) => trip.operatorName))),
    [trips]
  )

  // Create operator ratings mapping
  const operatorRatings = useMemo(() => {
    const ratings: Record<string, number> = {}
    trips.forEach((trip) => {
      ratings[trip.operatorName] = trip.rating
    })
    return ratings
  }, [trips])

  // Get active filters with labels and removal functions
  const getActiveFilters = () => {
    const activeFilters = []

    // Departure time slots
    filters.departureTimeSlots.forEach((slot) => {
      const timeSlot = timeSlots.find((t) => t.value === slot)
      if (timeSlot) {
        activeFilters.push({
          label: timeSlot.label.split(' (')[0], // Remove the time range part
          remove: () =>
            setFilters({
              ...filters,
              departureTimeSlots: filters.departureTimeSlots.filter(
                (s) => s !== slot
              ),
            }),
        })
      }
    })

    // Price range
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000000) {
      activeFilters.push({
        label: `${filters.priceRange[0].toLocaleString(
          'vi-VN'
        )}đ - ${filters.priceRange[1].toLocaleString('vi-VN')}đ`,
        remove: () =>
          setFilters({
            ...filters,
            priceRange: [0, 5000000],
          }),
      })
    }

    // Operators
    filters.operators.forEach((operator) => {
      activeFilters.push({
        label: operator,
        remove: () =>
          setFilters({
            ...filters,
            operators: filters.operators.filter((o) => o !== operator),
          }),
      })
    })

    // Bus types
    filters.busTypes.forEach((type) => {
      const busType = busTypes.find((b) => b.id === type)
      if (busType) {
        activeFilters.push({
          label: busType.label,
          remove: () =>
            setFilters({
              ...filters,
              busTypes: filters.busTypes.filter((t) => t !== type),
            }),
        })
      }
    })

    // Amenities
    filters.amenities.forEach((amenity) => {
      const amenityItem = amenities.find((a) => a.id === amenity)
      if (amenityItem) {
        activeFilters.push({
          label: amenityItem.label,
          remove: () =>
            setFilters({
              ...filters,
              amenities: filters.amenities.filter((a) => a !== amenity),
            }),
        })
      }
    })

    // Seat locations
    filters.seatLocations.forEach((location) => {
      activeFilters.push({
        label: location,
        remove: () =>
          setFilters({
            ...filters,
            seatLocations: filters.seatLocations.filter((l) => l !== location),
          }),
      })
    })

    // Minimum rating
    if (filters.minRating > 0) {
      activeFilters.push({
        label: `${filters.minRating}+ stars`,
        remove: () =>
          setFilters({
            ...filters,
            minRating: 0,
          }),
      })
    }

    // Seat availability
    if (filters.minSeatsAvailable > 0) {
      const option = seatAvailabilityOptions.find(
        (opt: { value: number; label: string }) =>
          opt.value === filters.minSeatsAvailable
      )
      activeFilters.push({
        label: option?.label || `${filters.minSeatsAvailable}+ seats available`,
        remove: () =>
          setFilters({
            ...filters,
            minSeatsAvailable: 0,
          }),
      })
    }

    return activeFilters
  }

  const activeFilters = getActiveFilters()

  // Apply filters and sorting
  const filteredAndSortedTrips = useMemo(() => {
    let result = [...trips]

    // Apply filters
    result = result.filter((trip) => {
      // Price range filter
      if (
        trip.price < filters.priceRange[0] ||
        trip.price > filters.priceRange[1]
      ) {
        return false
      }

      // Operators filter
      if (
        filters.operators.length > 0 &&
        !filters.operators.includes(trip.operatorName)
      ) {
        return false
      }

      // Bus types filter
      if (
        filters.busTypes.length > 0 &&
        !filters.busTypes.includes(trip.seatType)
      ) {
        return false
      }

      // Amenities filter (all selected amenities must be present)
      if (filters.amenities.length > 0) {
        const tripAmenityIds = trip.amenities.map((a: { id: string }) => a.id)
        const hasAllAmenities = filters.amenities.every((a) =>
          tripAmenityIds.includes(a)
        )
        if (!hasAllAmenities) return false
      }

      // Seat availability filter
      if (
        filters.minSeatsAvailable > 0 &&
        trip.availableSeats < filters.minSeatsAvailable
      ) {
        return false
      }

      // Rating filter
      if (filters.minRating > 0 && trip.rating < filters.minRating) {
        return false
      }

      return true
    })

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'departure-asc': {
          const aTime = parseInt(a.departureTime.replace(':', ''))
          const bTime = parseInt(b.departureTime.replace(':', ''))
          return aTime - bTime
        }
        case 'duration-asc': {
          const aDuration = parseInt(a.duration)
          const bDuration = parseInt(b.duration)
          return aDuration - bDuration
        }
        case 'rating-desc':
          return b.rating - a.rating
        case 'default':
        default:
          return 0
      }
    })

    return result
  }, [filters, sortBy, trips])

  // Pagination / Load More logic
  const totalPages = Math.ceil(filteredAndSortedTrips.length / itemsPerPage)
  const paginatedTrips = useMemo(() => {
    if (useLoadMore) {
      // Load more mode: show first N items
      return filteredAndSortedTrips.slice(0, loadedItemsCount)
    } else {
      // Pagination mode: show current page items
      const startIndex = (currentPage - 1) * itemsPerPage
      return filteredAndSortedTrips.slice(startIndex, startIndex + itemsPerPage)
    }
  }, [
    filteredAndSortedTrips,
    currentPage,
    itemsPerPage,
    useLoadMore,
    loadedItemsCount,
  ])

  const hasMoreResults =
    useLoadMore && loadedItemsCount < filteredAndSortedTrips.length

  const handleLoadMore = async () => {
    setIsLoadingMore(true)
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    setLoadedItemsCount((prev) =>
      Math.min(prev + 10, filteredAndSortedTrips.length)
    )
    setIsLoadingMore(false)
  }

  const handleClearFilters = () => {
    setFilters({
      departureTimeSlots: [],
      priceRange: [0, 5000000],
      operators: [],
      busTypes: [],
      amenities: [],
      seatLocations: [],
      minRating: 0,
      minSeatsAvailable: 0,
    })
    setCurrentPage(1)
    setLoadedItemsCount(10) // Reset load more count
  }

  const handleSelectTrip = (tripId: string) => {
    setSelectedTripId(selectedTripId === tripId ? null : tripId) // Toggle selection
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Search summary bar */}
      <div className="sticky top-16 z-40 bg-card border-b border-border py-4 md:py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Back and search info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="h-8 w-8 p-0 shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="truncate">
                <p className="text-sm md:text-base font-semibold text-foreground truncate">
                  {from} → {to}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {date} • {passengers} passenger{passengers !== '1' ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Results count */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              Results: {filteredAndSortedTrips.length} trip
              {filteredAndSortedTrips.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter and sort bar */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter button - visible on all sizes */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>

            {/* Active filters display */}
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {activeFilters.map((filter, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-secondary border border-border rounded-md px-2 py-1 text-xs"
                  >
                    <span className="text-secondary-foreground">
                      {filter.label}
                    </span>
                    <button
                      onClick={filter.remove}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Clear filters button - only show if filters are active */}
            {(filters.departureTimeSlots.length > 0 ||
              filters.operators.length > 0 ||
              filters.busTypes.length > 0 ||
              filters.amenities.length > 0 ||
              filters.priceRange[0] > 0 ||
              filters.priceRange[1] < 5000000 ||
              filters.minRating > 0 ||
              filters.minSeatsAvailable > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4 mr-2" />
                Clear filters
              </Button>
            )}
          </div>

          {/* Sort dropdown */}
          <SortDropdown value={sortBy} onChange={setSortBy} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Desktop filters - sidebar */}
          <div className="hidden md:block md:col-span-1">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={handleClearFilters}
              availableOperators={availableOperators}
              operatorRatings={operatorRatings}
              resultsCount={filteredAndSortedTrips.length}
            />
          </div>

          {/* Mobile filters - modal/drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 bg-black/50 md:hidden">
              <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-background">
                <div className="p-4 flex items-center justify-between border-b border-border">
                  <h2 className="font-semibold text-foreground">
                    Filter Search
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMobileFilters(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="overflow-y-auto">
                  <FilterPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClearFilters={handleClearFilters}
                    availableOperators={availableOperators}
                    operatorRatings={operatorRatings}
                    resultsCount={filteredAndSortedTrips.length}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Results section */}
          <div className="md:col-span-3">
            {paginatedTrips.length > 0 ? (
              <>
                <div className="space-y-4">
                  {paginatedTrips.map((trip) => (
                    <TripResultsCard
                      key={trip.id}
                      trip={trip}
                      onSelectTrip={handleSelectTrip}
                      isSelected={selectedTripId === trip.id}
                    />
                  ))}
                </div>

                {/* Pagination or Load More */}
                {useLoadMore
                  ? // Load More mode
                    hasMoreResults && (
                      <div className="mt-8 flex justify-center">
                        <Button
                          onClick={handleLoadMore}
                          disabled={isLoadingMore}
                          className="px-8 py-3"
                          size="lg"
                        >
                          {isLoadingMore ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Loading...
                            </>
                          ) : (
                            `View ${Math.min(10, filteredAndSortedTrips.length - loadedItemsCount)} more trips`
                          )}
                        </Button>
                      </div>
                    )
                  : // Pagination mode
                    totalPages > 1 && (
                      <div className="mt-8">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                          onItemsPerPageChange={setItemsPerPage}
                          itemsPerPage={itemsPerPage}
                        />
                      </div>
                    )}

                {/* Toggle between Load More and Pagination */}
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUseLoadMore(!useLoadMore)
                      setCurrentPage(1)
                      setLoadedItemsCount(10)
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {useLoadMore
                      ? 'Switch to pagination'
                      : 'Switch to load more'}
                  </Button>
                </div>
              </>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-lg text-muted-foreground mb-4">
                  No suitable trips found
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Try changing your search criteria or filters
                </p>
                <Button onClick={handleClearFilters}>Clear all filters</Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TripSearchResults
