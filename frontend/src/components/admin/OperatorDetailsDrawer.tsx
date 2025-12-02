import React from 'react'
import type { OperatorAdminData } from '@/types/trip.types'

interface OperatorDetailsDrawerProps {
  open: boolean
  onClose: () => void
  operator: OperatorAdminData | null
}

export const OperatorDetailsDrawer: React.FC<OperatorDetailsDrawerProps> = ({
  open,
  onClose,
  operator,
}) => {
  if (!open || !operator) return null

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'suspended':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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
              Operator Details
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              View operator information and metrics.
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

        <div className="flex-1 space-y-6 px-5 py-4">
          {/* Header Info */}
          <div className="space-y-3">
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Name
              </p>
              <p
                className="text-sm font-semibold mt-1"
                style={{ color: 'var(--foreground)' }}
              >
                {operator.name}
              </p>
            </div>

            <div>
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Status
              </p>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStatusColor(operator.status)}`}
              >
                {operator.status}
              </span>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h3
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Contact
            </h3>

            <div>
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Email
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: 'var(--foreground)' }}
              >
                {operator.contactEmail}
              </p>
            </div>

            <div>
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Phone
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: 'var(--foreground)' }}
              >
                {operator.contactPhone}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <h3
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Dates
            </h3>

            <div>
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Created
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: 'var(--foreground)' }}
              >
                {new Date(operator.createdAt).toLocaleDateString()}
              </p>
            </div>

            {operator.approvedAt && (
              <div>
                <p
                  className="text-xs font-medium"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Approved
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: 'var(--foreground)' }}
                >
                  {new Date(operator.approvedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          <div className="space-y-3">
            <h3
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Performance
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <div
                className="p-2 rounded-lg text-center"
                style={{
                  backgroundColor: 'var(--muted)',
                  border: '1px solid var(--border)',
                }}
              >
                <p
                  className="text-2xl font-bold"
                  style={{ color: 'var(--primary)' }}
                >
                  {operator.totalRoutes}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Routes
                </p>
              </div>

              <div
                className="p-2 rounded-lg text-center"
                style={{
                  backgroundColor: 'var(--muted)',
                  border: '1px solid var(--border)',
                }}
              >
                <p
                  className="text-2xl font-bold"
                  style={{ color: 'var(--primary)' }}
                >
                  {operator.rating.toFixed(1)}⭐
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Rating
                </p>
              </div>

              <div
                className="p-2 rounded-lg text-center"
                style={{
                  backgroundColor: 'var(--muted)',
                  border: '1px solid var(--border)',
                }}
              >
                <p
                  className="text-2xl font-bold"
                  style={{ color: 'var(--primary)' }}
                >
                  {operator.totalBuses}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Buses
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-end px-5 py-3 sticky bottom-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            type="button"
            onClick={onClose}
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
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
