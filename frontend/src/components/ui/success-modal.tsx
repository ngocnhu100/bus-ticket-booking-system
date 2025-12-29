import React from 'react'
import { CheckCircle, X } from 'lucide-react'

interface SuccessModalProps {
  open: boolean
  onClose: () => void
  title?: string
  message: string
  details?: string
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  open,
  onClose,
  title = 'Success',
  message,
  details,
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'var(--background)',
          opacity: 0.8,
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="relative mx-4 w-full max-w-md rounded-xl shadow-2xl"
        style={{ backgroundColor: 'var(--card)' }}
        role="dialog"
        aria-labelledby="success-dialog-title"
        aria-describedby="success-dialog-description"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
            <h2
              id="success-dialog-title"
              className="text-lg font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 transition"
            style={{
              color: 'var(--muted-foreground)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)'
              e.currentTarget.style.color = 'var(--foreground)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--muted-foreground)'
            }}
            aria-label="Close success dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-2">
          <p
            id="success-dialog-description"
            className="text-sm font-medium"
            style={{ color: 'var(--foreground)' }}
          >
            {message}
          </p>
          {details && (
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {details}
            </p>
          )}
        </div>

        {/* Actions */}
        <div
          className="flex items-center justify-end px-6 py-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium transition"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
