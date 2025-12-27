import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  ArrowRight,
  Filter,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import type { RouteAdminData } from '@/types/trip.types'
import { useAdminRoutes } from '@/hooks/admin/useAdminRoutes'
import { useToast } from '@/hooks/use-toast'
import { RouteFormDrawer } from '@/components/admin/RouteFormDrawer'
import {
  AdminTablePagination,
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  //StatusBadge,
} from '@/components/admin/table'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorModal } from '@/components/ui/error-modal'
import { SearchInput } from '@/components/ui/search-input'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'

type ValidationErrorDetail = { field: string; message: string }

type ErrorWithDetails = {
  details?: ValidationErrorDetail[]
  code?: string
}

type ErrorObject = {
  message?: string
  data?: { message?: string }
  details?: ValidationErrorDetail[]
}

const AdminRouteManagement: React.FC = () => {
  const ROUTES_PER_PAGE = 5
  const {
    routes: apiRoutes,
    isLoading,
    fetchRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
  } = useAdminRoutes()

  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [originFilter, setOriginFilter] = useState('')
  const [destinationFilter, setDestinationFilter] = useState('')
  const [distanceFilter, setDistanceFilter] = useState<
    'ALL' | 'SHORT' | 'MEDIUM' | 'LONG'
  >('ALL')
  const [durationFilter, setDurationFilter] = useState<
    'ALL' | 'SHORT' | 'MEDIUM' | 'LONG'
  >('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editingRoute, setEditingRoute] = useState<RouteAdminData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [routeToDelete, setRouteToDelete] = useState<{
    id: string
    name: string
  } | null>(null)
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null)
  const [errorModal, setErrorModal] = useState({
    open: false,
    title: 'Error',
    message: '',
    details: undefined as string | undefined,
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ROUTES_PER_PAGE,
    hasNextPage: false,
    hasPrevPage: false,
  })

  const routes = apiRoutes

  useEffect(() => {
    const loadRoutes = async () => {
      let minDistance: number | undefined
      let maxDistance: number | undefined
      if (distanceFilter === 'SHORT') {
        maxDistance = 300
      } else if (distanceFilter === 'MEDIUM') {
        minDistance = 301
        maxDistance = 800
      } else if (distanceFilter === 'LONG') {
        minDistance = 801
      }
      let minDuration: number | undefined
      let maxDuration: number | undefined
      if (durationFilter === 'SHORT') {
        maxDuration = 240 // 4 hours
      } else if (durationFilter === 'MEDIUM') {
        minDuration = 241
        maxDuration = 720 // 12 hours
      } else if (durationFilter === 'LONG') {
        minDuration = 721
      }
      try {
        const paginationData = await fetchRoutes(
          currentPage,
          ROUTES_PER_PAGE,
          searchTerm,
          minDistance,
          maxDistance,
          minDuration,
          maxDuration,
          originFilter,
          destinationFilter
        )
        if (paginationData) {
          setPagination(paginationData)
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load routes',
        })
      }
    }
    loadRoutes()
  }, [
    currentPage,
    searchTerm,
    originFilter,
    destinationFilter,
    distanceFilter,
    durationFilter,
    fetchRoutes,
    toast,
  ])

  const handleCreateRoute = () => {
    setEditingRoute(null)
    setShowForm(true)
  }

  const handleEditRoute = (route: RouteAdminData) => {
    setEditingRoute(route)
    setShowForm(true)
  }

  const handleDeleteRoute = (routeId: string, routeName: string) => {
    setRouteToDelete({ id: routeId, name: routeName })
    setDeleteDialogOpen(true)
  }

  const handleToggleExpand = (routeId: string) => {
    setExpandedRoute(expandedRoute === routeId ? null : routeId)
  }

  const handleConfirmDelete = async () => {
    if (!routeToDelete) return

    setActionLoading(routeToDelete.id)
    setDeleteDialogOpen(false)
    try {
      await deleteRoute(routeToDelete.id)
      setCurrentPage(1)
    } catch (error) {
      let message = 'Failed to delete route'

      // Extract error message from different error types
      if (error instanceof Error) {
        message = error.message
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as {
          message?: string
          data?: { message?: string }
        }
        message = errorObj.message || errorObj.data?.message || message
      }

      setErrorModal({
        open: true,
        title: 'Delete Failed',
        message,
        details: undefined,
      })
    } finally {
      setActionLoading(null)
      setRouteToDelete(null)
    }
  }

  const handleSaveRoute = async (
    routeData: Omit<RouteAdminData, 'route_id' | 'created_at'>
  ) => {
    try {
      if (editingRoute?.route_id) {
        await updateRoute(editingRoute.route_id, routeData)
      } else {
        await createRoute(routeData)
      }
      setShowForm(false)
      setCurrentPage(1)
    } catch (error) {
      let message = 'Failed to save route'
      let details = ''

      console.error('Route save error full object:', error)
      console.error(
        'Error type:',
        error instanceof Error ? 'Error instance' : typeof error
      )

      // Extract error message from different error types
      if (error instanceof Error) {
        message = error.message
        const err = error as ErrorWithDetails
        console.log('Error object keys:', Object.keys(err))
        console.log('Error details property:', err.details)
        console.log('Error code property:', err.code)

        if (err.details && Array.isArray(err.details)) {
          console.log('Found details array with', err.details.length, 'items')
          details = err.details
            .map((d) => `${d.field}: ${d.message}`)
            .join('\n')
        } else if (err.details) {
          console.log('Details is not an array:', err.details)
          details = JSON.stringify(err.details)
        }
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as ErrorObject
        console.log('Error object (non-Error):', errorObj)
        message = errorObj.message || errorObj.data?.message || message
        if (errorObj.details && Array.isArray(errorObj.details)) {
          details = errorObj.details
            .map((d) => `${d.field}: ${d.message}`)
            .join('\n')
        }
      }

      console.log('Final error state - message:', message, 'details:', details)
      setErrorModal({
        open: true,
        title: 'Error',
        message,
        details: details || undefined,
      })
    }
  }

  const resetFilters = () => {
    setSearchTerm('')
    setOriginFilter('')
    setDestinationFilter('')
    setDistanceFilter('ALL')
    setDurationFilter('ALL')
    setCurrentPage(1)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Route Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and manage bus routes for trip scheduling
            </p>
          </div>
          <button
            onClick={handleCreateRoute}
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Route
          </button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <SearchInput
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value)
              setCurrentPage(1)
            }}
            placeholder="Search by origin or destination..."
          />

          {/* Filter Controls */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Filters</h3>
              </div>
              {(searchTerm ||
                originFilter ||
                destinationFilter ||
                distanceFilter !== 'ALL' ||
                durationFilter !== 'ALL') && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Origin Filter */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Origin
                </label>
                <input
                  type="text"
                  value={originFilter}
                  onChange={(e) => {
                    setOriginFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Filter by origin city"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
              {/* Destination Filter */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Destination
                </label>
                <input
                  type="text"
                  value={destinationFilter}
                  onChange={(e) => {
                    setDestinationFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Filter by destination city"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
              {/* Distance Filter */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Distance
                </label>
                <CustomDropdown
                  options={[
                    { id: 'ALL', label: 'All Distances' },
                    { id: 'SHORT', label: 'Short (≤ 300 km)' },
                    { id: 'MEDIUM', label: 'Medium (301-800 km)' },
                    { id: 'LONG', label: `Long (>800 km)` },
                  ]}
                  value={distanceFilter}
                  onChange={(value) => {
                    setDistanceFilter(
                      value as 'ALL' | 'SHORT' | 'MEDIUM' | 'LONG'
                    )
                    setCurrentPage(1)
                  }}
                  placeholder="Select Distance"
                />
              </div>
              {/* Duration Filter */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Duration
                </label>
                <CustomDropdown
                  options={[
                    { id: 'ALL', label: 'All Durations' },
                    { id: 'SHORT', label: 'Short (≤ 4h)' },
                    { id: 'MEDIUM', label: 'Medium (4-12h)' },
                    { id: 'LONG', label: 'Long (>12h)' },
                  ]}
                  value={durationFilter}
                  onChange={(value) => {
                    setDurationFilter(
                      value as 'ALL' | 'SHORT' | 'MEDIUM' | 'LONG'
                    )
                    setCurrentPage(1)
                  }}
                  placeholder="Select Duration"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && !routes.length ? (
          <AdminLoadingSpinner message="Loading routes..." />
        ) : routes.length === 0 ? (
          <AdminEmptyState
            icon={MapPin}
            title="No routes found"
            description={
              searchTerm || distanceFilter !== 'ALL' || durationFilter !== 'ALL'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first route to get started'
            }
          />
        ) : (
          <>
            {/* Routes Table */}
            <div className="bg-card rounded-lg border border-border overflow-hidden max-w-full">
              <AdminTable
                columns={[
                  { key: 'route', label: 'Route' },
                  { key: 'distance', label: 'Distance' },
                  { key: 'duration', label: 'Duration' },
                  { key: 'actions', label: 'Actions', align: 'center' },
                ]}
              >
                {routes.map((route) => (
                  <React.Fragment key={route.route_id}>
                    <AdminTableRow
                      onClick={() => handleToggleExpand(route.route_id!)}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <AdminTableCell>
                        <div className="flex items-center gap-2">
                          <div className="mr-1">
                            {expandedRoute === route.route_id ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm flex items-center gap-1 font-medium text-foreground">
                              <span>{route.origin}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span>{route.destination}</span>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              {route.route_stops && route.route_stops.length > 0
                                ? `${route.route_stops.length} ${route.route_stops.length > 1 ? 'stops' : 'stop'}`
                                : 'No stops'}
                            </div>
                          </div>
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>
                        <span className="text-sm text-muted-foreground">
                          {route.distance_km} km
                        </span>
                      </AdminTableCell>
                      <AdminTableCell>
                        <span className="text-sm text-muted-foreground">
                          {Math.floor(route.estimated_minutes / 60)}h{' '}
                          {route.estimated_minutes % 60}m
                        </span>
                      </AdminTableCell>
                      <AdminTableCell className="w-24 text-center">
                        <div className="inline-flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditRoute(route)
                            }}
                            disabled={actionLoading === route.route_id}
                            style={{ color: 'var(--primary)' }}
                            className="hover:opacity-80 disabled:opacity-50"
                            title="Edit route"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteRoute(
                                route.route_id!,
                                `${route.origin} → ${route.destination}`
                              )
                            }}
                            disabled={actionLoading === route.route_id}
                            style={{ color: 'var(--destructive)' }}
                            className="hover:opacity-80 disabled:opacity-50"
                            title="Delete route"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </AdminTableCell>
                    </AdminTableRow>
                    {expandedRoute === route.route_id && (
                      <AdminTableRow>
                        <td colSpan={4} className="bg-muted/30 px-6 py-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2">
                                Route ID
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {route.route_id}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2">
                                Created At
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {route.created_at
                                  ? new Date(route.created_at).toLocaleString()
                                  : 'N/A'}
                              </p>
                            </div>

                            {/* Pickup Points Details */}
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-3">
                                Pickup Points ({route.pickup_points.length})
                              </h4>
                              <div className="space-y-2">
                                {route.pickup_points.map((point, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border"
                                  >
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold mt-0.5">
                                      {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-sm text-foreground">
                                        {point.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {point.address}
                                      </p>
                                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                        <span className="font-medium">
                                          Arrival Offset:
                                        </span>{' '}
                                        {typeof point.departure_offset_minutes ===
                                        'number'
                                          ? (() => {
                                              const offset =
                                                point.departure_offset_minutes
                                              const sign =
                                                offset >= 0 ? '+' : '-'
                                              const absOffset = Math.abs(offset)
                                              return `${sign}${Math.floor(
                                                absOffset / 60
                                              )
                                                .toString()
                                                .padStart(2, '0')}:${(
                                                absOffset % 60
                                              )
                                                .toString()
                                                .padStart(2, '0')}`
                                            })()
                                          : ''}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Dropoff Points Details */}
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-3">
                                Dropoff Points ({route.dropoff_points.length})
                              </h4>
                              <div className="space-y-2">
                                {route.dropoff_points.map((point, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border"
                                  >
                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-semibold mt-0.5">
                                      {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-sm text-foreground">
                                        {point.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {point.address}
                                      </p>
                                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                        <span className="font-medium">
                                          Departure Offset:
                                        </span>{' '}
                                        {typeof point.departure_offset_minutes ===
                                        'number'
                                          ? (() => {
                                              const offset =
                                                point.departure_offset_minutes
                                              const isPositive = offset >= 0
                                              const absOffset = Math.abs(offset)
                                              const hours = Math.floor(
                                                absOffset / 60
                                              )
                                              const minutes = absOffset % 60
                                              const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
                                              return isPositive
                                                ? `+${timeStr}`
                                                : `-${timeStr}`
                                            })()
                                          : ''}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Route Stops Details */}
                            {route.route_stops &&
                              route.route_stops.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-foreground mb-3">
                                    Route Stops ({route.route_stops.length})
                                  </h4>
                                  <div className="relative">
                                    <div className="absolute left-16 top-0 bottom-0 w-0.5 bg-border"></div>
                                    <div className="space-y-3">
                                      {route.route_stops
                                        .sort((a, b) => a.sequence - b.sequence)
                                        .map((stop, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-center gap-3 relative"
                                          >
                                            <span className="text-xs text-muted-foreground font-medium min-w-10 text-right">
                                              {stop.sequence}
                                            </span>
                                            <div className="flex flex-col items-center gap-1 relative">
                                              <div className="w-6 h-6 rounded-full bg-primary border-2 border-card flex items-center justify-center relative z-10">
                                                <div className="w-2 h-2 rounded-full bg-card"></div>
                                              </div>
                                            </div>
                                            <div className="flex-1">
                                              <span className="text-sm text-foreground font-medium">
                                                {stop.stop_name}
                                              </span>
                                              {stop.address && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                  <p>{stop.address}</p>
                                                </div>
                                              )}
                                              {stop.arrival_offset_minutes !==
                                                undefined && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                  <p>
                                                    <span className="font-medium">
                                                      Arrival Offset:
                                                    </span>{' '}
                                                    {(() => {
                                                      const offset =
                                                        stop.arrival_offset_minutes
                                                      const isPositive =
                                                        offset >= 0
                                                      const absOffset =
                                                        Math.abs(offset)
                                                      const hours = Math.floor(
                                                        absOffset / 60
                                                      )
                                                      const minutes =
                                                        absOffset % 60
                                                      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
                                                      return isPositive
                                                        ? `+${timeStr}`
                                                        : `-${timeStr}`
                                                    })()}
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                          </div>
                        </td>
                      </AdminTableRow>
                    )}
                  </React.Fragment>
                ))}
              </AdminTable>

              {/* Pagination */}
              <div className="flex justify-center">
                <AdminTablePagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  total={pagination.totalItems}
                  onPageChange={setCurrentPage}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </>
        )}

        {/* Route Form Drawer */}
        <RouteFormDrawer
          open={showForm}
          onClose={() => setShowForm(false)}
          initialRoute={editingRoute}
          onSave={handleSaveRoute}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false)
            setRouteToDelete(null)
          }}
          onConfirm={handleConfirmDelete}
          title="Confirm Deletion"
          message={`Are you sure you want to delete "${routeToDelete?.name}"? This action cannot be undone.`}
        />

        {/* Error Modal */}
        <ErrorModal
          open={errorModal.open}
          title={errorModal.title}
          message={errorModal.message}
          onClose={() => setErrorModal({ ...errorModal, open: false })}
        />
      </div>
    </DashboardLayout>
  )
}

export default AdminRouteManagement
