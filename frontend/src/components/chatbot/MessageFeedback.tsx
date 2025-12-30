import React, { useState } from 'react'
import { ThumbsUp, ThumbsDown, MessageSquare, X } from 'lucide-react'
import { chatbotApi } from '../../api/chatbot'
import { getAccessToken } from '../../api/auth'

interface MessageFeedbackProps {
  messageId: string
  sessionId: string
  onFeedbackSubmitted?: () => void
}

export const MessageFeedback: React.FC<MessageFeedbackProps> = ({
  messageId,
  sessionId,
  onFeedbackSubmitted,
}) => {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null)
  const [showCommentBox, setShowCommentBox] = useState(false)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRatingClick = async (selectedRating: 'positive' | 'negative') => {
    setRating(selectedRating)
    setError(null)

    // Submit rating without comment immediately
    await submitFeedback(selectedRating, '')
  }

  const submitFeedback = async (
    feedbackRating: 'positive' | 'negative',
    feedbackComment: string
  ) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const token = getAccessToken()
      const response = await chatbotApi.submitFeedback(
        {
          sessionId,
          messageId,
          rating: feedbackRating,
          comment: feedbackComment || undefined,
        },
        token || undefined
      )

      if (response.success) {
        setIsSubmitted(true)
        setShowCommentBox(false)
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted()
        }
      } else {
        setError('Failed to submit feedback. Please try again.')
      }
    } catch (err) {
      console.error('[MessageFeedback] Error submitting feedback:', err)
      setError('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCommentSubmit = async () => {
    if (!rating) return

    try {
      setIsSubmitting(true)
      setError(null)

      const token = getAccessToken()
      const response = await chatbotApi.submitFeedback(
        {
          sessionId,
          messageId,
          rating: rating,
          comment: comment || undefined,
        },
        token || undefined
      )

      if (response.success) {
        setShowCommentBox(false)
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted()
        }
      } else {
        setError('Failed to submit comment. Please try again.')
      }
    } catch (err) {
      console.error('[MessageFeedback] Error submitting comment:', err)
      setError('Failed to submit comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelComment = () => {
    setShowCommentBox(false)
    setComment('')
  }

  if (isSubmitted && !showCommentBox) {
    return (
      <div className="mt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Thanks for your feedback!
          </span>
          <button
            onClick={() => setShowCommentBox(true)}
            className="p-1.5 rounded-md transition-colors hover:bg-blue-100 text-blue-600 hover:text-blue-700"
            title="Add comment (optional)"
          >
            <MessageSquare size={14} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2">
      {/* Rating buttons */}
      {!showCommentBox && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Was this helpful?</span>
          <button
            onClick={() => handleRatingClick('positive')}
            disabled={isSubmitting}
            className={`p-1.5 rounded-md transition-colors ${
              rating === 'positive'
                ? 'bg-green-100 text-green-600'
                : 'hover:bg-gray-100 text-gray-500'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Thumbs up"
          >
            <ThumbsUp size={14} />
          </button>
          <button
            onClick={() => handleRatingClick('negative')}
            disabled={isSubmitting}
            className={`p-1.5 rounded-md transition-colors ${
              rating === 'negative'
                ? 'bg-red-100 text-red-600'
                : 'hover:bg-gray-100 text-gray-500'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Thumbs down"
          >
            <ThumbsDown size={14} />
          </button>
          <button
            onClick={() => {
              if (rating && !isSubmitted) {
                setShowCommentBox(true)
              }
            }}
            disabled={isSubmitting || !rating || isSubmitted}
            className={`p-1.5 rounded-md transition-colors ${
              rating && !isSubmitted
                ? 'hover:bg-blue-100 text-blue-600 hover:text-blue-700'
                : !rating
                  ? 'text-blue-400 cursor-not-allowed'
                  : 'text-gray-300 cursor-not-allowed'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={
              isSubmitted
                ? 'Feedback already submitted'
                : rating
                  ? 'Add comment (optional)'
                  : 'Select like/dislike first to add comment'
            }
          >
            <MessageSquare size={14} />
          </button>
        </div>
      )}

      {/* Comment box */}
      {showCommentBox && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">
              Tell us more (optional)
            </span>
            <button
              onClick={handleCancelComment}
              className="p-1 hover:bg-gray-200 rounded-md transition-colors"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              // Submit on Ctrl+Enter or Cmd+Enter
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                handleCommentSubmit()
              }
            }}
            placeholder="How can we improve? What went wrong? (Ctrl+Enter to submit)"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={3}
            maxLength={500}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {comment.length}/500 characters
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCancelComment}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCommentSubmit}
                disabled={isSubmitting || !rating}
                className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Comment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </div>
  )
}
