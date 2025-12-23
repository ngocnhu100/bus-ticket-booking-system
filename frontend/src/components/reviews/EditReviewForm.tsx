import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Clock, AlertCircle } from 'lucide-react'

interface EditReviewFormProps {
  reviewId: string
  initialText: string
  initialPhotos?: string[]
  onSubmit: (data: EditReviewData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export interface EditReviewData {
  reviewId: string
  reviewText: string
  removedPhotos?: string[]
  newPhotos?: File[]
}

const MAX_REVIEW_CHARS = 500

export function EditReviewForm({
  reviewId,
  initialText,
  onSubmit,
  onCancel,
  isLoading = false,
}: EditReviewFormProps) {
  const [reviewText, setReviewText] = useState(initialText)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!reviewText.trim()) {
      setError('Review text cannot be empty.')
      return
    }

    try {
      await onSubmit({
        reviewId,
        reviewText: reviewText.trim(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update review')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex gap-3 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="review-edit"
            className="text-sm font-semibold text-foreground"
          >
            Edit Review
          </label>
          <span className="text-xs text-muted-foreground">
            {reviewText.length}/{MAX_REVIEW_CHARS}
          </span>
        </div>
        <textarea
          id="review-edit"
          value={reviewText}
          onChange={(e) =>
            setReviewText(e.target.value.slice(0, MAX_REVIEW_CHARS))
          }
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          rows={4}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          variant="default"
          className="flex-1"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          variant="ghost"
          className="flex-1"
        >
          Cancel
        </Button>
      </div>

      <div className="flex gap-2 p-3 bg-info/5 text-info rounded-lg border border-info/20 text-xs">
        <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>You can edit this review for up to 24 hours from submission.</p>
      </div>
    </form>
  )
}
