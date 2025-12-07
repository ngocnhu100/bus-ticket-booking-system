import { useState, useMemo, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Icon } from 'lucide-react'
import { steeringWheel } from '@lucide/lab'
import { Card } from '@/components/ui/card'
import type { Seat, SeatMapData } from '@/types/trip.types'
import { SeatItem } from './SeatItem'
import { SeatLegend } from './SeatLegend'

interface SeatMapProps {
  /** Seat map data from API */
  seatMapData: SeatMapData
  /** Selected seat IDs */
  selectedSeats?: string[]
  /** Callback when seat is clicked */
  onSeatSelect?: (seat: Seat, isSelected: boolean) => void
  /** Maximum number of seats that can be selected */
  maxSelectable?: number
  /** Whether the map is in read-only mode */
  readOnly?: boolean
  /** Current user ID for lock ownership checking */
  currentUserId?: string
  /** User's active locks */
  userLocks?: Array<{ seat_code: string; expires_at: string }>
  /** Callback when a lock expires */
  onLockExpire?: (seatCode: string) => void
  /** Custom class name */
  className?: string
}

/**
 * SeatMap Component
 * @example
 * ```tsx
 * <SeatMap
 *   seatMapData={seatData}
 *   selectedSeats={['A1', 'A2']}
 *   onSeatSelect={(seat, isSelected) => handleSeatSelect(seat, isSelected)}
 *   maxSelectable={2}
 * />
 * ```
 */
export function SeatMap({
  seatMapData,
  selectedSeats = [],
  onSeatSelect,
  maxSelectable = 10,
  readOnly = false,
  currentUserId,
  userLocks = [],
  onLockExpire,
  className = '',
}: SeatMapProps) {
  const [localSelectedSeats, setLocalSelectedSeats] =
    useState<string[]>(selectedSeats)
  const [selectionError, setSelectionError] = useState<string>('')

  // Sync local state with prop changes
  useEffect(() => {
    setLocalSelectedSeats(selectedSeats)
  }, [selectedSeats])

  // Organize seats by row for easier rendering
  const seatsByRow = useMemo(() => {
    // Safety check for seatMapData.seats
    if (
      !seatMapData ||
      !seatMapData.seats ||
      !Array.isArray(seatMapData.seats)
    ) {
      return []
    }

    const rows = new Map<number, Seat[]>()
    seatMapData.seats.forEach((seat) => {
      // Use seat.row (1-indexed) to organize into rows
      const row = seat.row - 1 // Convert to 0-indexed for array
      if (!rows.has(row)) {
        rows.set(row, [])
      }
      rows.get(row)!.push(seat)
    })

    // Sort seats within each row by column
    rows.forEach((seats) => {
      seats.sort((a, b) => a.column - b.column)
    })

    // Return sorted rows
    return Array.from(rows.entries())
      .sort(([rowA], [rowB]) => rowA - rowB)
      .map(([, seats]) => seats)
  }, [seatMapData])

  const handleSeatClick = (seat: Seat) => {
    if (readOnly) return

    // Allow clicking if available or locked by current user
    const isLockedByUser = userLocks.some(
      (lock) => lock.seat_code === seat.seat_code
    )
    if (seat.status !== 'available' && !isLockedByUser) return

    const isCurrentlySelected = localSelectedSeats.includes(seat.seat_id!)

    // Check if we can add more seats
    if (!isCurrentlySelected && localSelectedSeats.length >= maxSelectable) {
      setSelectionError(`You can only select up to ${maxSelectable} seats.`)
      // Clear error after 3 seconds
      setTimeout(() => setSelectionError(''), 3000)
      return
    }

    // Clear any previous error
    setSelectionError('')

    // Call parent callback - let parent handle state updates
    onSeatSelect?.(seat, !isCurrentlySelected)
  }

  // Get row label (1, 2, 3, etc.)
  const getRowLabel = (rowIndex: number) => {
    return (rowIndex + 1).toString() // 1, 2, 3, etc.
  }

  return (
    <div className={`w-full ${className}`}>
      <>
        {/* Seat Map Container */}
        <Card className="p-4 bg-card border border-border/50 w-full">
          {/* Error Message */}
          {selectionError && (
            <div
              className="mb-4 p-3 rounded-lg border"
              style={{
                backgroundColor: 'hsl(var(--destructive) / 0.1)',
                borderColor: 'hsl(var(--destructive) / 0.2)',
              }}
            >
              <p
                className="text-sm"
                style={{ color: 'hsl(var(--destructive))' }}
              >
                {selectionError}
              </p>
            </div>
          )}

          {/* Seat Grid */}
          <div className="flex justify-center">
            <div className="space-y-3">
              {/* Driver Row */}
              <div className="flex items-center gap-4">
                {/* Driver Label */}
                <div className="w-6 text-center">
                  <Icon
                    iconNode={steeringWheel}
                    className="w-6 h-6 mx-auto"
                    style={{ color: 'hsl(var(--foreground))' }}
                  />
                </div>

                {/* Empty space for driver position */}
                <div className="flex flex-wrap gap-2">
                  <div className="w-9 h-9"></div>
                </div>
              </div>

              {seatsByRow.map((rowSeats, rowIndex) => (
                <div key={rowIndex} className="flex items-center gap-4">
                  {/* Row Label */}
                  <div className="w-6 text-center">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {getRowLabel(rowIndex)}
                    </span>
                  </div>

                  {/* Seats in Row */}
                  <div className="flex gap-2">
                    {/* Create a grid with positions 1 to maxColumns */}
                    {Array.from(
                      { length: seatMapData.columns },
                      (_, colIndex) => {
                        const column = colIndex + 1 // 1-indexed
                        const seat = rowSeats.find((s) => s.column === column)

                        if (seat) {
                          const userLock = userLocks.find(
                            (lock) => lock.seat_code === seat.seat_code
                          )
                          const isLockedByUser = userLocks.some(
                            (lock) => lock.seat_code === seat.seat_code
                          )
                          return (
                            <SeatItem
                              key={seat.seat_id}
                              seat={seat}
                              isSelected={
                                seat.seat_id
                                  ? localSelectedSeats.includes(seat.seat_id)
                                  : false
                              }
                              onClick={() => handleSeatClick(seat)}
                              disabled={
                                readOnly ||
                                (seat.status !== 'available' && !isLockedByUser)
                              }
                              currentUserId={currentUserId}
                              userLock={userLock}
                              onLockExpire={onLockExpire}
                            />
                          )
                        } else {
                          // Empty space for missing seat
                          return (
                            <div
                              key={`empty-${rowIndex}-${column}`}
                              className="w-9 h-9"
                            ></div>
                          )
                        }
                      }
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6">
            <SeatLegend />
          </div>
        </Card>

        {/* Warning if read-only */}
        {readOnly && (
          <div className="flex gap-3 p-4 rounded-lg bg-muted/50 border border-muted">
            <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Seat selection is currently disabled. This is a preview view.
            </p>
          </div>
        )}
      </>
    </div>
  )
}
