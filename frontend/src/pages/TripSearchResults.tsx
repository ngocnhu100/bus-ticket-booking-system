import { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Filter, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FilterPanel, type Filters } from '@/components/landing/FilterPanel'
import {
  SortDropdown,
  type SortOption,
} from '@/components/landing/SortDropdown'
import { Pagination } from '@/components/landing/Pagination'
import { TripResultsCard } from '@/components/landing/TripResultsCard'
import { SearchHistoryPanel } from '@/components/landing/SearchHistoryPanel'
import { Header } from '@/components/landing/Header'
import type { Trip, AlternativeTrips } from '@/types/trip.types'
import type { TripSearchParams } from '@/api/trips'
import { timeSlots, busTypes, amenities } from '@/constants/filterConstants'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import { useAuth } from '@/context/AuthContext'
import { getOperatorRatings } from '@/api/trips'
import { getTripDisplayProperties } from '@/utils/tripConversion'

const DEFAULT_ITEMS_PER_PAGE = 5

// API functions
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function searchTrips(
  params: TripSearchParams & { flexibleDays?: number }
) {
  console.log(
    '[TripSearchResults] searchTrips called with params:',
    JSON.stringify(params, null, 2)
  )
  const urlParams = new URLSearchParams()

  // Add all params
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => urlParams.append(key, v))
      } else {
        urlParams.set(key, value.toString())
      }
    }
  })

  const response = await fetch(
    `${API_BASE_URL}/trips/search?${urlParams.toString()}`
  )
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Search API error:', response.status, errorText)
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
  }
  const data = await response.json()
  return data
}

// Fetch alternative trip suggestions
async function getAlternativeTrips(
  origin: string,
  destination: string,
  date: string,
  flexibleDays: number,
  page: number = 1
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/trips/alternatives?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${date}&flexibleDays=${flexibleDays}&page=${page}`
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error('Failed to fetch alternative trips:', error)
    return null
  }
}

export function TripSearchResults() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    searches,
    addSearch,
    removeSearch,
    clearHistory,
    isLoaded: historyLoaded,
  } = useSearchHistory()

  const searchParams = new URLSearchParams(location.search)

  const origin = searchParams.get('from') || searchParams.get('origin')
  const destination = searchParams.get('to') || searchParams.get('destination')

  // Parse date from URL with validation to ensure YYYY-MM-DD format
  let date = searchParams.get('date')
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/

  // Ensure date is in valid YYYY-MM-DD format
  if (!date || !dateRegex.test(date)) {
    // If date is missing or invalid, use today's date in YYYY-MM-DD format
    const today = new Date()
    // Manually construct YYYY-MM-DD to avoid any locale issues
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    date = `${year}-${month}-${day}`
  }

  // Additional validation - parse date string and ensure it's valid
  const [dateYear, dateMonth, dateDay] = date.split('-').map(Number)
  if (
    isNaN(dateYear) ||
    isNaN(dateMonth) ||
    isNaN(dateDay) ||
    dateMonth < 1 ||
    dateMonth > 12 ||
    dateDay < 1 ||
    dateDay > 31
  ) {
    // If date components are invalid, use today
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    date = `${year}-${month}-${day}`
  }

  const passengers = searchParams.get('passengers') || '1'
  const urlFlexibleDays = searchParams.has('flexibleDays')
    ? parseInt(searchParams.get('flexibleDays')!)
    : undefined
  const urlDirection = searchParams.get('direction') as
    | 'next'
    | 'previous'
    | undefined

  // Parse filter params from URL
  const urlFilters: Partial<Filters> = {
    departureTimeSlots: searchParams.getAll('departureTime'),
    priceRange: [
      parseInt(searchParams.get('minPrice') || '0'),
      parseInt(searchParams.get('maxPrice') || '5000000'),
    ],
    operators: searchParams.getAll('operator'),
    busTypes: searchParams.getAll('busType'),
    amenities: searchParams.getAll('amenity'),
    seatLocations: searchParams.getAll('seatLocation'),
    minRating: parseFloat(searchParams.get('minRating') || '0'),
    minSeatsAvailable: Math.max(
      parseInt(passengers),
      parseInt(searchParams.get('minSeats') || '1')
    ),
  }

  // Parse pagination params from URL
  const urlPage = parseInt(searchParams.get('page') || '1')
  const urlLimit = parseInt(
    searchParams.get('limit') || DEFAULT_ITEMS_PER_PAGE.toString()
  )
  const urlSort = searchParams.get('sort') || 'default'

  // State management - MUST be declared before useEffect hooks that use them
  const [filters, setFilters] = useState<Filters>({
    departureTimeSlots: urlFilters.departureTimeSlots || [],
    priceRange: urlFilters.priceRange || [0, 5000000],
    operators: urlFilters.operators || [],
    busTypes: urlFilters.busTypes || [],
    amenities: urlFilters.amenities || [],
    seatLocations: urlFilters.seatLocations || [],
    minRating: urlFilters.minRating || 0,
    minSeatsAvailable: urlFilters.minSeatsAvailable || 1,
  })

  const [sortBy, setSortBy] = useState<SortOption>(
    (urlSort as SortOption) || 'default'
  )
  const [currentPage, setCurrentPage] = useState(urlPage || 1)
  const [itemsPerPage, setItemsPerPage] = useState(
    urlLimit || DEFAULT_ITEMS_PER_PAGE
  )
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [useLoadMore, setUseLoadMore] = useState(false)
  const [loadedItemsCount, setLoadedItemsCount] = useState(
    DEFAULT_ITEMS_PER_PAGE
  )
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [flexibleDays, setFlexibleDays] = useState(urlFlexibleDays || 7)
  const [direction, setDirection] = useState<'next' | 'previous'>(
    urlDirection || 'next'
  )
  const [flexibleSearchPage, setFlexibleSearchPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // State for trips data
  const [alternatives, setAlternatives] = useState<AlternativeTrips | null>(
    null
  )
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false)
  const [trips, setTrips] = useState<Trip[]>([])
  const [operatorRatingCounts, setOperatorRatingCounts] = useState<
    Record<string, number>
  >({})
  const hasAddedSearchRef = useRef(false)
  const hasFetchedTripsRef = useRef<string | false>(false)
  const hasFetchedAlternativesRef = useRef<string | false>(false)

  useEffect(() => {
    // Prevent multiple API calls for the same search
    const searchKey = location.search
    if (hasFetchedTripsRef.current === searchKey) {
      console.log(
        '[TripSearchResults] Skipping duplicate fetch for:',
        searchKey
      )
      return
    }
    hasFetchedTripsRef.current = searchKey

    const fetchTrips = async () => {
      try {
        // Validate date format (should be YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(date)) {
          console.error('Invalid date format:', date)
          setTrips([])
          return
        }

        if (!origin || !destination) {
          setTrips([])
          return
        }

        const searchParams = {
          origin,
          destination,
          date,
          passengers: filters.minSeatsAvailable,
          // Add filters
          departureTime:
            filters.departureTimeSlots.length > 0
              ? filters.departureTimeSlots
              : undefined,
          minPrice:
            filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
          maxPrice:
            filters.priceRange[1] < 5000000 ? filters.priceRange[1] : undefined,
          operator:
            filters.operators.length > 0 ? filters.operators : undefined,
          busType: filters.busTypes.length > 0 ? filters.busTypes : undefined,
          amenity: filters.amenities.length > 0 ? filters.amenities : undefined,
          seatLocation:
            filters.seatLocations.length > 0
              ? filters.seatLocations
              : undefined,
          minRating: filters.minRating > 0 ? filters.minRating : undefined,
          minSeats:
            filters.minSeatsAvailable > 1
              ? filters.minSeatsAvailable
              : undefined,
          // Add sort and pagination
          sort: sortBy !== 'default' ? sortBy : undefined,
          page: currentPage > 1 ? currentPage : undefined,
          limit: itemsPerPage,
          flexibleDays:
            urlFlexibleDays && urlFlexibleDays > 0
              ? urlFlexibleDays
              : undefined,
          direction: urlDirection || 'next',
        }

        const data = await searchTrips(searchParams)
        console.log('[TripSearchResults] API response data:', data)
        console.log('[TripSearchResults] useEffect running with:', {
          origin,
          destination,
          date,
          passengers,
          filters,
          sortBy,
          currentPage,
          itemsPerPage,
          urlFlexibleDays,
          urlDirection,
        })
        if (data.success && data.data.trips) {
          setTrips(data.data.trips)
          setTotalPages(data.data.totalPages || 1)
          setTotalCount(data.data.totalCount || 0)
        } else {
          setTrips([])
          setTotalPages(1)
          setTotalCount(0)
        }
      } catch (error) {
        console.error('Failed to fetch trips:', error)
        // Fallback to empty array
        setTrips([])
      }
    }
    fetchTrips()

    // Add current search to history only once per search parameters
    if (!hasAddedSearchRef.current && origin && destination) {
      addSearch({
        origin,
        destination,
        date,
        passengers: parseInt(passengers),
      })
      hasAddedSearchRef.current = true
    }
  }, [
    addSearch,
    currentPage,
    date,
    destination,
    filters,
    itemsPerPage,
    location.search,
    origin,
    passengers,
    sortBy,
    urlFlexibleDays,
    urlDirection,
  ])

  // Fetch operator rating counts when trips change
  useEffect(() => {
    const fetchOperatorRatingCounts = async () => {
      if (trips.length === 0) return

      // Get unique operators from trips
      const uniqueOperators = [
        ...new Set(trips.map((trip) => trip.operator.operator_id)),
      ]

      try {
        const ratingCounts: Record<string, number> = {}

        // Fetch rating stats for each operator
        for (const operatorId of uniqueOperators) {
          // Skip API calls for mock data operator IDs (they're not UUIDs)
          if (operatorId.startsWith('operator_')) {
            ratingCounts[operatorId] = 0
            continue
          }

          try {
            const ratingStats = await getOperatorRatings(operatorId)
            ratingCounts[operatorId] = ratingStats.stats?.totalRatings || 0
          } catch (error) {
            console.error(
              `Failed to fetch ratings for operator ${operatorId}:`,
              error
            )
            ratingCounts[operatorId] = 0 // Default to 0 if fetch fails
          }
        }

        setOperatorRatingCounts(ratingCounts)
      } catch (error) {
        console.error('Failed to fetch operator rating counts:', error)
      }
    }

    fetchOperatorRatingCounts()
  }, [trips])

  // Fetch alternative suggestions when no trips found
  useEffect(() => {
    if (!origin || !destination) return

    // Prevent multiple API calls for the same search
    const searchKey = `${origin}-${destination}-${date}-${flexibleDays}-${flexibleSearchPage}`
    if (hasFetchedAlternativesRef.current === searchKey) {
      console.log(
        '[TripSearchResults] Skipping duplicate alternatives fetch for:',
        searchKey
      )
      return
    }
    hasFetchedAlternativesRef.current = searchKey

    const fetchAlternatives = async () => {
      if (trips.length > 0) return

      setIsLoadingAlternatives(true)
      try {
        console.log(
          '[TripSearchResults] Fetching alternatives for:',
          JSON.stringify(
            {
              origin,
              destination,
              date,
              flexibleDays,
              page: flexibleSearchPage,
            },
            null,
            2
          )
        )
        const alternativesData = await getAlternativeTrips(
          origin,
          destination,
          date,
          flexibleDays,
          flexibleSearchPage
        )
        console.log(
          '[TripSearchResults] Alternatives data received:',
          alternativesData
        )
        setAlternatives(alternativesData)
      } catch (error) {
        console.error('Failed to fetch alternatives:', error)
        setAlternatives(null)
      } finally {
        setIsLoadingAlternatives(false)
      }
    }

    fetchAlternatives()
  }, [
    trips.length,
    origin,
    destination,
    date,
    flexibleDays,
    flexibleSearchPage,
  ])

  // Update URL when filters, sort, pagination change
  useEffect(() => {
    const params = new URLSearchParams()

    // Add search params
    params.set('from', origin || '')
    params.set('to', destination || '')
    params.set('date', date)
    params.set('passengers', passengers)

    // Add filter params
    filters.departureTimeSlots.forEach((slot) =>
      params.append('departureTime', slot)
    )
    if (filters.priceRange[0] > 0)
      params.set('minPrice', filters.priceRange[0].toString())
    if (filters.priceRange[1] < 5000000)
      params.set('maxPrice', filters.priceRange[1].toString())
    filters.operators.forEach((op) => params.append('operator', op))
    filters.busTypes.forEach((type) => params.append('busType', type))
    filters.amenities.forEach((amenity) => params.append('amenity', amenity))
    filters.seatLocations.forEach((location) =>
      params.append('seatLocation', location)
    )
    if (filters.minRating > 0)
      params.set('minRating', filters.minRating.toString())
    if (filters.minSeatsAvailable > 1)
      params.set('minSeats', filters.minSeatsAvailable.toString())

    // Add sort and pagination params
    if (sortBy !== 'default') params.set('sort', sortBy)
    params.set('page', currentPage.toString())
    params.set('limit', itemsPerPage.toString())

    // Update URL without triggering navigation
    const newSearch = params.toString()
    if (location.search !== `?${newSearch}`) {
      navigate(`${location.pathname}?${newSearch}`, { replace: true })
    }
  }, [
    filters,
    sortBy,
    currentPage,
    itemsPerPage,
    origin,
    destination,
    date,
    passengers,
    navigate,
    location.pathname,
    location.search,
  ])

  // Extract available operators from trips data
  const availableOperators = useMemo(
    () => Array.from(new Set(trips.map((trip) => trip.operator.name))),
    [trips]
  )

  // Create operator ratings mapping
  const operatorRatings = useMemo(() => {
    const ratings: Record<string, number> = {}
    trips.forEach((trip) => {
      ratings[trip.operator.name] = trip.operator.rating
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
          key: `departure-${slot}`,
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
        key: `price-${filters.priceRange[0]}-${filters.priceRange[1]}`,
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
        key: `operator-${operator}`,
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
          key: `busType-${type}`,
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
          key: `amenity-${amenity}`,
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
        key: `seatLocation-${location}`,
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
        key: `rating-${filters.minRating}`,
        label: `${filters.minRating}+ stars`,
        remove: () =>
          setFilters({
            ...filters,
            minRating: 0,
          }),
      })
    }

    // Seat availability
    if (filters.minSeatsAvailable > 1) {
      activeFilters.push({
        key: `seats-${filters.minSeatsAvailable}`,
        label: `${filters.minSeatsAvailable}+ seats available`,
        remove: () =>
          setFilters({
            ...filters,
            minSeatsAvailable: 1,
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
      const displayProps = getTripDisplayProperties(trip)

      // Price range filter
      if (
        displayProps.price < filters.priceRange[0] ||
        displayProps.price > filters.priceRange[1]
      ) {
        return false
      }

      // Operators filter
      if (
        filters.operators.length > 0 &&
        !filters.operators.includes(displayProps.operatorName)
      ) {
        return false
      }

      // Bus types filter
      if (
        filters.busTypes.length > 0 &&
        !filters.busTypes.includes(displayProps.seatType)
      ) {
        return false
      }

      // Amenities filter (all selected amenities must be present)
      if (filters.amenities.length > 0) {
        const tripAmenityIds = displayProps.amenities.map((a) => a.id)
        const hasAllAmenities = filters.amenities.every((a) =>
          tripAmenityIds.includes(a)
        )
        if (!hasAllAmenities) return false
      }

      // Rating filter
      if (filters.minRating > 0 && displayProps.rating < filters.minRating) {
        return false
      }

      return true
    })

    // Apply sorting
    result.sort((a, b) => {
      const aProps = getTripDisplayProperties(a)
      const bProps = getTripDisplayProperties(b)

      switch (sortBy) {
        case 'price-asc':
          return aProps.price - bProps.price
        case 'price-desc':
          return bProps.price - aProps.price
        case 'departure-asc': {
          const aTime = parseInt(aProps.departureTime.replace(':', ''))
          const bTime = parseInt(bProps.departureTime.replace(':', ''))
          return aTime - bTime
        }
        case 'departure-desc': {
          const aTime = parseInt(aProps.departureTime.replace(':', ''))
          const bTime = parseInt(bProps.departureTime.replace(':', ''))
          return bTime - aTime
        }
        case 'duration-asc': {
          const aDuration = parseInt(aProps.duration)
          const bDuration = parseInt(bProps.duration)
          return aDuration - bDuration
        }
        case 'rating-desc':
          return bProps.rating - aProps.rating
        case 'default':
        default:
          return 0
      }
    })

    return result
  }, [filters, sortBy, trips])

  // Pagination / Load More logic
  const paginatedTrips = useMemo(() => {
    if (useLoadMore) {
      // Load more mode: show first N items
      return filteredAndSortedTrips.slice(0, loadedItemsCount)
    } else {
      // BE handles pagination, so filteredAndSortedTrips is already the current page
      return filteredAndSortedTrips
    }
  }, [filteredAndSortedTrips, useLoadMore, loadedItemsCount])

  const hasMoreResults =
    useLoadMore && loadedItemsCount < filteredAndSortedTrips.length

  const handleLoadMore = async () => {
    setIsLoadingMore(true)
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    setLoadedItemsCount((prev) =>
      Math.min(prev + DEFAULT_ITEMS_PER_PAGE, filteredAndSortedTrips.length)
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
      minSeatsAvailable: 1,
    })
    setCurrentPage(1)
    setLoadedItemsCount(DEFAULT_ITEMS_PER_PAGE) // Reset load more count
  }

  const handleSelectTrip = (tripId: string) => {
    setSelectedTripId(selectedTripId === tripId ? null : tripId) // Toggle selection
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Search History Panel */}
      {user?.userId && historyLoaded && searches.length > 0 && (
        <div className="bg-muted/30 border-b border-border py-6 md:py-8">
          <div className="max-w-7xl mx-auto px-4">
            <SearchHistoryPanel
              searches={searches}
              onSelectSearch={(search) => {
                const newParams = new URLSearchParams({
                  origin: search.origin,
                  destination: search.destination,
                  date: search.date,
                  passengers: search.passengers.toString(),
                })
                navigate(`/trip-search-results?${newParams.toString()}`)
              }}
              onRemoveSearch={removeSearch}
              onClearHistory={clearHistory}
            />
          </div>
        </div>
      )}

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
                  {origin} <ArrowRight className="w-4 h-4 inline mx-1" />{' '}
                  {destination}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {date} • {passengers} passenger
                  {parseInt(passengers) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Results count */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              Results: {totalCount} trip
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
              filters.minSeatsAvailable > 1) && (
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
              resultsCount={totalCount}
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
                    resultsCount={totalCount}
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
                      key={trip.trip_id}
                      trip={trip}
                      onSelectTrip={handleSelectTrip}
                      isSelected={selectedTripId === trip.trip_id}
                      ratingCount={
                        operatorRatingCounts[trip.operator.operator_id] || 0
                      }
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
                            `View ${Math.min(DEFAULT_ITEMS_PER_PAGE, filteredAndSortedTrips.length - loadedItemsCount)} more trips`
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

                {/* End of list message for load more mode and pagination mode */}
                {((useLoadMore && !hasMoreResults) ||
                  (!useLoadMore && currentPage === totalPages)) &&
                  paginatedTrips.length > 0 && (
                    <div className="mt-8 flex justify-center">
                      <p className="text-sm text-muted-foreground">
                        You've reached the end of the results
                      </p>
                    </div>
                  )}

                {/* Toggle between Load More and Pagination */}
                {(hasMoreResults || (!useLoadMore && totalPages > 1)) && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUseLoadMore(!useLoadMore)
                        setCurrentPage(1)
                        setLoadedItemsCount(DEFAULT_ITEMS_PER_PAGE)
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {useLoadMore
                        ? 'Switch to pagination'
                        : 'Switch to load more'}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-6">
                {/* No trips found message */}
                <Card className="p-8 text-center">
                  <p className="text-lg text-muted-foreground mb-4">
                    No trips found for your search
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Try changing your search criteria or check out these
                    alternatives
                  </p>
                  <Button onClick={handleClearFilters}>
                    Clear all filters
                  </Button>
                </Card>

                {/* Alternative trip suggestions */}
                {isLoadingAlternatives ? (
                  <Card className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Loading alternatives...
                    </p>
                  </Card>
                ) : alternatives ? (
                  <>
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Alternative Options
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Same route, different dates */}
                        {alternatives.alternativeDates &&
                          alternatives.alternativeDates.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                                Same Route, Different Dates
                              </h4>
                              <div className="space-y-2">
                                {alternatives.alternativeDates.map(
                                  (altDate) => (
                                    <Button
                                      key={altDate.date}
                                      variant="outline"
                                      size="sm"
                                      className="w-full justify-start text-left"
                                      onClick={() => {
                                        const newParams = new URLSearchParams({
                                          from: origin || '',
                                          to: destination || '',
                                          date: altDate.date,
                                          passengers,
                                        })
                                        navigate(
                                          `/trip-search-results?${newParams.toString()}`
                                        )
                                      }}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span>
                                          {altDate.dayName}, {altDate.monthDay}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          +{altDate.daysAhead} day
                                          {altDate.daysAhead !== 1
                                            ? 's'
                                            : ''} • {altDate.tripCount} trip
                                          {altDate.tripCount !== 1 ? 's' : ''}
                                        </span>
                                      </div>
                                    </Button>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {/* Popular alternative routes */}
                        {alternatives.alternativeDestinations &&
                          alternatives.alternativeDestinations.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                                Popular Routes from {origin}
                              </h4>
                              <div className="space-y-2">
                                {alternatives.alternativeDestinations.map(
                                  (altDest) => (
                                    <Button
                                      key={altDest.destination}
                                      variant="outline"
                                      size="sm"
                                      className="w-full justify-start text-left"
                                      onClick={() => {
                                        const newParams = new URLSearchParams({
                                          from: origin || '',
                                          to: altDest.destination,
                                          date,
                                          passengers,
                                        })
                                        navigate(
                                          `/trip-search-results?${newParams.toString()}`
                                        )
                                      }}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span>
                                          {origin} → {altDest.destination}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {altDest.tripCount} trip
                                          {altDest.tripCount !== 1 ? 's' : ''}
                                        </span>
                                      </div>
                                    </Button>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Additional suggestions */}
                      <div className="mt-6 pt-4 border-t border-border">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Flexible search */}
                          <div className="space-y-2 md:col-span-2">
                            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                              Flexible Search
                            </h4>
                            <div className="flex items-center gap-2">
                              <select
                                value={direction}
                                onChange={(e) =>
                                  setDirection(
                                    e.target.value as 'next' | 'previous'
                                  )
                                }
                                className="px-2 py-1 text-sm border border-input rounded"
                              >
                                <option value="next">Next</option>
                                <option value="previous">Previous</option>
                              </select>
                              <input
                                type="number"
                                min="1"
                                max="30"
                                value={flexibleDays}
                                onChange={(e) =>
                                  setFlexibleDays(parseInt(e.target.value) || 7)
                                }
                                className="w-16 px-2 py-1 text-sm border border-input rounded"
                              />
                              <span className="text-sm">days</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1 justify-start text-left"
                                onClick={() => {
                                  console.log(
                                    'Flexible search button clicked, flexibleDays:',
                                    flexibleDays,
                                    'direction:',
                                    direction
                                  )

                                  // Calculate new date based on direction and flexibleDays
                                  const currentDate = new Date(date)
                                  const newDate = new Date(currentDate)

                                  if (direction === 'next') {
                                    newDate.setDate(
                                      currentDate.getDate() + flexibleDays
                                    )
                                  } else if (direction === 'previous') {
                                    newDate.setDate(
                                      currentDate.getDate() - flexibleDays
                                    )
                                  }

                                  const newDateStr = newDate
                                    .toISOString()
                                    .split('T')[0]

                                  const newParams = new URLSearchParams({
                                    from: origin || '',
                                    to: destination || '',
                                    date: newDateStr,
                                    passengers,
                                    flexibleDays: flexibleDays.toString(),
                                    direction,
                                    t: Date.now().toString(), // Force URL change
                                  })
                                  console.log(
                                    'Navigating to:',
                                    `/trip-search-results?${newParams.toString()}`
                                  )
                                  navigate(
                                    `/trip-search-results?${newParams.toString()}`
                                  )
                                }}
                              >
                                Search {direction}
                                {flexibleDays > 1
                                  ? ` ${flexibleDays} days`
                                  : ' day'}
                              </Button>
                            </div>
                          </div>

                          {/* Same date, different routes */}
                          {/* <div className="space-y-2 md:col-span-2">
                            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                              Same Date, Different Routes
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-left"
                              onClick={() => {
                                const newParams = new URLSearchParams({
                                  from: origin,
                                  to: '', // Clear destination to show all routes
                                  date,
                                  passengers,
                                })
                                navigate(
                                  `/trip-search-results?${newParams.toString()}`
                                )
                              }}
                            >
                              View all routes from {origin}
                            </Button>
                          </div> */}

                          {/* Reset search */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                              Start Over
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-left"
                              onClick={() => navigate('/')}
                            >
                              Back to search
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Flexible search results */}
                    {alternatives?.flexibleSearch &&
                      alternatives.flexibleSearch.trips.length > 0 && (
                        <Card className="p-6">
                          <h3 className="text-lg font-semibold mb-4">
                            {alternatives.flexibleSearch.description}
                          </h3>
                          <div className="space-y-4">
                            {alternatives.flexibleSearch.trips.map((trip) => (
                              <TripResultsCard
                                key={trip.trip_id}
                                trip={trip}
                                onSelectTrip={() =>
                                  handleSelectTrip(trip.trip_id)
                                }
                                isSelected={selectedTripId === trip.trip_id}
                              />
                            ))}
                          </div>
                          {/* Pagination for flexible search */}
                          {(alternatives.flexibleSearch.totalPages ?? 1) >
                            1 && (
                            <div className="mt-6 flex justify-center">
                              <Pagination
                                currentPage={
                                  alternatives.flexibleSearch.page ?? 1
                                }
                                totalPages={
                                  alternatives.flexibleSearch.totalPages ?? 1
                                }
                                onPageChange={(page) => {
                                  setFlexibleSearchPage(page)
                                }}
                              />
                            </div>
                          )}
                        </Card>
                      )}
                  </>
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Unable to load alternatives
                    </p>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TripSearchResults
