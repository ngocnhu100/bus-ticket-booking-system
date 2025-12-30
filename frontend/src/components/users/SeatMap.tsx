import { useState, useMemo } from 'react'
import { AlertCircle } from 'lucide-react'
import { Icon } from 'lucide-react'
import { steeringWheel } from '@lucide/lab'
import { Card } from '@/components/ui/card'
import type {
  Seat,
  SeatMapData,
  SeatItemType,
  LayoutRow,
} from '@/types/trip.types'
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
  /** Whether an operation is in progress (disables interaction) */
  operationInProgress?: boolean
  /** User's active locks */
  userLocks?: Array<{ seat_code: string; expires_at: string }>
  /** Callback when a lock expires */
  onLockExpire?: (seatCode: string) => void
  /** Custom class name */
  className?: string
  /** Current user ID (for fallback lock ownership check) */
  currentUserId?: string
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
  operationInProgress = false,
  userLocks = [],
  onLockExpire,
  className = '',
  currentUserId,
}: SeatMapProps) {
  // Use `selectedSeats` prop directly to avoid duplicated local state
  const [selectionError, setSelectionError] = useState<string>('')

  // Check if we have layout_structure and multiple floors
  const hasMultipleFloors = useMemo(() => {
    if (!seatMapData?.layout_structure?.rows) return false
    const allSeats = seatMapData.layout_structure.rows.flatMap(
      (row: LayoutRow) =>
        row.seats.filter(
          (
            s: SeatItemType
          ): s is { code: string; floor?: number; price?: number } =>
            s !== null && typeof s === 'object' && 'floor' in s
        )
    )
    const floorSet = new Set(allSeats.map((s) => s.floor))
    return floorSet.size > 1
  }, [seatMapData])

  const handleSeatClick = (seat: Seat) => {
    if (readOnly) return

    // Block interaction if seat is locked by booking
    if (seat.locked_by === 'booking') return

    const isCurrentlySelected = selectedSeats.includes(seat.seat_id!)

    // Allow clicking if:
    // - Seat is available, OR
    // - Seat is locked by current user, OR
    // - Seat is currently selected (allows deselection)
    const isLockedByUser =
      userLocks.some((lock) => lock.seat_code === seat.seat_code) ||
      (currentUserId && seat.locked_by === currentUserId)
    const canToggleSeat =
      seat.status === 'available' || isLockedByUser || isCurrentlySelected

    if (!canToggleSeat) return

    // Don't allow selecting if already at max capacity (but allow deselection)
    if (!isCurrentlySelected && operationInProgress) return
    if (!isCurrentlySelected && selectedSeats.length >= maxSelectable) {
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
          {!seatMapData?.layout_structure?.rows ? (
            // Fallback for old format
            <div className="flex justify-center">
              <div className="space-y-3">Invalid seat map data format.</div>
            </div>
          ) : hasMultipleFloors ? (
            // Two-floor layout - side by side
            <div className="flex justify-center gap-8">
              {/* Floor 1 (Left) */}
              <div>
                <h3 className="text-center text-sm font-semibold mb-4 text-muted-foreground">
                  Lower floor
                </h3>
                <div className="space-y-3">
                  {/* Driver Row */}
                  <div className="flex items-center gap-4">
                    <div className="w-6 text-center">
                      <Icon
                        iconNode={steeringWheel}
                        className="w-6 h-6 mx-auto"
                        style={{ color: 'hsl(var(--foreground))' }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="w-9 h-9"></div>
                    </div>
                  </div>

                  {seatMapData.layout_structure.rows.map(
                    (layoutRow: LayoutRow, rowIndex: number) => {
                      // Check if this row has floor 1 seats
                      const hasFloor1 = layoutRow.seats.some(
                        (s: SeatItemType) =>
                          s !== null &&
                          (typeof s === 'string' ||
                            (typeof s === 'object' &&
                              (!('floor' in s) || s.floor === 1)))
                      )

                      if (!hasFloor1) return null

                      return (
                        <div
                          key={`floor1-row-${rowIndex}`}
                          className="flex items-center gap-4"
                        >
                          <div className="w-6 text-center">
                            <span className="text-xs font-semibold text-muted-foreground">
                              {layoutRow.row}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {layoutRow.seats.map(
                              (seatItem: SeatItemType, colIndex: number) => {
                                if (seatItem === null) {
                                  return (
                                    <div
                                      key={`floor1-empty-${rowIndex}-${colIndex}`}
                                      className="w-9 h-9"
                                    ></div>
                                  )
                                }

                                // Skip if not floor 1
                                if (
                                  typeof seatItem === 'object' &&
                                  'floor' in seatItem &&
                                  seatItem.floor !== 1
                                ) {
                                  return null
                                }

                                // Get seat code
                                const seatCode =
                                  typeof seatItem === 'string'
                                    ? seatItem
                                    : seatItem.code

                                // Find corresponding seat object
                                const seat = seatMapData.seats.find(
                                  (s: Seat) => s.seat_code === seatCode
                                )

                                if (!seat) {
                                  return (
                                    <div
                                      key={`floor1-notfound-${rowIndex}-${colIndex}`}
                                      className="w-9 h-9"
                                    ></div>
                                  )
                                }

                                const userLock = userLocks.find(
                                  (lock) => lock.seat_code === seat.seat_code
                                )
                                const isLockExpired = userLock
                                  ? new Date(userLock.expires_at).getTime() <=
                                    new Date().getTime()
                                  : false
                                const validUserLock =
                                  userLock && !isLockExpired
                                    ? userLock
                                    : undefined
                                const isLockedByUser =
                                  userLocks.some(
                                    (lock) =>
                                      lock.seat_code === seat.seat_code &&
                                      new Date(lock.expires_at).getTime() >
                                        new Date().getTime()
                                  ) ||
                                  (currentUserId &&
                                    seat.locked_by === currentUserId)
                                const isCurrentlySelected = !!(
                                  seat.seat_id &&
                                  selectedSeats.includes(seat.seat_id) &&
                                  seat.locked_by !== 'booking'
                                )
                                const canToggleSeat =
                                  seat.locked_by !== 'booking' &&
                                  seat.status !== 'occupied' &&
                                  (seat.status === 'available' ||
                                    isLockedByUser ||
                                    isCurrentlySelected)

                                return (
                                  <SeatItem
                                    key={seat.seat_id}
                                    seat={seat}
                                    isSelected={isCurrentlySelected}
                                    onClick={() => handleSeatClick(seat)}
                                    disabled={
                                      readOnly ||
                                      operationInProgress ||
                                      !canToggleSeat
                                    }
                                    userLock={validUserLock}
                                    onLockExpire={onLockExpire}
                                    currentUserId={currentUserId}
                                  />
                                )
                              }
                            )}
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
              </div>

              {/* Floor 2 (Right) */}
              <div>
                <h3 className="text-center text-sm font-semibold mb-4 text-muted-foreground">
                  Upper floor
                </h3>
                <div className="space-y-3">
                  {/* Driver Row */}
                  <div className="flex items-center gap-4">
                    <div className="w-6 text-center">
                      <Icon
                        iconNode={steeringWheel}
                        className="w-6 h-6 mx-auto"
                        style={{ color: 'hsl(var(--foreground))' }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="w-9 h-9"></div>
                    </div>
                  </div>

                  {seatMapData.layout_structure.rows.map(
                    (layoutRow: LayoutRow, rowIndex: number) => {
                      // Check if this row has floor 2 seats
                      const hasFloor2 = layoutRow.seats.some(
                        (s: SeatItemType) =>
                          s !== null &&
                          typeof s === 'object' &&
                          'floor' in s &&
                          s.floor === 2
                      )

                      if (!hasFloor2) return null

                      return (
                        <div
                          key={`floor2-row-${rowIndex}`}
                          className="flex items-center gap-4"
                        >
                          <div className="w-6 text-center">
                            <span className="text-xs font-semibold text-muted-foreground">
                              {layoutRow.row}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {layoutRow.seats.map(
                              (seatItem: SeatItemType, colIndex: number) => {
                                if (seatItem === null) {
                                  return (
                                    <div
                                      key={`floor2-empty-${rowIndex}-${colIndex}`}
                                      className="w-9 h-9"
                                    ></div>
                                  )
                                }

                                // Skip if not floor 2
                                if (
                                  typeof seatItem !== 'object' ||
                                  !('floor' in seatItem) ||
                                  seatItem.floor !== 2
                                ) {
                                  return null
                                }

                                const seatCode = seatItem.code
                                const seat = seatMapData.seats.find(
                                  (s: Seat) => s.seat_code === seatCode
                                )

                                if (!seat) {
                                  return (
                                    <div
                                      key={`floor2-notfound-${rowIndex}-${colIndex}`}
                                      className="w-9 h-9"
                                    ></div>
                                  )
                                }

                                const userLock = userLocks.find(
                                  (lock) => lock.seat_code === seat.seat_code
                                )
                                const isLockExpired = userLock
                                  ? new Date(userLock.expires_at).getTime() <=
                                    new Date().getTime()
                                  : false
                                const validUserLock =
                                  userLock && !isLockExpired
                                    ? userLock
                                    : undefined
                                const isLockedByUser =
                                  userLocks.some(
                                    (lock) =>
                                      lock.seat_code === seat.seat_code &&
                                      new Date(lock.expires_at).getTime() >
                                        new Date().getTime()
                                  ) ||
                                  (currentUserId &&
                                    seat.locked_by === currentUserId)
                                const isCurrentlySelected = !!(
                                  seat.seat_id &&
                                  selectedSeats.includes(seat.seat_id) &&
                                  seat.locked_by !== 'booking'
                                )
                                const canToggleSeat =
                                  seat.locked_by !== 'booking' &&
                                  seat.status !== 'occupied' &&
                                  (seat.status === 'available' ||
                                    isLockedByUser ||
                                    isCurrentlySelected)

                                return (
                                  <SeatItem
                                    key={seat.seat_id}
                                    seat={seat}
                                    isSelected={isCurrentlySelected}
                                    onClick={() => handleSeatClick(seat)}
                                    disabled={
                                      readOnly ||
                                      operationInProgress ||
                                      !canToggleSeat
                                    }
                                    userLock={validUserLock}
                                    onLockExpire={onLockExpire}
                                    currentUserId={currentUserId}
                                  />
                                )
                              }
                            )}
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Single-floor layout - use layout_structure directly
            <div className="flex justify-center">
              <div className="space-y-3">
                {/* Driver Row */}
                <div className="flex items-center gap-4">
                  <div className="w-6 text-center">
                    <Icon
                      iconNode={steeringWheel}
                      className="w-6 h-6 mx-auto"
                      style={{ color: 'hsl(var(--foreground))' }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="w-9 h-9"></div>
                  </div>
                </div>

                {seatMapData.layout_structure.rows.map(
                  (layoutRow: LayoutRow, rowIndex: number) => (
                    <div
                      key={`row-${rowIndex}`}
                      className="flex items-center gap-4"
                    >
                      <div className="w-6 text-center">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {layoutRow.row}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {layoutRow.seats.map(
                          (seatItem: SeatItemType, colIndex: number) => {
                            if (seatItem === null) {
                              return (
                                <div
                                  key={`empty-${rowIndex}-${colIndex}`}
                                  className="w-9 h-9"
                                ></div>
                              )
                            }

                            const seatCode =
                              typeof seatItem === 'string'
                                ? seatItem
                                : seatItem.code

                            const seat = seatMapData.seats.find(
                              (s: Seat) => s.seat_code === seatCode
                            )

                            if (!seat) {
                              return (
                                <div
                                  key={`notfound-${rowIndex}-${colIndex}`}
                                  className="w-9 h-9"
                                ></div>
                              )
                            }

                            const userLock = userLocks.find(
                              (lock) => lock.seat_code === seat.seat_code
                            )
                            const isLockExpired = userLock
                              ? new Date(userLock.expires_at).getTime() <=
                                new Date().getTime()
                              : false
                            const validUserLock =
                              userLock && !isLockExpired ? userLock : undefined
                            const isLockedByUser =
                              userLocks.some(
                                (lock) =>
                                  lock.seat_code === seat.seat_code &&
                                  new Date(lock.expires_at).getTime() >
                                    new Date().getTime()
                              ) ||
                              (currentUserId &&
                                seat.locked_by === currentUserId)
                            const isCurrentlySelected = !!(
                              seat.seat_id &&
                              selectedSeats.includes(seat.seat_id) &&
                              seat.locked_by !== 'booking'
                            )
                            const canToggleSeat =
                              seat.locked_by !== 'booking' &&
                              seat.status !== 'occupied' &&
                              (seat.status === 'available' ||
                                isLockedByUser ||
                                isCurrentlySelected)

                            return (
                              <SeatItem
                                key={seat.seat_id}
                                seat={seat}
                                isSelected={isCurrentlySelected}
                                onClick={() => handleSeatClick(seat)}
                                disabled={
                                  readOnly ||
                                  operationInProgress ||
                                  !canToggleSeat
                                }
                                userLock={validUserLock}
                                onLockExpire={onLockExpire}
                                currentUserId={currentUserId}
                              />
                            )
                          }
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Legend */}
        <div className="mt-6">
          <SeatLegend />
        </div>

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
