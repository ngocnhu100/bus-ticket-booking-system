import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import { Plus, Edit, Grid3X3 } from 'lucide-react'
import {
  AdminTablePagination,
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  StatusBadge,
} from '@/components/admin/table'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorModal } from '@/components/ui/error-modal'
import { SearchInput } from '@/components/ui/search-input'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { SeatMapEditor } from '@/components/admin/seat-map'
import { adminBusService } from '@/services/adminBusService'
import type { Bus } from '@/services/adminBusService'
import type { LayoutData, SeatLayout } from '@/types/seatMap'

const AdminSeatMapManagement: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([])
  const [filteredBuses, setFilteredBuses] = useState<Bus[]>([])
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null)
  const [seatLayout, setSeatLayout] = useState<LayoutData | SeatLayout | null>(
    null
  )
  const [showEditor, setShowEditor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [operatorFilter, setOperatorFilter] = useState<string>('all')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)

  // Confirmation dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction] = useState<() => void>(() => {})

  useEffect(() => {
    loadBuses()
  }, [])

  // Filter buses based on search and filters
  useEffect(() => {
    let filtered = buses

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (bus) =>
          bus.license_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bus.bus_model_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          bus.operator_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((bus) => bus.status === statusFilter)
    }

    // Operator filter
    if (operatorFilter !== 'all') {
      filtered = filtered.filter((bus) => bus.operator_name === operatorFilter)
    }

    setFilteredBuses(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [buses, searchQuery, statusFilter, operatorFilter])

  const loadBuses = async () => {
    try {
      setLoading(true)
      const busesData = await adminBusService.getBuses()
      setBuses(busesData)
    } catch (err) {
      setError('Failed to load buses')
      setShowErrorModal(true)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadSeatLayout = async (bus: Bus) => {
    try {
      setLoading(true)
      setSelectedBus(bus)
      const layout = await adminBusService.getSeatLayout(bus.bus_id)
      setSeatLayout(layout)
      setShowEditor(true)
    } catch {
      // If no layout exists, create empty one
      setSeatLayout(null)
      setShowEditor(true)
    } finally {
      setLoading(false)
    }
  }

  const saveSeatLayout = async (layoutData: SeatLayout) => {
    if (!selectedBus) return

    try {
      setLoading(true)
      await adminBusService.saveSeatLayout(selectedBus.bus_id, layoutData)
      setSeatLayout(layoutData)
      setShowEditor(false)
      // Refresh buses to update has_seat_layout status
      await loadBuses()
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || 'Failed to save seat layout'
      setError(errorMessage)
      setShowErrorModal(true)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Get unique operators for filter dropdown
  const getUniqueOperators = () => {
    const operators = buses.map((bus) => bus.operator_name)
    return ['all', ...Array.from(new Set(operators))]
  }

  // Get status options for filter dropdown
  const getStatusOptions = () => [
    { id: 'all', value: 'all', label: 'All Status' },
    { id: 'active', value: 'active', label: 'Active' },
    { id: 'inactive', value: 'inactive', label: 'Inactive' },
  ]

  // Pagination logic
  const totalPages = Math.ceil(filteredBuses.length / itemsPerPage)
  const paginatedBuses = filteredBuses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Confirmation dialog handlers
  const executeConfirmAction = () => {
    confirmAction()
    setShowConfirmDialog(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Seat Map Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and manage custom seat layouts for each bus
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by license plate, model, or operator..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
          <div className="flex gap-2">
            <CustomDropdown
              options={getStatusOptions()}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Filter by status"
            />
            <CustomDropdown
              options={getUniqueOperators().map((operator, index) => ({
                id: `operator-${index}`,
                value: operator,
                label: operator === 'all' ? 'All Operators' : operator,
              }))}
              value={operatorFilter}
              onChange={setOperatorFilter}
              placeholder="Filter by operator"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && buses.length === 0 && (
          <div className="flex justify-center py-8">
            <AdminLoadingSpinner />
          </div>
        )}

        {/* Buses List */}
        {filteredBuses.length === 0 && !loading ? (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <AdminEmptyState
              title="No buses found"
              description={
                searchQuery ||
                statusFilter !== 'all' ||
                operatorFilter !== 'all'
                  ? 'No buses match your current filters. Try adjusting your search criteria.'
                  : 'Get started by adding your first bus to the system.'
              }
              icon={Grid3X3}
            />
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <AdminTable
              columns={[
                { key: 'license_plate', label: 'License Plate' },
                { key: 'model', label: 'Model' },
                { key: 'operator', label: 'Operator' },
                { key: 'status', label: 'Status' },
                { key: 'seat_layout', label: 'Seat Layout' },
                { key: 'actions', label: 'Actions', align: 'right' },
              ]}
              isLoading={false}
              isEmpty={false}
            >
              {paginatedBuses.map((bus) => (
                <AdminTableRow key={bus.bus_id}>
                  <AdminTableCell>
                    <div className="flex items-center gap-2">
                      <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {bus.license_plate}
                      </span>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell className="text-sm text-muted-foreground">
                    {bus.bus_model_name}
                  </AdminTableCell>
                  <AdminTableCell className="text-sm text-muted-foreground">
                    {bus.operator_name}
                  </AdminTableCell>
                  <AdminTableCell>
                    <StatusBadge
                      status={bus.status === 'active' ? 'success' : 'default'}
                      label={
                        bus.status.charAt(0).toUpperCase() + bus.status.slice(1)
                      }
                    />
                  </AdminTableCell>
                  <AdminTableCell>
                    <StatusBadge
                      status={bus.has_seat_layout ? 'success' : 'warning'}
                      label={bus.has_seat_layout ? 'Configured' : 'Not Set'}
                    />
                  </AdminTableCell>
                  <AdminTableCell align="right">
                    <button
                      onClick={() => loadSeatLayout(bus)}
                      className="inline-flex items-center text-primary hover:text-primary/80 disabled:opacity-50"
                      disabled={loading || bus.status === 'active'}
                      title={
                        bus.status === 'active'
                          ? 'Seat layout can only be modified when bus is inactive or in maintenance'
                          : bus.has_seat_layout
                            ? 'Edit seat layout'
                            : 'Create seat layout'
                      }
                    >
                      {bus.has_seat_layout ? (
                        <Edit className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </button>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>

            {/* Pagination */}
            {filteredBuses.length > itemsPerPage && (
              <div className="border-t border-border px-4 py-3">
                <AdminTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  total={filteredBuses.length}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        )}

        {/* Seat Map Editor Modal */}
        {showEditor && selectedBus && (
          <SeatMapEditor
            bus={selectedBus}
            initialLayout={seatLayout}
            onSave={saveSeatLayout}
            onClose={() => {
              setShowEditor(false)
              setSelectedBus(null)
              setSeatLayout(null)
            }}
            loading={loading}
          />
        )}

        {/* Confirmation Dialog */}
        <ConfirmDialog
          open={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={executeConfirmAction}
          title="Confirm Action"
          message="Are you sure you want to perform this action?"
          confirmText="Confirm"
          cancelText="Cancel"
        />

        {/* Error Modal */}
        <ErrorModal
          open={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title="Error"
          message={error || 'An unexpected error occurred'}
        />
      </div>
    </DashboardLayout>
  )
}

export default AdminSeatMapManagement
