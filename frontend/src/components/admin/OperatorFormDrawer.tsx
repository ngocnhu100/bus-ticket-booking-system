import React, { useState } from 'react'
import type { OperatorAdminData } from '@/types/trip.types'

interface OperatorFormDrawerProps {
  open: boolean
  onClose: () => void
  operator: OperatorAdminData | null
  onSubmit: (operator_id: string, newStatus: string) => void
  isLoading?: boolean
}

export const OperatorFormDrawer: React.FC<OperatorFormDrawerProps> = ({
  open,
  onClose,
  operator,
  onSubmit,
  isLoading = false,
}) => {
  // Initialize with operator data when drawer opens
  const initialStatus = operator?.status || ''
  const [status, setStatus] = useState(initialStatus)

  // Update status when operator changes (only for controlled updates)
  if (operator && status !== operator.status && open) {
    setStatus(operator.status)
  }

  if (!open || !operator) return null

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
  }

  const handleSubmit = () => {
    onSubmit(operator.operator_id, status)
    setStatus('')
  }

  const getStatusDescription = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'Operator is approved and can conduct trips'
      case 'pending':
        return 'Awaiting approval review'
      case 'rejected':
        return 'Operator application rejected'
      case 'suspended':
        return 'Operator temporarily suspended'
      default:
        return ''
    }
  }

  const statusOptions = ['pending', 'approved', 'rejected', 'suspended']

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div
        className="flex-1"
        style={{
          backgroundColor: 'var(--background)',
          opacity: 0.8,
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="flex h-full w-full max-w-md flex-col shadow-2xl overflow-auto"
        style={{ backgroundColor: 'var(--card)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              Update Operator Status
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Change status for {operator.name}
            </p>
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
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 px-5 py-4">
          {/* Current Status */}
          <div>
            <p
              className="text-xs font-medium"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Current Status
            </p>
            <p
              className="text-sm font-semibold mt-1"
              style={{ color: 'var(--foreground)' }}
            >
              {operator.status}
            </p>
          </div>

          {/* Status Selection */}
          <div className="space-y-3">
            <label
              className="text-xs font-medium"
              style={{ color: 'var(--muted-foreground)' }}
            >
              New Status
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg px-3 py-2 text-sm transition-colors"
              style={{
                backgroundColor: 'var(--input)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
              }}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {getStatusDescription(status)}
            </p>
          </div>

          {/* Feedback/Notes - Removed as per requirements */}

          {/* Operator Info Summary */}
          <div
            className="p-3 rounded-lg space-y-2"
            style={{
              backgroundColor: 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            <p
              className="text-xs font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              Operator Summary
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted-foreground)' }}>
                  Total Routes:
                </span>
                <span style={{ color: 'var(--foreground)' }}>
                  {operator.total_routes}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted-foreground)' }}>
                  Total Buses:
                </span>
                <span style={{ color: 'var(--foreground)' }}>
                  {operator.total_buses}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted-foreground)' }}>
                  Rating:
                </span>
                <span style={{ color: 'var(--foreground)' }}>
                  {operator.rating.toFixed(1)}⭐
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex gap-3 px-5 py-3 sticky bottom-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition"
            style={{
              backgroundColor: 'var(--muted)',
              color: 'var(--foreground)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading)
                e.currentTarget.style.backgroundColor =
                  'color-mix(in srgb, var(--muted) 80%, black)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || status === operator.status}
            className="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading && status !== operator.status)
                e.currentTarget.style.backgroundColor =
                  'color-mix(in srgb, var(--primary) 90%, black)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary)'
            }}
          >
            {isLoading ? 'Saving...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  )
}
