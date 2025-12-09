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
  const isLockExpired = userLock
    ? new Date(userLock.expires_at).getTime() <= new Date().getTime()
    : false

  // Determine seat status class
  const getSeatStatusClass = () => {
    // Selected takes precedence over all other statuses
    if (isSelected) return 'seat-selected'
    // User has a lock on this seat (but not selected) - treat as selected
    // But not if the lock has already expired
    if (userLock && !isLockExpired) return 'seat-selected'
    // Fallback: check if seat is locked by current user
    if (currentUserId && seat.locked_by === currentUserId && !isLockExpired)
      return 'seat-selected'
    if (seat.status === 'available') return 'seat-available'
    if (seat.status === 'occupied') return 'seat-occupied'
    if (seat.status === 'locked') return 'seat-locked'
    return 'seat-unavailable'
  }

  // Determine if seat is clickable
  const isClickable = !disabled

  // Get seat icon based on status
  const getSeatIcon = () => {
    // Show checkmark for selected seats (regardless of underlying status)
    if (isSelected) {
      return <Check className="w-4 h-4" />
    }
    // Show alert icon for locked seats (not selected by current user)
    if (seat.status === 'locked' || seat.status === 'occupied') {
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

        {/* Countdown Timer for selected seats with locks */}
        {(userLock || (currentUserId && seat.locked_by === currentUserId)) &&
          isSelected && (
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
