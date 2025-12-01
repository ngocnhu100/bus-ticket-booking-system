import React from 'react'
import { ArrowRight } from 'lucide-react'
import type { Trip } from '../../types/trip.types'

interface TripTableViewProps {
  trips: Trip[]
  selectedTripIds: string[]
  onSelectTrip: (tripId: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onEditTrip?: (trip: Trip) => void
}

export const TripTableView: React.FC<TripTableViewProps> = ({
  trips,
  selectedTripIds,
  onSelectTrip,
  onSelectAll,
  onEditTrip,
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

  return (
    <div
      className="overflow-hidden rounded-2xl"
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
              Route
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
              Bus
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
              Status
            </th>
            {onEditTrip && (
              <th
                className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Actions
              </th>
            )}
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
                {trip.schedule.departure_time.split('T')[0]}
              </td>
              <td
                className="whitespace-nowrap px-4 py-2 text-xs"
                style={{ color: 'var(--foreground)' }}
              >
                {trip.route.origin}{' '}
                <ArrowRight
                  className="w-3 h-3 inline mx-1"
                  style={{ color: 'var(--foreground)' }}
                />{' '}
                {trip.route.destination}
              </td>
              <td
                className="whitespace-nowrap px-4 py-2 text-xs"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {trip.schedule.departure_time.split('T')[1]?.slice(0, 5)}{' '}
                <ArrowRight
                  className="w-3 h-3 inline mx-1"
                  style={{ color: 'var(--muted-foreground)' }}
                />{' '}
                {trip.schedule.arrival_time.split('T')[1]?.slice(0, 5)}
              </td>
              <td
                className="whitespace-nowrap px-4 py-2 text-xs"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {trip.bus.model}
              </td>
              <td
                className="whitespace-nowrap px-4 py-2 text-xs"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {trip.pricing.base_price.toLocaleString('vi-VN')} đ
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-xs">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={
                    trip.status === 'active'
                      ? {
                          backgroundColor:
                            'color-mix(in srgb, var(--success) 20%, transparent)',
                          color: 'var(--success)',
                        }
                      : {
                          backgroundColor: 'var(--muted)',
                          color: 'var(--muted-foreground)',
                        }
                  }
                >
                  {trip.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </td>
              {onEditTrip && (
                <td className="whitespace-nowrap px-4 py-2 text-xs">
                  <button
                    className="text-sm font-medium focus:outline-none rounded px-2 py-1"
                    style={{ color: 'var(--primary)' }}
                    onClick={() => onEditTrip(trip)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = 'underline'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow =
                        '0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    Edit
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
