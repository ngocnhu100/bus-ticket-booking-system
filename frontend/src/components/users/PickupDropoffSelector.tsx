import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { MapPin, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react'
import type { PickupPoint, DropoffPoint } from '@/types/trip.types'

interface PickupDropoffSelectorProps {
  pickupPoints: PickupPoint[]
  dropoffPoints: DropoffPoint[]
  selectedPickup: PickupPoint | null
  selectedDropoff: DropoffPoint | null
  onPickupSelect: (point: PickupPoint) => void
  onDropoffSelect: (point: DropoffPoint) => void
  isActive: boolean
  seatsSelected: number
  minSeatsRequired?: number
}

/**
 * PickupDropoffSelector Component
 *
 * Allows users to select pickup and dropoff locations along the route.
 * Only active when at least 1 seat is selected.
 *
 * Features modern radio button UI with lucide icons and Tailwind styling.
 */
export function PickupDropoffSelector({
  pickupPoints,
  dropoffPoints,
  selectedPickup,
  selectedDropoff,
  onPickupSelect,
  onDropoffSelect,
  isActive,
  seatsSelected,
  minSeatsRequired = 1,
}: PickupDropoffSelectorProps) {
  const [isPickupOpen, setIsPickupOpen] = useState(false)
  const [isDropoffOpen, setIsDropoffOpen] = useState(false)

  const canSelect = isActive && seatsSelected >= minSeatsRequired

  const formatTime = (
    dateString: string | undefined,
    includeDate = true
  ): string => {
    if (!dateString) return 'N/A'
    try {
      const d = new Date(dateString)
      if (Number.isNaN(d.getTime())) return dateString

      const hh = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      const time = `${hh}:${mm}` // 24-hour format

      if (!includeDate) return time

      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      return `${time} (${day}/${month})` // e.g. "23:05 (17/12)"
    } catch {
      return dateString || 'N/A'
    }
  }

  // const formatTime = (dateString: string | undefined): string => {
  //   if (!dateString) return 'N/A'
  //   try {
  //     const d = new Date(dateString)
  //     if (Number.isNaN(d.getTime())) return dateString

  //     const hh = String(d.getHours()).padStart(2, '0')
  //     const mm = String(d.getMinutes()).padStart(2, '0')
  //     return `${hh}:${mm}` // 24-hour format
  //   } catch {
  //     return dateString || 'N/A'
  //   }
  // }

  const formatOffset = (offsetMinutes: number): string => {
    const sign = offsetMinutes >= 0 ? '+' : '-'
    const absOffset = Math.abs(offsetMinutes)
    const hours = Math.floor(absOffset / 60)
    const minutes = absOffset % 60
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  if (!canSelect) {
    return (
      <Card className="w-full flex flex-col items-center gap-3 py-6 bg-background border border-border rounded-xl shadow-sm">
        <AlertCircle size={28} className="text-yellow-500 mb-1" />
        <h3 className="text-lg font-semibold text-foreground">
          Pickup & Dropoff Locations
        </h3>
        <p className="text-sm text-muted-foreground text-center">
          Select at least {minSeatsRequired} seat
          {minSeatsRequired > 1 ? 's' : ''} to choose pickup and dropoff points
        </p>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-background border border-border rounded-xl shadow-sm p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={22} className="text-primary" />
        <h2 className="text-lg font-bold text-foreground">
          Pickup & Dropoff Locations
        </h2>
      </div>

      {/* Pickup Points Section */}
      <div className="mb-4">
        <button
          type="button"
          className="flex w-full items-center justify-between py-2 px-3 rounded-lg hover:bg-muted transition"
          onClick={() => setIsPickupOpen((v) => !v)}
          aria-expanded={isPickupOpen}
        >
          <div className="flex flex-col text-left">
            <span className="font-semibold text-sm text-foreground">
              Pickup Location
            </span>
            {selectedPickup && (
              <span className="text-xs text-muted-foreground">
                {selectedPickup.name} •{' '}
                {selectedPickup.time
                  ? formatTime(selectedPickup.time)
                  : formatOffset(selectedPickup.departure_offset_minutes)}
              </span>
            )}
          </div>
          <ChevronDown
            size={20}
            className={`transition-transform ${isPickupOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {isPickupOpen && (
          <div className="mt-2 space-y-2">
            {pickupPoints.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm p-3">
                <AlertCircle size={18} />
                <span>No pickup points available</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {pickupPoints.map((point) => (
                  <label
                    key={point.point_id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
                      ${selectedPickup?.point_id === point.point_id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                  >
                    <input
                      type="radio"
                      name="pickup-point"
                      value={point.point_id}
                      checked={selectedPickup?.point_id === point.point_id}
                      onChange={() => onPickupSelect(point)}
                      className="accent-primary h-5 w-5"
                    />

                    <div className="flex items-center gap-4 w-full">
                      <div className="w-28 shrink-0 text-sm font-semibold text-foreground">
                        {point.time
                          ? formatTime(point.time)
                          : formatOffset(point.departure_offset_minutes)}
                      </div>

                      <div className="flex-1 flex flex-col">
                        <span className="font-medium text-foreground">
                          {point.name}
                        </span>
                        <span className="text-sm text-muted-foreground wrap-break-word">
                          {point.address}
                        </span>
                      </div>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          point.address
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 text-primary underline text-sm flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MapPin size={16} />
                        <span>Map</span>
                      </a>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dropoff Points Section */}
      <div className="mb-2">
        <button
          type="button"
          className="flex w-full items-center justify-between py-2 px-3 rounded-lg hover:bg-muted transition"
          onClick={() => setIsDropoffOpen((v) => !v)}
          aria-expanded={isDropoffOpen}
        >
          <div className="flex flex-col text-left">
            <span className="font-semibold text-sm text-foreground">
              Dropoff Location
            </span>
            {selectedDropoff && (
              <span className="text-xs text-muted-foreground">
                {selectedDropoff.name} •{' '}
                {selectedDropoff.time
                  ? formatTime(selectedDropoff.time)
                  : formatOffset(selectedDropoff.departure_offset_minutes)}
              </span>
            )}
          </div>
          <ChevronDown
            size={20}
            className={`transition-transform ${isDropoffOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {isDropoffOpen && (
          <div className="mt-2 space-y-2">
            {dropoffPoints.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm p-3">
                <AlertCircle size={18} />
                <span>No dropoff points available</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {dropoffPoints.map((point) => (
                  <label
                    key={point.point_id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
                      ${selectedDropoff?.point_id === point.point_id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                  >
                    <input
                      type="radio"
                      name="dropoff-point"
                      value={point.point_id}
                      checked={selectedDropoff?.point_id === point.point_id}
                      onChange={() => onDropoffSelect(point)}
                      className="accent-primary h-5 w-5"
                    />

                    <div className="flex items-center gap-4 w-full">
                      <div className="w-28 shrink-0 text-sm font-semibold text-foreground">
                        {point.time
                          ? formatTime(point.time)
                          : formatOffset(point.departure_offset_minutes)}
                      </div>

                      <div className="flex-1 flex flex-col">
                        <span className="font-medium text-foreground">
                          {point.name}
                        </span>
                        <span className="text-sm text-muted-foreground wrap-break-word">
                          {point.address}
                        </span>
                      </div>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          point.address
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 text-primary underline text-sm flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MapPin size={16} />
                        <span>Map</span>
                      </a>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Completion Status */}
      {selectedPickup && selectedDropoff && (
        <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          <CheckCircle2 size={18} className="text-green-600" />
          <span>Locations selected</span>
        </div>
      )}
    </Card>
  )
}

export default PickupDropoffSelector
