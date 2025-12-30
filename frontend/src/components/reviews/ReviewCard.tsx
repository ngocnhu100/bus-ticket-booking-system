import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StarRating } from './StarRating'
import { format } from 'date-fns'
import { ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ReviewData {
  id: string
  authorName: string
  authorEmail?: string
  rating: number
  categoryRatings: Record<string, number>
  reviewText?: string
  photos?: string[]
  createdAt: Date | string
  updatedAt?: Date | string
  helpfulCount?: number
  userHelpful?: boolean
  isAuthor?: boolean
  canEdit?: boolean
  canDelete?: boolean
  seatType?: string
  route?: string
}

interface ReviewCardProps {
  review: ReviewData
  onHelpful?: (helpful: boolean) => Promise<void>
  onEdit?: () => void
  onDelete?: () => Promise<void>
  isLoading?: boolean
}

export function ReviewCard({
  review,
  onHelpful,
  onEdit,
  onDelete,
  isLoading = false,
}: ReviewCardProps) {
  const avgRating = review.rating?.toFixed(1) || '0'

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      return format(dateObj, 'MMM d, yyyy')
    } catch {
      return String(date)
    }
  }

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Color palette for avatars
  const getAvatarColors = (name: string) => {
    const colors = [
      {
        bg: 'bg-amber-100 dark:bg-amber-900',
        text: 'text-amber-700 dark:text-amber-200',
      },
      {
        bg: 'bg-blue-100 dark:bg-blue-900',
        text: 'text-blue-700 dark:text-blue-200',
      },
      {
        bg: 'bg-green-100 dark:bg-green-900',
        text: 'text-green-700 dark:text-green-200',
      },
      {
        bg: 'bg-purple-100 dark:bg-purple-900',
        text: 'text-purple-700 dark:text-purple-200',
      },
      {
        bg: 'bg-pink-100 dark:bg-pink-900',
        text: 'text-pink-700 dark:text-pink-200',
      },
      {
        bg: 'bg-indigo-100 dark:bg-indigo-900',
        text: 'text-indigo-700 dark:text-indigo-200',
      },
      {
        bg: 'bg-cyan-100 dark:bg-cyan-900',
        text: 'text-cyan-700 dark:text-cyan-200',
      },
      {
        bg: 'bg-rose-100 dark:bg-rose-900',
        text: 'text-rose-700 dark:text-rose-200',
      },
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const avatarColors = getAvatarColors(review.authorName)

  return (
    <Card className="bg-card border-border/50 p-4 sm:p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={cn(
              'shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base',
              avatarColors.bg,
              avatarColors.text
            )}
          >
            {getInitials(review.authorName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate text-sm sm:text-base">
              {review.authorName}
            </p>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <p className="text-xs text-muted-foreground">
                {formatDate(review.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {(review.canEdit || review.canDelete) && (
          <div className="flex gap-2 shrink-0">
            {review.canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                disabled={isLoading}
                title="Edit review text and photos (available for 24 hours after submission)"
              >
                Edit
              </Button>
            )}
            {review.canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isLoading}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-muted-foreground">
            Overall Experience
          </span>
          <StarRating
            value={Math.round(parseFloat(avgRating))}
            readonly
            size="sm"
          />
          <span className="text-sm font-semibold text-foreground">
            {avgRating}
          </span>
        </div>

        {/* Category Ratings */}
        {review.categoryRatings &&
          Object.keys(review.categoryRatings).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {Object.entries(review.categoryRatings).map(
                ([category, rating]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-2 bg-muted/40 dark:bg-muted/20 rounded text-muted-foreground"
                  >
                    <span className="capitalize text-xs font-medium">
                      {category.replace(/_/g, ' ')}
                    </span>
                    <span className="font-semibold text-foreground">
                      {rating}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
      </div>

      {/* Review Text */}
      {review.reviewText && (
        <p className="text-sm text-foreground leading-relaxed mb-4 whitespace-pre-wrap">
          {review.reviewText}
        </p>
      )}

      {/* Meta Information */}
      {(review.seatType || review.route) && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4 text-xs text-muted-foreground">
          {review.seatType && <span>Seat type: {review.seatType}</span>}
          {review.route && <span>Route: {review.route}</span>}
        </div>
      )}

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {review.photos.map((photo, index) => (
              <a
                key={index}
                href={photo}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
              >
                <img
                  src={photo}
                  alt={`Review photo ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer - Helpful */}
      <div className="flex items-center gap-3 pt-4 border-t border-border/50">
        <button
          onClick={() => onHelpful?.(true)}
          disabled={isLoading}
          className={cn(
            'inline-flex items-center gap-2 text-xs font-medium transition-colors',
            review.userHelpful
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <ThumbsUp
            className={cn('w-4 h-4', review.userHelpful && 'fill-current')}
          />
          <span>
            Helpful {review.helpfulCount ? `(${review.helpfulCount})` : ''}
          </span>
        </button>
      </div>
    </Card>
  )
}
