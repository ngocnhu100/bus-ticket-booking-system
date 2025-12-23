import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '../../components/users/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  SubmitRatingForm,
  type RatingSubmission,
  type RatingFormState,
} from '@/components/reviews'
import { useAuth } from '@/context/AuthContext'
import { ArrowRight, Mail, Phone } from 'lucide-react'
import {
  getUserBookings,
  type Booking,
  type BookingFilters,
} from '@/api/bookings'
import { submitRating } from '@/api/trips'
import '@/styles/admin.css'

/**
 * History Page - User Booking Dashboard
 * Integrated with full booking management features:
 * - List all user bookings
 * - Filter by status
 * - Pagination
 * - View booking details
 * - Status indicators
 */
const History = () => {
  const { token, logout } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedBookingForRating, setSelectedBookingForRating] =
    useState<Booking | null>(null)
  const [ratingFormState, setRatingFormState] = useState<
    Record<string, RatingFormState>
  >({})
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBookings, setTotalBookings] = useState(0)

  // Filter state
  const [statusFilter, setStatusFilter] =
    useState<BookingFilters['status']>('all')

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const filters: BookingFilters = {
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: currentPage,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }

      const response = await getUserBookings(filters)

      if (response.success) {
        setBookings(response.data)
        setTotalPages(response.pagination.totalPages)
        setTotalBookings(response.pagination.total)
      }
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError('Failed to load bookings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, currentPage])

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Disable background scroll when modal is open
  useEffect(() => {
    if (selectedBooking || selectedBookingForRating) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedBooking, selectedBookingForRating])

  // Status badge styling
  const getStatusBadge = (status: Booking['status']) => {
    const styles = {
      pending:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      confirmed:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      completed:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  // Format date
  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A'
    let d: Date
    if (date instanceof Date) {
      d = date
    } else {
      // Handle PostgreSQL timestamp format: '2025-12-22 09:32:05.2593+00'
      const isoString = date.replace(' ', 'T').replace(/\+(\d{2})$/, '+$1:00')
      d = new Date(isoString)
    }
    if (isNaN(d.getTime())) return 'Invalid Date'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  }

  // Check if booking is within 60-day rating window
  const isWithinRatingWindow = (departureTime: string) => {
    const tripDate = new Date(departureTime)
    const now = new Date()
    const daysSince = Math.floor(
      (now.getTime() - tripDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysSince <= 60
  }

  // View booking details
  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking)
  }

  // Close details modal
  const handleCloseDetails = () => {
    setSelectedBooking(null)
  }

  // Close rating modal
  const handleCloseRating = () => {
    setSelectedBookingForRating(null)
  }

  // Handle rating form state changes
  const handleRatingFormStateChange = useCallback(
    (bookingId: string, state: RatingFormState) => {
      setRatingFormState((prev) => ({
        ...prev,
        [bookingId]: state,
      }))
    },
    []
  )

  // Callback for rating form state changes
  const handleRatingStateChange = useCallback(
    (state: RatingFormState) => {
      if (selectedBookingForRating) {
        handleRatingFormStateChange(selectedBookingForRating.booking_id, state)
      }
    },
    [selectedBookingForRating, handleRatingFormStateChange]
  )

  // Handle rating submission
  const handleSubmitRating = async (ratingData: RatingSubmission) => {
    setIsSubmittingRating(true)
    setRatingError(null)

    try {
      // Check if user is still authenticated
      if (!token) {
        setRatingError('Your session has expired. Please log in again.')
        logout()
        return
      }

      // Prepare rating data for API
      const apiData = {
        bookingId: ratingData.bookingId,
        tripId: ratingData.tripId,
        ratings: ratingData.ratings,
        review: ratingData.review,
        // TODO: Handle photos conversion to base64
        // photos: ratingData.photos ? await convertFilesToBase64(ratingData.photos) : undefined,
      }

      // Call API to submit rating
      await submitRating(apiData)

      // Immediately update the booking to mark it as rated (optimistic update)
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.booking_id === ratingData.bookingId
            ? { ...booking, hasRating: true }
            : booking
        )
      )

      // Close the rating modal
      setSelectedBookingForRating(null)

      // Refresh bookings to show updated state (in background)
      fetchBookings()
      // Clear saved form state after successful submission
      setRatingFormState((prev) => {
        const newState = { ...prev }
        delete newState[ratingData.bookingId]
        return newState
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to submit rating'

      // Check if it's an authentication error
      if (message.includes('log in') || message.includes('session')) {
        logout()
      }

      setRatingError(message)
      throw err
    } finally {
      setIsSubmittingRating(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Booking History
          </h1>
          <p className="text-muted-foreground">
            View and manage your bookings ({totalBookings} total)
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter('all')
                setCurrentPage(1)
              }}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter('pending')
                setCurrentPage(1)
              }}
              size="sm"
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter('confirmed')
                setCurrentPage(1)
              }}
              size="sm"
            >
              Confirmed
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter('completed')
                setCurrentPage(1)
              }}
              size="sm"
            >
              Completed
            </Button>
            <Button
              variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter('cancelled')
                setCurrentPage(1)
              }}
              size="sm"
            >
              Cancelled
            </Button>
          </div>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading bookings...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 text-center border-red-200 dark:border-red-800">
            <svg
              className="w-12 h-12 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchBookings}>Try Again</Button>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && bookings.length === 0 && (
          <Card className="p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
            <p className="text-muted-foreground mb-4">
              {statusFilter === 'all'
                ? "You haven't made any bookings yet."
                : `No ${statusFilter} bookings found.`}
            </p>
            <Button onClick={() => (window.location.href = '/')}>
              Search for Trips
            </Button>
          </Card>
        )}

        {/* Bookings List */}
        {!isLoading && !error && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.booking_id} className="space-y-3">
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left Side - Booking Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {booking.booking_reference}
                        </h3>
                        {getStatusBadge(booking.status)}
                      </div>

                      {booking.trip_details && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="font-medium text-foreground flex items-center gap-2">
                            {booking.trip_details.route?.origin}
                            <ArrowRight className="w-4 h-4" />
                            {booking.trip_details.route?.destination}
                          </p>
                        </div>
                      )}

                      {/* Contact Info */}
                      <div className="mt-3">
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {booking.contact_email}
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {booking.contact_phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Price and Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Total Price
                        </p>
                        <p className="text-xl font-bold text-primary">
                          {formatPrice(booking.pricing.total)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(booking)}
                        >
                          View Details
                        </Button>
                        {booking.status === 'completed' &&
                          isWithinRatingWindow(
                            booking.trip_details?.schedule?.departure_time || ''
                          ) &&
                          !booking.hasRating && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() =>
                                setSelectedBookingForRating(booking)
                              }
                            >
                              Submit Review
                            </Button>
                          )}
                      </div>
                    </div>
                  </div>
                </Card>

                {ratingError && (
                  <Card className="p-4 bg-destructive/10 border-destructive/20">
                    <p className="text-sm text-destructive">{ratingError}</p>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {/* Booking Details Modal */}
        {selectedBooking && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseDetails()
              }
            }}
          >
            <Card
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Booking Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseDetails}
                  >
                    ✕
                  </Button>
                </div>

                {/* Booking Reference */}
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      {selectedBooking.booking_reference}
                    </h3>
                    {getStatusBadge(selectedBooking.status)}
                  </div>
                </div>

                {/* Trip Details */}
                {selectedBooking.trip_details && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">Trip Information</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
                      <p className="flex items-center gap-2">
                        <span className="text-muted-foreground">Route:</span>
                        {selectedBooking.trip_details.route?.origin}
                        <ArrowRight className="w-4 h-4" />
                        {selectedBooking.trip_details.route?.destination}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Operator:</span>{' '}
                        {selectedBooking.trip_details.operator?.name}
                      </p>
                      {selectedBooking.trip_details.schedule && (
                        <>
                          <p>
                            <span className="text-muted-foreground">
                              Departure:
                            </span>{' '}
                            {formatDate(
                              selectedBooking.trip_details.schedule
                                .departure_time
                            )}
                          </p>
                          <p>
                            <span className="text-muted-foreground">
                              Arrival:
                            </span>{' '}
                            {formatDate(
                              selectedBooking.trip_details.schedule.arrival_time
                            )}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Passengers */}
                {selectedBooking.seatCodes &&
                  selectedBooking.seatCodes.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-2">Seats</h4>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm">
                        <p className="text-muted-foreground">
                          Seat Codes: {selectedBooking.seatCodes.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                {/* Pricing */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Pricing</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>
                        {formatPrice(selectedBooking.pricing.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Service Fee:
                      </span>
                      <span>
                        {formatPrice(selectedBooking.pricing.service_fee)}
                      </span>
                    </div>
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-primary">
                        {formatPrice(selectedBooking.pricing.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Payment</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm">
                    <p>
                      <span className="text-muted-foreground">Status:</span>{' '}
                      <span
                        className={
                          selectedBooking.payment.status === 'paid'
                            ? 'text-green-600 font-medium'
                            : 'text-yellow-600 font-medium'
                        }
                      >
                        {selectedBooking.payment.status}
                      </span>
                    </p>
                    {selectedBooking.payment.paidAt && (
                      <p>
                        <span className="text-muted-foreground">Paid At:</span>{' '}
                        {formatDate(selectedBooking.payment.paidAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCloseDetails}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Rating Modal */}
        {selectedBookingForRating && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseRating()
              }
            }}
          >
            <Card
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Submit Your Review</h2>
                  <Button variant="ghost" size="sm" onClick={handleCloseRating}>
                    ✕
                  </Button>
                </div>

                {/* Trip Info */}
                <div className="mb-6">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm">
                    <p className="font-medium flex items-center gap-2">
                      {selectedBookingForRating.trip_details?.route?.origin}
                      <ArrowRight className="w-4 h-4" />
                      {
                        selectedBookingForRating.trip_details?.route
                          ?.destination
                      }
                    </p>
                    <p className="text-muted-foreground">
                      {selectedBookingForRating.trip_details?.operator?.name} •{' '}
                      {selectedBookingForRating.booking_reference}
                    </p>
                  </div>
                </div>

                {/* Rating Form */}
                <SubmitRatingForm
                  bookingId={selectedBookingForRating.booking_id}
                  bookingReference={selectedBookingForRating.booking_reference}
                  tripReference={selectedBookingForRating.trip_id}
                  onSubmit={handleSubmitRating}
                  onCancel={handleCloseRating}
                  isLoading={isSubmittingRating}
                  initialValues={
                    ratingFormState[selectedBookingForRating.booking_id]
                  }
                  onStateChange={handleRatingStateChange}
                />

                {ratingError && (
                  <div className="mt-4 flex gap-3 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                    <p className="text-sm font-medium">{ratingError}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default History
