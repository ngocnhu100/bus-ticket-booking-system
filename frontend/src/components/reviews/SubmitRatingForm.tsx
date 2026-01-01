import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { StarRating } from './StarRating'
import { PhotoUpload } from './PhotoUpload'
import type { RatingSubmission, RatingFormState } from './reviews.types'

interface SubmitRatingFormProps {
  bookingId: string
  bookingReference: string
  tripReference: string
  onSubmit: (ratingData: RatingSubmission) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  initialValues?: RatingFormState
  onStateChange?: (state: RatingFormState) => void
}

const RATING_CATEGORIES = [
  { id: 'overall', label: 'Overall Experience' },
  { id: 'cleanliness', label: 'Bus Cleanliness' },
  { id: 'driver_behavior', label: 'Driver Behavior' },
  { id: 'punctuality', label: 'Punctuality' },
  { id: 'comfort', label: 'Comfort' },
  { id: 'value_for_money', label: 'Value for Money' },
]

const MAX_REVIEW_CHARS = 500

export function SubmitRatingForm({
  bookingId,
  bookingReference,
  tripReference,
  onSubmit,
  onCancel,
  isLoading = false,
  initialValues,
  onStateChange,
}: SubmitRatingFormProps) {
  const [ratings, setRatings] = useState<Record<string, number>>(
    initialValues?.ratings ||
      RATING_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: 0 }), {})
  )
  const [reviewText, setReviewText] = useState(initialValues?.review || '')
  const [photos, setPhotos] = useState<File[]>(initialValues?.photos || [])
  const [displayNamePublicly, setDisplayNamePublicly] = useState(
    initialValues?.displayNamePublicly ?? false
  )
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [preview, setPreview] = useState(false)

  // Save state changes
  useEffect(() => {
    try {
      if (onStateChange) {
        onStateChange({
          ratings,
          review: reviewText,
          photos,
          displayNamePublicly,
        })
      }
    } catch {
      console.error('Error in onStateChange callback')
    }
  }, [ratings, reviewText, photos, displayNamePublicly, onStateChange])

  const handleRatingChange = (categoryId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [categoryId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate all categories are rated (matches backend requirement)
    const allRated = Object.values(ratings).every((r) => r > 0)
    if (!allRated) {
      setError('Please rate all categories before submitting.')
      return
    }

    // Validate: if photos exist, review text is required
    if (photos.length > 0 && reviewText.trim() === '') {
      setError('Please write a review when uploading photos.')
      return
    }

    setPreview(true)
  }

  if (submitted) {
    return (
      <Card className="bg-linear-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 border-slate-200 dark:border-slate-800 p-8 shadow-lg">
        <div className="text-center space-y-6">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2">
              <PartyPopper className="w-8 h-8" />
              Review Submitted Successfully!
            </h3>
            <p className="text-slate-700 dark:text-slate-300 text-lg">
              Thank you for your valuable feedback!
            </p>
          </div>

          {/* Additional Info */}
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your feedback helps improve our service and assists other
              travelers in making informed decisions.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Booking Reference:{' '}
              <span className="font-mono font-semibold">
                {bookingReference}
              </span>
            </p>
          </div>

          {/* Action Button */}
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/20"
          >
            Close
          </Button>
        </div>
      </Card>
    )
  }

  if (preview) {
    const ratingData: RatingSubmission = {
      bookingId,
      tripId: tripReference,
      ratings,
      review: reviewText.trim() || undefined,
      photos: photos.length > 0 ? photos : undefined,
      submittedAt: new Date(),
      displayNamePublicly,
    }

    return (
      <Card className="bg-linear-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 border-slate-200 dark:border-slate-800 p-8 shadow-lg">
        <div className="text-center space-y-6">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            Preview Your Rating
          </h3>
          <p className="text-slate-700 dark:text-slate-300">
            Please review your feedback before submitting.
          </p>

          {/* Rating Categories Preview */}
          <div className="space-y-4 text-left">
            <h4 className="font-semibold text-foreground">Your Ratings</h4>
            <div className="bg-card/50 rounded-lg p-4 space-y-4">
              {RATING_CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between pb-3 last:pb-0 border-b border-border/50 last:border-0"
                >
                  <span className="text-sm font-medium text-foreground">
                    {category.label}
                  </span>
                  <StarRating
                    value={ratings[category.id]}
                    onChange={() => {}}
                    size="md"
                    interactive={false}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Review Preview */}
          {reviewText.trim() && (
            <div className="space-y-2 text-left">
              <h4 className="font-semibold text-foreground">Your Review</h4>
              <div className="bg-card/50 rounded-lg p-4">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {reviewText.trim()}
                </p>
              </div>
            </div>
          )}

          {/* Photos Preview */}
          {photos.length > 0 && (
            <div className="space-y-2 text-left">
              <h4 className="font-semibold text-foreground">
                Photos ({photos.length})
              </h4>
              <div className="bg-card/50 rounded-lg p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden border border-border/50"
                    >
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setPreview(false)}
              variant="outline"
              className="flex-1"
            >
              Edit
            </Button>
            <Button
              onClick={async () => {
                try {
                  await onSubmit(ratingData)
                  setSubmitted(true)
                } catch {
                  setError('Failed to submit rating. Please try again.')
                }
              }}
              className="flex-1"
            >
              Submit Rating
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating Categories */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Rate Your Experience</h3>

        {/* Edit Policy Notice */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Review Editing Policy</p>
              <p>
                You can edit your review text and photos within 24 hours after
                submission. Ratings cannot be changed once submitted.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card/50 rounded-lg p-4 space-y-4">
          {RATING_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between pb-3 last:pb-0 border-b border-border/50 last:border-0"
            >
              <label className="text-sm font-medium text-foreground">
                {category.label}
              </label>
              <StarRating
                value={ratings[category.id]}
                onChange={(value) => handleRatingChange(category.id, value)}
                size="md"
                interactive
              />
            </div>
          ))}
        </div>
      </div>

      {/* Review Text */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="review" className="font-semibold text-foreground">
            Write a Review (Optional)
          </label>
          <span className="text-xs text-muted-foreground">
            {reviewText.length}/{MAX_REVIEW_CHARS}
          </span>
        </div>
        <textarea
          id="review"
          value={reviewText}
          onChange={(e) =>
            setReviewText(e.target.value.slice(0, MAX_REVIEW_CHARS))
          }
          placeholder="Share your experience with this trip. What did you like? What could be improved?"
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Please follow our{' '}
          <a
            href="/review-guidelines"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            review guidelines
          </a>{' '}
          and avoid inappropriate content. Reviews are shared publicly to help
          other travelers.
        </p>
      </div>

      {/* Privacy Option */}
      <div className="space-y-4">
        <div className="bg-card/50 rounded-lg p-4 border border-border/50">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <Checkbox
                id="display-name-publicly"
                checked={displayNamePublicly}
                onCheckedChange={(checked) =>
                  setDisplayNamePublicly(checked as boolean)
                }
              />
            </div>
            <div className="flex-1 min-w-0">
              <label
                htmlFor="display-name-publicly"
                className="text-sm font-medium text-foreground cursor-pointer select-none"
              >
                Display my name publicly
              </label>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Check to show your name publicly. This cannot be changed later.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Upload */}
      <PhotoUpload
        photos={photos}
        onPhotosChange={setPhotos}
        maxPhotos={5}
        disabled={isLoading}
      />

      {/* Actions */}
      <div className="space-y-3">
        {error && (
          <div className="flex gap-3 p-4 mb-6 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
            variant="default"
          >
            {isLoading ? 'Submitting...' : 'Submit Rating'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="ghost"
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

// Error Boundary wrapper for SubmitRatingForm
class SubmitRatingFormErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { hasError: boolean; error?: Error }
> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      'SubmitRatingForm Error Boundary caught an error:',
      error,
      errorInfo
    )
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 border-destructive/50 bg-destructive/5">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-destructive">
                Something went wrong
              </h3>
              <p className="text-sm text-muted-foreground">
                We encountered an error while loading the rating form. Please
                try refreshing the page.
              </p>
            </div>
            <Button
              onClick={() =>
                this.setState({ hasError: false, error: undefined })
              }
              variant="outline"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}

// Export wrapped component
export function SubmitRatingFormWithErrorBoundary(
  props: SubmitRatingFormProps
) {
  return (
    <SubmitRatingFormErrorBoundary>
      <SubmitRatingForm {...props} />
    </SubmitRatingFormErrorBoundary>
  )
}
