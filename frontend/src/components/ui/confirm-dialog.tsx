import React from 'react'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
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
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2
            id="confirm-dialog-title"
            className="text-lg font-semibold"
            style={{ color: 'var(--foreground)' }}
          >
            {title}
          </h2>
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
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p
            id="confirm-dialog-description"
            className="text-sm"
            style={{ color: 'var(--foreground)' }}
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium transition"
            style={{
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card)'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg px-4 py-2 text-sm font-medium transition"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                'color-mix(in srgb, var(--primary) 90%, black)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary)'
            }}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
