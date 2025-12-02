import { Button } from '../ui/button'
import { Card } from '../ui/card'
import {
  Clock,
  MapPin,
  Users as UsersIcon,
  Wifi,
  Wind,
  Droplet,
  Monitor,
} from 'lucide-react'
import type { Trip } from '@/api/trips'

interface TripResultCardProps {
  trip: Trip
  onSelectSeats?: (tripId: string) => void
}

export const TripResultCard = ({
  trip,
  onSelectSeats,
}: TripResultCardProps) => {
  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const calculateDuration = () => {
    const departure = new Date(`2000-01-01T${trip.schedule.departureTime}`)
    const arrival = new Date(`2000-01-01T${trip.schedule.arrivalTime}`)
    const diffMs = arrival.getTime() - departure.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const getAmenityIcon = (amenityId: string) => {
    switch (amenityId.toLowerCase()) {
      case 'wifi':
        return <Wifi className="w-4 h-4" />
      case 'ac':
      case 'air_conditioning':
        return <Wind className="w-4 h-4" />
      case 'toilet':
        return <Droplet className="w-4 h-4" />
      case 'entertainment':
        return <Monitor className="w-4 h-4" />
      default:
        return null
    }
  }

  const availabilityColor =
    trip.availability.availableSeats > 10
      ? 'text-green-600'
      : trip.availability.availableSeats > 5
        ? 'text-yellow-600'
        : 'text-red-600'

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Left section - Operator and trip details */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            {trip.operator.logo && (
              <img
                src={trip.operator.logo}
                alt={trip.operator.name}
                className="w-12 h-12 object-contain"
              />
            )}
            <div>
              <h3 className="font-semibold text-lg">{trip.operator.name}</h3>
              {trip.operator.rating && (
                <div className="flex items-center gap-1 text-sm text-yellow-500">
                  <span>⭐</span>
                  <span>{trip.operator.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="font-semibold">
                  {formatTime(trip.schedule.departureTime)}
                </span>
                <span className="text-muted-foreground"> → </span>
                <span className="font-semibold">
                  {formatTime(trip.schedule.arrivalTime)}
                </span>
                <span className="text-muted-foreground ml-2">
                  ({calculateDuration()})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>
              {trip.route.origin} → {trip.route.destination}
            </span>
            <span className="mx-2">•</span>
            <span>{trip.route.distance} km</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
              {trip.bus.busType}
            </span>
            <span className={`flex items-center gap-1 ${availabilityColor}`}>
              <UsersIcon className="w-4 h-4" />
              <span className="font-medium">
                {trip.availability.availableSeats} seats left
              </span>
            </span>
          </div>

          {/* Amenities */}
          {trip.bus.amenities && trip.bus.amenities.length > 0 && (
            <div className="flex items-center gap-3 text-muted-foreground">
              {trip.bus.amenities.slice(0, 4).map((amenity) => (
                <div
                  key={amenity.id}
                  className="flex items-center gap-1 text-xs"
                  title={amenity.name}
                >
                  {getAmenityIcon(amenity.id)}
                  <span>{amenity.name}</span>
                </div>
              ))}
              {trip.bus.amenities.length > 4 && (
                <span className="text-xs">
                  +{trip.bus.amenities.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right section - Price and action */}
        <div className="flex flex-col items-end gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {formatPrice(trip.pricing.basePrice)}
            </div>
            <div className="text-xs text-muted-foreground">per seat</div>
          </div>

          <Button
            className="bg-blue-500 text-white hover:bg-blue-600"
            onClick={() => onSelectSeats?.(trip.tripId)}
            disabled={trip.availability.availableSeats === 0}
          >
            {trip.availability.availableSeats === 0
              ? 'Sold Out'
              : 'Select Seats'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
