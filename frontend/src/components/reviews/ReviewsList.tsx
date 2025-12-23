import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronDown, Star, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReviewData } from './ReviewCard'
import { ReviewCard } from './ReviewCard'
import type { OperatorRatingStats } from '@/api/trips'

interface ReviewsListProps {
  reviews: ReviewData[]
  isLoading?: boolean
  onLoadMore?: () => Promise<void>
  hasMore?: boolean
  sortBy?: 'recent' | 'helpful' | 'rating-high' | 'rating-low'
  onSortChange?: (sort: string) => void
  ratingFilter?: number | null
  onRatingFilterChange?: (rating: number | null) => void
  operatorStats?: OperatorRatingStats | null
}

export function ReviewsList({
  reviews,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  sortBy = 'recent',
  onSortChange,
  ratingFilter = null,
  onRatingFilterChange,
  operatorStats,
}: ReviewsListProps) {
  console.log('ReviewsList received:', { reviews, sortBy, ratingFilter })

  const [showFilters, setShowFilters] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'images'>('all')
  const [selectedSeatType, setSelectedSeatType] = useState<string | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)

  const stats = useMemo(() => {
    if (!operatorStats) return null

    // Convert category averages to the expected format
    const categoryAverages: Record<string, number> = {}
    if (operatorStats.averages) {
      Object.entries(operatorStats.averages).forEach(([category, value]) => {
        if (category !== 'overall') {
          categoryAverages[category] = value
        }
      })
    }

    return {
      averageRating: operatorStats.averages?.overall || 0,
      totalRatings: operatorStats.totalRatings || 0,
      totalReviews: operatorStats.reviewsCount || 0,
      categoryAverages,
    }
  }, [operatorStats])

  // Get unique seat types and routes
  const uniqueSeatTypes = useMemo(() => {
    const types = new Set(reviews.map((r) => r.seatType).filter(Boolean))
    return Array.from(types).sort()
  }, [reviews])

  const uniqueRoutes = useMemo(() => {
    const routes = new Set(reviews.map((r) => r.route).filter(Boolean))
    return Array.from(routes).sort()
  }, [reviews])

  const filteredReviews = useMemo(() => {
    let result = reviews

    // Filter by type
    if (filterType === 'images') {
      result = result.filter((r) => r.photos && r.photos.length > 0)
    }

    // Filter by rating
    if (ratingFilter) {
      result = result.filter((review) => {
        return Math.round(review.rating || 0) === ratingFilter
      })
    }

    // Filter by seat type
    if (selectedSeatType) {
      result = result.filter((r) => r.seatType === selectedSeatType)
    }

    // Filter by route
    if (selectedRoute) {
      result = result.filter((r) => r.route === selectedRoute)
    }

    return result
  }, [reviews, filterType, ratingFilter, selectedSeatType, selectedRoute])

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-2">No reviews yet</p>
        <p className="text-sm text-muted-foreground">
          Be the first to share your experience!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary Section */}
      {stats && (
        <div className="bg-card border border-border/50 rounded-lg p-6 space-y-6">
          {/* Overall Rating */}
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-foreground mb-1">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={cn(
                      'transition-colors',
                      i < Math.round(stats.averageRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/30'
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalRatings}{' '}
                {stats.totalRatings === 1 ? 'rating' : 'ratings'}
              </p>
            </div>

            {/* Category Ratings Grid */}
            {Object.keys(stats.categoryAverages).length > 0 && (
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(stats.categoryAverages)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([category, rating]) => (
                    <div
                      key={category}
                      className="p-3 bg-muted/30 dark:bg-muted/20 rounded-lg border border-border/50"
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-1 capitalize">
                        {category.replace(/_/g, ' & ')}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {rating.toFixed(1)}
                        </span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={cn(
                                i < Math.round(rating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground/20'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filterType === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          All ({reviews.length})
        </button>
        <button
          onClick={() => setFilterType('images')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
            filterType === 'images'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          <ImageIcon className="w-4 h-4" />
          Has image (
          {reviews.filter((r) => r.photos && r.photos.length > 0).length})
        </button>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-end justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              showFilters && 'rotate-180'
            )}
          />
          More Filters
        </button>

        {/* Sort Dropdown */}
        {onSortChange && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Sort by</p>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
                <SelectItem value="rating-high">Highest Rating</SelectItem>
                <SelectItem value="rating-low">Lowest Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Expandable Filters Section */}
      {showFilters && (
        <div className="bg-muted/30 dark:bg-muted/20 rounded-lg p-4 space-y-4 border border-border/50">
          {/* Rating Filter */}
          {onRatingFilterChange && (
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-sm font-medium text-foreground">
                Filter by Rating
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onRatingFilterChange(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    ratingFilter === null
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:bg-card/80'
                  )}
                >
                  All Ratings
                </button>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => onRatingFilterChange(rating)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      ratingFilter === rating
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-card/80'
                    )}
                  >
                    <span>
                      <div className="flex gap-1 items-center ">
                        {rating}
                        <Star size={14} fill="currentColor" />
                      </div>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Seat Type Filter */}
          {uniqueSeatTypes.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-3">
                Seat Type
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSeatType(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    selectedSeatType === null
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:bg-card/80'
                  )}
                >
                  All
                </button>
                {uniqueSeatTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedSeatType(type)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      selectedSeatType === type
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-card/80'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Route Filter */}
          {uniqueRoutes.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Route</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedRoute(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    selectedRoute === null
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:bg-card/80'
                  )}
                >
                  All
                </button>
                {uniqueRoutes.map((route) => (
                  <button
                    key={route}
                    onClick={() => setSelectedRoute(route)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      selectedRoute === route
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-card/80'
                    )}
                  >
                    {route}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Showing {filteredReviews.length} of {reviews.length} reviews
          </p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={async (helpful) => {
                console.log('Helpful vote:', helpful)
              }}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No reviews match your filters
            </p>
          </div>
        )}
      </div>

      {/* Load More */}
      {hasMore && filteredReviews.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load More Reviews'}
          </Button>
        </div>
      )}
    </div>
  )
}
