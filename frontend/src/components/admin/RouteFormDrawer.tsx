import React, { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown, Trash2, Plus, Loader } from 'lucide-react'
import type { RouteAdminData } from '@/types/trip.types'
import { validateCreateRoute, validateUpdateRoute } from '@/lib/validation'

const emptyForm: Omit<RouteAdminData, 'route_id' | 'created_at'> = {
  origin: '',
  destination: '',
  distance_km: 0,
  estimated_minutes: 0,
  pickup_points: [
    { point_id: '', name: '', address: '', departure_offset_minutes: 0 },
  ],
  dropoff_points: [
    { point_id: '', name: '', address: '', departure_offset_minutes: 0 },
  ],
  route_stops: [],
}

interface RouteFormDrawerProps {
  open: boolean
  onClose: () => void
  initialRoute: RouteAdminData | null
  onSave: (values: Omit<RouteAdminData, 'route_id' | 'created_at'>) => void
}

export const RouteFormDrawer: React.FC<RouteFormDrawerProps> = ({
  open,
  onClose,
  initialRoute,
  onSave,
}) => {
  const [form, setForm] =
    useState<Omit<RouteAdminData, 'route_id' | 'created_at'>>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => {
        setErrors({})
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [errors])

  useEffect(() => {
    if (initialRoute) {
      setForm({
        origin: initialRoute.origin,
        destination: initialRoute.destination,
        distance_km: initialRoute.distance_km,
        estimated_minutes: initialRoute.estimated_minutes,
        pickup_points: initialRoute.pickup_points,
        dropoff_points: initialRoute.dropoff_points,
        route_stops: initialRoute.route_stops || [],
      })
    } else {
      setForm(emptyForm)
    }
  }, [initialRoute, open])

  const addPoint = (type: 'pickup' | 'dropoff') => {
    setForm((prev) => ({
      ...prev,
      [type === 'pickup' ? 'pickup_points' : 'dropoff_points']: [
        ...prev[type === 'pickup' ? 'pickup_points' : 'dropoff_points'],
        { point_id: '', name: '', address: '', departure_offset_minutes: 0 },
      ],
    }))
  }

  const updatePointField = (
    type: 'pickup' | 'dropoff',
    index: number,
    field: 'name' | 'address' | 'departure_offset_minutes',
    value: string | number
  ) => {
    setForm((prev) => {
      const key = type === 'pickup' ? 'pickup_points' : 'dropoff_points'
      const points = [...prev[key]] as typeof prev.pickup_points
      points[index] = { ...points[index], [field]: value }
      return { ...prev, [key]: points }
    })
  }

  const removePoint = (type: 'pickup' | 'dropoff', index: number) => {
    setForm((prev) => {
      const key = type === 'pickup' ? 'pickup_points' : 'dropoff_points'
      const points = [...prev[key]]
      points.splice(index, 1)
      return { ...prev, [key]: points }
    })
  }

  const addStop = () => {
    setForm((prev) => ({
      ...prev,
      route_stops: [
        ...(prev.route_stops || []),
        { stop_name: '', sequence: (prev.route_stops || []).length + 1 },
      ],
    }))
  }

  const updateStopField = (
    index: number,
    field: 'stop_name' | 'sequence' | 'arrival_offset_minutes' | 'address',
    value: string | number
  ) => {
    setForm((prev) => {
      const stops = [...(prev.route_stops || [])]
      stops[index] = { ...stops[index], [field]: value }
      return { ...prev, route_stops: stops }
    })
  }

  const removeStop = (index: number) => {
    setForm((prev) => {
      const stops = [...(prev.route_stops || [])]
      stops.splice(index, 1)
      // Re-sequence the remaining stops
      const updatedStops = stops.map((stop, idx) => ({
        ...stop,
        sequence: idx + 1,
      }))
      return { ...prev, route_stops: updatedStops }
    })
  }

  const moveStop = (index: number, direction: 'up' | 'down') => {
    setForm((prev) => {
      const stops = [...(prev.route_stops || [])]
      if (direction === 'up' && index > 0) {
        ;[stops[index], stops[index - 1]] = [stops[index - 1], stops[index]]
      } else if (direction === 'down' && index < stops.length - 1) {
        ;[stops[index], stops[index + 1]] = [stops[index + 1], stops[index]]
      }
      // Re-sequence all stops
      const updatedStops = stops.map((stop, idx) => ({
        ...stop,
        sequence: idx + 1,
      }))
      return { ...prev, route_stops: updatedStops }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Use validator from lib/validation.ts
    const validationErrors = initialRoute
      ? validateUpdateRoute({
          origin: form.origin,
          destination: form.destination,
          distance_km: form.distance_km,
          estimated_minutes: form.estimated_minutes,
          pickup_points: form.pickup_points,
          dropoff_points: form.dropoff_points,
          route_stops: form.route_stops,
        })
      : validateCreateRoute({
          origin: form.origin,
          destination: form.destination,
          distance_km: form.distance_km,
          estimated_minutes: form.estimated_minutes,
          pickup_points: form.pickup_points,
          dropoff_points: form.dropoff_points,
          route_stops: form.route_stops,
        })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(form)
    } finally {
      setIsSubmitting(false)
    }
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
              {initialRoute ? 'Edit Route' : 'Add Route'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Configure route with pickup and dropoff points.
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
          className="flex-1 space-y-4 overflow-auto px-5 py-4"
          onSubmit={handleSubmit}
        >
          {/* Route Info */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-xs font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  From *
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                  }}
                  value={form.origin}
                  onChange={(e) => handleChange('origin', e.target.value)}
                  placeholder="Origin city"
                />
                {errors.origin && (
                  <p className="mt-1 text-xs text-red-500">{errors.origin}</p>
                )}
              </div>
              <div>
                <label
                  className="block text-xs font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  To *
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                  }}
                  value={form.destination}
                  onChange={(e) => handleChange('destination', e.target.value)}
                  placeholder="Destination city"
                />
                {errors.destination && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.destination}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-xs font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Distance (km) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                  }}
                  value={form.distance_km || ''}
                  onInput={(e) => {
                    const input = e.target as HTMLInputElement
                    let value = input.value

                    // If the value starts with 0 and has more digits, remove leading zeros
                    if (
                      value.startsWith('0') &&
                      value.length > 1 &&
                      !value.includes('.')
                    ) {
                      value = value.replace(/^0+/, '')
                      input.value = value
                    }

                    handleChange(
                      'distance_km',
                      value === '' ? 0 : Number(value)
                    )
                  }}
                />
                {errors.distance_km && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.distance_km}
                  </p>
                )}
              </div>
              <div>
                <label
                  className="block text-xs font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Duration (min) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                  }}
                  value={form.estimated_minutes || ''}
                  onInput={(e) => {
                    const input = e.target as HTMLInputElement
                    let value = input.value

                    // If the value starts with 0 and has more digits, remove leading zeros
                    if (
                      value.startsWith('0') &&
                      value.length > 1 &&
                      !value.includes('.')
                    ) {
                      value = value.replace(/^0+/, '')
                      input.value = value
                    }

                    handleChange(
                      'estimated_minutes',
                      value === '' ? 0 : Number(value)
                    )
                  }}
                />
                {errors.estimated_minutes && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.estimated_minutes}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Route Stops */}
          <div className="space-y-2">
            <h3
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Route Stops
            </h3>
            <div className="relative">
              <div className="absolute left-16 top-0 bottom-0 w-0.5 bg-border"></div>
              <div className="space-y-3">
                {(form.route_stops || []).map((stop, idx) => (
                  <React.Fragment key={idx}>
                    <div className="flex items-center gap-3 relative">
                      <span className="text-xs text-muted-foreground font-medium min-w-10 text-right">
                        {stop.sequence}
                      </span>
                      <div className="flex flex-col items-center gap-1 relative">
                        <div className="w-6 h-6 rounded-full bg-primary border-2 border-white shadow-sm flex items-center justify-center relative z-10">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={stop.stop_name}
                          onChange={(e) =>
                            updateStopField(idx, 'stop_name', e.target.value)
                          }
                          placeholder="Stop name"
                          className="w-full rounded px-2 py-1 text-xs"
                          style={{
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--card)',
                            color: 'var(--foreground)',
                          }}
                        />
                        <input
                          type="text"
                          value={stop.address || ''}
                          onChange={(e) =>
                            updateStopField(idx, 'address', e.target.value)
                          }
                          placeholder="Address"
                          className="w-full rounded px-2 py-1 text-xs"
                          style={{
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--card)',
                            color: 'var(--foreground)',
                          }}
                        />
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                              Arrival Offset (min)
                            </label>
                            <input
                              type="number"
                              value={stop.arrival_offset_minutes || 0}
                              onInput={(e) => {
                                const input = e.target as HTMLInputElement
                                let value = input.value
                                if (
                                  value.startsWith('0') &&
                                  value.length > 1 &&
                                  !value.includes('.')
                                ) {
                                  value = value.replace(/^0+/, '')
                                  input.value = value
                                }
                                updateStopField(
                                  idx,
                                  'arrival_offset_minutes',
                                  value === '' ? 0 : Number(value)
                                )
                              }}
                              min="0"
                              placeholder="0"
                              className="w-full rounded px-2 py-1 text-xs"
                              style={{
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--card)',
                                color: 'var(--foreground)',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => moveStop(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStop(idx, 'down')}
                          disabled={idx === (form.route_stops || []).length - 1}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStop(idx)}
                          className="p-1 text-destructive hover:text-destructive/80"
                          title="Remove stop"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {/* Display errors for this stop */}
                    {(errors['route_stops.' + idx + '.stop_name'] ||
                      errors['route_stops.' + idx + '.sequence'] ||
                      errors[
                        'route_stops.' + idx + '.arrival_offset_minutes'
                      ]) && (
                      <div className="ml-16 space-y-1">
                        {errors['route_stops.' + idx + '.stop_name'] && (
                          <p className="text-xs text-red-500">
                            {errors['route_stops.' + idx + '.stop_name']}
                          </p>
                        )}
                        {errors['route_stops.' + idx + '.sequence'] && (
                          <p className="text-xs text-red-500">
                            {errors['route_stops.' + idx + '.sequence']}
                          </p>
                        )}
                        {errors[
                          'route_stops.' + idx + '.arrival_offset_minutes'
                        ] && (
                          <p className="text-xs text-red-500">
                            {
                              errors[
                                'route_stops.' + idx + '.arrival_offset_minutes'
                              ]
                            }
                          </p>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={addStop}
              className="text-xs text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Add route stop
            </button>
          </div>

          {/* Pickup Points */}
          <div className="space-y-2">
            <h3
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Pickup Points
            </h3>
            {errors.pickup_points && (
              <p className="text-xs text-red-500">{errors.pickup_points}</p>
            )}
            {form.pickup_points.map((point, idx) => (
              <div
                key={idx}
                className="space-y-2 p-2 border rounded-lg"
                style={{ borderColor: 'var(--border)' }}
              >
                <input
                  type="text"
                  value={point.name}
                  onChange={(e) =>
                    updatePointField('pickup', idx, 'name', e.target.value)
                  }
                  placeholder="Location name"
                  className="w-full rounded px-2 py-1 text-xs"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                  }}
                />
                {errors[`pickup_points.${idx}.name`] && (
                  <p className="text-xs text-red-500">
                    {errors[`pickup_points.${idx}.name`]}
                  </p>
                )}
                <input
                  type="text"
                  value={point.address}
                  onChange={(e) =>
                    updatePointField('pickup', idx, 'address', e.target.value)
                  }
                  placeholder="Address"
                  className="w-full rounded px-2 py-1 text-xs"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                  }}
                />
                {errors[`pickup_points.${idx}.address`] && (
                  <p className="text-xs text-red-500">
                    {errors[`pickup_points.${idx}.address`]}
                  </p>
                )}
                <input
                  type="number"
                  value={point.departure_offset_minutes || ''}
                  onChange={(e) =>
                    updatePointField(
                      'pickup',
                      idx,
                      'departure_offset_minutes',
                      Number(e.target.value) || 0
                    )
                  }
                  placeholder="Arrival Offset (min)"
                  className="w-full rounded px-2 py-1 text-xs"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                  }}
                />
                {form.pickup_points.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePoint('pickup', idx)}
                    className="w-full px-2 py-1 text-xs text-destructive hover:bg-destructive/10 rounded transition"
                  >
                    <Trash2 className="h-3 w-3 inline mr-1" />
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addPoint('pickup')}
              className="text-xs text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Add pickup point
            </button>
          </div>

          {/* Dropoff Points */}
          <div className="space-y-2">
            <h3
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Dropoff Points
            </h3>
            {errors.dropoff_points && (
              <p className="text-xs text-red-500">{errors.dropoff_points}</p>
            )}
            {form.dropoff_points.map((point, idx) => (
              <div
                key={idx}
                className="space-y-2 p-2 border rounded-lg"
                style={{ borderColor: 'var(--border)' }}
              >
                <input
                  type="text"
                  value={point.name}
                  onChange={(e) =>
                    updatePointField('dropoff', idx, 'name', e.target.value)
                  }
                  placeholder="Location name"
                  className="w-full rounded px-2 py-1 text-xs"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                  }}
                />
                {errors[`dropoff_points.${idx}.name`] && (
                  <p className="text-xs text-red-500">
                    {errors[`dropoff_points.${idx}.name`]}
                  </p>
                )}
                <input
                  type="text"
                  value={point.address}
                  onChange={(e) =>
                    updatePointField('dropoff', idx, 'address', e.target.value)
                  }
                  placeholder="Address"
                  className="w-full rounded px-2 py-1 text-xs"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                  }}
                />
                {errors[`dropoff_points.${idx}.address`] && (
                  <p className="text-xs text-red-500">
                    {errors[`dropoff_points.${idx}.address`]}
                  </p>
                )}
                <input
                  type="number"
                  value={point.departure_offset_minutes || ''}
                  onChange={(e) =>
                    updatePointField(
                      'dropoff',
                      idx,
                      'departure_offset_minutes',
                      Number(e.target.value) || 0
                    )
                  }
                  placeholder="Departure Offset (min)"
                  className="w-full rounded px-2 py-1 text-xs"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                  }}
                />
                {form.dropoff_points.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePoint('dropoff', idx)}
                    className="w-full px-2 py-1 text-xs text-destructive hover:bg-destructive/10 rounded transition"
                  >
                    <Trash2 className="h-3 w-3 inline mr-1" />
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addPoint('dropoff')}
              className="text-xs text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Add dropoff point
            </button>
          </div>
        </form>

        <div
          className="flex items-center justify-end gap-2 px-5 py-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
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
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg px-4 py-2 text-sm font-medium transition inline-flex items-center gap-2"
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
            {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
            {initialRoute ? 'Save Changes' : 'Add Route'}
          </button>
        </div>
      </div>
    </div>
  )
}
