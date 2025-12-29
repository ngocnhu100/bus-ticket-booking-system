import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import {
  ChevronDown,
  ChevronRight,
  Filter,
  X,
  XCircle,
  DollarSign,
  Calendar,
  User,
  Users,
} from 'lucide-react'
import { useAdminBookings } from '@/hooks/admin/useAdminBookings'
import type { BookingAdminData } from '@/types/trip.types'
import {
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  AdminTablePagination,
  StatusBadge,
} from '@/components/admin/table'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorModal } from '@/components/ui/error-modal'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'

const BOOKINGS_PER_PAGE = 10

const STATUS_OPTIONS = [
  { id: 'all', label: 'All Statuses' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'completed', label: 'Completed' },
]

const PAYMENT_STATUS_OPTIONS = [
  { id: 'all', label: 'All Payment Status' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'paid', label: 'Paid' },
  { id: 'refunded', label: 'Refunded' },
]

const SORT_OPTIONS = [
  { id: 'created_at', label: 'Created Date' },
  { id: 'updated_at', label: 'Updated Date' },
  { id: 'total_price', label: 'Total Price' },
  { id: 'status', label: 'Status' },
  { id: 'payment_status', label: 'Payment Status' },
]

const AdminBookingManagement: React.FC = () => {
  const {
    bookings,
    pagination,
    isLoading,
    error: fetchError,
    fetchBookings,
    updateBookingStatus,
    processRefund,
  } = useAdminBookings()

  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(
    null
  )
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })
  const [errorModal, setErrorModal] = useState({
    open: false,
    title: 'Error',
    message: '',
  })
  const [refundDialog, setRefundDialog] = useState({
    open: false,
    bookingId: '',
    bookingReference: '',
    totalPrice: 0,
  })
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')

  // Fetch bookings when filters change
  useEffect(() => {
    const loadBookings = async () => {
      try {
        console.log('Fetching bookings with params:', {
          page: currentPage,
          limit: BOOKINGS_PER_PAGE,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          payment_status:
            paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          sortBy,
          sortOrder,
        })

        await fetchBookings({
          page: currentPage,
          limit: BOOKINGS_PER_PAGE,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          payment_status:
            paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          sortBy,
          sortOrder,
        })

        // Bookings will be logged by the debug useEffect below
      } catch (error) {
        console.error('Error loading bookings:', error)
        // Don't throw, just log - let the UI show empty state
      }
    }

    loadBookings()
  }, [
    currentPage,
    statusFilter,
    paymentStatusFilter,
    fromDate,
    toDate,
    sortBy,
    sortOrder,
    fetchBookings,
  ])

  // Debug: Log bookings whenever they change
  useEffect(() => {
    const bookingCount = bookings.length
    console.log('[Component] Bookings state updated:', {
      count: bookingCount,
      hasBookings: bookingCount > 0,
    })
  }, [bookings.length])

  const handleToggleExpand = (bookingId: string) => {
    setExpandedBookingId(expandedBookingId === bookingId ? null : bookingId)
  }

  const handleUpdateStatus = (
    bookingId: string,
    bookingReference: string,
    currentStatus: string,
    newStatus: 'confirmed' | 'cancelled' | 'completed'
  ) => {
    setConfirmDialog({
      open: true,
      title: `Update Booking Status`,
      message: `Are you sure you want to change booking ${bookingReference} status from "${currentStatus}" to "${newStatus}"?`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }))
        try {
          await updateBookingStatus(bookingId, newStatus)
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Failed to update booking status'
          setErrorModal({
            open: true,
            title: 'Update Failed',
            message,
          })
        }
      },
    })
  }

  const handleOpenRefundDialog = (booking: BookingAdminData) => {
    setRefundDialog({
      open: true,
      bookingId: booking.booking_id,
      bookingReference: booking.booking_reference,
      totalPrice: booking.total_price,
    })
    setRefundAmount(booking.total_price.toString())
    setRefundReason('')
  }

  const handleProcessRefund = async () => {
    const amount = parseFloat(refundAmount)
    if (isNaN(amount) || amount <= 0) {
      setErrorModal({
        open: true,
        title: 'Invalid Amount',
        message: 'Please enter a valid refund amount',
      })
      return
    }

    if (amount > refundDialog.totalPrice) {
      setErrorModal({
        open: true,
        title: 'Invalid Amount',
        message: 'Refund amount cannot exceed total price',
      })
      return
    }

    try {
      console.log('Processing refund:', {
        bookingId: refundDialog.bookingId,
        amount,
        reason: refundReason,
      })

      await processRefund(refundDialog.bookingId, amount, refundReason)

      console.log('Refund processed successfully')

      // Đóng modal và reset state ngay lập tức
      setRefundDialog((prev) => {
        console.log('Closing refund modal')
        return { ...prev, open: false }
      })
      setRefundAmount('')
      setRefundReason('')

      // Refresh lại danh sách bookings để hiển thị refund amount
      await fetchBookings({
        page: currentPage,
        limit: BOOKINGS_PER_PAGE,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sortBy,
        sortOrder,
      })
    } catch (error) {
      console.error('Refund processing failed:', error)

      const message =
        error instanceof Error ? error.message : 'Failed to process refund'

      setErrorModal({
        open: true,
        title: 'Refund Failed',
        message,
      })

      setRefundDialog((prev) => ({ ...prev, open: false }))
      setRefundAmount('')
      setRefundReason('')
    }
  }

  const resetFilters = () => {
    setStatusFilter('all')
    setPaymentStatusFilter('all')
    setFromDate('')
    setToDate('')
    setSortBy('created_at')
    setSortOrder('DESC')
    setCurrentPage(1)
  }

  const formatPrice = (price: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (
    status: string
  ): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'confirmed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'cancelled':
        return 'danger'
      case 'completed':
        return 'default'
      default:
        return 'default'
    }
  }

  const getPaymentStatusColor = (
    status: string
  ): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'unpaid':
        return 'warning'
      case 'refunded':
        return 'default'
      default:
        return 'default'
    }
  }

  const hasActiveFilters =
    statusFilter !== 'all' ||
    paymentStatusFilter !== 'all' ||
    fromDate ||
    toDate ||
    sortBy !== 'created_at' ||
    sortOrder !== 'DESC'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Booking Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View and manage all bookings in the system
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Booking Status
              </label>
              <CustomDropdown
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(id: string) => {
                  setStatusFilter(id)
                  setCurrentPage(1)
                }}
                placeholder="Select status"
              />
            </div>

            {/* Payment Status Filter - Note: API doesn't support this yet */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Payment Status
              </label>
              <CustomDropdown
                options={PAYMENT_STATUS_OPTIONS}
                value={paymentStatusFilter}
                onChange={(id: string) => {
                  setPaymentStatusFilter(id)
                  setCurrentPage(1)
                }}
                placeholder="Select payment status"
              />
            </div>

            {/* From Date */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Sort By
              </label>
              <CustomDropdown
                options={SORT_OPTIONS}
                value={sortBy}
                onChange={(id: string) => setSortBy(id)}
                placeholder="Select sort field"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Sort Order
              </label>
              <CustomDropdown
                options={[
                  { id: 'DESC', label: 'Descending' },
                  { id: 'ASC', label: 'Ascending' },
                ]}
                value={sortOrder}
                onChange={(id: string) => setSortOrder(id as 'ASC' | 'DESC')}
                placeholder="Select order"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading && bookings.length === 0 ? (
          <AdminLoadingSpinner message="Loading bookings..." />
        ) : fetchError ? (
          <div className="bg-error/10 border border-error rounded-lg p-6 text-center">
            <div className="text-error text-lg font-semibold mb-2">
              Error Loading Bookings
            </div>
            <div className="text-muted-foreground mb-4">{fetchError}</div>
            <button
              onClick={() => {
                console.log('Retrying fetch...')
                fetchBookings({
                  page: currentPage,
                  limit: BOOKINGS_PER_PAGE,
                  status: statusFilter !== 'all' ? statusFilter : undefined,
                  fromDate: fromDate || undefined,
                  toDate: toDate || undefined,
                  sortBy,
                  sortOrder,
                })
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
            >
              Retry
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <AdminEmptyState
            icon={Calendar}
            title="No bookings found"
            description="No bookings match your current filters. Try adjusting your search criteria."
          />
        ) : (
          <>
            <div className="space-y-4">
              <AdminTable
                columns={[
                  { key: 'reference', label: 'Reference' },
                  { key: 'customer', label: 'Customer' },
                  { key: 'status', label: 'Status' },
                  { key: 'payment', label: 'Payment' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'passengers', label: 'Passengers' },
                  { key: 'created', label: 'Created' },
                  { key: 'actions', label: 'Actions' },
                ]}
              >
                {bookings.map((booking) => (
                  <React.Fragment key={booking.booking_id}>
                    <AdminTableRow
                      onClick={() => handleToggleExpand(booking.booking_id)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <AdminTableCell>
                        <div className="flex items-center gap-2">
                          {expandedBookingId === booking.booking_id ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {booking.booking_reference}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.booking_id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </AdminTableCell>

                      <AdminTableCell>
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {booking.user?.name || 'Guest'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.contact_email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.contact_phone}
                          </p>
                        </div>
                      </AdminTableCell>

                      <AdminTableCell>
                        <StatusBadge
                          status={getStatusColor(booking.status || 'pending')}
                          label={(booking.status || 'pending').toUpperCase()}
                        />
                      </AdminTableCell>

                      <AdminTableCell>
                        <StatusBadge
                          status={getPaymentStatusColor(
                            booking.payment_status || 'unpaid'
                          )}
                          label={(
                            booking.payment_status || 'unpaid'
                          ).toUpperCase()}
                        />
                        {/* Debug */}
                        <div className="text-xs text-muted-foreground mt-1">
                          Raw: {booking.payment_status || 'null'}
                        </div>
                      </AdminTableCell>

                      <AdminTableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {formatPrice(
                              booking.total_price || 0,
                              booking.currency || 'VND'
                            )}
                          </p>
                          {/* Debug */}
                          <div className="text-xs text-muted-foreground">
                            Raw: {booking.total_price || 'null'}
                          </div>
                          {booking.refund_amount &&
                            booking.refund_amount > 0 && (
                              <p className="text-xs text-error">
                                Refunded:{' '}
                                {formatPrice(
                                  booking.refund_amount,
                                  booking.currency || 'VND'
                                )}
                              </p>
                            )}
                        </div>
                      </AdminTableCell>

                      <AdminTableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {booking.passengerCount || 0}
                          </span>
                        </div>
                      </AdminTableCell>

                      <AdminTableCell>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(booking.created_at)}
                        </p>
                      </AdminTableCell>

                      <AdminTableCell>
                        <div className="flex items-center gap-2">
                          {/* Chỉ cho phép Cancel với bookings đang confirmed */}
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUpdateStatus(
                                  booking.booking_id,
                                  booking.booking_reference,
                                  booking.status,
                                  'cancelled'
                                )
                              }}
                              className="p-1.5 rounded-lg hover:bg-error/10 text-error transition"
                              title="Cancel Booking"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}

                          {/* Chỉ cho phép Refund với bookings confirmed và đã paid */}
                          {booking.status === 'confirmed' &&
                            booking.payment_status === 'paid' &&
                            !booking.refund_amount && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenRefundDialog(booking)
                                }}
                                className="p-1.5 rounded-lg hover:bg-warning/10 text-warning transition"
                                title="Process Refund"
                              >
                                <DollarSign className="h-4 w-4" />
                              </button>
                            )}

                          {/* Hiển thị thông báo cho completed bookings */}
                          {booking.status === 'completed' && (
                            <span className="text-xs text-muted-foreground italic">
                              Completed - No actions available
                            </span>
                          )}

                          {/* Hiển thị thông báo cho cancelled bookings */}
                          {booking.status === 'cancelled' && (
                            <span className="text-xs text-muted-foreground italic">
                              Already cancelled
                            </span>
                          )}
                        </div>
                      </AdminTableCell>
                    </AdminTableRow>

                    {/* Expanded Details */}
                    {expandedBookingId === booking.booking_id && (
                      <AdminTableRow>
                        <td colSpan={8} className="bg-muted/30">
                          <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Booking Information */}
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-3">
                                  Booking Information
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Booking ID:
                                    </span>
                                    <span className="font-medium">
                                      {booking.booking_id}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Trip ID:
                                    </span>
                                    <span className="font-medium">
                                      {booking.trip_id}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Created:
                                    </span>
                                    <span className="font-medium">
                                      {formatDate(booking.created_at)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Updated:
                                    </span>
                                    <span className="font-medium">
                                      {formatDate(booking.updated_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Payment Information */}
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-3">
                                  Payment Information
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Subtotal:
                                    </span>
                                    <span className="font-medium">
                                      {formatPrice(
                                        booking.subtotal || 0,
                                        booking.currency || 'VND'
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Service Fee:
                                    </span>
                                    <span className="font-medium">
                                      {formatPrice(
                                        booking.service_fee || 0,
                                        booking.currency || 'VND'
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-t border-border pt-2">
                                    <span className="text-muted-foreground font-semibold">
                                      Total:
                                    </span>
                                    <span className="font-semibold text-primary">
                                      {formatPrice(
                                        booking.total_price,
                                        booking.currency || 'VND'
                                      )}
                                    </span>
                                  </div>
                                  {booking.refund_amount &&
                                    booking.refund_amount > 0 && (
                                      <>
                                        <div className="flex justify-between text-error">
                                          <span>Refund Amount:</span>
                                          <span className="font-semibold">
                                            {formatPrice(
                                              booking.refund_amount,
                                              booking.currency || 'VND'
                                            )}
                                          </span>
                                        </div>
                                        {booking.cancellation_reason && (
                                          <div className="mt-2 p-2 bg-error/10 rounded text-xs">
                                            <span className="font-medium">
                                              Reason:
                                            </span>{' '}
                                            {booking.cancellation_reason}
                                          </div>
                                        )}
                                      </>
                                    )}
                                </div>
                              </div>
                            </div>

                            {/* Passengers */}
                            {booking.passengers &&
                              booking.passengers.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-foreground mb-3">
                                    Passengers ({booking.passengers.length})
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {booking.passengers.map((passenger) => (
                                      <div
                                        key={passenger.passenger_id}
                                        className="p-3 bg-card border border-border rounded-lg"
                                      >
                                        <div className="flex justify-between items-start mb-2">
                                          <p className="font-medium text-sm">
                                            {passenger.full_name}
                                          </p>
                                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                                            {passenger.seat_code}
                                          </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          Phone: {passenger.phone}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          ID: {passenger.id_number}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {/* Trip Information */}
                            {booking.trip && (
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-3">
                                  Trip Information
                                </h4>
                                <div className="p-4 bg-card border border-border rounded-lg">
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Route:
                                      </span>
                                      <span className="font-medium">
                                        {booking.trip.route.origin} →{' '}
                                        {booking.trip.route.destination}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Departure:
                                      </span>
                                      <span className="font-medium">
                                        {formatDate(
                                          booking.trip.schedule.departureTime
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Arrival:
                                      </span>
                                      <span className="font-medium">
                                        {formatDate(
                                          booking.trip.schedule.arrivalTime
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Base Price:
                                      </span>
                                      <span className="font-medium">
                                        {formatPrice(
                                          booking.trip.pricing.basePrice,
                                          booking.currency || 'VND'
                                        )}
                                      </span>
                                    </div>
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
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  onPageChange={setCurrentPage}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </>
        )}

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
        />

        {/* Refund Dialog */}
        {refundDialog.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Process Refund</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Booking Reference
                  </p>
                  <p className="font-medium">{refundDialog.bookingReference}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Price
                  </p>
                  <p className="font-medium">
                    {formatPrice(refundDialog.totalPrice)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Refund Amount *
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter refund amount"
                    max={refundDialog.totalPrice}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Reason
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter refund reason (optional)"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setRefundDialog({ ...refundDialog, open: false })
                      setRefundAmount('')
                      setRefundReason('')
                    }}
                    className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProcessRefund}
                    className="flex-1 px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition"
                  >
                    Process Refund
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

export default AdminBookingManagement
