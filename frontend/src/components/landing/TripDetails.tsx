import { Star, Wifi, AirVent, Usb, MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Trip } from './TripResultsCard'

interface TripDetailsProps {
  trip: Trip
  onSelectTrip?: (tripId: string) => void
}

export function TripDetails({ trip, onSelectTrip }: TripDetailsProps) {
  const getAmenityIcon = (amenityId: string) => {
    const amenityMap: Record<string, React.ReactNode> = {
      wifi: <Wifi className="w-4 h-4" />,
      ac: <AirVent className="w-4 h-4" />,
      usb: <Usb className="w-4 h-4" />,
      toilet: <span className="text-sm font-semibold">WC</span>,
    }
    return amenityMap[amenityId] || null
  }

  return (
    <div className="mt-6 pt-6 border-t border-border space-y-6">
      {/* Route Details */}
      {trip.routeDetails && (
        <div>
          <h4 className="font-semibold text-foreground mb-4">Route Details</h4>
          <div className="space-y-6">
            {/* Pickup Points */}
            {trip.routeDetails.pickupPoints &&
              trip.routeDetails.pickupPoints.length > 0 && (
                <div>
                  <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-success" />
                    Pickup Points
                  </h5>
                  <div className="space-y-2">
                    {trip.routeDetails.pickupPoints.map((point, index) => (
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
                              {point.time}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Dropoff Points */}
            {trip.routeDetails.dropoffPoints &&
              trip.routeDetails.dropoffPoints.length > 0 && (
                <div>
                  <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Dropoff Points
                  </h5>
                  <div className="space-y-2">
                    {trip.routeDetails.dropoffPoints.map((point, index) => (
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
                              {point.time}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Route Stops */}
            {trip.routeDetails.stops && trip.routeDetails.stops.length > 0 && (
              <div>
                <h5 className="font-medium text-foreground mb-3">
                  Route Stops
                </h5>
                <div className="relative">
                  <div className="absolute left-16 top-0 bottom-0 w-0.5 bg-border"></div>
                  <div className="space-y-3">
                    {trip.routeDetails.stops.map((stop, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 relative"
                      >
                        {stop.time && (
                          <span className="text-xs text-muted-foreground font-medium min-w-10 text-right">
                            {stop.time}
                          </span>
                        )}
                        <div className="flex flex-col items-center gap-1 relative">
                          <div className="w-6 h-6 rounded-full bg-primary border-2 border-white shadow-sm flex items-center justify-center relative z-10">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <span className="text-sm text-foreground font-medium">
                            {stop.name}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {stop.address}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-muted">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> The schedule times are estimated.
                    This schedule may change depending on actual conditions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bus Information */}
      {(trip.busModel || trip.busCapacity || trip.busType) && (
        <div>
          <h4 className="font-semibold text-foreground mb-4">
            Bus Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trip.busModel && (
              <div className="p-4 bg-muted/30 rounded-lg border border-muted">
                <h5 className="font-medium text-sm text-muted-foreground mb-1">
                  Model
                </h5>
                <p className="text-foreground font-medium">{trip.busModel}</p>
              </div>
            )}
            {trip.busCapacity && (
              <div className="p-4 bg-muted/30 rounded-lg border border-muted">
                <h5 className="font-medium text-sm text-muted-foreground mb-1">
                  Capacity
                </h5>
                <p className="text-foreground font-medium">
                  {trip.busCapacity} seats
                </p>
              </div>
            )}
            {trip.busType && (
              <div className="p-4 bg-muted/30 rounded-lg border border-muted">
                <h5 className="font-medium text-sm text-muted-foreground mb-1">
                  Type
                </h5>
                <p className="text-foreground font-medium">{trip.busType}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Amenities */}
      {trip.amenities && trip.amenities.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3">
            Amenities & Services
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {trip.amenities.map((amenity) => (
              <div
                key={amenity.id}
                className="flex items-center gap-2 p-3 bg-secondary/20 rounded-lg"
              >
                {getAmenityIcon(amenity.id)}
                <span className="text-sm">{amenity.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policies */}
      {trip.policies && (
        <div>
          <h4 className="font-semibold text-foreground mb-3">Policies</h4>
          <div className="space-y-3">
            <div>
              <h5 className="font-medium text-sm text-foreground">
                Cancellation Policy
              </h5>
              <p className="text-sm text-muted-foreground">
                {trip.policies.cancellation}
              </p>
            </div>
            <div>
              <h5 className="font-medium text-sm text-foreground">
                Refund Policy
              </h5>
              <p className="text-sm text-muted-foreground">
                {trip.policies.refund}
              </p>
            </div>
            <div>
              <h5 className="font-medium text-sm text-foreground">
                Change Policy
              </h5>
              <p className="text-sm text-muted-foreground">
                {trip.policies.change}
              </p>
            </div>
            <div>
              <h5 className="font-medium text-sm text-foreground">
                Luggage Policy
              </h5>
              <p className="text-sm text-muted-foreground">
                {trip.policies.luggage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bus Images */}
      {trip.busImages && trip.busImages.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3">Bus Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {trip.busImages.map((image, index) => (
              <div
                key={index}
                className="aspect-video rounded-lg overflow-hidden bg-secondary/20"
              >
                <img
                  src={image}
                  alt={`Bus image ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      {trip.reviews?.recent && trip.reviews.recent.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3">Recent Reviews</h4>
          <div className="space-y-3">
            {trip.reviews.recent.slice(0, 3).map((review, index) => (
              <div key={index} className="p-3 bg-secondary/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm">{review.author}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs">{review.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Button */}
      <div className="pt-4">
        <Button
          className="w-full"
          size="lg"
          onClick={(e) => {
            e.stopPropagation()
            onSelectTrip?.(trip.id)
          }}
        >
          Book This Trip - {trip.price.toLocaleString('vi-VN')}đ
        </Button>
      </div>
    </div>
  )
}
