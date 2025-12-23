/**
 * Type definitions for review and rating components
 */

export interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  interactive?: boolean
}

export interface RatingCategory {
  id: string
  label: string
  value?: number
}

export interface RatingSubmission {
  bookingId: string
  tripId: string
  ratings: Record<string, number>
  review?: string
  submittedAt: Date
}

export interface RatingFormState {
  ratings?: Record<string, number>
  review?: string
}

export interface SubmitRatingFormProps {
  bookingId: string
  tripReference: string
  onSubmit: (ratingData: RatingSubmission) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export interface ReviewData {
  id: string
  authorName: string
  authorEmail?: string
  rating: number
  categoryRatings: Record<string, number>
  reviewText?: string
  photos?: string[]
  createdAt: Date
  updatedAt?: Date
  isVerifiedBooking: boolean
  helpfulCount?: number
  userHelpful?: boolean
  isAuthor?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export interface ReviewCardProps {
  review: ReviewData
  onHelpful?: (helpful: boolean) => Promise<void>
  onEdit?: () => void
  onDelete?: () => Promise<void>
  isLoading?: boolean
}

export interface ReviewsListProps {
  reviews: ReviewData[]
  isLoading?: boolean
  onLoadMore?: () => Promise<void>
  hasMore?: boolean
  sortBy?: 'recent' | 'helpful' | 'rating-high' | 'rating-low'
  onSortChange?: (sort: string) => void
  ratingFilter?: number | null
  onRatingFilterChange?: (rating: number | null) => void
}

export interface RatingDistribution {
  stars: number
  count: number
  percentage: number
}

export interface RatingStatsData {
  averageRating: number
  totalReviews: number
  distribution: RatingDistribution[]
  categoryAverages?: Record<string, number>
}

export interface RatingStatsProps {
  stats: RatingStatsData
  className?: string
  variant?: 'card' | 'inline'
}

export interface PastBooking {
  bookingId: string
  bookingReference: string
  tripReference: string
  tripDetails: {
    origin: string
    destination: string
    departureTime: Date
    arrivalTime: Date
  }
  status: 'completed' | 'cancelled' | 'pending'
  createdAt: Date
  hasRating?: boolean
  ratingSubmittedAt?: Date
}

export interface RatingPromptProps {
  booking: PastBooking
  onSubmit: (bookingId: string, ratingData: RatingSubmission) => Promise<void>
  isLoading?: boolean
}

export interface EditReviewData {
  reviewId: string
  reviewText: string
  removedPhotos?: string[]
  newPhotos?: File[]
}

export interface EditReviewFormProps {
  reviewId: string
  initialText: string
  initialPhotos?: string[]
  onSubmit: (data: EditReviewData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export interface TripRatingDisplayProps {
  tripId: string
  stats: RatingStatsData | null
  isLoading?: boolean
  className?: string
}

/**
 * API Response Types
 */

export interface RatingSubmissionResponse {
  success: boolean
  ratingId: string
  message: string
}

export interface ReviewsResponse {
  reviews: ReviewData[]
  total: number
  page: number
  hasMore: boolean
}

export interface RatingStatsResponse {
  averageRating: number
  totalReviews: number
  distribution: RatingDistribution[]
  categoryAverages: Record<string, number>
}

/**
 * Sort and Filter Types
 */

export type SortOption = 'recent' | 'helpful' | 'rating-high' | 'rating-low'
export type RatingSize = 'sm' | 'md' | 'lg'
export type BookingStatus = 'completed' | 'cancelled' | 'pending'

/**
 * Error Types
 */

export interface RatingError {
  code: string
  message: string
  field?: string
}

export interface RatingAPIError {
  status: number
  error: RatingError
}
