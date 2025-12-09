import {
  Star,
  Armchair,
  Ticket,
  Bus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { MdOutlineTripOrigin, MdOutlineLocationOn } from 'react-icons/md'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TripDetails } from './TripDetails'
import type { Trip } from '@/types/trip.types'

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
  const [isExpanded, setIsExpanded] = useState(false)
  const navigate = useNavigate()

  // Extract and format display properties from nested Trip structure
  const operatorName = trip.operator.name
  const operatorRating = trip.operator.rating
  const operatorLogo = trip.operator.logo

  const departureDate = new Date(trip.schedule.departure_time)
  const arrivalDate = new Date(trip.schedule.arrival_time)

  const departureTime = departureDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const arrivalTime = arrivalDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const durationMinutes = trip.schedule.duration
  const hours = Math.floor(durationMinutes / 60)
  const mins = durationMinutes % 60
  const duration =
    hours > 0 ? (mins > 0 ? `${hours}h${mins}m` : `${hours}h`) : `${mins}m`

  const departureLocation = trip.route.origin
  const arrivalLocation = trip.route.destination
  const distance = `${trip.route.distance_km} km`
  const price = trip.pricing.base_price
  const seatType = trip.bus.bus_type
  const availableSeats = trip.availability.available_seats

  // Optional properties (for future use or when extended in API)
  const reviewCount = 0
  const discount: number | undefined = undefined
  const originalPrice: number | undefined = undefined
  const isBestPrice = false

  const discountPercentage =
    discount && originalPrice ? Math.round((discount / originalPrice) * 100) : 0

  const seatTypeLabel: Record<string, string> = {
    standard: 'Standard Seat',
    limousine: 'Limousine 9 seats',
    sleeper: 'Sleeper Bus',
  }

  return (
    <Card
      className={`p-4 md:p-6 hover:shadow-lg active:shadow-xl transition-all duration-300 border-2 cursor-pointer ${
        isSelected
          ? 'shadow-2xl border-primary ring-4 ring-primary/50 scale-[1.02]'
          : 'border-border'
      }`}
      onClick={() => onSelectTrip?.(trip.trip_id)}
    >
      <div className="space-y-4">
        {/* Header with operator and price */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {operatorLogo ? (
              <img
                src={operatorLogo}
                alt={`${operatorName} logo`}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Ticket className="w-4 h-4 text-primary" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-foreground text-sm md:text-base">
                {operatorName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs md:text-sm font-medium">
                  {operatorRating.toFixed(1)} ({reviewCount.toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              {discount ? (
                <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs font-semibold rounded">
                  -{discountPercentage}%
                </span>
              ) : null}
              {isBestPrice ? (
                <span className="px-2 py-1 bg-success/10 text-success text-xs font-semibold rounded">
                  Best Price
                </span>
              ) : null}
            </div>
            <div className="text-xl md:text-2xl font-bold text-primary">
              {price.toLocaleString('vi-VN')}đ
            </div>
            {originalPrice !== undefined && (
              <div className="text-xs text-muted-foreground line-through">
                {(originalPrice as number).toLocaleString('vi-VN')}đ
              </div>
            )}
          </div>
        </div>

        {/* Timeline section */}
        <div className="py-4">
          <div className="flex items-center justify-between text-center">
            <div className="flex flex-col items-center">
              <div className="text-lg md:text-xl font-bold text-foreground">
                {departureTime}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <MdOutlineTripOrigin className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">
                  {departureLocation}
                </span>
              </div>
            </div>

            <div className="flex-1 mx-4 flex flex-col items-center">
              <div className="w-full flex items-center">
                <div className="flex-1 h-0.5 bg-border"></div>
                <div className="px-3 py-1 bg-secondary rounded text-xs font-medium text-muted-foreground">
                  {duration}
                </div>
                <div className="flex-1 h-0.5 bg-border"></div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {distance}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-lg md:text-xl font-bold text-foreground">
                {arrivalTime}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <MdOutlineLocationOn className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">
                  {arrivalLocation}
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
              {seatTypeLabel[seatType]}
            </span>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Armchair className="w-4 h-4" />
            <span className="font-semibold text-foreground">
              {availableSeats}
            </span>{' '}
            seats left
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                View Details
              </>
            )}
          </button>
          <Button
            variant={isSelected ? 'outline' : 'default'}
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/booking/${trip.trip_id}/seats`)
            }}
          >
            Select Seats
          </Button>
        </div>

        {/* Expanded Details */}
        {isExpanded && <TripDetails trip={trip} />}
      </div>
    </Card>
  )
}
