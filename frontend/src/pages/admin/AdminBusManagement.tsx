import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import {
  Plus,
  Edit,
  Bus as BusIcon,
  ChevronDown,
  ChevronRight,
  X,
  Filter,
  PowerOff,
  Power,
  Grid3X3,
} from 'lucide-react'
import { BusFormDrawer } from '@/components/admin/BusFormDrawer'
import { useAdminBuses } from '@/hooks/admin/useAdminBuses'
import { useAdminOperators } from '@/hooks/admin/useAdminOperators'
import type { BusAdminData } from '@/types/trip.types'
import {
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  AdminTablePagination,
  StatusBadge,
} from '@/components/admin/table'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorModal } from '@/components/ui/error-modal'
import { SearchInput } from '@/components/ui/search-input'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { SeatMapEditor } from '@/components/admin/seat-map'
import type { Bus as SeatMapBus } from '@/types/seatMap'
import { adminBusService, type SeatLayout } from '@/services/adminBusService'

const AMENITIES_LABELS: Record<string, string> = {
  wifi: 'WiFi',
  ac: 'Air Conditioning',
  toilet: 'Toilet',
  tv: 'TV',
  entertainment: 'Entertainment System',
  blanket: 'Blanket',
  water: 'Water',
  usb: 'USB Charging',
  reading_light: 'Reading Light',
  massage: 'Massage',
  pillow: 'Pillow',
}

const AdminBusManagement: React.FC = () => {
  const {
    buses,
    busModels,
    pagination,
    isLoading,
    fetchBuses,
    fetchBusModels,
    createBus,
    updateBus,
    deactivateBus,
    activateBus,
  } = useAdminBuses()

  const { operators, fetchOperators } = useAdminOperators()

  const [filters, setFilters] = useState<{
    type: string
    status: string
    operator_id: string
    has_seat_layout: string
  }>({
    type: '',
    status: '',
    operator_id: '',
    has_seat_layout: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingBus, setEditingBus] = useState<BusAdminData | null>(null)
  const [errorModal, setErrorModal] = useState({
    open: false,
    message: '',
    title: 'Error',
  })
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })
  const [expandedBusId, setExpandedBusId] = useState<string | null>(null)
  const [imageModal, setImageModal] = useState({
    open: false,
    imageUrl: '',
    alt: '',
  })
  const [showSeatMapEditor, setShowSeatMapEditor] = useState(false)
  const [selectedBusForSeatMap, setSelectedBusForSeatMap] =
    useState<BusAdminData | null>(null)
  const [seatMapInitialLayout, setSeatMapInitialLayout] =
    useState<SeatLayout | null>(null)
  const [isLoadingSeatLayout, setIsLoadingSeatLayout] = useState(false)

  const ITEMS_PER_PAGE = 4

  // Fetch buses on component mount and when page/search changes
  useEffect(() => {
    fetchBuses(currentPage, ITEMS_PER_PAGE, searchTerm, filters)
    fetchOperators('approved') // Only fetch approved operators
    fetchBusModels() // Fetch bus models for dropdown
  }, [
    fetchBuses,
    fetchOperators,
    fetchBusModels,
    currentPage,
    searchTerm,
    filters,
  ])

  // Prepare operators for dropdown
  const operatorOptions = operators
    .filter((op) => op.status === 'approved')
    .map((op) => ({
      id: op.operator_id,
      label: op.name,
    }))

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page on search
    fetchBuses(1, ITEMS_PER_PAGE, searchTerm, filters)
  }

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filter changes
    fetchBuses(1, ITEMS_PER_PAGE, searchTerm, newFilters)
  }

  const clearFilters = () => {
    const emptyFilters = {
      type: '',
      status: '',
      operator_id: '',
      has_seat_layout: '',
    }
    setFilters(emptyFilters)
    setCurrentPage(1)
    fetchBuses(1, ITEMS_PER_PAGE, searchTerm, emptyFilters)
  }

  const refreshBuses = () => {
    fetchBuses(currentPage, ITEMS_PER_PAGE, searchTerm, filters)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage)
    }
  }

  const handleRowClick = (bus: BusAdminData) => {
    setExpandedBusId(expandedBusId === bus.bus_id ? null : bus.bus_id!)
  }

  const handleImageClick = (imageUrl: string, alt: string) => {
    setImageModal({
      open: true,
      imageUrl,
      alt,
    })
  }

  const handleCreateBus = () => {
    setEditingBus(null)
    setShowForm(true)
  }

  const handleEditBus = (bus: BusAdminData) => {
    setEditingBus(bus)
    setShowForm(true)
  }

  const handleDeactivateBus = (bus: BusAdminData) => {
    setConfirmDialog({
      open: true,
      title: 'Deactivate Bus',
      message: `Are you sure you want to deactivate "${bus.name}"? The bus will be marked as inactive and won't be available for new trips.`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }))
        try {
          await deactivateBus(bus.bus_id!)
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to deactivate bus'
          setErrorModal({
            open: true,
            title: 'Deactivate Failed',
            message,
          })
        }
      },
    })
  }

  const handleActivateBus = (bus: BusAdminData) => {
    setConfirmDialog({
      open: true,
      title: 'Activate Bus',
      message: `Are you sure you want to activate "${bus.name}"? The bus will be marked as active and available for new trips.`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }))
        try {
          await activateBus(bus.bus_id!)
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to activate bus'
          setErrorModal({
            open: true,
            title: 'Activate Failed',
            message,
          })
        }
      },
    })
  }

  const handleConfigureSeatMap = async (bus: BusAdminData) => {
    if (!bus.bus_id) return

    // Fetch existing seat layout
    const layoutData = await fetchSeatLayout(bus.bus_id)

    setSeatMapInitialLayout(layoutData)

    // Set selected bus and open editor
    setSelectedBusForSeatMap(bus)
    setShowSeatMapEditor(true)
  }

  const handleCloseSeatMapEditor = () => {
    setShowSeatMapEditor(false)
    setSelectedBusForSeatMap(null)
    setSeatMapInitialLayout(null)
  }

  const handleSaveSeatLayout = async (layoutData: SeatLayout) => {
    if (!selectedBusForSeatMap?.bus_id) return

    try {
      await adminBusService.saveSeatLayout(
        selectedBusForSeatMap.bus_id,
        layoutData
      )
      handleCloseSeatMapEditor()
      refreshBuses()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save seat layout'
      setErrorModal({
        open: true,
        title: 'Save Failed',
        message,
      })
    }
  }

  const fetchSeatLayout = async (busId: string) => {
    setIsLoadingSeatLayout(true)
    try {
      const response = await adminBusService.getSeatLayout(busId)

      // Handle different response structures
      let layoutData: SeatLayout

      // If response has a data property, use that
      if (
        'data' in response &&
        typeof response.data === 'object' &&
        response.data !== null &&
        'rows' in response.data
      ) {
        layoutData = response.data as SeatLayout
      } else {
        layoutData = response as SeatLayout
      }

      // If rows is not an array, it means no layout exists
      if (!Array.isArray(layoutData.rows)) {
        return null
      }

      return layoutData
    } catch (error) {
      console.error('Error fetching seat layout:', error)
      return null
    } finally {
      setIsLoadingSeatLayout(false)
    }
  }

  const handleSaveBus = async (
    busData: Omit<BusAdminData, 'bus_id' | 'created_at'>
  ) => {
    try {
      if (editingBus) {
        await updateBus(editingBus.bus_id!, busData)
      } else {
        await createBus(busData)
      }
      setShowForm(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save bus'
      setErrorModal({
        open: true,
        title: 'Save Failed',
        message,
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Bus Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage the bus fleet and assign buses to trips
            </p>
          </div>
          <button
            onClick={handleCreateBus}
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Bus
          </button>
        </div>

        {/* Search */}
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          onSubmit={handleSearch}
          placeholder="Search buses..."
        />

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Filters</h3>
            </div>
            {(filters.type ||
              filters.status ||
              filters.operator_id ||
              filters.has_seat_layout) && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Bus Type
              </label>
              <CustomDropdown
                options={[
                  { id: '', label: 'All Types' },
                  { id: 'standard', label: 'Standard' },
                  { id: 'limousine', label: 'Limousine' },
                  { id: 'sleeper', label: 'Sleeper' },
                ]}
                value={filters.type}
                onChange={(value) => handleFilterChange('type', value)}
                placeholder="All Types"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Status
              </label>
              <CustomDropdown
                options={[
                  { id: '', label: 'All Status' },
                  { id: 'active', label: 'Active' },
                  { id: 'maintenance', label: 'Inactive' },
                ]}
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
                placeholder="All Status"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Operator
              </label>
              <CustomDropdown
                options={[
                  { id: '', label: 'All Operators' },
                  ...operatorOptions,
                ]}
                value={filters.operator_id}
                onChange={(value) => handleFilterChange('operator_id', value)}
                placeholder="All Operators"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Seat Map
              </label>
              <CustomDropdown
                options={[
                  { id: '', label: 'All' },
                  { id: 'true', label: 'Set' },
                  { id: 'false', label: 'Not Set' },
                ]}
                value={filters.has_seat_layout}
                onChange={(value) =>
                  handleFilterChange('has_seat_layout', value)
                }
                placeholder="All"
              />
            </div>
          </div>
        </div>

        {/* Buses List */}
        {isLoading && buses.length === 0 ? (
          <AdminLoadingSpinner message="Loading buses..." />
        ) : buses.length === 0 ? (
          <AdminEmptyState
            icon={BusIcon}
            title="No buses found"
            description={
              searchTerm ||
              filters.type ||
              filters.status ||
              filters.operator_id ||
              filters.has_seat_layout
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first bus to get started'
            }
          />
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden max-w-full">
            <AdminTable
              columns={[
                { key: 'busDetails', label: 'Bus Details' },
                { key: 'type', label: 'Type' },
                { key: 'capacity', label: 'Capacity' },
                { key: 'seatLayout', label: 'Seat Map' },
                { key: 'amenities', label: 'Amenities' },
                { key: 'status', label: 'Status' },
                { key: 'actions', label: 'Actions', align: 'center' },
              ]}
              isLoading={isLoading}
              isEmpty={false}
              emptyMessage=""
            >
              {buses.map((bus) => (
                <React.Fragment key={bus.bus_id}>
                  <AdminTableRow
                    isHoverable={true}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(bus)}
                  >
                    <AdminTableCell>
                      <div className="flex items-center">
                        <div className="mr-3">
                          {expandedBusId === bus.bus_id ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        {bus.image_urls && bus.image_urls.length > 0 ? (
                          <img
                            src={bus.image_urls[0]}
                            alt={bus.name}
                            className="h-8 w-8 rounded object-cover mr-3"
                          />
                        ) : bus.image_url ? (
                          <img
                            src={bus.image_url}
                            alt={bus.name}
                            className="h-8 w-8 rounded object-cover mr-3"
                          />
                        ) : (
                          <BusIcon className="h-8 w-8 text-muted-foreground mr-3" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {bus.model}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {bus.operator_name} • {bus.plate_number}
                          </div>
                        </div>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      <StatusBadge
                        status="default"
                        label={bus.type[0].toUpperCase() + bus.type.slice(1)}
                      />
                    </AdminTableCell>
                    <AdminTableCell className="text-sm text-muted-foreground">
                      {bus.capacity} seats
                    </AdminTableCell>
                    <AdminTableCell>
                      <StatusBadge
                        status={bus.has_seat_layout ? 'success' : 'warning'}
                        label={bus.has_seat_layout ? 'Set' : 'Not Set'}
                      />
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="flex flex-wrap gap-1">
                        {bus.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs bg-muted rounded"
                          >
                            {AMENITIES_LABELS[amenity] || amenity}
                          </span>
                        ))}
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      <StatusBadge
                        status={
                          bus.status === 'active'
                            ? 'success'
                            : bus.status === 'maintenance' ||
                                bus.status === 'inactive'
                              ? 'warning'
                              : 'default'
                        }
                        label={
                          bus.status === 'active'
                            ? 'Active'
                            : bus.status === 'maintenance' ||
                                bus.status === 'inactive'
                              ? 'Inactive'
                              : bus.status
                        }
                      />
                    </AdminTableCell>
                    <AdminTableCell className="text-center">
                      <div className="inline-flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleConfigureSeatMap(bus)
                          }}
                          style={{ color: 'var(--primary)' }}
                          className="hover:opacity-80 disabled:opacity-50"
                          title="Configure seat map"
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditBus(bus)
                          }}
                          style={{ color: 'var(--primary)' }}
                          className="hover:opacity-80 disabled:opacity-50"
                          title="Edit bus"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {bus.status === 'active' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeactivateBus(bus)
                            }}
                            style={{ color: 'var(--destructive)' }}
                            className="hover:opacity-80 disabled:opacity-50"
                            title="Deactivate bus"
                          >
                            <PowerOff className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleActivateBus(bus)
                            }}
                            style={{ color: 'var(--primary)' }}
                            className="hover:opacity-80 disabled:opacity-50"
                            title="Activate bus"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </AdminTableCell>
                  </AdminTableRow>

                  {/* Expanded Images Row */}
                  {expandedBusId === bus.bus_id && (
                    <tr>
                      <td colSpan={7} className="bg-muted/50 px-4 py-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-foreground">
                              Bus Images (
                              {bus.image_urls?.length ||
                                (bus.image_url ? 1 : 0)}
                              )
                            </h4>
                            <p className="text-xs text-muted-foreground font-mono">
                              Bus ID: {bus.bus_id}
                            </p>
                          </div>
                          {bus.image_urls && bus.image_urls.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {bus.image_urls.map((url, index) => (
                                <div
                                  key={index}
                                  className="relative group cursor-pointer"
                                  onClick={() =>
                                    handleImageClick(
                                      url,
                                      `${bus.name} - Image ${index + 1}`
                                    )
                                  }
                                >
                                  <img
                                    src={url}
                                    alt={`${bus.name} - Image ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border border-border hover:opacity-90 transition-opacity"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                                    <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                      Click to view full size
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : bus.image_url ? (
                            <div
                              className="relative group inline-block cursor-pointer"
                              onClick={() =>
                                handleImageClick(
                                  bus.image_url!,
                                  `${bus.name} - Image`
                                )
                              }
                            >
                              <img
                                src={bus.image_url}
                                alt={`${bus.name} - Image`}
                                className="w-32 h-24 object-cover rounded-lg border border-border hover:opacity-90 transition-opacity"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                                <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                  Click to view full size
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground italic">
                              No images available for this bus.
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </AdminTable>

            {/* Pagination */}
            <div className="flex justify-center">
              <AdminTablePagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {/* Bus Form Drawer */}
        <BusFormDrawer
          open={showForm}
          onClose={() => setShowForm(false)}
          initialBus={editingBus}
          onSave={handleSaveBus}
          operators={operatorOptions}
          busModels={busModels}
          onRefresh={refreshBuses}
        />

        {/* Seat Map Editor */}
        {showSeatMapEditor && selectedBusForSeatMap && (
          <SeatMapEditor
            bus={
              {
                bus_id: selectedBusForSeatMap.bus_id || '',
                license_plate: selectedBusForSeatMap.plate_number,
                bus_model_name: selectedBusForSeatMap.model,
                operator_name:
                  operators.find(
                    (op) => op.operator_id === selectedBusForSeatMap.operator_id
                  )?.name || '',
                status: selectedBusForSeatMap.status,
                has_seat_layout: selectedBusForSeatMap.has_seat_layout || false,
                type: selectedBusForSeatMap.type || '',
              } as SeatMapBus
            }
            initialLayout={seatMapInitialLayout}
            onSave={handleSaveSeatLayout}
            onClose={handleCloseSeatMapEditor}
            loading={isLoadingSeatLayout}
          />
        )}

        {/* Error Modal */}
        <ErrorModal
          open={errorModal.open}
          title={errorModal.title}
          message={errorModal.message}
          onClose={() => setErrorModal({ ...errorModal, open: false })}
        />
        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
          onConfirm={confirmDialog.onConfirm}
          confirmText="Confirm"
          cancelText="Cancel"
        />

        {/* Image Modal */}
        {imageModal.open && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setImageModal({ ...imageModal, open: false })}
          >
            <div className="relative max-w-lg max-h-[60vh] p-2 bg-white rounded-lg shadow-2xl">
              <img
                src={imageModal.imageUrl}
                alt={imageModal.alt}
                className="max-w-full max-h-[calc(60vh-1rem)] object-contain rounded"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setImageModal({ ...imageModal, open: false })}
                className="absolute top-0 -right-12 text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-colors border border-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminBusManagement
