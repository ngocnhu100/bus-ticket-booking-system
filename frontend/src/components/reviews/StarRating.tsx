import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  interactive?: boolean
}

const sizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

const labelSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
  showValue = false,
  interactive = true,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const displayValue = hoverValue ?? value
  const isInteractive = interactive && !readonly

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => isInteractive && onChange?.(star)}
            onMouseEnter={() => isInteractive && setHoverValue(star)}
            onMouseLeave={() => isInteractive && setHoverValue(null)}
            className={cn(
              'transition-all duration-200',
              isInteractive && 'cursor-pointer hover:scale-110',
              readonly && 'cursor-default'
            )}
            aria-label={`Rate ${star} stars`}
          >
            <Star
              className={cn(
                sizeStyles[size],
                displayValue >= star
                  ? 'fill-warning text-warning'
                  : 'text-muted-foreground/30'
              )}
            />
          </button>
        ))}
      </div>

      {showValue && (
        <span
          className={cn(labelSizes[size], 'text-muted-foreground font-medium')}
        >
          {displayValue > 0 ? `${displayValue}.0` : 'Not rated'}
        </span>
      )}
    </div>
  )
}
