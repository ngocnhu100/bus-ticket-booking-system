import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Clock, AlertCircle, X } from 'lucide-react'
import { PhotoUpload } from './PhotoUpload'
import { Card } from '@/components/ui/card'

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
  initialPhotos = [],
  onSubmit,
  onCancel,
  isLoading = false,
}: EditReviewFormProps) {
  const [reviewText, setReviewText] = useState(initialText)
  const [existingPhotos, setExistingPhotos] = useState<string[]>(initialPhotos)
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleRemoveExistingPhoto = (photoUrl: string) => {
    setExistingPhotos((prev) => prev.filter((p) => p !== photoUrl))
    setRemovedPhotos((prev) => [...prev, photoUrl])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // if (!reviewText.trim()) {
    //   setError('Review text cannot be empty.')
    //   return
    // }

    try {
      console.log('EditReviewForm submit data:', {
        reviewId,
        reviewText: reviewText.trim(),
        removedPhotos,
        newPhotos,
      })
      await onSubmit({
        reviewId,
        reviewText: reviewText.trim(),
        removedPhotos,
        newPhotos,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update review')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex gap-3 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Edit Policy Notice */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
        <div className="flex gap-2">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium mb-1">Time-Sensitive Edit</p>
            <p>
              You can only edit your review within 24 hours of submission. Only
              review text and photos can be modified.
            </p>
          </div>
        </div>
      </div>

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

      {/* Existing Photos */}
      {existingPhotos.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">
            Current Photos
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {existingPhotos.map((photo, index) => (
              <div key={index} className="relative group">
                <Card className="aspect-square overflow-hidden">
                  <img
                    src={photo}
                    alt={`Current photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveExistingPhoto(photo)
                    }}
                    disabled={isLoading}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Photos Upload */}
      <PhotoUpload
        photos={newPhotos}
        onPhotosChange={setNewPhotos}
        maxPhotos={5 - existingPhotos.length}
        disabled={isLoading}
      />

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
        <Clock className="w-4 h-4 shrink-0 mt-0.5" />
        <p>You can edit this review for up to 24 hours from submission.</p>
      </div>
    </form>
  )
}
