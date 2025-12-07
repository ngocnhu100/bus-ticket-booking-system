import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SeatMap } from '@/components/users/SeatMap'
import { ChevronLeft, ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { Seat, SeatMapData, Trip } from '@/types/trip.types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const MAX_SELECTABLE_SEATS = import.meta.env.VITE_MAX_SELECTABLE_SEATS
  ? parseInt(import.meta.env.VITE_MAX_SELECTABLE_SEATS)
  : 5

/**
 * Format time from a date string
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
 * SeatSelection Page
 * Allows users to select seats for their chosen trip
 */
export function SeatSelection() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [seatMapData, setSeatMapData] = useState<SeatMapData | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch trip details and seat map
  useEffect(() => {
    const fetchTripAndSeats = async () => {
      if (!tripId) {
        setError('Trip ID is missing')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch trip details
        const tripResponse = await fetch(`${API_BASE_URL}/trips/${tripId}`)
        console.log('Trip API response:', tripResponse)
        if (!tripResponse.ok) {
          throw new Error('Failed to fetch trip details')
        }
        const tripResult = await tripResponse.json()
        console.log('Trip API result:', tripResult)
        const tripData = tripResult.data || tripResult
        setTrip(tripData)

        // Fetch seat map
        const seatsResponse = await fetch(
          `${API_BASE_URL}/trips/${tripId}/seats`
        )
        console.log('Seats API response:', seatsResponse)
        if (!seatsResponse.ok) {
          throw new Error('Failed to fetch seat map')
        }
        const seatsResult = await seatsResponse.json()
        console.log('Seats API result:', seatsResult)
        const seatsData = seatsResult.data.seat_map || seatsResult
        console.log('Processed seats data:', seatsData)
        setSeatMapData(seatsData)
      } catch (err) {
        console.error('Error fetching trip/seats:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to load trip details'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchTripAndSeats()
  }, [tripId])

  const handleSeatSelect = (seat: Seat, isSelected: boolean) => {
    if (!seat.seat_id) return // Skip if no seat id

    if (isSelected) {
      setSelectedSeats([...selectedSeats, seat.seat_id])
      setTotalPrice((prev) => prev + seat.price)
    } else {
      setSelectedSeats(selectedSeats.filter((id) => id !== seat.seat_id))
      setTotalPrice((prev) => prev - seat.price)
    }
  }

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat')
      return
    }
    // In real app, navigate to next step (passenger details, etc.)
    console.log('Selected seats:', selectedSeats)
    console.log('Total price:', totalPrice)
  }

  const getSelectedSeatCodes = () => {
    if (!seatMapData?.seats) return '-'
    const selectedSeatObjects = seatMapData.seats.filter(
      (seat) => seat.seat_id && selectedSeats.includes(seat.seat_id)
    )
    return selectedSeatObjects.length > 0
      ? selectedSeatObjects.map((seat) => seat.seat_code).join(', ')
      : '-'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading trip details...</p>
        </div>
      </div>
    )
  }

  if (error || !seatMapData || !trip) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Error Loading Trip
            </h2>
            <p className="text-muted-foreground mb-4">
              {error || 'Failed to load trip details. Please try again.'}
            </p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Custom Header for Seat Selection */}
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Back Button and Logo */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🚌</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">
                BusGo
              </span>
            </div>
          </div>

          {/* Dashboard Button and Theme Toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </div>
        </nav>
      </header>

      <div className="bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              Select Your Seats
            </h1>
          </div>

          {/* Trip Details Header */}
          {trip && (
            <Card className="p-4 bg-card border border-border/50 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    Trip Details:
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {trip.route?.origin || 'Unknown'}
                  </span>
                  <ArrowRight className="w-4 h-4 inline mx-1" />
                  <span className="text-sm font-semibold text-foreground">
                    {trip.route?.destination || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{trip.operator?.name || 'Unknown'}</span>
                  <span>
                    {formatTime(trip.schedule?.departure_time)}
                    {' - '}
                    {formatTime(trip.schedule?.arrival_time)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Main Content Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Seat Map */}
            <div className="flex-1 space-y-4">
              {/* Seat Map Component */}
              {seatMapData && (
                <SeatMap
                  seatMapData={seatMapData}
                  selectedSeats={selectedSeats}
                  onSeatSelect={handleSeatSelect}
                  maxSelectable={MAX_SELECTABLE_SEATS}
                />
              )}
            </div>

            {/* Right Column - Booking Summary */}
            <div className="lg:w-80 xl:w-96 shrink-0">
              <Card className="p-4 bg-card border border-border/50">
                <h3 className="text-base font-semibold text-foreground mb-3">
                  BOOKING SUMMARY
                </h3>

                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Selected Seats:</p>
                    <p className="font-semibold text-foreground">
                      {getSelectedSeatCodes()}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Passengers:</p>
                    <p className="font-semibold text-foreground">
                      {selectedSeats.length}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <p className="text-muted-foreground">Fare per seat:</p>
                    <p className="font-semibold text-foreground">
                      {trip?.pricing?.base_price
                        ? trip.pricing.base_price.toLocaleString('vi-VN')
                        : '0'}
                      đ
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Subtotal:</p>
                    <p className="font-semibold text-foreground">
                      {totalPrice.toLocaleString('vi-VN')}đ
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Service fee:</p>
                    <p className="font-semibold text-foreground">0đ</p>
                  </div>

                  <div className="pt-2 border-t border-border/50 border-b">
                    <p className="text-muted-foreground">Total:</p>
                    <p className="text-lg font-bold text-primary">
                      {totalPrice.toLocaleString('vi-VN')}đ
                    </p>
                  </div>

                  <Button
                    onClick={handleContinue}
                    disabled={selectedSeats.length === 0}
                    className="w-full mt-3"
                    size="sm"
                  >
                    Continue to Checkout
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
