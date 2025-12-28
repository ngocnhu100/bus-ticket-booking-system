import React, { useState } from 'react'

interface ReasonModalProps {
  open: boolean
  title: string
  action: 'suspend' | 'reject'
  onConfirm: (reason: string) => void
  onClose: () => void
}

export const ReasonModal: React.FC<ReasonModalProps> = ({
  open,
  title,
  action,
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState('')

  const actionText = action === 'suspend' ? 'suspension' : 'rejection'

  if (!open) return null

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim())
      setReason('')
    }
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg border border-border max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Please provide a reason for {actionText}:
        </p>
        <textarea
          placeholder={`Enter ${action} reason...`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
          rows={3}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim()}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
