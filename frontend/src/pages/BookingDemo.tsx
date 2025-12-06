import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/landing/Header'
import { BookingForm } from '@/components/booking/BookingForm'
import type { Trip } from '@/types/trip.types'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Mock trip data for testing guest checkout - matching Trip type structure
const MOCK_TRIP: Trip = {
  trip_id: 'TRIP_TEST_001',
  route: {
    route_id: '123e4567-e89b-12d3-a456-426614174001',
    origin: 'TP. Hồ Chí Minh',
    destination: 'Đà Lạt',
    distance_km: 308,
    estimated_minutes: 390,
  },
  operator: {
    operator_id: '123e4567-e89b-12d3-a456-426614174003',
    name: 'Phương Trang',
    rating: 4.8,
  },
  bus: {
    bus_id: '123e4567-e89b-12d3-a456-426614174002',
    model: 'Thaco Universe',
    plate_number: '51G-12345',
    seat_capacity: 40,
    bus_type: 'limousine',
    amenities: ['wifi', 'ac', 'water', 'blanket'],
  },
  schedule: {
    departure_time: '2024-12-20T08:00:00Z',
    arrival_time: '2024-12-20T14:30:00Z',
    duration: 390,
  },
  pricing: {
    base_price: 250000,
    currency: 'VND',
  },
  availability: {
    total_seats: 40,
    available_seats: 25,
    occupancy_rate: 37.5,
  },
  policies: {
    cancellation_policy: 'Free cancellation up to 24 hours before departure',
    modification_policy:
      'Modifications allowed up to 12 hours before departure',
    refund_policy: '100% refund if cancelled 24+ hours before departure',
  },
  pickup_points: [
    {
      point_id: '1',
      name: 'Bến xe Miền Đông',
      address: '292 Đinh Bộ Lĩnh, P.26, Q.Bình Thạnh',
      time: '2024-12-20T08:00:00Z',
    },
    {
      point_id: '2',
      name: 'Công viên 23/9',
      address: 'Phạm Ngũ Lão, Q.1',
      time: '2024-12-20T08:15:00Z',
    },
  ],
  dropoff_points: [
    {
      point_id: '1',
      name: 'Trung tâm Đà Lạt',
      address: '01 Nguyễn Thị Minh Khai',
      time: '2024-12-20T14:15:00Z',
    },
    {
      point_id: '2',
      name: 'Hồ Xuân Hương',
      address: 'Trần Quốc Toản',
      time: '2024-12-20T14:30:00Z',
    },
  ],
  status: 'active',
}

export function BookingDemo() {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([
    'B2',
    'C1',
    'D3',
  ])
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)

  // Fetch occupied seats from database
  useEffect(() => {
    const fetchOccupiedSeats = async () => {
      try {
        const response = await axios.get<{
          success: boolean
          data: Array<{ seat_code: string; status: string }>
        }>(`${API_BASE_URL}/trips/TRIP_TEST_001/seats`)
        if (response.data.success && response.data.data) {
          const occupied = response.data.data
            .filter(
              (seat) => seat.status === 'booked' || seat.status === 'locked'
            )
            .map((seat) => seat.seat_code)
          setOccupiedSeats(occupied)
        }
      } catch (error) {
        console.warn('Could not fetch occupied seats, using defaults:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchOccupiedSeats()
  }, [])

  const handleSeatToggle = (seat: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]
    )
  }

  const handleBookingSuccess = (bookingReference: string) => {
    console.log('Booking successful:', bookingReference)
    // Navigation is handled by BookingForm component
  }

  if (showBookingForm && selectedSeats.length > 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="outline"
              onClick={() => setShowBookingForm(false)}
              className="mb-6"
            >
              ← Back to Seat Selection
            </Button>
            <BookingForm
              trip={MOCK_TRIP}
              selectedSeats={selectedSeats}
              onSuccess={handleBookingSuccess}
              onCancel={() => setShowBookingForm(false)}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Trip Details Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.history.back()}
              >
                ← Back
              </Button>
              <div className="h-8 w-px bg-border"></div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {MOCK_TRIP.route.origin} → {MOCK_TRIP.route.destination}
                </p>
                <p className="font-semibold">
                  {MOCK_TRIP.operator.name} •{' '}
                  {new Date(MOCK_TRIP.schedule.departure_time).toLocaleString(
                    'vi-VN',
                    { dateStyle: 'short', timeStyle: 'short' }
                  )}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              DEMO MODE
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Seat Map */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seat Map Card */}
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">SEAT MAP</h2>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred seats
                  </p>
                </div>

                {/* Legend */}
                <div className="flex gap-6 pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 border-2 border-gray-300 rounded flex items-center justify-center text-xs font-medium">
                      A1
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Available
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gray-200 border-2 border-gray-300 rounded flex items-center justify-center text-xs font-medium text-gray-500">
                      X
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Occupied
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-600 border-2 border-blue-600 rounded flex items-center justify-center text-xs font-medium text-white">
                      A1
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Your selection
                    </span>
                  </div>
                </div>

                {/* Seat Grid */}
                <div className="bg-gray-50 p-8 rounded-lg">
                  {/* Driver indicator */}
                  <div className="mb-6">
                    <div className="w-16 h-12 mx-auto bg-gray-300 rounded-t-2xl flex items-center justify-center">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-gray-400">
                        <span className="text-xs font-bold text-gray-600">
                          D
                        </span>
                      </div>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-2">
                      Driver
                    </p>
                  </div>

                  {/* Seat grid - 2-2 layout with aisle */}
                  <div className="space-y-4 max-w-md mx-auto">
                    {loading ? (
                      <p className="text-center text-muted-foreground">
                        Loading seats...
                      </p>
                    ) : (
                      ['A', 'B', 'C', 'D'].map((row) => (
                        <div
                          key={row}
                          className="flex gap-4 justify-center items-center"
                        >
                          {/* Left side - 2 seats */}
                          <div className="flex gap-3">
                            {[1, 2].map((col) => {
                              const seat = `${row}${col}`
                              const isSelected = selectedSeats.includes(seat)
                              const isOccupied = occupiedSeats.includes(seat)

                              return (
                                <button
                                  key={seat}
                                  onClick={() =>
                                    !isOccupied && handleSeatToggle(seat)
                                  }
                                  disabled={isOccupied}
                                  className={`
                                    w-14 h-14 rounded-lg border-2 font-semibold text-sm transition-all
                                    ${
                                      isOccupied
                                        ? 'bg-gray-200 border-gray-300 cursor-not-allowed text-gray-500'
                                        : isSelected
                                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105'
                                          : 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:scale-105'
                                    }
                                  `}
                                >
                                  {isOccupied ? 'X' : seat}
                                </button>
                              )
                            })}
                          </div>

                          {/* Aisle */}
                          <div className="w-8 border-l-2 border-dashed border-gray-300 h-12"></div>

                          {/* Right side - 2 seats */}
                          <div className="flex gap-3">
                            {[3, 4].map((col) => {
                              const seat = `${row}${col}`
                              const isSelected = selectedSeats.includes(seat)
                              const isOccupied = occupiedSeats.includes(seat)

                              return (
                                <button
                                  key={seat}
                                  onClick={() =>
                                    !isOccupied && handleSeatToggle(seat)
                                  }
                                  disabled={isOccupied}
                                  className={`
                                    w-14 h-14 rounded-lg border-2 font-semibold text-sm transition-all
                                    ${
                                      isOccupied
                                        ? 'bg-gray-200 border-gray-300 cursor-not-allowed text-gray-500'
                                        : isSelected
                                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105'
                                          : 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:scale-105'
                                    }
                                  `}
                                >
                                  {isOccupied ? 'X' : seat}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Booking Summary (Sticky) */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-1">BOOKING SUMMARY</h3>
                  <p className="text-sm text-muted-foreground">
                    Review your selection
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Selected Seats */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Selected Seats:
                    </p>
                    {selectedSeats.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedSeats.map((seat) => (
                          <Badge
                            key={seat}
                            variant="secondary"
                            className="text-sm"
                          >
                            {seat}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No seats selected
                      </p>
                    )}
                  </div>

                  {/* Passenger count */}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Passengers
                    </span>
                    <span className="font-semibold">
                      {selectedSeats.length}
                    </span>
                  </div>

                  {/* Pricing breakdown */}
                  {selectedSeats.length > 0 && (
                    <>
                      <div className="space-y-2 pt-4 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Fare per seat
                          </span>
                          <span>
                            {MOCK_TRIP.pricing.base_price.toLocaleString(
                              'vi-VN'
                            )}{' '}
                            VND
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Subtotal
                          </span>
                          <span>
                            {(
                              selectedSeats.length *
                              MOCK_TRIP.pricing.base_price
                            ).toLocaleString('vi-VN')}{' '}
                            VND
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Service fee
                          </span>
                          <span>
                            {(
                              selectedSeats.length *
                              MOCK_TRIP.pricing.base_price *
                              0.05
                            ).toLocaleString('vi-VN')}{' '}
                            VND
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t-2 border-dashed">
                        <span className="font-semibold">Total</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {(
                            selectedSeats.length *
                            MOCK_TRIP.pricing.base_price *
                            1.05
                          ).toLocaleString('vi-VN')}{' '}
                          VND
                        </span>
                      </div>

                      <Button
                        size="lg"
                        onClick={() => setShowBookingForm(true)}
                        className="w-full"
                      >
                        Continue to Checkout
                      </Button>
                    </>
                  )}

                  {selectedSeats.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        Select seats to continue
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
