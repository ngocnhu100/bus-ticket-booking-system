import React from 'react'
import { ArrowRight, Trash2, X, Eye } from 'lucide-react'
import type { TripData } from '@/types/adminTripTypes'

interface TripTableViewProps {
  trips: TripData[]
  selectedTripIds: string[]
  onSelectTrip: (tripId: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onEditTrip?: (trip: TripData) => void
  onDeleteTrip?: (tripId: string) => void
  onCancelTrip?: (tripId: string) => void
  onUpdateStatus?: (
    tripId: string,
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  ) => void
}

export const TripTableView: React.FC<TripTableViewProps> = ({
  trips,
  selectedTripIds,
  onSelectTrip,
  onSelectAll,
  onEditTrip,
  onDeleteTrip,
  onCancelTrip,
}) => {
  const allSelected =
    trips.length > 0 && selectedTripIds.length === trips.length
  const someSelected =
    selectedTripIds.length > 0 && selectedTripIds.length < trips.length

  if (trips.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        No trips to display in this range.
      </p>
    )
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'scheduled':
        return {
          backgroundColor:
            'color-mix(in srgb, var(--primary) 30%, var(--card))',
          color: 'var(--primary)',
        }
      case 'in_progress':
        return {
          backgroundColor: 'color-mix(in srgb, var(--accent) 30%, var(--card))',
          color: 'var(--accent)',
        }
      case 'completed':
        return {
          backgroundColor:
            'color-mix(in srgb, var(--success) 30%, var(--card))',
          color: 'var(--success)',
        }
      case 'cancelled':
        return {
          backgroundColor:
            'color-mix(in srgb, var(--destructive) 30%, var(--card))',
          color: 'var(--destructive)',
        }
      default:
        return {
          backgroundColor: 'var(--muted)',
          color: 'var(--muted-foreground)',
        }
    }
  }

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
  }

  return (
    <div
      className="overflow-x-auto rounded-2xl"
      style={{ border: '1px solid var(--border)' }}
    >
      <table
        className="min-w-full divide-y text-sm"
        style={{ borderColor: 'var(--border)' }}
      >
        <thead style={{ backgroundColor: 'var(--muted)' }}>
          <tr>
            <th
              className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-4 w-4 rounded transition-colors cursor-pointer"
                style={{
                  border: '2px solid var(--border)',
                  accentColor: 'var(--primary)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow =
                    '0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </th>
            <th
              className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Date
            </th>
            <th
              className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Time
            </th>
            <th
              className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Price
            </th>
            <th
              className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Bookings
            </th>
            <th
              className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Status
            </th>
            <th
              className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody
          className="divide-y"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--card)',
          }}
        >
          {trips.map((trip) => (
            <tr key={trip.trip_id}>
              <td className="whitespace-nowrap px-4 py-2 text-xs">
                <input
                  type="checkbox"
                  checked={selectedTripIds.includes(trip.trip_id)}
                  onChange={(e) => onSelectTrip(trip.trip_id, e.target.checked)}
                  className="h-4 w-4 rounded transition-colors cursor-pointer"
                  style={{
                    border: '2px solid var(--border)',
                    accentColor: 'var(--primary)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow =
                      '0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </td>
              <td
                className="whitespace-nowrap px-4 py-2 text-xs"
                style={{ color: 'var(--foreground)' }}
              >
                {trip.schedule?.departure_time?.split('T')[0] || 'N/A'}
              </td>
              <td
                className="whitespace-nowrap px-4 py-2 text-xs"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {trip.schedule?.departure_time?.split('T')[1]?.slice(0, 5) ||
                  'N/A'}{' '}
                <ArrowRight
                  className="w-3 h-3 inline mx-1"
                  style={{ color: 'var(--muted-foreground)' }}
                />{' '}
                {trip.schedule?.arrival_time?.split('T')[1]?.slice(0, 5) ||
                  'N/A'}
              </td>
              <td
                className="whitespace-nowrap px-4 py-2 text-xs"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {(trip.pricing?.base_price || 0).toLocaleString('vi-VN')} VND
              </td>
              <td
                className="whitespace-nowrap px-4 py-2 text-xs"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {trip.availability?.available_seats || 0}/
                {trip.availability?.total_seats || 0}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-xs">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={getStatusBadgeStyle(trip.status)}
                >
                  {formatStatus(trip.status)}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-xs">
                <div className="flex items-center gap-1">
                  {onEditTrip && (
                    <button
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--primary)' }}
                      onClick={() => onEditTrip(trip)}
                      title="Edit"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'color-mix(in srgb, var(--primary) 10%, transparent)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {onCancelTrip && trip.status !== 'cancelled' && (
                    <button
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--accent)' }}
                      onClick={() => onCancelTrip(trip.trip_id)}
                      title="Cancel Trip"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'color-mix(in srgb, var(--accent) 10%, transparent)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {onDeleteTrip && (
                    <button
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--destructive)' }}
                      onClick={() => onDeleteTrip(trip.trip_id)}
                      title="Delete"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'color-mix(in srgb, var(--destructive) 10%, transparent)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
