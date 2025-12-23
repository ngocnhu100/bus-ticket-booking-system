import { Card } from '@/components/ui/card'
import { RatingStats, type RatingStatsData } from './RatingStats'

interface TripRatingDisplayProps {
  tripId: string
  stats: RatingStatsData | null
  isLoading?: boolean
  className?: string
}

/**
 * Display rating summary for a trip in search results
 * Shows average rating, total reviews, and rating distribution
 */
export function TripRatingDisplay({
  stats,
  isLoading = false,
  className,
}: TripRatingDisplayProps) {
  if (isLoading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-20 bg-muted rounded" />
      </Card>
    )
  }

  if (!stats) {
    return (
      <div className="text-sm text-muted-foreground">
        No ratings yet. Be the first to rate!
      </div>
    )
  }

  return <RatingStats stats={stats} variant="inline" className={className} />
}
