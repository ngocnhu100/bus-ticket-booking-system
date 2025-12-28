import React, { useState, useEffect, useMemo } from 'react'
import type {
  TripData,
  TripCreateRequest,
  TripUpdateRequest,
} from '@/types/adminTripTypes'
import { adminTripService } from '@/services/adminTripService'
import { CustomDropdown } from '../ui/custom-dropdown'
import { PriceInput } from '../ui/price-input'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

interface RoutesData {
  route_id: string
  origin: string
  destination: string
  estimated_minutes?: number
  distance_km?: number
}

interface BusData {
  bus_id: string
  name?: string
  plate_number: string
  bus_model?: string
  model_name?: string
  operator_name?: string
  operator_id?: string
  status?: 'active' | 'inactive' | 'maintenance'
}

interface TripFormDrawerProps {
  open: boolean
  onClose: () => void
  initialTrip: TripData | null
  onSave: (data: TripCreateRequest | TripUpdateRequest) => void
}

export const TripFormDrawer: React.FC<TripFormDrawerProps> = ({
  open,
  onClose,
  initialTrip,
  onSave,
}) => {
  const isEditMode = !!initialTrip
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})
  const [isLoading, setIsLoading] = useState(false)
  const [routes, setRoutes] = useState<RoutesData[]>([])
  const [buses, setBuses] = useState<BusData[]>([])

  //Helper function to convert UTC ISO string to local datetime-local value
  const utcToLocalString = (utcString: string): string => {
    if (!utcString) return ''
    const date = new Date(utcString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // CREATE mode form
  const [createForm, setCreateForm] = useState({
    route_id: '',
    bus_id: '',
    departure_time: '',
    base_price: 0,
    service_fee: 0,
    policies: {
      cancellation_policy:
        'Cancellations are accepted up to 24 hours prior to the scheduled departure time.',
      modification_policy:
        'Booking modifications are permitted up to 72 hours prior to the scheduled departure time.',
      refund_policy:
        '100% refund if cancelled 72 hours prior; 50% if 24–72 hours. Subject to a 10% fee and processed within 7 days.',
    },
  })

  // UPDATE mode form
  const [updateForm, setUpdateForm] = useState({
    status: '',
    bus_id: '',
    route_id: '',
    departure_time: '',
    base_price: 0,
    service_fee: 0,
    policies: {
      cancellation_policy:
        'Cancellations are accepted up to 24 hours prior to the scheduled departure time.',
      modification_policy:
        'Booking modifications are permitted up to 72 hours prior to the scheduled departure time.',
      refund_policy:
        '100% refund if cancelled 72 hours prior; 50% if 24–72 hours. Subject to a 10% fee and processed within 7 days.',
    },
  })

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (Object.keys(validationErrors).length > 0) {
      const timer = setTimeout(() => {
        setValidationErrors({})
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [validationErrors])
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [routesResponse, busesResponse] = await Promise.all([
          adminTripService.getAllRoutes(),
          adminTripService.getAvailableBuses(),
        ])
        setRoutes(
          (routesResponse || [])
            .filter((route) => route.route_id)
            .map((route) => ({
              route_id: route.route_id!,
              origin: route.origin,
              destination: route.destination,
              estimated_minutes: route.estimated_minutes,
              distance_km: route.distance_km,
            }))
        )
        setBuses(
          (busesResponse || [])
            .filter((bus) => bus.bus_id)
            .map((bus) => ({
              bus_id: bus.bus_id!,
              name: bus.name,
              plate_number: bus.plate_number,
              bus_model: bus.model,
              model_name: bus.model,
              operator_name: bus.operator_name,
              operator_id: bus.operator_id,
              status: bus.status,
            }))
        )
      } catch (error) {
        console.error('Error loading routes/buses:', error)
        setRoutes([])
        setBuses([])
      } finally {
        setIsLoading(false)
      }
    }

    if (open) {
      loadData()
    }
  }, [open])

  // Default policies - memoized to avoid dependency changes
  const defaultPolicies = useMemo(
    () => ({
      cancellation_policy:
        'Cancellations are accepted up to 24 hours prior to the scheduled departure time.',
      modification_policy:
        'Booking modifications are permitted up to 72 hours prior to the scheduled departure time.',
      refund_policy:
        '100% refund if cancelled 72 hours prior; 50% if 24–72 hours. Subject to a 10% fee and processed within 7 days.',
    }),
    []
  )

  // Initialize forms based on mode
  useEffect(() => {
    if (isEditMode && initialTrip) {
      // Merge initialTrip.policies with defaults to ensure all fields exist
      const policies = initialTrip.policies
        ? {
            cancellation_policy:
              initialTrip.policies.cancellation_policy ||
              defaultPolicies.cancellation_policy,
            modification_policy:
              initialTrip.policies.modification_policy ||
              defaultPolicies.modification_policy,
            refund_policy:
              initialTrip.policies.refund_policy ||
              defaultPolicies.refund_policy,
          }
        : defaultPolicies

      setUpdateForm({
        status: initialTrip.status || 'scheduled',
        bus_id: initialTrip.bus?.bus_id || '',
        route_id: initialTrip.route?.route_id || '',
        departure_time: initialTrip.schedule?.departure_time
          ? utcToLocalString(initialTrip.schedule.departure_time)
          : '',
        base_price: initialTrip.pricing?.base_price || 0,
        service_fee: initialTrip.pricing?.service_fee || 0,
        policies,
      })
    } else {
      setCreateForm({
        route_id: '',
        bus_id: '',
        departure_time: '',
        base_price: 0,
        service_fee: 0,
        policies: defaultPolicies,
      })
    }
    setValidationErrors({})
  }, [initialTrip, isEditMode, open, defaultPolicies])

  const handleCreateChange = (key: string, value: string | number) => {
    setCreateForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleUpdateChange = (key: string, value: string | number) => {
    setUpdateForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleCreatePolicyChange = (policyKey: string, value: string) => {
    setCreateForm((prev) => ({
      ...prev,
      policies: {
        ...prev.policies,
        [policyKey]: value,
      },
    }))
  }

  const handleUpdatePolicyChange = (policyKey: string, value: string) => {
    setUpdateForm((prev) => ({
      ...prev,
      policies: {
        ...prev.policies,
        [policyKey]: value,
      },
    }))
  }

  const validateCreateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!createForm.route_id) errors.route_id = 'Route is required'
    if (!createForm.bus_id) errors.bus_id = 'Bus is required'
    if (!createForm.departure_time)
      errors.departure_time = 'Departure time is required'
    if (createForm.base_price <= 0) errors.base_price = 'Base price must be > 0'
    if (createForm.service_fee < 0)
      errors.service_fee = 'Service fee must be ≥ 0'

    // Validate policies
    if (!createForm.policies.cancellation_policy?.trim())
      errors.cancellation_policy = 'Cancellation policy is required'
    if (!createForm.policies.modification_policy?.trim())
      errors.modification_policy = 'Modification policy is required'
    if (!createForm.policies.refund_policy?.trim())
      errors.refund_policy = 'Refund policy is required'

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateUpdateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Status validation
    if (!updateForm.status) errors.status = 'Status is required'

    // Status transition validation
    const validTransitions: Record<string, string[]> = {
      scheduled: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    }
    if (initialTrip && updateForm.status !== initialTrip.status) {
      if (!validTransitions[initialTrip.status]?.includes(updateForm.status)) {
        errors.status = `Invalid status transition from ${initialTrip.status} to ${updateForm.status}`
      }
    }

    // Route is required if status is scheduled
    if (updateForm.status === 'scheduled' && !updateForm.route_id) {
      errors.route_id = 'Route is required for scheduled trips'
    }

    // Price validations
    if (updateForm.base_price <= 0) errors.base_price = 'Base price must be > 0'
    if (updateForm.service_fee < 0)
      errors.service_fee = 'Service fee must be ≥ 0'

    // Validate policies
    if (!updateForm.policies.cancellation_policy?.trim())
      errors.cancellation_policy = 'Cancellation policy is required'
    if (!updateForm.policies.modification_policy?.trim())
      errors.modification_policy = 'Modification policy is required'
    if (!updateForm.policies.refund_policy?.trim())
      errors.refund_policy = 'Refund policy is required'

    // Departure time validation
    if (!updateForm.departure_time) {
      errors.departure_time = 'Departure time is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateCreateForm()) return

    const selectedBus = buses.find((bus) => bus.bus_id === createForm.bus_id)
    const operatorId = selectedBus?.operator_id || ''

    const requestData: TripCreateRequest = {
      route_id: createForm.route_id,
      bus_id: createForm.bus_id,
      operator_id: operatorId,
      departure_time: createForm.departure_time
        ? new Date(createForm.departure_time).toISOString()
        : '',
      arrival_time: '', // Will be calculated by backend (backend will ignore empty string and calculate)
      base_price: createForm.base_price,
      service_fee: createForm.service_fee,
      policies: createForm.policies,
    }

    onSave(requestData)
  }

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateUpdateForm()) return

    // Ensure status is valid before submission
    if (
      !updateForm.status ||
      !['scheduled', 'in_progress', 'completed', 'cancelled'].includes(
        updateForm.status
      )
    ) {
      setValidationErrors({ status: 'Invalid status selected' })
      return
    }

    const requestData: TripUpdateRequest = {
      status: updateForm.status as
        | 'scheduled'
        | 'in_progress'
        | 'completed'
        | 'cancelled',
      ...(updateForm.bus_id && { bus_id: updateForm.bus_id }),
      ...(updateForm.route_id && { route_id: updateForm.route_id }),
      ...(updateForm.departure_time && {
        departure_time: new Date(updateForm.departure_time).toISOString(),
      }),
      ...(updateForm.base_price && { base_price: updateForm.base_price }),
      ...(updateForm.service_fee && { service_fee: updateForm.service_fee }),
      policies: updateForm.policies,
    }

    onSave(requestData)
  }

  if (!open) return null

  const canChangeBus = isEditMode && updateForm.status === 'scheduled'
  const canChangeRoute =
    isEditMode &&
    updateForm.status &&
    !['cancelled', 'in_progress', 'completed'].includes(updateForm.status)
  const isRouteRequired = updateForm.status === 'scheduled'

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
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              {isEditMode ? 'Update Trip' : 'Create Trip'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {isEditMode
                ? 'Update trip details, status, and assignments'
                : 'Create a new trip by selecting route, bus, and schedule'}
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

        {/* Form */}
        <form
          className="flex-1 space-y-5 overflow-auto px-5 py-4"
          onSubmit={isEditMode ? handleUpdateSubmit : handleCreateSubmit}
        >
          {isEditMode ? (
            // === UPDATE MODE ===
            <>
              {/* Status Selector */}
              <div>
                <label
                  className="block text-xs font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Trip Status *
                </label>
                <CustomDropdown
                  options={[
                    { id: 'scheduled', label: 'Scheduled' },
                    { id: 'in_progress', label: 'In Progress' },
                    { id: 'completed', label: 'Completed' },
                    { id: 'cancelled', label: 'Cancelled' },
                  ]}
                  value={updateForm.status}
                  onChange={(value) => handleUpdateChange('status', value)}
                  placeholder="Select status"
                />
                {validationErrors.status && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors.status}
                  </p>
                )}
              </div>

              {/* Bus Assignment (only for scheduled) */}
              <div>
                <label
                  className="block text-xs font-medium"
                  style={{
                    color: canChangeBus
                      ? 'var(--foreground)'
                      : 'var(--muted-foreground)',
                  }}
                >
                  Assign Bus {canChangeBus ? '*' : '(Read-only)'}
                </label>
                {canChangeBus ? (
                  <CustomDropdown
                    options={buses.map((bus) => ({
                      id: bus.bus_id,
                      label: `${bus.name || 'Unknown'} - ${bus.operator_name || 'Unknown'}`,
                    }))}
                    value={updateForm.bus_id}
                    onChange={(value) => handleUpdateChange('bus_id', value)}
                    placeholder="Select bus"
                  />
                ) : (
                  <div
                    className="mt-1 rounded-lg px-3 py-2 text-sm"
                    style={{
                      backgroundColor: 'var(--muted)',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    {updateForm.bus_id &&
                    buses.find((b) => b.bus_id === updateForm.bus_id)
                      ? buses.find((b) => b.bus_id === updateForm.bus_id)!
                          .plate_number
                      : 'No bus assigned'}
                  </div>
                )}
                {validationErrors.bus_id && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors.bus_id}
                  </p>
                )}
                {!canChangeBus && (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    Bus can only be changed for scheduled trips
                  </p>
                )}
              </div>

              {/* Route Assignment (conditional) */}
              <div>
                <label
                  className="block text-xs font-medium"
                  style={{
                    color: canChangeRoute
                      ? 'var(--foreground)'
                      : 'var(--muted-foreground)',
                  }}
                >
                  Assign Route{' '}
                  {canChangeRoute && isRouteRequired
                    ? '*'
                    : canChangeRoute
                      ? ''
                      : '(Read-only)'}
                </label>
                {canChangeRoute ? (
                  <CustomDropdown
                    options={routes.map((route) => ({
                      id: route.route_id,
                      label: `${route.origin} → ${route.destination}`,
                    }))}
                    value={updateForm.route_id}
                    onChange={(value) => handleUpdateChange('route_id', value)}
                    placeholder={
                      isRouteRequired
                        ? 'Select route (required)'
                        : 'Select route (optional)'
                    }
                  />
                ) : (
                  <div
                    className="mt-1 rounded-lg px-3 py-2 text-sm"
                    style={{
                      backgroundColor: 'var(--muted)',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    {initialTrip?.route?.origin} →{' '}
                    {initialTrip?.route?.destination}
                  </div>
                )}
                {validationErrors.route_id && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors.route_id}
                  </p>
                )}
                {!canChangeRoute && (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    Cannot change route for {updateForm.status} trips
                  </p>
                )}
              </div>

              {/* Departure Time */}
              <div>
                <label
                  className="block text-xs font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Departure Time
                </label>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    value={
                      updateForm.departure_time
                        ? new Date(updateForm.departure_time)
                        : null
                    }
                    onChange={(newValue) =>
                      handleUpdateChange(
                        'departure_time',
                        newValue ? newValue.toISOString() : ''
                      )
                    }
                    slotProps={{
                      textField: {
                        className:
                          'mt-1 w-full rounded-xl px-3 py-2 text-sm focus:outline-none',
                        sx: {
                          '& .MuiInputBase-root': {
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--card)',
                            color: 'var(--foreground)',
                            '&:focus': {
                              outline: 'none',
                            },
                          },
                          '& .MuiInputBase-input': {
                            color: 'var(--foreground)',
                          },
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
                {validationErrors.departure_time && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors.departure_time}
                  </p>
                )}
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <h3
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Pricing
                </h3>
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Base Price (VND)
                  </label>
                  <PriceInput
                    value={updateForm.base_price}
                    onChange={(value) =>
                      handleUpdateChange('base_price', value)
                    }
                    placeholder="Enter base price"
                    min={0}
                  />
                  {validationErrors.base_price && (
                    <p className="mt-1 text-xs text-red-500">
                      {validationErrors.base_price}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Service Fee (VND)
                  </label>
                  <PriceInput
                    value={updateForm.service_fee}
                    onChange={(value) =>
                      handleUpdateChange('service_fee', value)
                    }
                    placeholder="Enter service fee"
                    min={0}
                  />
                  {validationErrors.service_fee && (
                    <p className="mt-1 text-xs text-red-500">
                      {validationErrors.service_fee}
                    </p>
                  )}
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
                    className="block text-xs font-medium mb-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Cancellation Policy *
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none min-h-15 resize-none"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--foreground)',
                    }}
                    value={updateForm.policies.cancellation_policy}
                    onChange={(e) =>
                      handleUpdatePolicyChange(
                        'cancellation_policy',
                        e.target.value
                      )
                    }
                    placeholder="Enter cancellation policy"
                  />
                  {validationErrors.cancellation_policy && (
                    <p className="mt-1 text-xs text-red-500">
                      {validationErrors.cancellation_policy}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Modification Policy *
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none min-h-15 resize-none"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--foreground)',
                    }}
                    value={updateForm.policies.modification_policy}
                    onChange={(e) =>
                      handleUpdatePolicyChange(
                        'modification_policy',
                        e.target.value
                      )
                    }
                    placeholder="Enter modification policy"
                  />
                  {validationErrors.modification_policy && (
                    <p className="mt-1 text-xs text-red-500">
                      {validationErrors.modification_policy}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Refund Policy *
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none min-h-15 resize-none"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--foreground)',
                    }}
                    value={updateForm.policies.refund_policy}
                    onChange={(e) =>
                      handleUpdatePolicyChange('refund_policy', e.target.value)
                    }
                    placeholder="Enter refund policy"
                  />
                  {validationErrors.refund_policy && (
                    <p className="mt-1 text-xs text-red-500">
                      {validationErrors.refund_policy}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            // === CREATE MODE ===
            <>
              {/* Route Selection */}
              <div>
                <label
                  className="block text-xs font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Route *
                </label>
                <CustomDropdown
                  options={routes.map((route) => ({
                    id: route.route_id,
                    label: `${route.origin} → ${route.destination}`,
                  }))}
                  value={createForm.route_id}
                  onChange={(value) => handleCreateChange('route_id', value)}
                  placeholder="Select route"
                />
                {validationErrors.route_id && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors.route_id}
                  </p>
                )}
              </div>

              {/* Bus Selection */}
              <div>
                <label
                  className="block text-xs font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Bus *
                </label>
                <CustomDropdown
                  options={buses.map((bus) => ({
                    id: bus.bus_id,
                    label: `${bus.name || 'Unknown'} - ${bus.operator_name || 'Unknown'}`,
                  }))}
                  value={createForm.bus_id}
                  onChange={(value) => handleCreateChange('bus_id', value)}
                  placeholder="Select bus"
                />
                {validationErrors.bus_id && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors.bus_id}
                  </p>
                )}
              </div>

              {/* Schedule */}
              <div className="space-y-3">
                <h3
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Schedule
                </h3>
                <div>
                  <label
                    className="block text-xs font-medium"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Departure Time *
                  </label>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      value={
                        createForm.departure_time
                          ? new Date(createForm.departure_time)
                          : null
                      }
                      onChange={(newValue) =>
                        handleCreateChange(
                          'departure_time',
                          newValue ? newValue.toISOString() : ''
                        )
                      }
                      slotProps={{
                        textField: {
                          required: true,
                          className:
                            'mt-1 w-full rounded-2xl px-3 py-2 text-sm focus:outline-none',
                          sx: {
                            '& .MuiInputBase-root': {
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--card)',
                              color: 'var(--foreground)',
                              '&:focus': {
                                outline: 'none',
                              },
                            },
                            '& .MuiInputBase-input': {
                              color: 'var(--foreground)',
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    Arrival time will be calculated automatically based on route
                    distance
                  </p>
                  {validationErrors.departure_time && (
                    <p className="mt-1 text-xs text-red-500">
                      {validationErrors.departure_time}
                    </p>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <h3
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Pricing
                </h3>
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Base Price (VND) *
                  </label>
                  <PriceInput
                    value={createForm.base_price}
                    onChange={(value) =>
                      handleCreateChange('base_price', value)
                    }
                    placeholder="Enter base price"
                    min={0}
                  />
                  {validationErrors.base_price && (
                    <p className="mt-1 text-xs text-red-500">
                      {validationErrors.base_price}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Service Fee (VND)
                  </label>
                  <PriceInput
                    value={createForm.service_fee}
                    onChange={(value) =>
                      handleCreateChange('service_fee', value)
                    }
                    placeholder="Enter service fee"
                    min={0}
                  />
                  {validationErrors.service_fee && (
                    <p className="mt-1 text-xs text-red-500">
                      {validationErrors.service_fee}
                    </p>
                  )}
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
                    className="block text-xs font-medium mb-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Cancellation Policy *
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none min-h-15 resize-none"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--foreground)',
                    }}
                    value={createForm.policies.cancellation_policy}
                    onChange={(e) =>
                      handleCreatePolicyChange(
                        'cancellation_policy',
                        e.target.value
                      )
                    }
                    placeholder="Enter cancellation policy"
                  />
                  {validationErrors.cancellation_policy && (
                    <p className="mt-1 text-xs text-red-500">
                      {validationErrors.cancellation_policy}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Modification Policy *
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none min-h-15 resize-none"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--foreground)',
                    }}
                    value={createForm.policies.modification_policy}
                    onChange={(e) =>
                      handleCreatePolicyChange(
                        'modification_policy',
                        e.target.value
                      )
                    }
                    placeholder="Enter modification policy"
                  />
                  {validationErrors.modification_policy && (
                    <p className="mt-1 text-xs text-red-500">
                      {validationErrors.modification_policy}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Refund Policy *
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none min-h-15 resize-none"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--foreground)',
                    }}
                    value={createForm.policies.refund_policy}
                    onChange={(e) =>
                      handleCreatePolicyChange('refund_policy', e.target.value)
                    }
                    placeholder="Enter refund policy"
                  />
                  {validationErrors.refund_policy && (
                    <p className="mt-1 text-xs text-red-500">
                      {validationErrors.refund_policy}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </form>

        {/* Footer */}
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
            onClick={isEditMode ? handleUpdateSubmit : handleCreateSubmit}
            className="rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none"
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
            disabled={isLoading}
          >
            {isEditMode ? 'Save Changes' : 'Create Trip'}
          </button>
        </div>
      </div>
    </div>
  )
}
