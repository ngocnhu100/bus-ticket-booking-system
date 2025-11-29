import { Star, Wifi, AirVent, Usb, Armchair, Ticket, Bus } from 'lucide-react'
import { MdOutlineTripOrigin, MdOutlineLocationOn } from 'react-icons/md'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Amenity {
  id: string
  name: string
  icon?: React.ReactNode
}

export interface Trip {
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
  seatType: 'standard' | 'limousine' | 'sleeper'
  availableSeats: number
  totalSeats: number
  amenities: Amenity[]
  isBestPrice?: boolean
  isLimitedOffer?: boolean
}

interface TripResultsCardProps {
  trip: Trip
  onSelectTrip?: (tripId: string) => void
  isSelected?: boolean
}

export function TripResultsCard({
  trip,
  onSelectTrip,
  isSelected = false,
}: TripResultsCardProps) {
  const discountPercentage = trip.discount
    ? Math.round((trip.discount / trip.originalPrice!) * 100)
    : 0

  const seatTypeLabel = {
    standard: 'Standard Seat',
    limousine: 'Limousine 9 seats',
    sleeper: 'Sleeper Bus',
  }

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
    <Card
      className={`p-4 md:p-6 hover:shadow-lg active:shadow-xl transition-all duration-300 border-2 cursor-pointer ${
        isSelected
          ? 'shadow-2xl border-primary ring-4 ring-primary/50 scale-[1.02]'
          : 'border-border'
      }`}
      onClick={() => onSelectTrip?.(trip.id)}
    >
      <div className="space-y-4">
        {/* Header with operator and price */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm md:text-base">
                {trip.operatorName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs md:text-sm font-medium">
                  {trip.rating.toFixed(1)} ({trip.reviewCount.toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              {trip.discount && (
                <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs font-semibold rounded">
                  -{discountPercentage}%
                </span>
              )}
              {trip.isBestPrice && (
                <span className="px-2 py-1 bg-success/10 text-success text-xs font-semibold rounded">
                  Best Price
                </span>
              )}
            </div>
            <div className="text-xl md:text-2xl font-bold text-primary">
              {trip.price.toLocaleString('vi-VN')}đ
            </div>
            {trip.originalPrice && (
              <div className="text-xs text-muted-foreground line-through">
                {trip.originalPrice.toLocaleString('vi-VN')}đ
              </div>
            )}
          </div>
        </div>

        {/* Timeline section */}
        <div className="py-4">
          <div className="flex items-center justify-between text-center">
            <div className="flex flex-col items-center">
              <div className="text-lg md:text-xl font-bold text-foreground">
                {trip.departureTime}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <MdOutlineTripOrigin className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">
                  {trip.departureLocation}
                </span>
              </div>
            </div>

            <div className="flex-1 mx-4 flex flex-col items-center">
              <div className="w-full flex items-center">
                <div className="flex-1 h-0.5 bg-border"></div>
                <div className="px-3 py-1 bg-secondary rounded text-xs font-medium text-muted-foreground">
                  {trip.duration}
                </div>
                <div className="flex-1 h-0.5 bg-border"></div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {trip.distance}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-lg md:text-xl font-bold text-foreground">
                {trip.arrivalTime}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <MdOutlineLocationOn className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">
                  {trip.arrivalLocation}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bus details */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {seatTypeLabel[trip.seatType]}
            </span>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Armchair className="w-4 h-4" />
            <span className="font-semibold text-foreground">
              {trip.availableSeats}
            </span>{' '}
            seats left
          </div>
        </div>

        {/* Amenities */}
        {trip.amenities && trip.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {trip.amenities.map((amenity) => (
              <div
                key={amenity.id}
                className="flex items-center gap-1 px-3 py-1 bg-secondary/20 rounded-full text-sm"
              >
                {getAmenityIcon(amenity.id)}
                <span>{amenity.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1">
            View Details
          </Button>
          <Button
            variant={isSelected ? 'outline' : 'default'}
            className="flex-1"
          >
            Select Trip
          </Button>
        </div>
      </div>
    </Card>
  )
}
