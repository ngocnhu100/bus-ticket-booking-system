import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/landing/Header'
import {
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Users,
  Mail,
  Phone,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { cancelBooking } from '@/api/bookings'
import type { Booking } from '@/types/booking.types'
import type { Seat } from '@/types/trip.types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/**
 * Format time from ISO string
 */
function formatTime(dateString: string | undefined): string {
  if (!dateString) return 'Unknown'
  try {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return 'Unknown'
  }
}

/**
 * Format date from ISO string
 */
function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Unknown'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return 'Unknown'
  }
}

/**
 * Calculate time remaining until lock expires
 */
function getTimeRemaining(lockedUntil: string | undefined): string {
  if (!lockedUntil) return '0:00'

  const now = new Date().getTime()
  const lockTime = new Date(lockedUntil).getTime()
  const remaining = Math.max(0, lockTime - now)

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Calculate service fee (matches backend calculation: 3% + 10,000 VND fixed fee)
 */
function calculateServiceFee(subtotal: number): number {
  const percentageFee = subtotal * 0.03 // 3%
  const fixedFee = 10000 // 10,000 VND
  return Math.round(percentageFee + fixedFee)
}

/**
 * Format price in VND (match SeatSelection)
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
}

export function BookingReview() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('10:00')
  const [calculatedPricing, setCalculatedPricing] = useState<{
    subtotal: number
    serviceFee: number
    total: number
  } | null>(null)

  // Load booking from sessionStorage or fetch from API
  useEffect(() => {
    const loadBooking = async () => {
      try {
        setLoading(true)
        setError(null)

        // Try to load from sessionStorage first (for guest checkout)
        const pendingBooking = sessionStorage.getItem('pendingBooking')
        if (pendingBooking) {
          const bookingData = JSON.parse(pendingBooking)
          console.log('📋 Booking loaded from sessionStorage:', bookingData)
          setBooking(bookingData)
          await calculatePricing(bookingData)
          setLoading(false)
          return
        }

        // Otherwise fetch from API
        if (!bookingId) {
          throw new Error('Booking ID is missing')
        }

        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to load booking')
        }

        const result = await response.json()
        console.log('📋 Booking loaded from API:', result.data)
        setBooking(result.data)
        await calculatePricing(result.data)
      } catch (err) {
        console.error('Error loading booking:', err)
        setError(err instanceof Error ? err.message : 'Failed to load booking')
      } finally {
        setLoading(false)
      }
    }

    loadBooking()
  }, [bookingId])

  // Calculate pricing by fetching seat prices
  const calculatePricing = async (bookingData: Booking) => {
    try {
      const tripId =
        (bookingData.trip_details as { trip_id?: string } | undefined)
          ?.trip_id || bookingData.trip_id
      if (!tripId) {
        console.warn('No trip ID available for pricing calculation')
        return
      }

      // Fetch seats for the trip
      const seatsResponse = await fetch(`${API_BASE_URL}/trips/${tripId}/seats`)
      if (!seatsResponse.ok) {
        throw new Error('Failed to fetch seat information')
      }

      const seatsResult = await seatsResponse.json()
      // Normalize seat list (API may return { data: { seat_map: { seats: [...] } } } or an array)
      const rawSeatMap = seatsResult?.data?.seat_map ?? seatsResult
      const seatList: Seat[] = Array.isArray(rawSeatMap)
        ? rawSeatMap
        : (rawSeatMap?.seats ?? rawSeatMap)

      // Find prices for the booked seats
      const seatCodes = bookingData.passengers?.map((p) => p.seat_code) || []
      const bookedSeats = (seatList || []).filter((seat: Seat) =>
        seatCodes.includes(seat.seat_code)
      )

      if (bookedSeats.length !== seatCodes.length) {
        console.warn(
          'Some seat prices not found, using backend pricing as fallback'
        )
        return
      }

      // Calculate subtotal by summing seat prices
      const subtotal = bookedSeats.reduce((sum: number, seat: Seat) => {
        const price =
          typeof seat.price === 'string' ? Number(seat.price) : seat.price || 0
        return sum + (Number.isFinite(price) ? price : 0)
      }, 0)
      const serviceFee = calculateServiceFee(subtotal)
      const total = subtotal + serviceFee

      setCalculatedPricing({ subtotal, serviceFee, total })
    } catch (err) {
      console.error('Error calculating pricing:', err)
      // Fallback to backend pricing if calculation fails
    }
  }

  // Update countdown timer
  useEffect(() => {
    if (!booking?.locked_until) return

    const interval = setInterval(() => {
      const remaining = getTimeRemaining(booking.locked_until || undefined)
      setTimeRemaining(remaining)

      // If time expired, show alert and navigate to home
      if (remaining === '0:00') {
        clearInterval(interval)
        alert('Booking time expired. Please select seats again')
        navigate('/')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [booking, navigate])

  const handleProceedToPayment = () => {
    // TODO: Implement payment flow
    // For now, just show a toast and keep placeholder behavior
    alert('Payment integration coming soon!')
    // navigate(`/booking/${bookingId}/payment`)
  }

  const handleCancel = async () => {
    if (!bookingId) return

    try {
      setLoading(true)
      await cancelBooking(bookingId, {
        reason: 'User cancelled',
        requestRefund: true,
      })
      // Clear pending booking and return to home
      sessionStorage.removeItem('pendingBooking')
      alert('Booking cancelled successfully')
      navigate('/')
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading booking details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Booking Not Found</h2>
            <p className="text-muted-foreground">
              {error || 'Unable to load booking details'}
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Back to Home
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const seatCodes =
    booking.passengers
      ?.map((p) => p.seat_code)
      .filter(Boolean)
      .join(', ') || 'N/A'

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/5">
      <Header />
      {/* ThemeToggle is provided in Header - avoid duplicate toggles */}

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Created!</h1>
          <p className="text-muted-foreground text-lg">
            Reference:{' '}
            <span className="font-mono font-semibold text-foreground">
              {booking.booking_reference}
            </span>
          </p>
        </div>

        {/* Time Remaining Alert */}
        {booking.locked_until && (
          <Card className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  Complete payment within: {timeRemaining}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Your seats are temporarily reserved
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Trip Details */}
          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Trip Details
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Route</p>
                <p className="font-semibold text-lg">
                  {booking.trip_details?.route?.origin || 'Unknown'}{' '}
                  <ArrowRight className="inline w-4 h-4 mx-1" />{' '}
                  {booking.trip_details?.route?.destination || 'Unknown'}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Operator</p>
                <p className="font-semibold">
                  {booking.trip_details?.operator?.name || 'Unknown'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Departure
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-sm">
                        {formatDate(
                          booking.trip_details?.schedule?.departure_time
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(
                          booking.trip_details?.schedule?.departure_time
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Arrival</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-sm">
                        {formatDate(
                          booking.trip_details?.schedule?.arrival_time
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(
                          booking.trip_details?.schedule?.arrival_time
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Seats</p>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <p className="font-semibold">{seatCodes}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Contact & Payment */}
          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-bold">Contact & Payment</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Contact Email
                </p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="font-mono text-sm">{booking.contact_email}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Contact Phone
                </p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <p className="font-mono text-sm">{booking.contact_phone}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">Payment Summary</h3>
                <div className="space-y-2">
                  {calculatedPricing ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-semibold text-foreground">
                          {formatPrice(calculatedPricing.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Service Fee
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatPrice(calculatedPricing.serviceFee)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-semibold">Total</span>
                        <span className="text-xl font-bold text-primary">
                          {formatPrice(calculatedPricing.total)}
                        </span>
                      </div>
                    </>
                  ) : booking?.pricing ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-semibold text-foreground">
                          {formatPrice(booking.pricing.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Service Fee
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatPrice(booking.pricing.service_fee)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-semibold">Total</span>
                        <span className="text-xl font-bold text-primary">
                          {formatPrice(booking.pricing.total)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Pricing information not available
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <p className="text-xs text-muted-foreground mb-4">
                  Your e-ticket will be sent to {booking.contact_email} after
                  payment is confirmed.
                </p>

                <div className="space-y-2">
                  <Button
                    onClick={handleProceedToPayment}
                    className="w-full"
                    size="lg"
                  >
                    Proceed to Payment
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel Booking
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Info */}
        <Card className="mt-6 p-6 bg-muted/50">
          <h3 className="font-semibold mb-2">Important Information</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              Complete payment within the time limit to confirm your booking
            </li>
            <li>Your booking reference can be used to check booking status</li>
            <li>E-ticket will be sent to your email after payment</li>
            <li>
              Please arrive at the departure point at least 15 minutes early
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
