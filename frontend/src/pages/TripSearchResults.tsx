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
import type { Trip } from '@/types/trip.types'
import {
  legacyTripToTripFormat,
  getTripDisplayProperties,
} from '@/utils/tripConversion'
import { legacyMockTripsData } from '@/data/legacyMockTrips'
import {
  seatAvailabilityOptions,
  timeSlots,
  busTypes,
  amenities,
} from '@/constants/filterConstants'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import { useAuth } from '@/context/AuthContext'

// API functions
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function searchTrips(params) {
  const urlParams = new URLSearchParams(params)
  const response = await fetch(
    `${API_BASE_URL}/trips/search?${urlParams.toString()}`
  )
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const data = await response.json()
  return data
}

// Convert legacy mock data to Trip format
const mockTrips: Trip[] = legacyMockTripsData.map(legacyTripToTripFormat)

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

  const origin = searchParams.get('origin') || 'Ho Chi Minh'
  const destination = searchParams.get('destination') || 'Lam Dong'
  const date =
    searchParams.get('date') || new Date().toISOString().split('T')[0]
  const passengers = searchParams.get('passengers') || '1'

  // State for trips data

  const [trips, setTrips] = useState<Trip[]>(mockTrips)
  const hasAddedSearchRef = useRef(false)

  // TODO: Fetch trips from GET /trips/search API
  useEffect(() => {
    // TODO: Implement API call to GET /trips/search
    const fetchTrips = async () => {
      try {
        const data = await searchTrips({
          origin,
          destination,
          date,
          passengers,
        })
        if (data.success) setTrips(data.data)
      } catch (error) {
        console.error('Failed to fetch trips:', error)
        // Fallback to mock data
        setTrips(mockTrips)
      }
    }
    fetchTrips()

    // Add current search to history only once per search parameters
    if (!hasAddedSearchRef.current) {
      addSearch({
        origin,
        destination,
        date,
        passengers: parseInt(passengers),
      })
      hasAddedSearchRef.current = true
    }
  }, [origin, destination, date, passengers, addSearch])

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

      // Seat availability filter
      if (
        filters.minSeatsAvailable > 0 &&
        displayProps.availableSeats < filters.minSeatsAvailable
      ) {
        return false
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
                      key={trip.trip_id}
                      trip={trip}
                      onSelectTrip={handleSelectTrip}
                      isSelected={selectedTripId === trip.trip_id}
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
                        setLoadedItemsCount(10)
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
