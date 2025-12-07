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
  /** Current user ID */
  currentUserId?: string
  /** User's lock for this seat */
  userLock?: { seat_code: string; expires_at: string }
  /** Callback when lock expires */
  onLockExpire?: (seatCode: string) => void
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentUserId,
  userLock,
  onLockExpire,
}: SeatItemProps) {
  // Determine seat status class
  const getSeatStatusClass = () => {
    if (isSelected) return 'seat-selected'
    if (seat.status === 'available') return 'seat-available'
    if (seat.status === 'occupied') return 'seat-occupied'
    if (seat.status === 'locked') return 'seat-locked'
    return 'seat-unavailable'
  }

  // Determine if seat is clickable
  const isClickable = !disabled

  // Get seat icon based on status
  const getSeatIcon = () => {
    if (isSelected) {
      return <Check className="w-4 h-4" />
    }
    if (seat.status !== 'available') {
      return <AlertCircle className="w-4 h-4" />
    }
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
        ${isSelected ? 'seat-item-selected' : ''}
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
        {userLock && isSelected && (
          <div className="seat-countdown">
            <CountdownTimer
              expiresAt={userLock.expires_at}
              onExpire={() => onLockExpire?.(seat.seat_code)}
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
