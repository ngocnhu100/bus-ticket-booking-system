import { useState, useEffect } from 'react'
import { TripCard } from '@/components/users/TripCard'
import { TripSearchForm } from '@/components/users/TripSearchForm'
import { useToast } from '../../hooks/use-toast'
import '@/styles/admin.css'
import { DashboardLayout } from '@/components/users/DashboardLayout'
import { CancelBookingDialog } from '@/components/users/CancelBookingDialog'
import { ModifyBookingDialog } from '@/components/users/ModifyBookingDialog'
import { getUserBookings, type Booking } from '@/api/bookings'
import { Loader2 } from 'lucide-react'
import { getAccessToken } from '@/api/auth'
import { API_BASE_URL } from '@/lib/api'

const Dashboard = () => {
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  )
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)

  // Fetch user bookings on mount
  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getUserBookings({
        status: 'confirmed',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 50, // Limit to prevent timeout
      })

      // Filter only upcoming trips (future departure time)
      const now = new Date()
      const upcomingBookings = (response.data || []).filter((booking) => {
        // Only show confirmed bookings
        if (booking.status !== 'confirmed') return false

        // Check if trip has future departure time
        const departureTime = booking.trip_details?.schedule?.departure_time
        if (departureTime) {
          const departure = new Date(departureTime)
          return departure > now
        }

        // If no departure time, include it (fallback)
        return true
      })

      setBookings(upcomingBookings)
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setCancelDialogOpen(true)
  }

  const handleModify = (bookingId: string, tripId: string) => {
    setSelectedBookingId(bookingId)
    setSelectedTripId(tripId)
    setModifyDialogOpen(true)
  }

  const handleViewTicket = async (bookingId: string) => {
    const booking = bookings.find((b) => b.booking_id === bookingId)
    if (!booking?.booking_reference) {
      toast({
        title: 'E-Ticket Not Available',
        description: 'Booking reference not found.',
      })
      return
    }

    try {
      const token = getAccessToken()
      const headers: HeadersInit = {
        Authorization: `Bearer ${token}`,
      }

      // Call ticket endpoint with authentication
      const response = await fetch(
        `${API_BASE_URL}/bookings/${booking.booking_reference}/ticket`,
        { headers }
      )

      if (!response.ok) {
        throw new Error('Failed to load ticket')
      }

      // Convert response to blob and open in new tab
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')

      // Cleanup after a delay to allow the new tab to load
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error('Error viewing ticket:', error)
      toast({
        title: 'View Failed',
        description: 'Unable to view e-ticket. Please try again.',
      })
    }
  }

  const handleCancelSuccess = () => {
    toast({
      title: 'Booking Cancelled',
      description: 'Your booking has been cancelled successfully',
    })
    fetchBookings() // Refresh bookings list
  }

  const handleModifySuccess = () => {
    toast({
      title: 'Booking Modified',
      description: 'Your booking has been updated successfully',
    })
    fetchBookings() // Refresh bookings list
  }

  // Transform bookings for TripCard component
  const upcomingTrips = bookings.map((booking) => {
    // Handle seatCodes field from API (it's an array of strings)
    const seats =
      booking.seatCodes?.join(', ') ||
      booking.passengers?.map((p) => p.seatCode).join(', ') ||
      'Unknown'

    return {
      from: booking.trip_details?.route?.origin || 'Unknown',
      to: booking.trip_details?.route?.destination || 'Unknown',
      date: booking.trip_details?.schedule?.departure_time
        ? new Date(
            booking.trip_details.schedule.departure_time
          ).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : booking.created_at
          ? new Date(booking.created_at).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : 'Unknown',
      time: booking.trip_details?.schedule?.departure_time
        ? new Date(
            booking.trip_details.schedule.departure_time
          ).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Unknown',
      seats,
      bookingId: booking.booking_id,
      bookingReference: booking.booking_reference,
      tripId: booking.trip_id,
    }
  })

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        {/* Search Form Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Search Bus Tickets
          </h1>
          <p className="text-muted-foreground mb-8">
            Find and book your next trip
          </p>
          <TripSearchForm />
        </div>

        {/* Upcoming Trips Section */}
        <div className="mb-8 mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Upcoming Trips
          </h2>
          <p className="text-muted-foreground">
            Manage your upcoming travel bookings
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && (
          <>
            {upcomingTrips.length > 0 ? (
              <div className="space-y-4">
                {upcomingTrips.map((trip) => (
                  <TripCard
                    key={trip.bookingId}
                    {...trip}
                    status="upcoming"
                    onCancel={() => handleCancel(trip.bookingId)}
                    onModify={() => handleModify(trip.bookingId, trip.tripId)}
                    onViewTicket={() => handleViewTicket(trip.bookingId)}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-12 text-center py-12 border border-dashed border-border rounded-lg">
                <p className="text-muted-foreground mb-2">
                  No upcoming trips found
                </p>
                <p className="text-sm text-muted-foreground">
                  Book a trip to see it here
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel Booking Dialog */}
      {selectedBookingId && (
        <CancelBookingDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          bookingId={selectedBookingId}
          onSuccess={handleCancelSuccess}
        />
      )}

      {/* Modify Booking Dialog */}
      {selectedBookingId && selectedTripId && (
        <ModifyBookingDialog
          open={modifyDialogOpen}
          onOpenChange={setModifyDialogOpen}
          bookingId={selectedBookingId}
          tripId={selectedTripId}
          onSuccess={handleModifySuccess}
        />
      )}
    </DashboardLayout>
  )
}

export default Dashboard
