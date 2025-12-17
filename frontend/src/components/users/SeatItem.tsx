import { useCallback } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import type { Seat } from '@/types/trip.types'
import { CountdownTimer } from './CountdownTimer'
import './SeatItem.css'

interface SeatItemProps {
  /** Seat data */
  seat: Seat
  /** Whether this seat is selected */
  isSelected: boolean
  /** Callback when seat is clicked */
  onClick: () => void
  /** Whether the seat is disabled (can't be clicked) */
  disabled: boolean
  /** User's lock for this seat */
  userLock?: { seat_code: string; expires_at: string }
  /** Callback when lock expires */
  onLockExpire?: (seatCode: string) => void
  /** Current user ID (for fallback lock ownership check) */
  currentUserId?: string
}

/**
 * SeatItem Component
 *
 * Individual seat component with visual indicators and interactive states.
 * Displays seat status and type with appropriate styling.
 *
 * Seat statuses:
 * - available: Can be selected
 * - occupied: Already booked, not clickable
 * - locked: Temporarily unavailable
 * - selected: User has chosen this seat
 *
 * Seat types affect styling:
 * - standard: Regular seat
 * - vip: Premium seat with special styling
 */
export function SeatItem({
  seat,
  isSelected,
  onClick,
  disabled,
  userLock,
  onLockExpire,
  currentUserId,
}: SeatItemProps) {
  // Memoize the expire callback to prevent CountdownTimer from restarting on every render
  const handleExpire = useCallback(() => {
    onLockExpire?.(seat.seat_code)
  }, [onLockExpire, seat.seat_code])

  // Check if the lock has expired
  // Note: SeatMap already filters out expired locks, so this is a safety check
  const isLockExpired = userLock
    ? new Date(userLock.expires_at).getTime() <= new Date().getTime()
    : false

  // Check if the seat has an expired lock based on locked_until (for backend data)
  const hasExpiredLock =
    seat.locked_until && new Date(seat.locked_until) <= new Date()

  // Determine seat status class
  const getSeatStatusClass = () => {
    // Check if the seat has an expired lock based on locked_until
    const hasExpiredLock =
      seat.locked_until && new Date(seat.locked_until) <= new Date()

    // If lock has expired, treat as available regardless of backend status
    if (hasExpiredLock) {
      return 'seat-available'
    }

    // Priority 1: If locked by "booking", always show as locked (pending booking state)
    if (seat.locked_by === 'booking' && !hasExpiredLock) {
      return 'seat-locked'
    }
    // Priority 2: Backend status takes precedence
    if (seat.status === 'occupied') return 'seat-occupied'
    if (seat.status === 'locked') {
      // If locked, check if it's locked by current user
      if (currentUserId && seat.locked_by === currentUserId && !isLockExpired) {
        return 'seat-selected' // Show as selected if locked by current user
      }
      if (userLock && !isLockExpired) {
        return 'seat-selected' // Show as selected if user has a valid lock
      }
      return 'seat-locked' // Show as locked if locked by someone else
    }
    if (seat.status === 'available') {
      return isSelected ? 'seat-selected' : 'seat-available'
    }

    // Fallback
    return 'seat-unavailable'
  }

  // Determine if seat is clickable
  const isClickable = !disabled

  // Get seat icon based on status
  const getSeatIcon = () => {
    // If lock has expired, don't show any icon (treat as available)
    if (hasExpiredLock) {
      return null
    }

    // Show checkmark for selected seats
    if (
      isSelected &&
      seat.status !== 'occupied' &&
      seat.locked_by !== 'booking'
    ) {
      return <Check className="w-4 h-4" />
    }
    // Show checkmark for seats locked by current user (only if lock is valid and backend agrees)
    if (
      currentUserId &&
      seat.locked_by === currentUserId &&
      !isLockExpired &&
      seat.status === 'locked'
    ) {
      return <Check className="w-4 h-4" />
    }
    // Show alert icon for locked/occupied seats or seats locked by booking
    if (
      seat.status === 'locked' ||
      seat.status === 'occupied' ||
      seat.locked_by === 'booking'
    ) {
      return <AlertCircle className="w-4 h-4" />
    }
    // Don't show icon for available seats
    return null
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={`
        seat-item
        ${getSeatStatusClass()}
        ${isClickable ? 'seat-item-interactive' : 'seat-item-disabled-btn'}
        ${seat.seat_type === 'vip' ? 'seat-vip' : ''}
      `}
      title={`${seat.seat_code} - ${seat.seat_type} - ${seat.status}`}
      aria-label={`Seat ${seat.seat_code}, ${seat.seat_type}, ${seat.status}`}
      aria-pressed={isSelected}
    >
      {/* Seat Content */}
      <div className="seat-content">
        {/* Seat Icon / Visual */}
        <div className="seat-visual">
          {getSeatIcon()}
          {seat.seat_type === 'vip' && !isSelected && !getSeatIcon() && (
            <span className="text-xs font-bold">VIP</span>
          )}
        </div>

        {/* Seat Code */}
        <span className="seat-code">{seat.seat_code}</span>

        {/* Countdown Timer for seats with valid user locks or current-user locks. */}
        {seat.status !== 'occupied' &&
          seat.locked_by !== 'booking' &&
          ((userLock && !isLockExpired) ||
            (currentUserId &&
              seat.locked_by === currentUserId &&
              !isLockExpired)) &&
          (userLock?.expires_at || seat.locked_until) &&
          !hasExpiredLock && (
            <div className="seat-countdown">
              <CountdownTimer
                expiresAt={userLock?.expires_at || seat.locked_until || ''}
                onExpire={handleExpire}
                showWarning={true}
                warningThreshold={120}
              />
            </div>
          )}
      </div>

      {/* Status Indicator Dot */}
      <div className="seat-indicator" />
    </button>
  )
}
