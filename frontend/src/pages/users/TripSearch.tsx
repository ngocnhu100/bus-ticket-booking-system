import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/users/DashboardLayout'
import { TripResultCard } from '@/components/users/TripResultCard'
import { DepartureTimeFilter } from '@/components/users/DepartureTimeFilter'
import { BusTypeFilter } from '@/components/users/BusTypeFilter'
import { PriceRangeFilter } from '@/components/users/PriceRangeFilter'
import { AmenitiesFilter } from '@/components/users/AmenitiesFilter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { searchTrips } from '@/api/trips'
import type { Trip } from '@/api/trips'
import { ArrowLeft, MapPin, Calendar, Users, RotateCcw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const TripSearch = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Extract search parameters from URL
  const origin = searchParams.get('origin') || ''
  const destination = searchParams.get('destination') || ''
  const date = searchParams.get('date') || ''
  const passengers = parseInt(searchParams.get('passengers') || '1')

  // Filter states
  const [departureTime, setDepartureTime] = useState<string[]>([])
  const [busType, setBusType] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(1000000)
  const [amenities, setAmenities] = useState<string[]>([])

  // Results state
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Debounced price change
  const [debouncedMinPrice, setDebouncedMinPrice] = useState<number>(minPrice)
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState<number>(maxPrice)

  // Debounce price changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinPrice(minPrice)
      setDebouncedMaxPrice(maxPrice)
    }, 500)

    return () => clearTimeout(timer)
  }, [minPrice, maxPrice])

  // Fetch trips whenever filters change
  const fetchTrips = useCallback(async () => {
    if (!origin || !destination || !date) {
      toast({
        title: 'Missing Search Parameters',
        description: 'Please provide origin, destination, and date.',
      })
      return
    }

    setLoading(true)
    try {
      const response = await searchTrips({
        origin,
        destination,
        date,
        passengers,
        departureTime: departureTime.length > 0 ? departureTime : undefined,
        busType: busType.length > 0 ? busType : undefined,
        minPrice: debouncedMinPrice > 0 ? debouncedMinPrice : undefined,
        maxPrice: debouncedMaxPrice < 1000000 ? debouncedMaxPrice : undefined,
        amenities: amenities.length > 0 ? amenities : undefined,
        page: currentPage,
        limit: 5,
      })

      if (response.success) {
        setTrips(response.data.trips)
        setTotalCount(response.data.totalCount)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to fetch trips',
      })
    } finally {
      setLoading(false)
    }
  }, [
    origin,
    destination,
    date,
    passengers,
    departureTime,
    busType,
    debouncedMinPrice,
    debouncedMaxPrice,
    amenities,
    currentPage,
    toast,
  ])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [departureTime, busType, debouncedMinPrice, debouncedMaxPrice, amenities])

  const handleResetFilters = () => {
    setDepartureTime([])
    setBusType([])
    setMinPrice(0)
    setMaxPrice(1000000)
    setAmenities([])
    setCurrentPage(1)
  }

  const handleSelectSeats = (tripId: string) => {
    toast({
      title: 'Seat Selection',
      description: `Redirecting to seat selection for trip ${tripId}`,
    })
    // Navigate to seat selection page
    // navigate(`/trips/${tripId}/select-seats`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const hasActiveFilters =
    departureTime.length > 0 ||
    busType.length > 0 ||
    minPrice > 0 ||
    maxPrice < 1000000 ||
    amenities.length > 0

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <Card className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>
                    {origin} → {destination}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(date)}</span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>
                    {passengers} passenger{passengers > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main content: Filters + Results */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Panel */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Filters</h2>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="text-xs gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </Button>
                  )}
                </div>

                <Separator />

                <DepartureTimeFilter
                  selectedTimes={departureTime}
                  onChange={setDepartureTime}
                />

                <Separator />

                <BusTypeFilter selectedTypes={busType} onChange={setBusType} />

                <Separator />

                <PriceRangeFilter
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onChange={(min, max) => {
                    setMinPrice(min)
                    setMaxPrice(max)
                  }}
                />

                <Separator />

                <AmenitiesFilter
                  selectedAmenities={amenities}
                  onChange={setAmenities}
                />
              </div>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Results header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {loading ? (
                    'Searching...'
                  ) : (
                    <>
                      Search Results{' '}
                      <span className="text-muted-foreground">
                        ({totalCount} trip{totalCount !== 1 ? 's' : ''})
                      </span>
                    </>
                  )}
                </h2>
              </div>

              {/* Results list */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6">
                      <div className="space-y-3">
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : trips.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center space-y-3">
                    <p className="text-muted-foreground text-lg">
                      No trips found matching your criteria.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your filters or search parameters.
                    </p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        onClick={handleResetFilters}
                        className="mt-4"
                      >
                        Reset Filters
                      </Button>
                    )}
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {trips.map((trip) => (
                    <TripResultCard
                      key={trip.tripId}
                      trip={trip}
                      onSelectSeats={handleSelectSeats}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && trips.length > 0 && totalCount > 5 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Page {currentPage} of {Math.ceil(totalCount / 5)}
                  </span>
                  <Button
                    variant="outline"
                    disabled={currentPage >= Math.ceil(totalCount / 5)}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default TripSearch
