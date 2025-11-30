import React, { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import type {
  Trip,
  RouteAdminData,
  BusAdminData,
  TripFormData,
} from '../../types/trip.types'
import { CustomDropdown } from '../ui/custom-dropdown'

const emptyForm: TripFormData = {
  routeId: '',
  busId: '',
  departureTime: '',
  arrivalTime: '',
  basePrice: 0,
  status: 'active',
}

interface TripFormDrawerProps {
  open: boolean
  onClose: () => void
  routes: RouteAdminData[]
  buses: BusAdminData[]
  initialTrip: Trip | null
  onSave: (values: TripFormData) => void
}

export const TripFormDrawer: React.FC<TripFormDrawerProps> = ({
  open,
  onClose,
  routes,
  buses,
  initialTrip,
  onSave,
}) => {
  const [form, setForm] = useState<TripFormData>(() => emptyForm)

  // Populate form when editing a trip
  useEffect(() => {
    if (initialTrip) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        tripId: initialTrip.tripId,
        routeId: initialTrip.route.routeId,
        busId: initialTrip.bus.busId,
        departureTime: initialTrip.schedule.departureTime,
        arrivalTime: initialTrip.schedule.arrivalTime,
        basePrice: initialTrip.pricing.basePrice,
        status: initialTrip.status,
      })
    } else {
      setForm(emptyForm)
    }
  }, [initialTrip])

  const handleChange = (field: keyof TripFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  if (!open) return null

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
        className="flex h-full w-full max-w-md flex-col shadow-2xl"
        style={{ backgroundColor: 'var(--card)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              {initialTrip ? 'Edit Trip' : 'Create Trip'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Set route, bus, schedule, and pricing.
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

        <form
          className="flex-1 space-y-5 overflow-auto px-5 py-4"
          onSubmit={handleSubmit}
        >
          {/* Route & Bus */}
          <div className="space-y-3">
            <div>
              <label
                className="block text-xs font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Route *
              </label>
              <CustomDropdown
                options={routes.map((r) => ({
                  id: r.routeId || '',
                  label: (
                    <div className="flex items-center gap-2">
                      <span>{r.origin}</span>
                      <ArrowRight
                        className="w-3 h-3"
                        style={{ color: 'var(--primary)' }}
                      />
                      <span>{r.destination}</span>
                    </div>
                  ),
                  displayLabel: (
                    <div className="flex items-center gap-2">
                      <span>{r.origin}</span>
                      <ArrowRight
                        className="w-3 h-3"
                        style={{ color: 'var(--primary)' }}
                      />
                      <span>{r.destination}</span>
                    </div>
                  ),
                }))}
                value={form.routeId}
                onChange={(id) => handleChange('routeId', id)}
                placeholder="Select route"
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Bus *
              </label>
              <CustomDropdown
                options={buses.map((b) => ({
                  id: b.busId || '',
                  label: `${b.name} · ${b.type} · ${b.capacity} seats`,
                  displayLabel: `${b.name} · ${b.type} · ${b.capacity} seats`,
                }))}
                value={form.busId}
                onChange={(id) => handleChange('busId', id)}
                placeholder="Select bus"
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-3">
            <h3
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Schedule
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-xs font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Departure Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                  }}
                  value={form.departureTime.slice(0, 16)}
                  onChange={(e) =>
                    handleChange('departureTime', e.target.value + ':00')
                  }
                />
              </div>

              <div>
                <label
                  className="block text-xs font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Arrival Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                  }}
                  value={form.arrivalTime.slice(0, 16)}
                  onChange={(e) =>
                    handleChange('arrivalTime', e.target.value + ':00')
                  }
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Status
              </label>
              <CustomDropdown
                options={[
                  { id: 'active', label: 'Active' },
                  { id: 'inactive', label: 'Inactive' },
                ]}
                value={form.status}
                onChange={(id) =>
                  handleChange('status', id as 'active' | 'inactive')
                }
                placeholder="Select status"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <h3
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Pricing
            </h3>
            <div>
              <label
                className="block text-xs font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Base price per seat (VND) *
              </label>
              <input
                type="number"
                required
                min={0}
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                }}
                value={form.basePrice}
                onChange={(e) =>
                  handleChange(
                    'basePrice',
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow =
                    '0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)'
                  e.currentTarget.style.borderColor = 'var(--primary)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow =
                    '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}
              />
            </div>
          </div>
        </form>

        <div
          className="flex items-center justify-end gap-2 px-5 py-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none"
            style={{
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card)'
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow =
                '0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)'
              e.currentTarget.style.borderColor = 'var(--primary)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2"
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
            {initialTrip ? 'Save changes' : 'Create trip'}
          </button>
        </div>
      </div>
    </div>
  )
}
