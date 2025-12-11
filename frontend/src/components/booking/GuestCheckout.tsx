import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ChevronLeft, UserCheck } from 'lucide-react'
import { PassengerInformationForm } from '@/components/booking/PassengerInformationForm'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { createBooking } from '@/api/bookings'
import { useBookingStore } from '@/store/bookingStore'

interface GuestCheckoutProps {
  selectedSeats?: { seat_id: string; seat_code: string }[]
  onSubmit?: (data: {
    contactEmail: string
    contactPhone: string
    passengers: {
      fullName: string
      phone?: string
      documentId?: string
      seatCode: string
    }[]
  }) => void
  onBack?: () => void
}

const GuestCheckout: React.FC<GuestCheckoutProps> = ({
  selectedSeats: propSeats,
  onSubmit,
  onBack,
}) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { selectedTrip } = useBookingStore()

  const selectedSeats = propSeats ?? []
  const [contactEmail, setContactEmail] = React.useState(user?.email || '')
  const [contactPhone, setContactPhone] = React.useState(user?.phone || '')
  const [contactErrors, setContactErrors] = React.useState<{
    email?: string
    phone?: string
  }>({})
  const [passengers, setPassengers] = React.useState<
    {
      fullName: string
      phone?: string
      documentId?: string
      seatCode: string
    }[]
  >([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const validateContactInfo = () => {
    const errors: { email?: string; phone?: string } = {}
    let isValid = true
    if (!contactEmail.trim()) {
      errors.email = 'Email is required'
      isValid = false
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(contactEmail.trim())) {
        errors.email = 'Invalid email format'
        isValid = false
      }
    }
    if (!contactPhone.trim()) {
      errors.phone = 'Phone number is required'
      isValid = false
    } else {
      const phoneRegex = /^(\+84|0)[0-9]{9,10}$/
      if (!phoneRegex.test(contactPhone.trim())) {
        errors.phone = 'Invalid phone format (e.g., 0901234567)'
        isValid = false
      }
    }
    setContactErrors(errors)
    return isValid
  }

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault()

    console.log('=== GuestCheckout handleSubmit DEBUG ===')
    console.log('passengers:', passengers)
    console.log('contactEmail:', contactEmail)
    console.log('contactPhone:', contactPhone)
    console.log('selectedTrip:', selectedTrip)
    console.log('selectedTrip?.trip_id:', selectedTrip?.trip_id)
    console.log('selectedSeats:', selectedSeats)

    setError(null)
    setIsSubmitting(true)

    try {
      // Validate contact info
      const contactValid = validateContactInfo()
      if (!contactValid || passengers.length === 0) {
        setIsSubmitting(false)
        return
      }

      // Validate selectedTrip exists
      if (!selectedTrip?.trip_id) {
        console.error(
          'selectedTrip is missing or has no trip_id:',
          selectedTrip
        )
        throw new Error(
          'Trip information is missing. Please select seats again.'
        )
      }

      // Prepare booking data
      const bookingData = {
        tripId: selectedTrip.trip_id,
        seats: selectedSeats.map((s) => s.seat_code),
        passengers: passengers,
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        isGuestCheckout: !user,
      }

      console.log('Creating booking with data:', bookingData)

      // Call backend API
      const response = await createBooking(bookingData)
      console.log('Booking created successfully:', response.data)

      // Store booking in sessionStorage for BookingReview
      sessionStorage.setItem('pendingBooking', JSON.stringify(response.data))

      // Navigate to review page with bookingId
      navigate(`/booking/${response.data.booking_id}/review`)

      // Call optional onSubmit callback if provided
      if (onSubmit) {
        onSubmit({ contactEmail, contactPhone, passengers })
      }
    } catch (err) {
      console.error('Error creating booking:', err)
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to create booking. Please try again.'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <Card className="max-w-4xl mx-auto mb-8 rounded-2xl shadow-xl border border-border/70 bg-white dark:bg-slate-900">
        <CardHeader className="pb-0 pt-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-7 h-7 text-primary" />
            <CardTitle className="text-3xl font-bold text-center text-foreground">
              {user ? 'Passenger Information' : 'Guest Checkout'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-2 pb-8 px-4 md:px-8">
          {/* Back button */}
          {onBack && (
            <div className="mb-6 flex">
              <Button
                type="button"
                onClick={onBack}
                variant="outline"
                className="gap-2 px-4 py-2 rounded-full shadow-sm border-primary text-primary hover:bg-primary/10"
                disabled={isSubmitting}
              >
                <ChevronLeft className="w-4 h-4" />
                Quay lại chọn ghế
              </Button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="mb-8">
            <Card className="border rounded-xl shadow-sm bg-white dark:bg-slate-800">
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-lg font-semibold text-primary">
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      value={contactEmail}
                      onChange={(e) => {
                        setContactEmail(e.target.value)
                        setContactErrors((prev) => ({
                          ...prev,
                          email: undefined,
                        }))
                      }}
                      onBlur={() => {
                        if (!contactEmail.trim()) {
                          setContactErrors((prev) => ({
                            ...prev,
                            email: 'Email is required',
                          }))
                        } else {
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                          if (!emailRegex.test(contactEmail.trim())) {
                            setContactErrors((prev) => ({
                              ...prev,
                              email: 'Invalid email format',
                            }))
                          }
                        }
                      }}
                      readOnly={!!user}
                      disabled={!!user}
                      className={
                        'w-full rounded-lg border px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground/70 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-[#d0d0d0] ' +
                        (contactErrors.email
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-input') +
                        (user ? ' bg-muted cursor-not-allowed' : '')
                      }
                      required
                    />
                    {contactErrors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {contactErrors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      placeholder="0901234567"
                      value={contactPhone}
                      onChange={(e) => {
                        setContactPhone(e.target.value)
                        setContactErrors((prev) => ({
                          ...prev,
                          phone: undefined,
                        }))
                      }}
                      onBlur={() => {
                        if (!contactPhone.trim()) {
                          setContactErrors((prev) => ({
                            ...prev,
                            phone: 'Phone number is required',
                          }))
                        } else {
                          const phoneRegex = /^(\+84|0)[0-9]{9,10}$/
                          if (!phoneRegex.test(contactPhone.trim())) {
                            setContactErrors((prev) => ({
                              ...prev,
                              phone: 'Invalid phone format (e.g., 0901234567)',
                            }))
                          }
                        }
                      }}
                      readOnly={!!user}
                      disabled={!!user}
                      className={
                        'w-full rounded-lg border px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground/70 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-[#d0d0d0] ' +
                        (contactErrors.phone
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-input') +
                        (user ? ' bg-muted cursor-not-allowed' : '')
                      }
                      required
                    />
                    {contactErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {contactErrors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="mb-8">
            <PassengerInformationForm
              seatInfos={selectedSeats}
              onSubmit={(data) => setPassengers(data)}
            />
          </div>
          <div className="flex justify-center mt-8">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || passengers.length === 0}
              className="bg-primary hover:bg-primary/90 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-md dark:shadow-blue-500/20 text-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Booking...' : 'Continue to Summary'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GuestCheckout
