import React, { useState } from 'react'
import {
  type Trip,
  type Route,
  type Bus,
  type TripFormData,
  WEEKDAYS,
} from '../../types/trip.types'
import '@/styles/admin.css'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import '@/styles/datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

// ============================================================================
// MOCK DATA
// ============================================================================

const initialRoutes: Route[] = [
  {
    id: 'r1',
    from: 'Ho Chi Minh City',
    to: 'Da Lat',
    distance: 0,
    estimatedDuration: 0,
    pickupPoints: [],
    dropoffPoints: [],
    status: 'INACTIVE',
  },
  {
    id: 'r2',
    from: 'Ho Chi Minh City',
    to: 'Nha Trang',
    distance: 0,
    estimatedDuration: 0,
    pickupPoints: [],
    dropoffPoints: [],
    status: 'INACTIVE',
  },
]

const initialBuses: Bus[] = [
  {
    id: 'b1',
    name: 'Limousine 20-seat',
    type: 'LIMOUSINE',
    capacity: 20,
    model: '',
    plateNumber: '',
    amenities: [],
    status: 'INACTIVE',
  },
  {
    id: 'b2',
    name: 'Sleeper 40-seat',
    type: 'SLEEPER',
    capacity: 40,
    model: '',
    plateNumber: '',
    amenities: [],
    status: 'INACTIVE',
  },
]

const initialTrips: Trip[] = [
  {
    id: 't1',
    routeId: 'r1',
    routeLabel: 'Ho Chi Minh City → Da Lat',
    busId: 'b1',
    busLabel: 'Limousine 20-seat',
    date: new Date().toISOString().slice(0, 10),
    departureTime: '08:00',
    arrivalTime: '12:30',
    basePrice: 350000,
    status: 'ACTIVE',
  },
  {
    id: 't2',
    routeId: 'r1',
    routeLabel: 'Ho Chi Minh City → Da Lat',
    busId: 'b2',
    busLabel: 'Sleeper 40-seat',
    date: new Date().toISOString().slice(0, 10),
    departureTime: '14:00',
    arrivalTime: '18:15',
    basePrice: 300000,
    status: 'INACTIVE',
  },
  {
    id: 't3',
    routeId: 'r2',
    routeLabel: 'Ho Chi Minh City → Nha Trang',
    busId: 'b1',
    busLabel: 'Limousine 20-seat',
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    departureTime: '06:30',
    arrivalTime: '11:00',
    basePrice: 400000,
    status: 'ACTIVE',
  },
]

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

const AdminTripSchedulingPage: React.FC = () => {
  const [routes] = useState(initialRoutes)
  const [buses] = useState(initialBuses)
  const [trips, setTrips] = useState(initialTrips)
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'LIST'>('CALENDAR')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)

  // Filter state
  const [filters, setFilters] = useState({
    routeId: '',
    busId: '',
    status: '',
  })

  // Bulk operations state
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([])

  const handleCreateClick = () => {
    setEditingTrip(null)
    setDrawerOpen(true)
  }

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip)
    setDrawerOpen(true)
  }

  // Validation and conflict detection
  const validateTripForm = (form: TripFormData): string[] => {
    const errors: string[] = []

    // Required fields
    if (!form.routeId) errors.push('Route is required')
    if (!form.busId) errors.push('Bus is required')
    if (!form.date) errors.push('Date is required')
    if (!form.departureTime) errors.push('Departure time is required')
    if (!form.arrivalTime) errors.push('Arrival time is required')
    if (!form.basePrice || form.basePrice === '') {
      errors.push('Base price is required')
    }

    // Price validation
    if (form.basePrice && Number(form.basePrice) < 0) {
      errors.push('Base price cannot be negative')
    }

    // Date validation
    if (form.date) {
      const selectedDate = new Date(form.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        errors.push('Date must be today or in the future')
      }
    }

    // Time validation
    if (form.departureTime && form.arrivalTime) {
      const depTime = form.departureTime
      const arrTime = form.arrivalTime
      if (depTime >= arrTime) {
        errors.push('Arrival time must be after departure time')
      }
    }

    // Recurrence validation
    if (form.isRecurring) {
      if (!form.recurrenceType) {
        errors.push('Recurrence type is required for recurring trips')
      }
      if (!form.recurrenceEndDate) {
        errors.push('End date is required for recurring trips')
      }
      if (
        form.recurrenceType === 'WEEKLY' &&
        form.recurrenceDays.length === 0
      ) {
        errors.push('At least one day must be selected for weekly recurrence')
      }
      if (form.recurrenceEndDate && form.date) {
        const startDate = new Date(form.date)
        const endDate = new Date(form.recurrenceEndDate)
        if (endDate <= startDate) {
          errors.push('End date must be after start date')
        }
      }
    }

    return errors
  }

  const detectConflicts = (
    newTrip: TripFormData,
    existingTrips: Trip[]
  ): string[] => {
    const conflicts: string[] = []
    const selectedBus = buses.find((b) => b.id === newTrip.busId)
    if (!selectedBus) return conflicts

    const newDate = newTrip.date
    const newDepTime = newTrip.departureTime
    const newArrTime = newTrip.arrivalTime

    // Check for same bus conflicts on same date
    const sameBusTrips = existingTrips.filter(
      (t) =>
        t.busId === newTrip.busId &&
        t.date === newDate &&
        (!editingTrip || t.id !== editingTrip.id) // Exclude current trip when editing
    )

    for (const trip of sameBusTrips) {
      // Check for time overlap
      const tripDepTime = trip.departureTime
      const tripArrTime = trip.arrivalTime

      // Two time ranges overlap if: start1 < end2 && start2 < end1
      if (newDepTime < tripArrTime && tripDepTime < newArrTime) {
        conflicts.push(
          `Bus "${selectedBus.name}" has a conflicting trip: ${trip.routeLabel} (${tripDepTime} - ${tripArrTime})`
        )
      }
    }

    return conflicts
  }

  const generateRecurringTrips = (baseTrip: TripFormData): Trip[] => {
    const trips: Trip[] = []
    const startDate = new Date(baseTrip.date)
    const endDate = new Date(baseTrip.recurrenceEndDate!)
    const route = routes.find((r) => r.id === baseTrip.routeId)
    const bus = buses.find((b) => b.id === baseTrip.busId)

    if (!route || !bus) return trips

    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      let shouldCreate = false

      if (baseTrip.recurrenceType === 'DAILY') {
        shouldCreate = true
      } else if (baseTrip.recurrenceType === 'WEEKLY') {
        const dayOfWeek = currentDate.getDay() // 0 = Sunday, 1 = Monday, etc.
        // Convert to our format: 0 = Monday, 6 = Sunday
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        shouldCreate = baseTrip.recurrenceDays.includes(WEEKDAYS[adjustedDay])
      }

      if (shouldCreate) {
        const trip: Trip = {
          id: crypto.randomUUID(),
          routeId: baseTrip.routeId,
          routeLabel: `${route.from} → ${route.to}`,
          busId: baseTrip.busId,
          busLabel: bus.name,
          date: currentDate.toISOString().slice(0, 10),
          departureTime: baseTrip.departureTime,
          arrivalTime: baseTrip.arrivalTime,
          basePrice: Number(baseTrip.basePrice),
          status: baseTrip.status,
        }
        trips.push(trip)
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return trips
  }

  // Filter and get trips for selected date
  const filteredTrips = trips.filter((trip) => {
    if (selectedDate) {
      const tripDate = new Date(trip.date)
      const selected = new Date(selectedDate)
      if (tripDate.toDateString() !== selected.toDateString()) return false
    }

    if (filters.routeId && trip.routeId !== filters.routeId) return false
    if (filters.busId && trip.busId !== filters.busId) return false
    if (filters.status && trip.status !== filters.status) return false

    return true
  })

  const handleApplyFilters = () => {
    // Filters are applied automatically through the filteredTrips computation
    console.log('Filters applied:', filters)
  }

  const handleClearFilters = () => {
    setFilters({
      routeId: '',
      busId: '',
      status: '',
    })
  }

  const handleSaveTrip = (values: TripFormData) => {
    // Validate form
    const validationErrors = validateTripForm(values)
    if (validationErrors.length > 0) {
      alert(`Validation errors:\n${validationErrors.join('\n')}`)
      return
    }

    // Check for conflicts
    const conflicts = detectConflicts(values, trips)
    if (conflicts.length > 0) {
      const proceed = confirm(
        `Scheduling conflicts detected:\n\n${conflicts.join(
          '\n\n'
        )}Do you want to proceed anyway?`
      )
      if (!proceed) return
    }

    if (values.id) {
      // Update existing trip
      setTrips((prev) =>
        prev.map((t) =>
          t.id === values.id
            ? {
                ...t,
                routeId: values.routeId,
                busId: values.busId,
                date: values.date,
                departureTime: values.departureTime,
                arrivalTime: values.arrivalTime,
                basePrice: Number(values.basePrice),
                status: values.status,
              }
            : t
        )
      )
    } else {
      // Create new trip(s)
      if (values.isRecurring) {
        // Generate recurring trips
        const recurringTrips = generateRecurringTrips(values)
        if (recurringTrips.length > 0) {
          setTrips((prev) => [...prev, ...recurringTrips])
          alert(
            `Created ${recurringTrips.length} recurring trips successfully!`
          )
        }
      } else {
        // Create single trip
        const route = routes.find((r) => r.id === values.routeId)
        const bus = buses.find((b) => b.id === values.busId)
        const newTrip: Trip = {
          id: crypto.randomUUID(),
          routeId: values.routeId,
          routeLabel: route ? `${route.from} → ${route.to}` : '',
          busId: values.busId,
          busLabel: bus ? bus.name : '',
          date: values.date,
          departureTime: values.departureTime,
          arrivalTime: values.arrivalTime,
          basePrice: Number(values.basePrice),
          status: values.status,
        }
        setTrips((prev) => [...prev, newTrip])
      }
    }
    setDrawerOpen(false)
  }

  // Bulk operations
  const handleSelectTrip = (tripId: string, selected: boolean) => {
    if (selected) {
      setSelectedTripIds((prev) => [...prev, tripId])
    } else {
      setSelectedTripIds((prev) => prev.filter((id) => id !== tripId))
    }
  }

  const handleSelectAllTrips = (selected: boolean) => {
    if (selected) {
      setSelectedTripIds(filteredTrips.map((trip) => trip.id))
    } else {
      setSelectedTripIds([])
    }
  }

  const handleBulkDelete = () => {
    if (selectedTripIds.length === 0) return

    const confirmDelete = confirm(
      `Are you sure you want to delete ${selectedTripIds.length} trip(s)? This action cannot be undone.`
    )

    if (confirmDelete) {
      setTrips((prev) =>
        prev.filter((trip) => !selectedTripIds.includes(trip.id))
      )
      setSelectedTripIds([])
    }
  }

  const handleBulkStatusUpdate = (newStatus: 'ACTIVE' | 'INACTIVE') => {
    if (selectedTripIds.length === 0) return

    setTrips((prev) =>
      prev.map((trip) =>
        selectedTripIds.includes(trip.id)
          ? { ...trip, status: newStatus }
          : trip
      )
    )
    setSelectedTripIds([])
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Trip Scheduling
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, edit, and manage trip schedules for all routes and buses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="EEEE, MMMM d, yyyy"
              placeholderText="Select date"
              className="w-full h-10 px-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              wrapperClassName="w-full"
              calendarClassName="!bg-card !border !border-border !rounded-md !shadow-xl"
              dayClassName={(date) => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const isToday = date.getTime() === today.getTime()

                if (isToday) {
                  return 'bg-primary text-primary-foreground font-bold ring-2 ring-primary/50'
                }
                return 'hover:bg-accent hover:text-accent-foreground cursor-pointer'
              }}
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          <button
            onClick={handleCreateClick}
            className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            + Create Trip
          </button>
        </div>
      </div>

      {/* Bulk Operations Bar */}
      {selectedTripIds.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">
                {selectedTripIds.length} trip
                {selectedTripIds.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedTripIds([])}
                className="text-sm text-muted-foreground hover:text-foreground underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-2 py-1"
              >
                Clear selection
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => handleBulkStatusUpdate('ACTIVE')}
                className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-w-0"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('INACTIVE')}
                className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-w-0"
              >
                Deactivate
              </button>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground shadow-sm transition hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 min-w-0"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-[420px,1fr] gap-8">
        {/* Left: Filters + Trip List */}
        <div className="space-y-6">
          <TripFilters
            routes={routes}
            buses={buses}
            filters={filters}
            onFiltersChange={setFilters}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
          />
          <TripList
            trips={filteredTrips}
            onEditTrip={handleEditTrip}
            selectedTripIds={selectedTripIds}
            onSelectTrip={handleSelectTrip}
            onSelectAll={handleSelectAllTrips}
          />
        </div>

        {/* Right: Calendar / List View */}
        <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="inline-flex rounded-full border border-border bg-muted p-1 text-sm font-medium text-muted-foreground">
              <button
                className={`rounded-full px-4 py-2 transition ${
                  viewMode === 'CALENDAR'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setViewMode('CALENDAR')}
              >
                Calendar
              </button>
              <button
                className={`rounded-full px-4 py-2 transition ${
                  viewMode === 'LIST'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setViewMode('LIST')}
              >
                List
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {viewMode === 'CALENDAR' ? (
              <TripCalendarView trips={trips} onEditTrip={handleEditTrip} />
            ) : (
              <TripTableView
                trips={trips}
                selectedTripIds={selectedTripIds}
                onSelectTrip={handleSelectTrip}
                onSelectAll={handleSelectAllTrips}
              />
            )}
          </div>
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <TripFormDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          routes={routes}
          buses={buses}
          initialTrip={editingTrip}
          onSave={handleSaveTrip}
        />
      )}
    </DashboardLayout>
  )
}

// ============================================================================
// TRIP FILTERS COMPONENT
// ============================================================================

interface TripFiltersProps {
  routes: Route[]
  buses: Bus[]
  filters: {
    routeId: string
    busId: string
    status: string
  }
  onFiltersChange: (filters: {
    routeId: string
    busId: string
    status: string
  }) => void
  onApplyFilters: () => void
  onClearFilters: () => void
}

const TripFilters: React.FC<TripFiltersProps> = ({
  routes,
  buses,
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
}) => {
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Filters</h2>
        <button
          className="text-sm font-medium text-primary hover:text-primary/80 underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-2 py-1 transition-colors"
          onClick={onClearFilters}
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="mr-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            Route
          </label>
          <div className="relative">
            <select
              value={filters.routeId}
              onChange={(e) => handleFilterChange('routeId', e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-8 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All routes</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.from} → {r.to}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="mr-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            Bus
          </label>
          <div className="relative">
            <select
              value={filters.busId}
              onChange={(e) => handleFilterChange('busId', e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-8 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All buses</option>
              {buses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Status
          </label>
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-8 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      <button
        className="mt-6 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onClick={onApplyFilters}
      >
        Apply Filters
      </button>
    </div>
  )
}

// ============================================================================
// TRIP LIST COMPONENT (left side)
// ============================================================================

interface TripListProps {
  trips: Trip[]
  onEditTrip: (trip: Trip) => void
  selectedTripIds: string[]
  onSelectTrip: (tripId: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
}

const TripList: React.FC<TripListProps> = ({
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

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Trips on selected date
        </h2>
        {trips.length > 0 && (
          <label className="flex items-center gap-3 text-sm font-medium text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected
              }}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="h-4 w-4 rounded border-2 border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors cursor-pointer"
            />
            <span>Select all</span>
          </label>
        )}
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No trips scheduled for this date.
          </p>
          <p className="text-sm text-muted-foreground">
            Click <span className="font-semibold">"Create Trip"</span> to add
            one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="flex items-center justify-between rounded-xl border border-border p-4 shadow-sm transition hover:shadow-md hover:border-primary/20 bg-card hover:bg-muted/50"
            >
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={selectedTripIds.includes(trip.id)}
                  onChange={(e) => onSelectTrip(trip.id, e.target.checked)}
                  className="h-4 w-4 rounded border-2 border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">
                    {trip.routeLabel}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {trip.departureTime} → {trip.arrivalTime} · {trip.busLabel}
                  </p>
                  <p className="text-xs font-medium text-foreground">
                    {trip.basePrice.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    trip.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {trip.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
                <button
                  className="text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-2 py-1"
                  onClick={() => onEditTrip(trip)}
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

// ============================================================================
// CALENDAR VIEW COMPONENT
// ============================================================================

interface TripCalendarViewProps {
  trips: Trip[]
  onEditTrip?: (trip: Trip) => void
}

const TripCalendarView: React.FC<TripCalendarViewProps> = ({
  trips,
  onEditTrip,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<'MONTH' | 'WEEK'>('MONTH')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Group trips by date
  const tripsByDate = trips.reduce(
    (acc, trip) => {
      const dateKey = trip.date
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(trip)
      return acc
    },
    {} as Record<string, Trip[]>
  )

  const formatDateKey = (date: Date) => date.toISOString().slice(0, 10)

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => date.getMonth() === month

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7)
      } else {
        newDate.setDate(newDate.getDate() + 7)
      }
      return newDate
    })
  }

  const goToToday = () => setCurrentDate(new Date())

  // Generate calendar days for monthly view
  const generateMonthlyCalendar = () => {
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Start from Sunday

    const endDate = new Date(lastDay)
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay())) // End on Saturday

    const calendarDays = []
    const current = new Date(startDate)

    while (current <= endDate) {
      calendarDays.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return calendarDays
  }

  // Generate calendar days for weekly view
  const generateWeeklyCalendar = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()) // Start from Sunday

    const calendarDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      calendarDays.push(day)
    }

    return calendarDays
  }

  const calendarDays =
    calendarView === 'MONTH'
      ? generateMonthlyCalendar()
      : generateWeeklyCalendar()

  const navigate = (direction: 'prev' | 'next') => {
    if (calendarView === 'MONTH') {
      navigateMonth(direction)
    } else {
      navigateWeek(direction)
    }
  }

  const getHeaderTitle = () => {
    if (calendarView === 'MONTH') {
      return currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    } else {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      const startMonth = startOfWeek.toLocaleDateString('en-US', {
        month: 'short',
      })
      const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' })
      const year = startOfWeek.getFullYear()

      if (startMonth === endMonth) {
        return `${startMonth} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${year}`
      } else {
        return `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${year}`
      }
    }
  }

  return (
    <div className="space-y-4 w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('prev')}
            className="rounded-lg border border-border p-2 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-semibold text-foreground">
            {getHeaderTitle()}
          </h2>
          <button
            onClick={() => navigate('next')}
            className="rounded-lg border border-border p-2 hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-1">
            <button
              onClick={() => setCalendarView('MONTH')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                calendarView === 'MONTH'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setCalendarView('WEEK')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                calendarView === 'WEEK'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Week
            </button>
          </div>
          <button
            onClick={goToToday}
            className="rounded-lg bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-2 w-full p-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 w-full p-1">
        {calendarDays.map((date, index) => {
          const dateKey = formatDateKey(date)
          const dayTrips = tripsByDate[dateKey] || []

          return (
            <div
              key={index}
              className={`${
                calendarView === 'MONTH' ? 'min-h-[140px]' : 'min-h-40'
              } border rounded-lg p-2 ${
                isCurrentMonth(date)
                  ? isToday(date)
                    ? 'bg-primary/5 border-primary ring-1 ring-primary/30'
                    : 'bg-card border-border'
                  : 'bg-muted/30 text-muted-foreground border-border'
              } flex flex-col relative`}
            >
              <div className="text-sm font-medium mb-2 shrink-0 flex items-center gap-1">
                <span
                  className={
                    isToday(date)
                      ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold'
                      : ''
                  }
                >
                  {date.getDate()}
                </span>
                {calendarView === 'MONTH' && !isCurrentMonth(date) && (
                  <span className="text-xs text-muted-foreground">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                )}
              </div>
              <div className="space-y-1 flex-1 overflow-y-auto">
                {dayTrips
                  .slice(0, calendarView === 'WEEK' ? 6 : 4)
                  .map((trip) => {
                    // Calculate duration
                    const [depHour, depMin] = trip.departureTime
                      .split(':')
                      .map(Number)
                    const [arrHour, arrMin] = trip.arrivalTime
                      .split(':')
                      .map(Number)
                    const depMinutes = depHour * 60 + depMin
                    let arrMinutes = arrHour * 60 + arrMin

                    // Handle overnight trips (arrival next day)
                    if (arrMinutes < depMinutes) {
                      arrMinutes += 24 * 60
                    }

                    const durationMinutes = arrMinutes - depMinutes
                    const durationHours = Math.floor(durationMinutes / 60)
                    const durationMins = durationMinutes % 60
                    const duration =
                      durationHours > 0
                        ? `${durationHours}h ${durationMins}m`
                        : `${durationMins}m`

                    // Get origin and destination with abbreviations for long names
                    const routeParts = trip.routeLabel.split(' → ')
                    const origin = routeParts[0] || 'Unknown'
                    const destination =
                      routeParts[1] || routeParts[0] || 'Unknown'

                    // Abbreviate long city names
                    const abbreviateCity = (city: string) => {
                      if (city.length > 10) {
                        return city
                          .split(' ')
                          .map((word) =>
                            word.length > 3 ? word.substring(0, 3) + '.' : word
                          )
                          .join(' ')
                      }
                      return city
                    }

                    const shortOrigin = abbreviateCity(origin)
                    const shortDestination = abbreviateCity(destination)

                    return (
                      <div
                        key={trip.id}
                        className="text-xs bg-primary/10 text-primary rounded px-1.5 py-1 border border-primary/20 hover:bg-primary/15 transition-colors cursor-pointer"
                        title={`${trip.routeLabel} - ${trip.departureTime} to ${trip.arrivalTime} (${duration})`}
                        onClick={() => {
                          onEditTrip?.(trip)
                        }}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <div className="font-medium flex-1 min-w-0">
                            <div className="truncate font-semibold text-xs">
                              {trip.departureTime}
                            </div>
                            <div className="text-[10px] opacity-80 leading-tight">
                              {shortOrigin} → {shortDestination}
                            </div>
                          </div>
                          <div className="text-[10px] opacity-75 shrink-0 font-medium leading-tight">
                            {duration}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                {dayTrips.length > (calendarView === 'WEEK' ? 6 : 4) && (
                  <div className="text-xs text-muted-foreground text-center py-1">
                    +{dayTrips.length - (calendarView === 'WEEK' ? 6 : 4)} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// TABLE VIEW COMPONENT
// ============================================================================

interface TripTableViewProps {
  trips: Trip[]
  selectedTripIds: string[]
  onSelectTrip: (tripId: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
}

const TripTableView: React.FC<TripTableViewProps> = ({
  trips,
  selectedTripIds,
  onSelectTrip,
  onSelectAll,
}) => {
  const allSelected =
    trips.length > 0 && selectedTripIds.length === trips.length
  const someSelected =
    selectedTripIds.length > 0 && selectedTripIds.length < trips.length

  if (trips.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No trips to display in this range.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-2 border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors cursor-pointer"
              />
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Date
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Route
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Time
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Bus
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Price
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {trips.map((trip) => (
            <tr key={trip.id}>
              <td className="whitespace-nowrap px-4 py-2 text-xs">
                <input
                  type="checkbox"
                  checked={selectedTripIds.includes(trip.id)}
                  onChange={(e) => onSelectTrip(trip.id, e.target.checked)}
                  className="h-4 w-4 rounded border-2 border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors cursor-pointer"
                />
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-xs text-foreground">
                {trip.date}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-xs text-foreground">
                {trip.routeLabel}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground">
                {trip.departureTime} → {trip.arrivalTime}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground">
                {trip.busLabel}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground">
                {trip.basePrice.toLocaleString('vi-VN')} đ
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    trip.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {trip.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================================
// FORM DRAWER COMPONENT
// ============================================================================

const emptyForm: TripFormData = {
  routeId: '',
  busId: '',
  date: new Date().toISOString().slice(0, 10),
  departureTime: '',
  arrivalTime: '',
  basePrice: '',
  status: 'ACTIVE',
  isRecurring: false,
  recurrenceType: 'NONE',
  recurrenceDays: [],
  recurrenceEndDate: '',
}

interface TripFormDrawerProps {
  open: boolean
  onClose: () => void
  routes: Route[]
  buses: Bus[]
  initialTrip: Trip | null
  onSave: (values: TripFormData) => void
}

const TripFormDrawer: React.FC<TripFormDrawerProps> = ({
  open,
  onClose,
  routes,
  buses,
  initialTrip,
  onSave,
}) => {
  const [form, setForm] = useState<TripFormData>(() =>
    initialTrip
      ? {
          id: initialTrip.id,
          routeId: initialTrip.routeId,
          busId: initialTrip.busId,
          date: initialTrip.date,
          departureTime: initialTrip.departureTime,
          arrivalTime: initialTrip.arrivalTime,
          basePrice: initialTrip.basePrice,
          status: initialTrip.status,
          isRecurring: false,
          recurrenceType: 'NONE',
          recurrenceDays: [],
          recurrenceEndDate: '',
        }
      : emptyForm
  )

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
        className="flex-1 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {initialTrip ? 'Edit Trip' : 'Create Trip'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Set route, bus, schedule, and pricing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
              <label className="block text-xs font-medium text-foreground">
                Route *
              </label>
              <select
                required
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.routeId}
                onChange={(e) => handleChange('routeId', e.target.value)}
              >
                <option value="">Select route</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.from} → {r.to}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground">
                Bus *
              </label>
              <select
                required
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.busId}
                onChange={(e) => handleChange('busId', e.target.value)}
              >
                <option value="">Select bus</option>
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} · {b.type} · {b.capacity} seats
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Schedule
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3">
                <label className="block text-xs font-medium text-foreground">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground">
                  Departure *
                </label>
                <input
                  type="time"
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.departureTime}
                  onChange={(e) =>
                    handleChange('departureTime', e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground">
                  Arrival *
                </label>
                <input
                  type="time"
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.arrivalTime}
                  onChange={(e) => handleChange('arrivalTime', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground">
                  Status
                </label>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.status}
                  onChange={(e) =>
                    handleChange(
                      'status',
                      e.target.value as 'ACTIVE' | 'INACTIVE'
                    )
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="recurring"
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                checked={form.isRecurring}
                onChange={(e) => handleChange('isRecurring', e.target.checked)}
              />
              <label
                htmlFor="recurring"
                className="text-xs font-medium text-foreground"
              >
                Repeat this trip
              </label>
            </div>

            {form.isRecurring && (
              <div className="space-y-3 rounded-2xl border border-border bg-muted p-3">
                <div>
                  <label className="block text-xs font-medium text-foreground">
                    Pattern
                  </label>
                  <select
                    className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.recurrenceType}
                    onChange={(e) =>
                      handleChange(
                        'recurrenceType',
                        e.target.value as 'NONE' | 'DAILY' | 'WEEKLY'
                      )
                    }
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                  </select>
                </div>

                {form.recurrenceType === 'WEEKLY' && (
                  <div className="flex flex-wrap gap-1">
                    {WEEKDAYS.map((day) => {
                      const selected = form.recurrenceDays.includes(day)
                      return (
                        <button
                          key={day}
                          type="button"
                          className={`rounded-full border px-2 py-1 text-[10px] font-medium transition ${
                            selected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-card text-muted-foreground'
                          }`}
                          onClick={() => {
                            handleChange(
                              'recurrenceDays',
                              selected
                                ? form.recurrenceDays.filter((d) => d !== day)
                                : [...form.recurrenceDays, day]
                            )
                          }}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-foreground">
                    Repeat until
                  </label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.recurrenceEndDate || ''}
                    onChange={(e) =>
                      handleChange('recurrenceEndDate', e.target.value)
                    }
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Trips will be generated for each selected day until this
                    date (implementation to be handled in backend logic).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pricing
            </h3>
            <div>
              <label className="block text-xs font-medium text-foreground">
                Base price per seat (VND) *
              </label>
              <input
                type="number"
                required
                min={0}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={form.basePrice}
                onChange={(e) =>
                  handleChange(
                    'basePrice',
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {initialTrip ? 'Save changes' : 'Create trip'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminTripSchedulingPage
