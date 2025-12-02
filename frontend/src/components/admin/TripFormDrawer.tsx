import React, { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Trip, RouteAdminData, BusAdminData } from '../../types/trip.types'
import { CustomDropdown } from '../ui/custom-dropdown'

const emptyForm: Trip = {
  trip_id: '',
  route: {
    route_id: '',
    origin: '',
    destination: '',
    distance_km: 0,
    estimated_minutes: 0,
  },
  operator: {
    operator_id: '',
    name: '',
    rating: 0,
  },
  bus: {
    bus_id: '',
    model: '',
    plate_number: '',
    seat_capacity: 0,
    bus_type: 'standard',
    amenities: [],
  },
  schedule: {
    departure_time: '',
    arrival_time: '',
    duration: 0,
  },
  pricing: {
    base_price: 0,
    currency: 'VND',
    service_fee: 0,
  },
  availability: {
    total_seats: 0,
    available_seats: 0,
    occupancy_rate: 0,
  },
  policies: {
    cancellation_policy: '',
    modification_policy: '',
    refund_policy: '',
  },
  pickup_points: [],
  dropoff_points: [],
  status: 'active',
}

interface TripFormDrawerProps {
  open: boolean
  onClose: () => void
  routes: RouteAdminData[]
  buses: BusAdminData[]
  initialTrip: Trip | null
  onSave: (data: {
    trip: Trip
    isRecurring: boolean
    recurrencePattern: string
    repeatBasedOn: 'departure' | 'arrival'
    endsOn: 'never' | 'date'
    endDate: string
  }) => void
}

export const TripFormDrawer: React.FC<TripFormDrawerProps> = ({
  open,
  onClose,
  routes,
  buses,
  initialTrip,
  onSave,
}) => {
  const [form, setForm] = useState<Trip>(() => emptyForm)
  const [validationErrors, setValidationErrors] = useState<string[]>([]) // State for validation errors
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState<
    'daily' | 'weekly' | ''
  >('')
  const [repeatBasedOn, setRepeatBasedOn] = useState<'departure' | 'arrival'>(
    'departure'
  )
  const [endsOn, setEndsOn] = useState<'never' | 'date'>('never')
  const [endDate, setEndDate] = useState('')

  // Populate form when editing a trip
  useEffect(() => {
    if (initialTrip) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(initialTrip)
    } else {
      setForm(emptyForm)
    }
  }, [initialTrip])

  const handleChange = (path: string, value: unknown) => {
    setForm((prev) => {
      if (path === 'route_id') {
        return {
          ...prev,
          route: { ...prev.route, route_id: value as string },
        }
      } else if (path === 'bus_id') {
        return {
          ...prev,
          bus: { ...prev.bus, bus_id: value as string },
        }
      } else if (path === 'departure_time') {
        return {
          ...prev,
          schedule: { ...prev.schedule, departure_time: value as string },
        }
      } else if (path === 'arrival_time') {
        return {
          ...prev,
          schedule: { ...prev.schedule, arrival_time: value as string },
        }
      } else if (path === 'base_price') {
        return {
          ...prev,
          pricing: { ...prev.pricing, base_price: value as number },
        }
      } else if (path === 'service_fee') {
        return {
          ...prev,
          pricing: { ...prev.pricing, service_fee: value as number },
        }
      } else if (path === 'status') {
        return {
          ...prev,
          status: value as 'active' | 'inactive',
        }
      } else if (path === 'cancellation_policy') {
        return {
          ...prev,
          policies: { ...prev.policies, cancellation_policy: value as string },
        }
      } else if (path === 'modification_policy') {
        return {
          ...prev,
          policies: { ...prev.policies, modification_policy: value as string },
        }
      } else if (path === 'refund_policy') {
        return {
          ...prev,
          policies: { ...prev.policies, refund_policy: value as string },
        }
      }
      return prev
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const errors: string[] = []

    if (!form.route.route_id) errors.push('Route is required')
    if (!form.bus.bus_id) errors.push('Bus is required')
    if (!form.schedule.departure_time) errors.push('Departure time is required')
    if (!form.schedule.arrival_time) errors.push('Arrival time is required')
    if (form.pricing.base_price < 0) errors.push('Base price must be positive')
    if (form.pricing.service_fee && form.pricing.service_fee < 0)
      errors.push('Service fee must be positive')

    if (form.schedule.departure_time && form.schedule.arrival_time) {
      const depTime = new Date(form.schedule.departure_time)
      const arrTime = new Date(form.schedule.arrival_time)
      if (depTime >= arrTime) {
        errors.push('Arrival time must be after departure time')
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors) // Set validation errors in state
      return
    }

    setValidationErrors([]) // Clear errors if validation passes
    onSave({
      trip: form,
      isRecurring,
      recurrencePattern,
      repeatBasedOn,
      endsOn,
      endDate,
    })
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
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div
              className="p-3 text-sm rounded-lg"
              style={{
                color: 'var(--foreground)',
                backgroundColor:
                  'color-mix(in srgb, var(--destructive) 10%, var(--background))',
              }}
            >
              <ul className="list-disc pl-5">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

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
                  id: r.route_id || '',
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
                value={form.route.route_id}
                onChange={(id) => handleChange('route_id', id)}
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
                  id: b.bus_id || '',
                  label: `${b.name} · ${b.type} · ${b.capacity} seats`,
                  displayLabel: `${b.name} · ${b.type} · ${b.capacity} seats`,
                }))}
                value={form.bus.bus_id}
                onChange={(id) => handleChange('bus_id', id)}
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
                  value={form.schedule.departure_time.slice(0, 16)}
                  onChange={(e) =>
                    handleChange('departure_time', e.target.value + ':00')
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
                  value={form.schedule.arrival_time.slice(0, 16)}
                  onChange={(e) =>
                    handleChange('arrival_time', e.target.value + ':00')
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

            <div>
              <label
                className="block text-xs font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Is Recurring
              </label>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="mt-1"
              />
            </div>

            {isRecurring && (
              <>
                <div>
                  <label
                    className="block text-xs font-medium"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Repeat Based On
                  </label>
                  <CustomDropdown
                    options={[
                      { id: 'departure', label: 'Departure Date' },
                      { id: 'arrival', label: 'Arrival Date' },
                    ]}
                    value={repeatBasedOn}
                    onChange={(value) =>
                      setRepeatBasedOn(value as 'departure' | 'arrival')
                    }
                    placeholder="Select base"
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-medium"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Recurrence Pattern
                  </label>
                  <CustomDropdown
                    options={[
                      { id: 'daily', label: 'Daily' },
                      { id: 'weekly', label: 'Weekly' },
                    ]}
                    value={recurrencePattern}
                    onChange={(value) =>
                      setRecurrencePattern(value as 'daily' | 'weekly')
                    }
                    placeholder="Select pattern"
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-medium"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Ends
                  </label>
                  <CustomDropdown
                    options={[
                      { id: 'never', label: 'Never' },
                      { id: 'date', label: 'On Date' },
                    ]}
                    value={endsOn}
                    onChange={(value) => setEndsOn(value as 'never' | 'date')}
                    placeholder="Select end condition"
                  />
                </div>

                {endsOn === 'date' && (
                  <div>
                    <label
                      className="block text-xs font-medium"
                      style={{ color: 'var(--foreground)' }}
                    >
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--foreground)',
                      }}
                    />
                  </div>
                )}
              </>
            )}
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
                value={form.pricing.base_price}
                onChange={(e) =>
                  handleChange(
                    'base_price',
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
            <div>
              <label
                className="block text-xs font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Service fee per seat (VND)
              </label>
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                }}
                value={
                  form.pricing.service_fee
                    ? form.pricing.service_fee
                    : form.pricing.base_price * 0.03
                }
                onChange={(e) =>
                  handleChange(
                    'service_fee',
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

          {/* Policies */}
          <div className="space-y-3">
            <h3
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Policies
            </h3>
            <div>
              <label
                className="block text-xs font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Cancellation Policy
              </label>
              <textarea
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                }}
                value={form.policies.cancellation_policy}
                onChange={(e) =>
                  handleChange('cancellation_policy', e.target.value)
                }
                rows={3}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Modification Policy
              </label>
              <textarea
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                }}
                value={form.policies.modification_policy}
                onChange={(e) =>
                  handleChange('modification_policy', e.target.value)
                }
                rows={3}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Refund Policy
              </label>
              <textarea
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                }}
                value={form.policies.refund_policy}
                onChange={(e) => handleChange('refund_policy', e.target.value)}
                rows={3}
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
