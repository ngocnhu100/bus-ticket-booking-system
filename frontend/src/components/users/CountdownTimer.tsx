import { useState, useEffect } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

interface CountdownTimerProps {
  /** Expiration timestamp (ISO string) */
  expiresAt: string
  /** Callback when timer expires */
  onExpire?: () => void
  /** Whether to show warning when time is low */
  showWarning?: boolean
  /** Warning threshold in seconds */
  warningThreshold?: number
  /** Custom class name */
  className?: string
}

/**
 * CountdownTimer Component
 *
 * Displays a countdown timer for seat locks with visual indicators.
 * Shows warning when time is running low.
 */
export function CountdownTimer({
  expiresAt,
  onExpire,
  showWarning = true,
  warningThreshold = 120, // 2 minutes
  className = '',
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const difference = expiry - now

      if (difference <= 0) {
        setIsExpired(true)
        setTimeLeft(0)
        onExpire?.()
        return
      }

      setTimeLeft(Math.floor(difference / 1000))
    }

    // Calculate initial time
    calculateTimeLeft()

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [expiresAt, onExpire])

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const isWarning = showWarning && timeLeft <= warningThreshold && timeLeft > 0

  if (isExpired) {
    return (
      <div
        className={`flex items-center gap-1 text-destructive text-xs font-medium ${className}`}
      >
        <AlertTriangle className="w-3 h-3" />
        <span>Expired</span>
      </div>
    )
  }

  return (
    <div
      className={`
        flex items-center gap-1 text-xs font-medium
        ${isWarning ? 'text-destructive' : 'text-foreground'}
        ${className}
      `}
    >
      <Clock className="w-3 h-3" />
      <span>{formatTime(timeLeft)}</span>
      {isWarning && <AlertTriangle className="w-3 h-3" />}
    </div>
  )
}
