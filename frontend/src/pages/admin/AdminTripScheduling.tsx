import React, { useState } from 'react'
import type {
  Trip,
  RouteAdminData,
  BusAdminData,
  TripFormData,
} from '../../types/trip.types'
import '@/styles/admin.css'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import { TripFilters } from '@/components/admin/TripFilters'
import { TripList } from '@/components/admin/TripList'
import { TripCalendarView } from '@/components/admin/TripCalendarView'
import { TripTableView } from '@/components/admin/TripTableView'
import { TripFormDrawer } from '@/components/admin/TripFormDrawer'
import { CustomDatePicker } from '@/components/ui/custom-datepicker'

// ============================================================================
// MOCK DATA
// ============================================================================

const initialRoutes: RouteAdminData[] = [
  {
    routeId: 'r1',
    operatorId: 'op-001',
    origin: 'Ho Chi Minh City',
    destination: 'Da Lat',
    distanceKm: 308,
    estimatedMinutes: 360,
    pickupPoints: [
      {
        pointId: 'p1',
        name: 'Ben Thanh Station',
        address: 'Ben Thanh, District 1',
        time: '08:00',
      },
    ],
    dropoffPoints: [
      {
        pointId: 'd1',
        name: 'Da Lat Station',
        address: 'District 1',
        time: '14:00',
      },
    ],
  },
  {
    routeId: 'r2',
    operatorId: 'op-001',
    origin: 'Ho Chi Minh City',
    destination: 'Nha Trang',
    distanceKm: 450,
    estimatedMinutes: 480,
    pickupPoints: [
      {
        pointId: 'p2',
        name: 'Ben Thanh Station',
        address: 'Ben Thanh, District 1',
        time: '06:30',
      },
    ],
    dropoffPoints: [
      {
        pointId: 'd2',
        name: 'Nha Trang Station',
        address: 'Nha Trang City',
        time: '11:00',
      },
    ],
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
    tripId: 'trp_xyz789',
    route: {
      routeId: 'r1',
      origin: 'Ho Chi Minh City',
      destination: 'Da Lat',
      distanceKm: 308,
      estimatedMinutes: 360,
    },
    operator: {
      operatorId: 'opr_futa',
      name: 'Futa Bus Lines',
      rating: 4.5,
      logo: 'https://cdn.example.com/futa-logo.png',
    },
    bus: {
      busId: 'b1',
      model: 'Limousine 20-seat',
      plateNumber: '51B-12345',
      seatCapacity: 20,
      busType: 'limousine',
      amenities: ['wifi', 'ac', 'toilet', 'entertainment'],
    },
    schedule: {
      departureTime: '2025-11-30T08:00:00Z',
      arrivalTime: '2025-11-30T12:30:00Z',
      duration: 270,
    },
    pricing: {
      basePrice: 350000,
      currency: 'VND',
      serviceFee: 10000,
    },
    availability: {
      totalSeats: 20,
      availableSeats: 8,
      occupancyRate: 60,
    },
    policies: {
      cancellationPolicy: 'free cancellation up to 24 hours before departure',
      modificationPolicy: 'modification allowed up to 12 hours before',
      refundPolicy: '80% refund if cancelled 24h+ before departure',
    },
    pickupPoints: [
      {
        pointId: 'pp_001',
        name: 'Ben Xe Mien Dong',
        address: '292 Dinh Bo Linh, Binh Thanh, HCM',
        time: '2025-11-30T08:00:00Z',
      },
    ],
    dropoffPoints: [
      {
        pointId: 'dp_001',
        name: 'Ben Xe My Dinh',
        address: 'Pham Hung, Nam Tu Liem, Hanoi',
        time: '2025-11-30T12:30:00Z',
      },
    ],
    status: 'active',
  },
  {
    tripId: 'trp_abc123',
    route: {
      routeId: 'r1',
      origin: 'Ho Chi Minh City',
      destination: 'Da Lat',
      distanceKm: 308,
      estimatedMinutes: 360,
    },
    operator: {
      operatorId: 'op-001',
      name: 'Futa Bus Lines',
      rating: 4.5,
    },
    bus: {
      busId: 'b2',
      model: 'Sleeper 40-seat',
      plateNumber: '51B-67890',
      seatCapacity: 40,
      busType: 'sleeper',
      amenities: ['wifi', 'ac', 'toilet', 'entertainment', 'bed'],
    },
    schedule: {
      departureTime: '2025-11-30T14:00:00Z',
      arrivalTime: '2025-11-30T18:15:00Z',
      duration: 255,
    },
    pricing: {
      basePrice: 300000,
      currency: 'VND',
      serviceFee: 10000,
    },
    availability: {
      totalSeats: 40,
      availableSeats: 12,
      occupancyRate: 70,
    },
    policies: {
      cancellationPolicy: 'free cancellation up to 24 hours before departure',
      modificationPolicy: 'modification allowed up to 12 hours before',
      refundPolicy: '80% refund if cancelled 24h+ before departure',
    },
    pickupPoints: [
      {
        pointId: 'pp_002',
        name: 'Ben Xe Mien Dong',
        address: '292 Dinh Bo Linh, Binh Thanh, HCM',
        time: '2025-11-30T14:00:00Z',
      },
    ],
    dropoffPoints: [
      {
        pointId: 'dp_002',
        name: 'Ben Xe My Dinh',
        address: 'Pham Hung, Nam Tu Liem, Hanoi',
        time: '2025-11-30T18:15:00Z',
      },
    ],
    status: 'active',
  },
  {
    tripId: 'trp_def456',
    route: {
      routeId: 'r2',
      origin: 'Ho Chi Minh City',
      destination: 'Nha Trang',
      distanceKm: 441,
      estimatedMinutes: 420,
    },
    operator: {
      operatorId: 'opr_futa',
      name: 'Futa Bus Lines',
      rating: 4.5,
      logo: 'https://cdn.example.com/futa-logo.png',
    },
    bus: {
      busId: 'b1',
      model: 'Limousine 20-seat',
      plateNumber: '51B-12345',
      seatCapacity: 20,
      busType: 'limousine',
      amenities: ['wifi', 'ac', 'toilet', 'entertainment'],
    },
    schedule: {
      departureTime:
        new Date(Date.now() + 86400000).toISOString().split('T')[0] +
        'T06:30:00Z',
      arrivalTime:
        new Date(Date.now() + 86400000).toISOString().split('T')[0] +
        'T11:00:00Z',
      duration: 270,
    },
    pricing: {
      basePrice: 400000,
      currency: 'VND',
      serviceFee: 10000,
    },
    availability: {
      totalSeats: 20,
      availableSeats: 5,
      occupancyRate: 75,
    },
    policies: {
      cancellationPolicy: 'free cancellation up to 24 hours before departure',
      modificationPolicy: 'modification allowed up to 12 hours before',
      refundPolicy: '80% refund if cancelled 24h+ before departure',
    },
    pickupPoints: [
      {
        pointId: 'pp_003',
        name: 'Ben Xe Mien Dong',
        address: '292 Dinh Bo Linh, Binh Thanh, HCM',
        time:
          new Date(Date.now() + 86400000).toISOString().split('T')[0] +
          'T06:30:00Z',
      },
    ],
    dropoffPoints: [
      {
        pointId: 'dp_003',
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
  const validateTripForm = (form: TripFormData): string[] => {
    const errors: string[] = []

    // Required fields
    if (!form.routeId) errors.push('Route is required')
    if (!form.busId) errors.push('Bus is required')
    if (!form.departureTime) errors.push('Departure time is required')
    if (!form.arrivalTime) errors.push('Arrival time is required')
    if (form.basePrice < 0) errors.push('Base price must be positive')

    // Time validation
    if (form.departureTime && form.arrivalTime) {
      const depTime = form.departureTime
      const arrTime = form.arrivalTime
      if (depTime >= arrTime) {
        errors.push('Arrival time must be after departure time')
      }
    }

    return errors
  }

  // Filter and get trips for selected date
  const filteredTrips = trips.filter((trip) => {
    if (selectedDate) {
      const tripDate = new Date(trip.schedule.departureTime)
      const selected = new Date(selectedDate)
      if (tripDate.toDateString() !== selected.toDateString()) return false
    }

    if (appliedFilters.routeId && trip.route.routeId !== appliedFilters.routeId)
      return false
    if (appliedFilters.busId && trip.bus.busId !== appliedFilters.busId)
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

  const handleSaveTrip = (values: TripFormData) => {
    // Validate form
    const validationErrors = validateTripForm(values)
    if (validationErrors.length > 0) {
      alert(`Validation errors:\n${validationErrors.join('\n')}`)
      return
    }

    if (values.tripId) {
      // Update existing trip
      setTrips((prev) =>
        prev.map((t) => {
          if (t.tripId === values.tripId) {
            const route = routes.find((r) => r.routeId === values.routeId)
            const bus = buses.find((b) => b.busId === values.busId)
            if (!route || !bus) return t

            const depParts = values.departureTime.split(':')
            const arrParts = values.arrivalTime.split(':')
            const depMinutes =
              parseInt(depParts[0]) * 60 + parseInt(depParts[1])
            const arrMinutes =
              parseInt(arrParts[0]) * 60 + parseInt(arrParts[1])
            const duration =
              arrMinutes > depMinutes
                ? arrMinutes - depMinutes
                : 1440 + arrMinutes - depMinutes

            return {
              ...t,
              route: {
                routeId: values.routeId,
                origin: route.origin,
                destination: route.destination,
                distanceKm: route.distanceKm,
                estimatedMinutes: route.estimatedMinutes,
              },
              bus: {
                busId: values.busId,
                model: bus.model,
                plateNumber: bus.plateNumber,
                seatCapacity: bus.capacity,
                busType: bus.type,
                amenities: bus.amenities,
              },
              schedule: {
                departureTime: values.departureTime,
                arrivalTime: values.arrivalTime,
                duration: duration,
              },
              pricing: {
                ...t.pricing,
                basePrice: values.basePrice,
              },
              status: values.status,
            }
          }
          return t
        })
      )
    } else {
      // Create new trip
      const route = routes.find((r) => r.routeId === values.routeId)
      const bus = buses.find((b) => b.busId === values.busId)
      if (!route || !bus) return

      const depParts = values.departureTime.split(':')
      const arrParts = values.arrivalTime.split(':')
      const depMinutes = parseInt(depParts[0]) * 60 + parseInt(depParts[1])
      const arrMinutes = parseInt(arrParts[0]) * 60 + parseInt(arrParts[1])
      const duration =
        arrMinutes > depMinutes
          ? arrMinutes - depMinutes
          : 1440 + arrMinutes - depMinutes

      const newTrip: Trip = {
        tripId: crypto.randomUUID(),
        route: {
          routeId: values.routeId,
          origin: route.origin,
          destination: route.destination,
          distanceKm: route.distanceKm,
          estimatedMinutes: route.estimatedMinutes,
        },
        operator: {
          operatorId: 'op-001',
          name: 'Default Operator',
          rating: 4.0,
        },
        bus: {
          busId: values.busId,
          model: bus.model,
          plateNumber: bus.plateNumber,
          seatCapacity: bus.capacity,
          busType: bus.type,
          amenities: bus.amenities,
        },
        schedule: {
          departureTime: values.departureTime,
          arrivalTime: values.arrivalTime,
          duration: duration,
        },
        pricing: {
          basePrice: values.basePrice,
          currency: 'VND',
        },
        availability: {
          totalSeats: bus.capacity,
          availableSeats: bus.capacity,
          occupancyRate: 0,
        },
        policies: {
          cancellationPolicy:
            'free cancellation up to 24 hours before departure',
          modificationPolicy: 'modification allowed up to 12 hours before',
          refundPolicy: '80% refund if cancelled 24h+ before departure',
        },
        pickupPoints: [],
        dropoffPoints: [],
        status: values.status,
      }
      setTrips((prev) => [...prev, newTrip])
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
      setSelectedTripIds(filteredTrips.map((trip) => trip.tripId))
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
        prev.filter((trip) => !selectedTripIds.includes(trip.tripId))
      )
      setSelectedTripIds([])
    }
  }

  const handleBulkStatusUpdate = (newStatus: 'ACTIVE' | 'INACTIVE') => {
    if (selectedTripIds.length === 0) return

    const statusValue = newStatus === 'ACTIVE' ? 'active' : 'inactive'
    setTrips((prev) =>
      prev.map((trip) =>
        selectedTripIds.includes(trip.tripId)
          ? { ...trip, status: statusValue }
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

export default AdminTripSchedulingPage
