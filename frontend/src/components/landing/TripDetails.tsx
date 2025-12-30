import {
  Wifi,
  AirVent,
  Usb,
  MapPin,
  Bath,
  Clock,
  Tv,
  Bed,
  Armchair,
  CupSoda,
  Headphones,
  Spotlight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import type { Trip } from '@/types/trip.types'
import { ReviewsList } from '@/components/reviews/ReviewsList'
import { useState, useEffect } from 'react'
import { getOperatorReviews, getOperatorRatings } from '@/api/trips'
import type { ReviewData } from '@/components/reviews/ReviewCard'
import type { OperatorRatingStats } from '@/api/trips'

interface TripDetailsProps {
  trip: Trip
}

export function TripDetails({ trip }: TripDetailsProps) {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsSortBy, setReviewsSortBy] = useState<
    'recent' | 'helpful' | 'rating-high' | 'rating-low'
  >('recent')
  const [reviewsRatingFilter, setReviewsRatingFilter] = useState<number | null>(
    null
  )
  const [reviewsPage, setReviewsPage] = useState(1)
  const [reviewsLimit, setReviewsLimit] = useState(5)
  const [hasMoreReviews, setHasMoreReviews] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [operatorStats, setOperatorStats] =
    useState<OperatorRatingStats | null>(null)

  // Fetch operator stats when component mounts
  useEffect(() => {
    // Skip API calls for mock data operator IDs (they're not UUIDs)
    if (trip.operator.operator_id.startsWith('operator_')) {
      setOperatorStats(null)
      return
    }

    const fetchOperatorStats = async () => {
      try {
        const response = await getOperatorRatings(trip.operator.operator_id)
        if (response.stats) {
          setOperatorStats(response.stats)
        }
      } catch (error) {
        console.error('Failed to fetch operator stats:', error)
        setOperatorStats(null)
      }
    }

    fetchOperatorStats()
  }, [trip.operator.operator_id])

  // Fetch reviews when component mounts or filters change
  useEffect(() => {
    // Skip API calls for mock data operator IDs (they're not UUIDs)
    if (trip.operator.operator_id.startsWith('operator_')) {
      setReviews([])
      setReviewsLoading(false)
      setHasMoreReviews(false)
      return
    }

    const fetchReviews = async () => {
      setReviewsLoading(true)
      try {
        console.log('Fetching reviews with:', {
          operatorId: trip.operator.operator_id,
          page: reviewsPage,
          sortBy: reviewsSortBy,
          rating: reviewsRatingFilter,
        })

        const response = await getOperatorReviews(trip.operator.operator_id, {
          page: reviewsPage,
          limit: reviewsLimit,
          sortBy: reviewsSortBy,
          rating: reviewsRatingFilter || undefined,
        })

        console.log('Reviews response:', response)
        console.log('Response data:', response.data)

        if (response.success && response.data) {
          const reviewData = response.data.map((review) => {
            console.log('Mapping review:', review)
            return {
              ...review,
              createdAt: new Date(review.createdAt),
              updatedAt: review.updatedAt
                ? new Date(review.updatedAt)
                : undefined,
            }
          })

          console.log('Mapped reviews:', reviewData)

          console.log('Setting reviews:', reviewData)
          setReviews(reviewData)

          setHasMoreReviews(reviewsPage < response.pagination.totalPages)
          setTotalPages(response.pagination.totalPages)
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error)
        setReviews([])
        setHasMoreReviews(false)
      } finally {
        setReviewsLoading(false)
      }
    }

    fetchReviews()
  }, [
    trip.operator.operator_id,
    trip.route,
    reviewsPage,
    reviewsSortBy,
    reviewsRatingFilter,
    reviewsLimit,
  ])

  // Helper function to format time
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      return format(date, 'HH:mm (MMM d)')
    } catch {
      return timeString // Fallback to original string if parsing fails
    }
  }

  const getAmenityIcon = (amenityId: string) => {
    const amenityMap: Record<string, { icon: React.ReactNode; name: string }> =
      {
        wifi: { icon: <Wifi className="w-4 h-4" />, name: 'WiFi' },
        ac: { icon: <AirVent className="w-4 h-4" />, name: 'Air Conditioning' },
        usb: { icon: <Usb className="w-4 h-4" />, name: 'USB Charging' },
        toilet: { icon: <Bath className="w-4 h-4" />, name: 'Restroom' },
        entertainment: {
          icon: <Headphones className="w-4 h-4" />,
          name: 'Entertainment',
        },
        tv: {
          icon: <Tv className="w-4 h-4" />,
          name: 'Television',
        },
        blanket: {
          icon: <Bed className="w-4 h-4" />,
          name: 'Blanket',
        },
        pillow: {
          icon: (
            <img
              className="w-4 h-4"
              src="https://img.icons8.com/material-outlined/96/pillow.png"
              alt="pillow"
            />
          ),
          name: 'Pillow',
        },
        water: {
          icon: <CupSoda className="w-4 h-4" />,
          name: 'Water',
        },
        massage: {
          icon: <Armchair className="w-4 h-4" />,
          name: 'Massage Seat',
        },
        reading_light: {
          icon: <Spotlight className="w-4 h-4" />,
          name: 'Reading Light',
        },
      }
    return amenityMap[amenityId] || null
  }

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <Tabs
        defaultValue="points"
        className="w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <TabsList
          className="grid w-full grid-cols-6 mb-6"
          onClick={(e) => e.stopPropagation()}
        >
          <TabsTrigger value="points" onClick={(e) => e.stopPropagation()}>
            Pickup/Dropoff
          </TabsTrigger>
          <TabsTrigger value="bus" onClick={(e) => e.stopPropagation()}>
            Bus
          </TabsTrigger>
          <TabsTrigger value="amenities" onClick={(e) => e.stopPropagation()}>
            Amenities
          </TabsTrigger>
          <TabsTrigger value="policies" onClick={(e) => e.stopPropagation()}>
            Policies
          </TabsTrigger>
          <TabsTrigger value="stops" onClick={(e) => e.stopPropagation()}>
            Route Stops
          </TabsTrigger>
          <TabsTrigger value="reviews" onClick={(e) => e.stopPropagation()}>
            Reviews
          </TabsTrigger>
        </TabsList>

        {/* Pickup & Dropoff Points Tab */}
        <TabsContent value="points" className="space-y-6">
          <div>
            <div className="space-y-6">
              {/* Pickup Points */}
              {trip.pickup_points && trip.pickup_points.length > 0 && (
                <div>
                  <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-success" />
                    Pickup Points
                  </h5>
                  <div className="space-y-2">
                    {trip.pickup_points.map((point, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20"
                      >
                        <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center text-success-foreground text-xs font-semibold mt-0.5">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">
                            {point.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {point.address}
                          </p>
                          {point.time && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(point.time)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dropoff Points */}
              {trip.dropoff_points && trip.dropoff_points.length > 0 && (
                <div>
                  <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Dropoff Points
                  </h5>
                  <div className="space-y-2">
                    {trip.dropoff_points.map((point, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-muted"
                      >
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-semibold mt-0.5">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">
                            {point.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {point.address}
                          </p>
                          {point.time && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(point.time)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-muted">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> The schedule times are estimated. This
                schedule may change depending on actual conditions.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Bus Information Tab */}
        <TabsContent value="bus" className="space-y-6">
          {/* Bus Images */}
          {trip.bus.image_urls && trip.bus.image_urls.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-3">Bus Images</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {trip.bus.image_urls.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="rounded-lg overflow-hidden border border-border aspect-video bg-muted"
                  >
                    <img
                      src={imageUrl}
                      alt={`Bus image ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://via.placeholder.com/400x300?text=Bus+Image'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bus Information */}
          {(trip.bus.model || trip.bus.seat_capacity || trip.bus.bus_type) && (
            <div>
              <h4 className="font-medium text-foreground mb-3">Bus Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trip.bus.model && (
                  <div className="p-4 bg-muted/30 rounded-lg border border-muted">
                    <h5 className="font-medium text-sm text-muted-foreground mb-1">
                      Model
                    </h5>
                    <p className="text-foreground font-medium">
                      {trip.bus.model}
                    </p>
                  </div>
                )}
                {trip.bus.seat_capacity && (
                  <div className="p-4 bg-muted/30 rounded-lg border border-muted">
                    <h5 className="font-medium text-sm text-muted-foreground mb-1">
                      Capacity
                    </h5>
                    <p className="text-foreground font-medium">
                      {trip.bus.seat_capacity} seats
                    </p>
                  </div>
                )}
                {trip.bus.plate_number && (
                  <div className="p-4 bg-muted/30 rounded-lg border border-muted">
                    <h5 className="font-medium text-sm text-muted-foreground mb-1">
                      Plate Number
                    </h5>
                    <p className="text-foreground font-medium">
                      {trip.bus.plate_number}
                    </p>
                  </div>
                )}
                {trip.bus.bus_type && (
                  <div className="p-4 bg-muted/30 rounded-lg border border-muted">
                    <h5 className="font-medium text-sm text-muted-foreground mb-1">
                      Type
                    </h5>
                    <p className="text-foreground font-medium">
                      {trip.bus.bus_type.charAt(0).toUpperCase() +
                        trip.bus.bus_type.slice(1)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Amenities Tab */}
        <TabsContent value="amenities" className="space-y-6">
          {trip.bus.amenities && trip.bus.amenities.length > 0 && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {trip.bus.amenities.map((amenity) => {
                  const amenityData = getAmenityIcon(amenity)
                  return (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg border border-muted"
                    >
                      {amenityData?.icon}
                      <span className="text-sm">
                        {amenityData?.name || amenity}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          {trip.policies && (
            <div>
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-sm text-foreground">
                    Cancellation Policy
                  </h5>
                  <p className="text-sm text-muted-foreground">
                    {trip.policies.cancellation_policy}
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-sm text-foreground">
                    Refund Policy
                  </h5>
                  <p className="text-sm text-muted-foreground">
                    {trip.policies.refund_policy}
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-sm text-foreground">
                    Modification Policy
                  </h5>
                  <p className="text-sm text-muted-foreground">
                    {trip.policies.modification_policy}
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-sm text-foreground">
                    Service Fee
                  </h5>
                  <p className="text-sm text-muted-foreground">
                    {trip.pricing.service_fee !== undefined
                      ? `${trip.pricing.service_fee.toLocaleString('vi-VN')}đ per booking`
                      : 'Included'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Route Stops Tab */}
        <TabsContent value="stops" className="space-y-6">
          {trip.route_stops && trip.route_stops.length > 0 ? (
            <div>
              <div className="relative">
                <div className="absolute left-[6.9rem] top-0 bottom-0 w-0.5 bg-border"></div>
                <div className="space-y-3">
                  {trip.route_stops
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((stop, index) => {
                      // Calculate actual arrival time
                      let actualTime = ''
                      if (stop.arrival_offset_minutes !== undefined) {
                        const departureDate = new Date(
                          trip.schedule.departure_time
                        )
                        const arrivalTime = new Date(
                          departureDate.getTime() +
                            stop.arrival_offset_minutes * 60000
                        )
                        actualTime = formatTime(arrivalTime.toISOString())
                      }
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 relative"
                        >
                          <span className="text-xs text-muted-foreground font-medium w-22 text-right">
                            {actualTime}
                          </span>
                          <div className="flex flex-col items-center gap-1 relative">
                            <div className="w-6 h-6 rounded-full bg-primary border-2 border-white shadow-sm flex items-center justify-center relative z-10">
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className="text-sm text-foreground font-medium">
                              {stop.stop_name}
                            </span>
                            <div className="text-xs text-muted-foreground mt-1 space-y-1">
                              {stop.address !== undefined && (
                                <p>{stop.address}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-muted">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> The schedule times are estimated. This
                  schedule may change depending on actual conditions.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No intermediate stops on this route
              </p>
            </div>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <ReviewsList
            reviews={reviews}
            isLoading={reviewsLoading}
            onLoadMore={async () => {
              setReviewsPage((prev) => prev + 1)
            }}
            hasMore={hasMoreReviews}
            sortBy={reviewsSortBy}
            onSortChange={(sort) => {
              setReviewsSortBy(
                sort as 'recent' | 'helpful' | 'rating-high' | 'rating-low'
              )
              setReviewsPage(1) // Reset to first page when sorting changes
            }}
            ratingFilter={reviewsRatingFilter}
            onRatingFilterChange={(rating) => {
              setReviewsRatingFilter(rating)
              setReviewsPage(1) // Reset to first page when filter changes
            }}
            operatorStats={operatorStats}
            currentPage={reviewsPage}
            totalPages={totalPages}
            onPageChange={(page) => setReviewsPage(page)}
            limit={reviewsLimit}
            onLimitChange={(limit) => {
              setReviewsLimit(limit)
              setReviewsPage(1) // Reset to first page when limit changes
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Booking Button */}
      <div className="pt-4 mt-6 border-t border-border">
        <Button
          className="w-full"
          size="lg"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/booking/${trip.trip_id}/seats`)
          }}
        >
          Book This Trip -{' '}
          {(trip.pricing?.base_price || 0).toLocaleString('vi-VN')}đ
        </Button>
      </div>
    </div>
  )
}
