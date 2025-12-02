import React from 'react'
import { ArrowRight } from 'lucide-react'
import type { Trip } from '../../types/trip.types'

interface TripListProps {
  trips: Trip[]
  onEditTrip: (trip: Trip) => void
  selectedTripIds: string[]
  onSelectTrip: (tripId: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
}

export const TripList: React.FC<TripListProps> = ({
  trips,
  onEditTrip,
  selectedTripIds,
  onSelectTrip,
  onSelectAll,
}) => {
  const allSelected =
    trips.length > 0 && selectedTripIds.length === trips.length
  const someSelected =
    selectedTripIds.length > 0 && selectedTripIds.length < trips.length

  const handleEditClick = (trip: Trip) => {
    onEditTrip(trip)
  }

  return (
    <div
      className="rounded-2xl p-6 shadow-sm"
      style={{
        border: '1px solid var(--border)',
        backgroundColor: 'var(--card)',
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-lg font-semibold"
          style={{ color: 'var(--foreground)' }}
        >
          Trips on selected date
        </h2>
        {trips.length > 0 && (
          <label
            className="flex items-center gap-3 text-sm font-medium cursor-pointer"
            style={{ color: 'var(--foreground)' }}
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
            <span>Select all</span>
          </label>
        )}
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-8">
          <p className="mb-4" style={{ color: 'var(--muted-foreground)' }}>
            No trips scheduled for this date.
          </p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Click <span className="font-semibold">"Create Trip"</span> to add
            one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <div
              key={trip.trip_id}
              className="flex items-center justify-between rounded-xl p-4 shadow-sm transition"
              style={{
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor =
                  'color-mix(in srgb, var(--primary) 20%, var(--border))'
                e.currentTarget.style.backgroundColor =
                  'color-mix(in srgb, var(--muted) 50%, var(--card))'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.backgroundColor = 'var(--card)'
              }}
            >
              <div className="flex items-center gap-3 flex-1">
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
                <div className="flex-1">
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {trip.route.origin}{' '}
                    <ArrowRight
                      className="w-4 h-4 inline mx-1"
                      style={{ color: 'var(--foreground)' }}
                    />{' '}
                    {trip.route.destination}
                  </p>
                  <p
                    className="text-xs mb-2"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {trip.schedule.departure_time.split('T')[1]?.slice(0, 5)}{' '}
                    <ArrowRight
                      className="w-3 h-3 inline mx-1"
                      style={{ color: 'var(--muted-foreground)' }}
                    />{' '}
                    {trip.schedule.arrival_time.split('T')[1]?.slice(0, 5)} ·{' '}
                    {trip.bus.model}
                  </p>
                  <p
                    className="text-xs font-medium"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {trip.pricing.base_price.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={
                    trip.status === 'active'
                      ? {
                          backgroundColor:
                            'color-mix(in srgb, var(--success) 30%, var(--card))',
                          color: 'var(--primary)',
                        }
                      : {
                          backgroundColor: 'var(--muted)',
                          color: 'var(--muted-foreground)',
                        }
                  }
                >
                  {trip.status === 'active' ? 'Active' : 'Inactive'}
                </span>
                <button
                  className="text-sm font-medium focus:outline-none rounded px-2 py-1"
                  style={{ color: 'var(--primary)' }}
                  onClick={() => handleEditClick(trip)}
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
