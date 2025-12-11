import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useBookingStore } from '@/store/bookingStore'
import { createBooking } from '@/api/bookings'
import type { PassengerInfo } from '../../api/bookings'
import type { Trip } from '../../api/trips'

interface BookingSummaryProps {
  // All props are optional - will use store by default
  trip?: Trip
  passengers?: PassengerInfo[]
  contactEmail?: string
  contactPhone?: string
  pricing?: {
    subtotal: number
    serviceFee: number
    total: number
    currency: string
  }
  onConfirm?: () => void
  onBack?: () => void
  isLoading?: boolean
}

/**
 * Booking Summary Component
 * Displays final booking details and creates booking via API
 * Integrated with booking store for state management
 */
export function BookingSummary({
  trip: propTrip,
  passengers: propPassengers,
  contactEmail: propContactEmail,
  contactPhone: propContactPhone,
  pricing: propPricing,
  onConfirm: propOnConfirm,
  onBack,
  isLoading: propIsLoading = false,
}: BookingSummaryProps) {
  const navigate = useNavigate()

  // Get from store
  const {
    selectedTrip,
    passengers: storePassengers,
    contactEmail: storeContactEmail,
    contactPhone: storeContactPhone,
    clearBooking,
  } = useBookingStore()

  // Use props if provided, otherwise use store
  const trip = propTrip || selectedTrip
  const passengers = propPassengers || storePassengers
  const contactEmail = propContactEmail || storeContactEmail
  const contactPhone = propContactPhone || storeContactPhone

  const [isLoading, setIsLoading] = useState(propIsLoading)
  const [error, setError] = useState<string | null>(null)

  // Redirect if no booking data
  useEffect(() => {
    if (!trip || passengers.length === 0 || !contactEmail || !contactPhone) {
      navigate('/booking/passenger-info')
    }
  }, [trip, passengers, contactEmail, contactPhone, navigate])

  // Calculate pricing
  const calculatePricing = () => {
    if (propPricing) return propPricing

    if (!trip) {
      return {
        subtotal: 0,
        serviceFee: 0,
        total: 0,
        currency: 'VND',
      }
    }

    const basePrice = trip.pricing.base_price
    const subtotal = basePrice * passengers.length

    // Service fee calculation (2% with min 5,000 VND)
    const serviceFee = Math.max(subtotal * 0.02, 5000)
    const total = subtotal + serviceFee

    return {
      subtotal,
      serviceFee,
      total,
      currency: trip.pricing.currency || 'VND',
    }
  }

  const pricing = calculatePricing()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Unknown'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Unknown'
      return date.toLocaleString('vi-VN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Unknown'
    }
  }

  const handleConfirm = async () => {
    if (propOnConfirm) {
      // Use custom handler if provided (backward compatibility)
      propOnConfirm()
      return
    }

    if (!trip) {
      setError('Trip information is missing')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Prepare booking data
      const bookingData = {
        tripId: trip.trip_id,
        seats: passengers.map((p: PassengerInfo) => p.seatCode),
        passengers: passengers,
        contactEmail: contactEmail,
        contactPhone: contactPhone,
      }

      console.log('Creating booking with data:', bookingData)

      // Call API to create booking
      const response = await createBooking(bookingData)

      if (response.success) {
        console.log('Booking created successfully:', response.data)

        // Clear booking store
        clearBooking()

        // Show success and redirect to payment or booking details
        // For now, redirect to booking confirmation page
        alert(
          `Booking created successfully! Reference: ${response.data.booking_reference}`
        )

        // Redirect to user bookings/history
        navigate('/users/history')
      } else {
        throw new Error('Booking creation failed')
      }
    } catch (err) {
      console.error('Error creating booking:', err)

      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to create booking. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/booking/passenger-info')
    }
  }

  if (!trip) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">Booking Summary</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please review your booking details before confirming.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-500 mr-2 mt-0.5 shrink-0"
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
                <div className="flex-1">
                  <p className="font-medium text-red-800 dark:text-red-400">
                    Error
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trip Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Trip Information
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Route</span>
                <span className="font-medium">
                  {trip.route.origin} → {trip.route.destination}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Distance
                </span>
                <span className="font-medium">{trip.route.distance} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Operator
                </span>
                <span className="font-medium">{trip.operator.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Bus Type
                </span>
                <span className="font-medium capitalize">
                  {trip.bus.bus_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Departure
                </span>
                <span className="font-medium">
                  {formatDateTime(trip.schedule.departure_time)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Arrival
                </span>
                <span className="font-medium">
                  {formatDateTime(trip.schedule.arrival_time)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Total Seats
                </span>
                <span className="font-medium">{passengers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Seat Numbers
                </span>
                <span className="font-medium">
                  {passengers.map((p: PassengerInfo) => p.seatCode).join(', ')}
                </span>
              </div>
            </div>
          </div>

          {/* Passenger Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Passengers
            </h3>
            <div className="space-y-3">
              {passengers.map((passenger: PassengerInfo, index: number) => (
                <div
                  key={`${passenger.seatCode}-${index}`}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium">Passenger {index + 1}</span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                      Seat {passenger.seatCode}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Name:
                      </span>
                      <span>{passenger.fullName}</span>
                    </div>
                    {passenger.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Phone:
                        </span>
                        <span>{passenger.phone}</span>
                      </div>
                    )}
                    {passenger.documentId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Document ID:
                        </span>
                        <span>{passenger.documentId}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Contact Details
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email</span>
                <span className="font-medium">{contactEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Phone</span>
                <span className="font-medium">{contactPhone}</span>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Pricing Details
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Subtotal ({passengers.length} seat
                  {passengers.length > 1 ? 's' : ''})
                </span>
                <span>{formatPrice(pricing.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Service Fee
                </span>
                <span>{formatPrice(pricing.serviceFee)}</span>
              </div>
              <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {formatPrice(pricing.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mr-2 mt-0.5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-400 mb-1">
                  Important Notice
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Your seats will be reserved for 10 minutes. Please complete
                  payment within this time to confirm your booking.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isLoading}
              className="sm:w-auto"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
            >
              {isLoading
                ? 'Creating Booking...'
                : 'Confirm & Proceed to Payment'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
