import React, { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAdminTripData } from '@/hooks/admin/useAdminTrip'
import type { Trip, RouteAdminData, BusAdminData } from '../../types/trip.types'
import '@/styles/admin.css'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import { TripFilters } from '@/components/admin/TripFilters'
import { TripList } from '@/components/admin/TripList'
import { TripCalendarView } from '@/components/admin/TripCalendarView'
import { TripTableView } from '@/components/admin/TripTableView'
import { TripFormDrawer } from '@/components/admin/TripFormDrawer'
import { CustomDatePicker } from '@/components/ui/custom-datepicker'

// ============================================================================
// API CONFIGURATION
// ============================================================================
// MOCK DATA (Fallback only)
// ============================================================================

const initialRoutes: RouteAdminData[] = [
  {
    route_id: 'r1',
    operator_id: 'op-001',
    origin: 'Ho Chi Minh City',
    destination: 'Da Lat',
    distance_km: 308,
    estimated_minutes: 360,
    pickup_points: [
      {
        point_id: 'p1',
        name: 'Ben Thanh Station',
        address: 'Ben Thanh, District 1',
        time: '08:00',
      },
    ],
    dropoff_points: [
      {
        point_id: 'd1',
        name: 'Da Lat Station',
        address: 'District 1',
        time: '14:00',
      },
    ],
    route_stops: [],
  },
  {
    route_id: 'r2',
    operator_id: 'op-001',
    origin: 'Ho Chi Minh City',
    destination: 'Nha Trang',
    distance_km: 450,
    estimated_minutes: 480,
    pickup_points: [
      {
        point_id: 'p2',
        name: 'Ben Thanh Station',
        address: 'Ben Thanh, District 1',
        time: '06:30',
      },
    ],
    dropoff_points: [
      {
        point_id: 'd2',
        name: 'Nha Trang Station',
        address: 'Nha Trang City',
        time: '11:00',
      },
    ],
    route_stops: [],
  },
]

const initialBuses: BusAdminData[] = [
  {
    busId: 'b1',
    name: 'Limousine 20-seat',
    type: 'limousine',
    capacity: 20,
    model: 'Hyundai Universe Limousine',
    plateNumber: '51B-12345',
    amenities: ['WiFi', 'AC', 'Toilet', 'Entertainment'],
    status: 'active',
  },
  {
    busId: 'b2',
    name: 'Sleeper 40-seat',
    type: 'sleeper',
    capacity: 40,
    model: 'Thaco Universe Sleeper',
    plateNumber: '51B-12346',
    amenities: ['WiFi', 'AC', 'Sleeping Beds', 'Toilet'],
    status: 'active',
  },
]

// Trips data structure reflecting GET /trips/search response format from API
const initialTrips: Trip[] = [
  {
    trip_id: 'trp_xyz789',
    route: {
      route_id: 'r1',
      origin: 'Ho Chi Minh City',
      destination: 'Da Lat',
      distance_km: 308,
      estimated_minutes: 360,
    },
    operator: {
      operator_id: 'opr_futa',
      name: 'Futa Bus Lines',
      rating: 4.5,
      logo: 'https://cdn.example.com/futa-logo.png',
    },
    bus: {
      bus_id: 'b1',
      model: 'Limousine 20-seat',
      plate_number: '51B-12345',
      seat_capacity: 20,
      bus_type: 'limousine',
      amenities: ['wifi', 'ac', 'toilet', 'entertainment'],
    },
    schedule: {
      departure_time: '2025-11-30T08:00:00Z',
      arrival_time: '2025-11-30T12:30:00Z',
      duration: 270,
    },
    pricing: {
      base_price: 350000,
      currency: 'VND',
      service_fee: 10000,
    },
    availability: {
      total_seats: 20,
      available_seats: 8,
      occupancy_rate: 60,
    },
    policies: {
      cancellation_policy: 'free cancellation up to 24 hours before departure',
      modification_policy: 'modification allowed up to 12 hours before',
      refund_policy: '80% refund if cancelled 24h+ before departure',
    },
    pickup_points: [
      {
        point_id: 'pp_001',
        name: 'Ben Xe Mien Dong',
        address: '292 Dinh Bo Linh, Binh Thanh, HCM',
        time: '2025-11-30T08:00:00Z',
      },
    ],
    dropoff_points: [
      {
        point_id: 'dp_001',
        name: 'Ben Xe My Dinh',
        address: 'Pham Hung, Nam Tu Liem, Hanoi',
        time: '2025-11-30T12:30:00Z',
      },
    ],
    status: 'active',
  },
  {
    trip_id: 'trp_abc123',
    route: {
      route_id: 'r1',
      origin: 'Ho Chi Minh City',
      destination: 'Da Lat',
      distance_km: 308,
      estimated_minutes: 360,
    },
    operator: {
      operator_id: 'op-001',
      name: 'Futa Bus Lines',
      rating: 4.5,
    },
    bus: {
      bus_id: 'b2',
      model: 'Sleeper 40-seat',
      plate_number: '51B-67890',
      seat_capacity: 40,
      bus_type: 'sleeper',
      amenities: ['wifi', 'ac', 'toilet', 'entertainment', 'bed'],
    },
    schedule: {
      departure_time: '2025-11-30T14:00:00Z',
      arrival_time: '2025-11-30T18:15:00Z',
      duration: 255,
    },
    pricing: {
      base_price: 300000,
      currency: 'VND',
      service_fee: 10000,
    },
    availability: {
      total_seats: 40,
      available_seats: 12,
      occupancy_rate: 70,
    },
    policies: {
      cancellation_policy: 'free cancellation up to 24 hours before departure',
      modification_policy: 'modification allowed up to 12 hours before',
      refund_policy: '80% refund if cancelled 24h+ before departure',
    },
    pickup_points: [
      {
        point_id: 'pp_002',
        name: 'Ben Xe Mien Dong',
        address: '292 Dinh Bo Linh, Binh Thanh, HCM',
        time: '2025-11-30T14:00:00Z',
      },
    ],
    dropoff_points: [
      {
        point_id: 'dp_002',
        name: 'Ben Xe My Dinh',
        address: 'Pham Hung, Nam Tu Liem, Hanoi',
        time: '2025-11-30T18:15:00Z',
      },
    ],
    status: 'active',
  },
  {
    trip_id: 'trp_def456',
    route: {
      route_id: 'r2',
      origin: 'Ho Chi Minh City',
      destination: 'Nha Trang',
      distance_km: 441,
      estimated_minutes: 420,
    },
    operator: {
      operator_id: 'opr_futa',
      name: 'Futa Bus Lines',
      rating: 4.5,
      logo: 'https://cdn.example.com/futa-logo.png',
    },
    bus: {
      bus_id: 'b1',
      model: 'Limousine 20-seat',
      plate_number: '51B-12345',
      seat_capacity: 20,
      bus_type: 'limousine',
      amenities: ['wifi', 'ac', 'toilet', 'entertainment'],
    },
    schedule: {
      departure_time:
        new Date(Date.now() + 86400000).toISOString().split('T')[0] +
        'T06:30:00Z',
      arrival_time:
        new Date(Date.now() + 86400000).toISOString().split('T')[0] +
        'T11:00:00Z',
      duration: 270,
    },
    pricing: {
      base_price: 400000,
      currency: 'VND',
      service_fee: 10000,
    },
    availability: {
      total_seats: 20,
      available_seats: 5,
      occupancy_rate: 75,
    },
    policies: {
      cancellation_policy: 'free cancellation up to 24 hours before departure',
      modification_policy: 'modification allowed up to 12 hours before',
      refund_policy: '80% refund if cancelled 24h+ before departure',
    },
    pickup_points: [
      {
        point_id: 'pp_003',
        name: 'Ben Xe Mien Dong',
        address: '292 Dinh Bo Linh, Binh Thanh, HCM',
        time:
          new Date(Date.now() + 86400000).toISOString().split('T')[0] +
          'T06:30:00Z',
      },
    ],
    dropoff_points: [
      {
        point_id: 'dp_003',
        name: 'Ben Xe My Dinh',
        address: 'Pham Hung, Nam Tu Liem, Hanoi',
        time:
          new Date(Date.now() + 86400000).toISOString().split('T')[0] +
          'T11:00:00Z',
      },
    ],
    status: 'active',
  },
]

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

const AdminTripSchedulingPage: React.FC = () => {
  const { trips, buses, routes, createTrip, updateTrip, deleteTrip } =
    useAdminTripData(initialTrips, initialBuses, initialRoutes)

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'LIST'>('CALENDAR')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false)
  const [dialogMessage, setDialogMessage] = useState('')

  // Filter state
  const [filters, setFilters] = useState({
    routeId: '',
    busId: '',
    status: '',
  })
  const [appliedFilters, setAppliedFilters] = useState({
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

  // Validation
  const validateTripForm = (form: Trip): string[] => {
    const errors: string[] = []

    // Required fields
    if (!form.route.route_id) errors.push('Route is required')
    if (!form.bus.bus_id) errors.push('Bus is required')
    if (!form.schedule.departure_time) errors.push('Departure time is required')
    if (!form.schedule.arrival_time) errors.push('Arrival time is required')
    if (form.pricing.base_price < 0) errors.push('Base price must be positive')

    // Time validation
    if (form.schedule.departure_time && form.schedule.arrival_time) {
      const depTime = form.schedule.departure_time
      const arrTime = form.schedule.arrival_time
      if (depTime >= arrTime) {
        errors.push('Arrival time must be after departure time')
      }
    }

    return errors
  }

  // Filter and get trips for selected date
  const filteredTrips = trips.filter((trip) => {
    if (selectedDate) {
      const tripDate = new Date(trip.schedule.departure_time)
      const selected = new Date(selectedDate)
      if (tripDate.toDateString() !== selected.toDateString()) return false
    }

    if (
      appliedFilters.routeId &&
      trip.route.route_id !== appliedFilters.routeId
    )
      return false
    if (appliedFilters.busId && trip.bus.bus_id !== appliedFilters.busId)
      return false
    if (
      appliedFilters.status &&
      trip.status !== appliedFilters.status.toLowerCase()
    )
      return false

    return true
  })

  const handleApplyFilters = () => {
    setAppliedFilters(filters)
  }

  const handleClearFilters = () => {
    setFilters({
      routeId: '',
      busId: '',
      status: '',
    })
    setAppliedFilters({
      routeId: '',
      busId: '',
      status: '',
    })
  }

  const handleSaveTrip = async (data: {
    trip: Trip
    isRecurring: boolean
    recurrencePattern: string
    repeatBasedOn: 'departure' | 'arrival'
    endsOn: 'never' | 'date'
    endDate: string
  }) => {
    const {
      trip,
      isRecurring,
      recurrencePattern,
      repeatBasedOn,
      endsOn,
      endDate,
    } = data
    // Validate form
    const validationErrors = validateTripForm(trip)
    if (validationErrors.length > 0) {
      return
    }

    if (isRecurring && recurrencePattern) {
      // Generate and post recurring trips
      const baseTrip = { ...trip }
      const baseTime =
        repeatBasedOn === 'departure'
          ? baseTrip.schedule.departure_time
          : baseTrip.schedule.arrival_time
      const startDate = new Date(baseTime)
      const endDateObj =
        endsOn === 'date' && endDate
          ? new Date(endDate)
          : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year if never

      const currentDate = new Date(startDate)
      while (currentDate <= endDateObj) {
        const newTrip = { ...baseTrip }
        newTrip.trip_id = `${baseTrip.trip_id}_${currentDate.toISOString().split('T')[0]}`
        if (repeatBasedOn === 'departure') {
          newTrip.schedule.departure_time = currentDate.toISOString()
          const arrTime = new Date(currentDate)
          arrTime.setMinutes(arrTime.getMinutes() + baseTrip.schedule.duration)
          newTrip.schedule.arrival_time = arrTime.toISOString()
          newTrip.pickup_points = newTrip.pickup_points.map((p) => ({
            ...p,
            time: currentDate.toISOString(),
          }))
          newTrip.dropoff_points = newTrip.dropoff_points.map((d) => ({
            ...d,
            time: arrTime.toISOString(),
          }))
        } else {
          // repeatBasedOn === 'arrival'
          newTrip.schedule.arrival_time = currentDate.toISOString()
          const depTime = new Date(currentDate)
          depTime.setMinutes(depTime.getMinutes() - baseTrip.schedule.duration)
          newTrip.schedule.departure_time = depTime.toISOString()
          newTrip.pickup_points = newTrip.pickup_points.map((p) => ({
            ...p,
            time: depTime.toISOString(),
          }))
          newTrip.dropoff_points = newTrip.dropoff_points.map((d) => ({
            ...d,
            time: currentDate.toISOString(),
          }))
        }
        try {
          await createTrip(newTrip)
        } catch (error) {
          console.error('Failed to create recurring trip:', error)
          // Stop the entire series on the first error
          break
        }

        // Increment date
        if (recurrencePattern === 'daily') {
          currentDate.setDate(currentDate.getDate() + 1)
        } else if (recurrencePattern === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7)
        }
      }
    } else {
      if (trip.trip_id) {
        // Update existing trip
        await updateTrip(trip.trip_id, trip)
      } else {
        // Create new trip
        await createTrip(trip)
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
      setSelectedTripIds(filteredTrips.map((trip) => trip.trip_id))
    } else {
      setSelectedTripIds([])
    }
  }

  const handleBulkDelete = () => {
    if (selectedTripIds.length === 0) return

    setDialogMessage(
      `Are you sure you want to delete ${selectedTripIds.length} trip(s)? This action cannot be undone.`
    )
    setOpenConfirmDialog(true)
  }

  const handleConfirmDelete = async () => {
    for (const tripId of selectedTripIds) {
      try {
        await deleteTrip(tripId)
      } catch (error) {
        console.error(`Failed to delete trip ${tripId}:`, error)
        // Continue with next trip
      }
    }
    setSelectedTripIds([])
    setOpenConfirmDialog(false)
  }

  const handleBulkStatusUpdate = async (newStatus: 'ACTIVE' | 'INACTIVE') => {
    if (selectedTripIds.length === 0) return

    const statusValue = newStatus === 'ACTIVE' ? 'active' : 'inactive'
    for (const tripId of selectedTripIds) {
      const trip = trips.find((t) => t.trip_id === tripId)
      if (trip) {
        try {
          await updateTrip(tripId, { ...trip, status: statusValue })
        } catch (error) {
          console.error(`Failed to update status for trip ${tripId}:`, error)
          // Continue with next trip
        }
      }
    }
    setSelectedTripIds([])
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: 'var(--foreground)' }}
          >
            Trip Scheduling
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Create, edit, and manage trip schedules for all routes and buses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CustomDatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => setSelectedDate(date)}
            dateFormat="EEEE, MMMM d, yyyy"
            placeholderText="Select date"
            className="w-64"
          />
          <button
            onClick={handleCreateClick}
            className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2"
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
            + Create Trip
          </button>
        </div>
      </div>

      {/* Bulk Operations Bar */}
      {selectedTripIds.length > 0 && (
        <div
          className="mb-6 rounded-xl p-4 shadow-sm"
          style={{
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                {selectedTripIds.length} trip
                {selectedTripIds.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedTripIds([])}
                className="text-sm underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded px-2 py-1"
                style={{
                  color: 'var(--muted-foreground)',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--foreground)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--muted-foreground)'
                }}
              >
                Clear selection
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => handleBulkStatusUpdate('ACTIVE')}
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 min-w-0"
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
                Activate
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('INACTIVE')}
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 min-w-0"
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
                Deactivate
              </button>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 min-w-0"
                style={{
                  backgroundColor: 'var(--muted)',
                  color: 'var(--muted-foreground)',
                  border: '1px solid var(--border)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--accent-foreground)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--muted)'
                  e.currentTarget.style.color = 'var(--muted-foreground)'
                }}
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
        <div
          className="flex h-full flex-col rounded-2xl p-6 shadow-sm"
          style={{
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
          }}
        >
          <div className="mb-6 flex items-center justify-between">
            <div
              className="inline-flex rounded-full p-1"
              style={{
                border: '1px solid var(--border)',
                backgroundColor: 'var(--muted)',
              }}
            >
              <button
                className={`rounded-full px-4 py-2 transition ${
                  viewMode === 'CALENDAR' ? 'shadow-sm' : ''
                }`}
                style={{
                  backgroundColor:
                    viewMode === 'CALENDAR' ? 'var(--card)' : 'transparent',

                  color:
                    viewMode === 'CALENDAR'
                      ? 'var(--foreground)'
                      : 'var(--muted-foreground)',
                }}
                onClick={() => setViewMode('CALENDAR')}
              >
                Calendar
              </button>
              <button
                className={`rounded-full px-4 py-2 transition ${
                  viewMode === 'LIST' ? 'shadow-sm' : ''
                }`}
                style={{
                  backgroundColor:
                    viewMode === 'LIST' ? 'var(--card)' : 'transparent',
                  color:
                    viewMode === 'LIST'
                      ? 'var(--foreground)'
                      : 'var(--muted-foreground)',
                }}
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
                onEditTrip={handleEditTrip}
              />
            )}
          </div>
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <TripFormDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false)
          }}
          routes={routes}
          buses={buses}
          initialTrip={editingTrip}
          onSave={handleSaveTrip}
        />
      )}

      <ConfirmDialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={dialogMessage}
      />
    </DashboardLayout>
  )
}

export default AdminTripSchedulingPage
