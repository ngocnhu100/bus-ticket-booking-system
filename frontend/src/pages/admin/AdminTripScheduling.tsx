import React, { useState, useEffect } from 'react'
import {
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  AdminTablePagination,
  StatusBadge,
} from '@/components/admin/table'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorModal } from '@/components/ui/error-modal'
import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { FileX, Edit, SquareX, ChevronDown, ChevronRight } from 'lucide-react'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import { TripFilters } from '@/components/admin/TripFilters'
import { TripCalendarView } from '@/components/admin/TripCalendarView'
import { TripFormDrawer } from '@/components/admin/TripFormDrawer'
import { useAdminTrips } from '@/hooks/admin/useAdminTrips'
import type { TripData } from '@/types/adminTripTypes'
import '@/styles/admin.css'

// ============================================================================
// ADMIN TRIP SCHEDULING PAGE - REAL API INTEGRATION
// ============================================================================

const AdminTripSchedulingPage: React.FC = () => {
  // UI state
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'LIST'>('LIST')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<TripData | null>(null)
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false)
  const [confirmDialogConfig, setConfirmDialogConfig] = useState<{
    title: string
    message: string
    action: () => Promise<void>
  }>({
    title: '',
    message: '',
    action: async () => {},
  })

  // Filter state
  const [filters, setFilters] = useState<{
    page: number
    limit: number
    sort_by: string
    sort_order: 'asc' | 'desc'
    status?: string
    route_id?: string
    departure_date_from?: string
    departure_date_to?: string
  }>({
    page: 1,
    limit: 10,
    sort_by: 'departure_time',
    sort_order: 'asc',
  })

  // Bulk operations state
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([])
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null)

  // Use the admin trips hook
  const {
    trips,
    isLoading,
    error,
    pagination,
    fetchTrips,
    createTrip,
    updateTrip,
    deleteTrip,
    cancelTrip,
    updateTripStatus,
    clearError,
  } = useAdminTrips()

  // Update filtered trips when trips change
  const [filteredTrips, setFilteredTrips] = useState<TripData[]>([])
  useEffect(() => {
    setFilteredTrips(trips)
  }, [trips])

  const totalTrips = pagination.total

  // Map trip & buses status to badge status
  const getBadgeStatus = (
    status: string
  ): 'success' | 'danger' | 'default' | 'warning' => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'success'
      case 'cancelled':
        return 'danger'
      case 'in_progress':
        return 'warning'
      case 'scheduled':
        return 'default'
      default:
        return 'default'
    }
  }

  // Fetch trips on mount and when filters change
  useEffect(() => {
    fetchTrips(filters.page, filters.limit, filters)
  }, [fetchTrips, filters])

  /**
   * Handle create trip
   */
  const handleCreateClick = () => {
    setEditingTrip(null)
    setDrawerOpen(true)
  }

  /**
   * Handle edit trip
   */
  const handleEditTrip = (trip: TripData) => {
    setEditingTrip(trip)
    setDrawerOpen(true)
  }

  /**
   * Handle save trip (create or update)
   */
  const handleSaveTrip = async (
    tripData: TripCreateRequest | TripUpdateRequest
  ) => {
    if (editingTrip) {
      // Update existing trip
      await updateTrip(editingTrip.trip_id, tripData)
    } else {
      // Create new trip
      await createTrip(tripData)
    }

    setDrawerOpen(false)
    setEditingTrip(null)
  }

  /**
   * Handle select single trip
   */
  const handleSelectTrip = (tripId: string, selected: boolean) => {
    if (selected) {
      setSelectedTripIds((prev) => [...prev, tripId])
    } else {
      setSelectedTripIds((prev) => prev.filter((id) => id !== tripId))
    }
  }

  /**
   * Handle apply filters
   */
  const handleApplyFilters = (newFilters: TripFilterParams) => {
    setFilters({
      ...newFilters,
      page: 1,
    })
    fetchTrips(1, newFilters.limit || 10, newFilters)
  }

  /**
   * Handle clear filters
   */
  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sort_by: 'departure_time',
      sort_order: 'asc',
    })
  }

  /**
   * Handle bulk status update
   */
  const handleBulkStatusUpdate = async (
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  ) => {
    if (selectedTripIds.length === 0) return

    for (const tripId of selectedTripIds) {
      await updateTripStatus(tripId, { status })
    }
    // Refresh trips
    await fetchTrips()
    setSelectedTripIds([])
  }

  /**
   * Handle bulk delete
   */
  /**
   * Handle bulk delete
   */
  const handleBulkDelete = () => {
    if (selectedTripIds.length === 0) return

    setConfirmDialogConfig({
      title: 'Delete Trips',
      message: `Are you sure you want to delete ${selectedTripIds.length} trip(s)? This action cannot be undone.`,
      action: async () => {
        for (const tripId of selectedTripIds) {
          await deleteTrip(tripId)
        }
        setSelectedTripIds([])
        setOpenConfirmDialog(false)
      },
    })
    setOpenConfirmDialog(true)
  }

  /**
   * Handle cancel trip
   */
  const handleCancelTrip = async (tripId: string) => {
    setConfirmDialogConfig({
      title: 'Cancel Trip',
      message:
        'Are you sure you want to cancel this trip? This will automatically process refunds for all confirmed bookings.',
      action: async () => {
        await cancelTrip(tripId, { process_refunds: true })
        setOpenConfirmDialog(false)
      },
    })
    setOpenConfirmDialog(true)
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
          <button
            onClick={handleCreateClick}
            disabled={isLoading}
            className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor =
                  'color-mix(in srgb, var(--primary) 90%, black)'
              }
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
                onClick={() => handleBulkStatusUpdate('scheduled')}
                disabled={isLoading}
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 min-w-0 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor =
                      'color-mix(in srgb, var(--primary) 90%, black)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)'
                }}
              >
                Schedule
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('cancelled')}
                disabled={isLoading}
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 min-w-0 disabled:opacity-50"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = 'var(--muted)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--card)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isLoading}
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 min-w-0 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--muted)',
                  color: 'var(--muted-foreground)',
                  border: '1px solid var(--border)',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = 'var(--accent)'
                    e.currentTarget.style.color = 'var(--accent-foreground)'
                  }
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
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left: Filters */}
        <div className="space-y-6 xl:col-span-1">
          <TripFilters
            filters={filters}
            onFiltersChange={handleApplyFilters}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Right: Trip Table / Calendar View */}
        <div className="xl:col-span-3">
          <div
            className="flex flex-col rounded-2xl p-6 shadow-sm min-h-150"
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

              <span
                className="text-sm"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {filteredTrips.length} trips
              </span>
            </div>

            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <AdminLoadingSpinner />
              ) : filteredTrips.length === 0 ? (
                <AdminEmptyState
                  icon={FileX}
                  title="No trips found"
                  description="Try adjusting your filters or create a new trip."
                />
              ) : viewMode === 'CALENDAR' ? (
                <TripCalendarView
                  trips={filteredTrips}
                  onEditTrip={handleEditTrip}
                />
              ) : (
                <div>
                  <AdminTable
                    columns={[
                      { key: 'select', label: '', align: 'center' },
                      { key: 'route', label: 'Route' },
                      { key: 'bus', label: 'Bus' },
                      { key: 'departure_time', label: 'Departure Time' },
                      { key: 'bookings', label: 'Bookings' },
                      { key: 'status', label: 'Status' },
                      { key: 'actions', label: 'Actions' },
                    ]}
                  >
                    {filteredTrips.map((trip) => (
                      <React.Fragment key={trip.trip_id}>
                        <AdminTableRow
                          onClick={() =>
                            setExpandedTripId(
                              expandedTripId === trip.trip_id
                                ? null
                                : trip.trip_id
                            )
                          }
                          className="hover:bg-muted/30 cursor-pointer transition-colors"
                        >
                          <AdminTableCell>
                            <div className="flex items-center gap-2">
                              <div className="mr-1">
                                {expandedTripId === trip.trip_id ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <input
                                type="checkbox"
                                checked={selectedTripIds.includes(trip.trip_id)}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  handleSelectTrip(
                                    trip.trip_id,
                                    e.target.checked
                                  )
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </AdminTableCell>
                          <AdminTableCell>
                            {trip.route?.origin} - {trip.route?.destination}
                          </AdminTableCell>
                          <AdminTableCell>
                            {trip.bus?.plate_number}
                          </AdminTableCell>
                          <AdminTableCell>
                            {new Date(
                              trip.schedule.departure_time
                            ).toLocaleString()}
                          </AdminTableCell>
                          <AdminTableCell align="center">
                            {trip.bookings || 0}
                          </AdminTableCell>
                          <AdminTableCell>
                            <StatusBadge
                              status={getBadgeStatus(trip.status)}
                              label={
                                trip.status[0].toUpperCase() +
                                trip.status.slice(1)
                              }
                            />
                          </AdminTableCell>
                          <AdminTableCell>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditTrip(trip)
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCancelTrip(trip.trip_id)
                                }}
                                className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                                title="Cancel"
                              >
                                <SquareX size={16} />
                              </button>
                            </div>
                          </AdminTableCell>
                        </AdminTableRow>
                        {expandedTripId === trip.trip_id && (
                          <AdminTableRow>
                            <td colSpan={7} className="bg-muted/30 px-6 py-4">
                              <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-6">
                                  <div>
                                    <h4 className="text-sm font-medium text-foreground mb-2">
                                      Trip ID
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {trip.trip_id}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium text-foreground mb-2">
                                      Bus
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {trip.bus?.model || 'N/A'} (
                                      {trip.bus?.plate_number})
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium text-foreground mb-2">
                                      Price
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {trip.pricing?.base_price?.toLocaleString() ||
                                        'N/A'}{' '}
                                      đ
                                    </p>
                                  </div>
                                </div>

                                <div className="border-t border-border pt-4">
                                  <h4 className="text-sm font-medium text-foreground mb-3">
                                    Policies
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="p-3 bg-card rounded-lg border border-border">
                                      <h5 className="text-xs font-semibold text-foreground mb-1 uppercase">
                                        Cancellation Policy
                                      </h5>
                                      <p className="text-sm text-muted-foreground">
                                        {trip.policies?.cancellation_policy ||
                                          'No policy defined'}
                                      </p>
                                    </div>
                                    <div className="p-3 bg-card rounded-lg border border-border">
                                      <h5 className="text-xs font-semibold text-foreground mb-1 uppercase">
                                        Modification Policy
                                      </h5>
                                      <p className="text-sm text-muted-foreground">
                                        {trip.policies?.modification_policy ||
                                          'No policy defined'}
                                      </p>
                                    </div>
                                    <div className="p-3 bg-card rounded-lg border border-border">
                                      <h5 className="text-xs font-semibold text-foreground mb-1 uppercase">
                                        Refund Policy
                                      </h5>
                                      <p className="text-sm text-muted-foreground">
                                        {trip.policies?.refund_policy ||
                                          'No policy defined'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </AdminTableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </AdminTable>
                  <AdminTablePagination
                    currentPage={filters.page}
                    totalPages={Math.ceil(totalTrips / filters.limit)}
                    total={totalTrips}
                    onPageChange={(page) =>
                      setFilters((prev) => ({ ...prev, page }))
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <TripFormDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false)
            setEditingTrip(null)
          }}
          initialTrip={editingTrip}
          onSave={handleSaveTrip}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
        onConfirm={confirmDialogConfig.action}
        title={confirmDialogConfig.title}
        message={confirmDialogConfig.message}
      />

      {/* Error Modal */}
      <ErrorModal
        open={!!error}
        onClose={clearError}
        title="Error"
        message={error || ''}
      />
    </DashboardLayout>
  )
}

export default AdminTripSchedulingPage
