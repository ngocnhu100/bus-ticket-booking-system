import { StarRating } from './StarRating'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface RatingStatsData {
  averageRating: number
  totalReviews: number
  distribution: {
    stars: number
    count: number
    percentage: number
  }[]
  categoryAverages?: Record<string, number>
}

interface RatingStatsProps {
  stats: RatingStatsData
  className?: string
  variant?: 'card' | 'inline'
}

export function RatingStats({
  stats,
  className,
  variant = 'card',
}: RatingStatsProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <StarRating
          value={Math.round(stats.averageRating)}
          readonly
          size="sm"
        />
        <span className="text-sm font-semibold text-foreground">
          {stats.averageRating.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground">
          ({stats.totalReviews})
        </span>
      </div>
    )
  }

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="font-bold text-lg text-foreground mb-4">
        Ratings & Reviews
      </h3>

      {/* Overall Rating */}
      <div className="mb-6 pb-6 border-b border-border/50">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-foreground">
            {stats.averageRating.toFixed(1)}
          </span>
          <div>
            <StarRating
              value={Math.round(stats.averageRating)}
              readonly
              size="md"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-3 mb-6">
        {[...stats.distribution].reverse().map((item) => (
          <div key={item.stars} className="flex items-center gap-3">
            <div className="w-12 text-sm font-medium text-muted-foreground">
              {item.stars}★
            </div>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-warning to-accent transition-all duration-300"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <span className="w-12 text-right text-xs text-muted-foreground">
              {item.count}
            </span>
          </div>
        ))}
      </div>

      {/* Category Averages */}
      {stats.categoryAverages &&
        Object.keys(stats.categoryAverages).length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm font-semibold text-foreground mb-3">
              Category Ratings
            </p>
            <div className="space-y-2">
              {Object.entries(stats.categoryAverages).map(
                ([category, average]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-muted-foreground capitalize">
                      {category.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${(average / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-8 text-right text-xs font-semibold text-foreground">
                        {average.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
    </Card>
  )
}
