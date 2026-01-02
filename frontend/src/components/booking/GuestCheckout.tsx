import React from 'react'
import StripeCardCheckout from '../StripeCardCheckout'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ChevronLeft, UserCheck, LogOut } from 'lucide-react'
import { PassengerInformationForm } from '@/components/booking/PassengerInformationForm'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { createBooking } from '@/api/bookings'
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector'
import { confirmPayment } from '@/api/bookings'
import { useBookingStore } from '@/store/bookingStore'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Bus } from 'lucide-react'

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
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { selectedTrip, selectedPickupPoint, selectedDropoffPoint } =
    useBookingStore()

  const selectedSeats = propSeats ?? []

  // Helper function to calculate service fee (3% + 10,000 VND - matches backend)
  const calculateServiceFee = (subtotal: number): number => {
    return subtotal * 0.03 + 10000
  }

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
  const [agreed, setAgreed] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<
    string | null
  >(null)
  const [paymentResult, setPaymentResult] = React.useState<{
    paymentId?: string
    status?: string
    paymentUrl?: string
    qrCode?: string
    expiresAt?: string
    provider?: string
    clientSecret?: string
  } | null>(null)
  const [bookingId, setBookingId] = React.useState<string | null>(null)
  const [bookingCreated, setBookingCreated] = React.useState(false)

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
    setError(null)

    // For PayOS, don't show loading state - redirect immediately
    const shouldShowLoading = selectedPaymentMethod !== 'payos'
    if (shouldShowLoading) {
      setIsSubmitting(true)
    }

    try {
      if (!selectedPaymentMethod) {
        setError('Please select a payment method.')
        setIsSubmitting(false)
        return
      }
      const contactValid = validateContactInfo()
      if (!contactValid || passengers.length === 0) {
        setIsSubmitting(false)
        return
      }
      if (!selectedTrip?.trip_id) {
        throw new Error(
          'Trip information is missing. Please select seats again.'
        )
      }
      let booking = null
      let booking_id = bookingId
      if (!bookingCreated && !bookingId) {
        // Only create booking if not already created
        const bookingData = {
          tripId: selectedTrip.trip_id,
          seats: selectedSeats.map((s) => s.seat_code),
          passengers: passengers,
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          pickupPointId: selectedPickupPoint?.point_id,
          dropoffPointId: selectedDropoffPoint?.point_id,
          isGuestCheckout: !user,
        }
        const response = await createBooking(bookingData)
        booking = response.data
        booking_id = booking.booking_id
        setBookingId(booking_id)
        setBookingCreated(true)
        sessionStorage.setItem('pendingBooking', JSON.stringify(booking))
      }
      // Always use booking_id from state/session
      const idToPay =
        booking_id ||
        JSON.parse(sessionStorage.getItem('pendingBooking') || '{}').booking_id
      console.log(
        '[GuestCheckout] bookingId (idToPay) before confirmPayment:',
        idToPay
      )
      if (!idToPay) throw new Error('Booking ID missing. Please try again.')
      // DEBUG LOG: print all relevant info
      console.log(
        '[GuestCheckout] selectedPaymentMethod:',
        selectedPaymentMethod
      )

      // Calculate service fee and total based on all selected seats
      const basePrice = selectedTrip.pricing?.base_price || 0
      const subtotal = basePrice * selectedSeats.length // Multiply by number of seats
      const serviceFee = calculateServiceFee(subtotal)
      const totalAmount = subtotal + serviceFee

      const paymentPayload = {
        bookingId: idToPay, // Đảm bảo backend nhận đúng bookingId
        paymentMethod: selectedPaymentMethod,
        amount: totalAmount,
        transactionRef: undefined, // hoặc truyền ref nếu có
      }
      console.log('[GuestCheckout] paymentPayload:', paymentPayload)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paymentRes: any = await confirmPayment(idToPay, paymentPayload)
      console.log('[GuestCheckout] confirmPayment response:', paymentRes)
      setPaymentResult({
        paymentUrl: paymentRes.paymentUrl,
        qrCode: paymentRes.qrCode,
        provider: paymentRes.provider,
        clientSecret: paymentRes.clientSecret,
        ...paymentRes.data,
      })
      if (paymentRes.paymentUrl) {
        window.location.href = paymentRes.paymentUrl
      }
      if (onSubmit) {
        onSubmit({ contactEmail, contactPhone, passengers })
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to create booking. Please try again.'
      setError(errorMessage)
    } finally {
      if (shouldShowLoading) {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Custom Header for Checkout (same as Seat Selection) */}
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Back Button and Logo */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              disabled={isSubmitting}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => (window.location.href = '/')}
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Bus className="text-primary-foreground w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">
                BusGo
              </span>
            </div>
          </div>
          {/* Theme Toggle and Auth Buttons */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!user ? (
              <Button
                onClick={() => (window.location.href = '/login')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <span className="hidden sm:inline">Login</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => (window.location.href = '/dashboard')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
                <Button
                  onClick={logout}
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            )}
          </div>
        </nav>
      </header>
      <div className="max-w-5xl mx-auto my-8 p-4">
        {/* Main layout: Passenger Details 6/10, Order Summary 4/10, Payment Method below */}
        <div className="grid grid-cols-1 md:grid-cols-10 gap-8">
          {/* Left: Passenger Details (6/10) */}
          <div className="md:col-span-6">
            {/* Removed 'Back to Seat Selection' button for design consistency */}
            <Card className="mb-6">
              <CardHeader className="pb-0 pt-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-6 h-6 text-primary" />
                  <CardTitle className="text-xl font-bold text-foreground mb-0">
                    Passenger Details
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2 pb-4 px-2 md:px-4">
                {/* Contact Information UI with border and rounded corners */}
                <div className="mb-6 border border-black rounded-xl bg-white dark:bg-slate-900 p-4">
                  <div className="text-lg font-bold text-primary mb-2">
                    Contact Information
                  </div>
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
                        className={
                          'w-full rounded-lg border px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground/70 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-[#d0d0d0] ' +
                          (contactErrors.email
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-input')
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
                                phone:
                                  'Invalid phone format (e.g., 0901234567)',
                              }))
                            }
                          }
                        }}
                        className={
                          'w-full rounded-lg border px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground/70 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-[#d0d0d0] ' +
                          (contactErrors.phone
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-input')
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
                </div>
                {/* Passenger Information Form */}
                <PassengerInformationForm
                  seatInfos={selectedSeats}
                  onSubmit={(data) => setPassengers(data)}
                />
              </CardContent>
            </Card>
          </div>
          {/* Right: Order Summary (4/10) */}
          <div className="md:col-span-4">
            <Card className="mb-6">
              <CardHeader className="pb-0 pt-4">
                <CardTitle className="text-lg font-bold text-primary">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 pb-4 px-2 md:px-4">
                {selectedTrip && (
                  <div className="space-y-2">
                    <div className="font-medium">
                      Trip: {selectedTrip.route.origin} →{' '}
                      {selectedTrip.route.destination}
                    </div>
                    <div>
                      Date: {selectedTrip.schedule.departure_time.slice(0, 10)}
                    </div>
                    <div>
                      Departure:{' '}
                      {selectedTrip.schedule.departure_time.slice(11, 16)}
                    </div>
                    <div>Operator: {selectedTrip.operator.name}</div>
                    <div>
                      Seats: {selectedSeats.map((s) => s.seat_code).join(', ')}
                    </div>
                    <div>Passengers: {selectedSeats.length}</div>
                    <div className="border-t my-2"></div>
                    <div>
                      Fare:{' '}
                      {(
                        selectedTrip.pricing.base_price * selectedSeats.length
                      ).toLocaleString('vi-VN')}{' '}
                      VND
                    </div>
                    <div>
                      Service fee:{' '}
                      {calculateServiceFee(
                        selectedTrip.pricing.base_price * selectedSeats.length
                      ).toLocaleString('vi-VN')}{' '}
                      VND
                    </div>
                    <div className="font-bold text-lg">
                      Total:{' '}
                      {(
                        selectedTrip.pricing.base_price * selectedSeats.length +
                        calculateServiceFee(
                          selectedTrip.pricing.base_price * selectedSeats.length
                        )
                      ).toLocaleString('vi-VN')}{' '}
                      VND
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Payment Method below both columns */}
            <div className="md:col-span-10">
              <Card className="mb-6">
                <CardHeader className="pb-0 pt-4">
                  <CardTitle className="text-lg font-bold text-primary">
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 pb-4 px-2 md:px-4">
                  <PaymentMethodSelector
                    amount={
                      selectedTrip && selectedSeats.length > 0
                        ? selectedTrip.pricing.base_price *
                            selectedSeats.length +
                          calculateServiceFee(
                            selectedTrip.pricing.base_price *
                              selectedSeats.length
                          )
                        : 0
                    }
                    onSelect={(method: { key: string }) =>
                      setSelectedPaymentMethod(method.key)
                    }
                  />
                  {error && !isSubmitting && (
                    <div className="mt-2 text-red-600 text-sm">{error}</div>
                  )}
                </CardContent>
              </Card>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="agree"
                  className="mr-2"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <label htmlFor="agree" className="text-sm">
                  I agree to Terms and Conditions
                </label>
              </div>
              <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                <b>Selected Payment Method:</b>{' '}
                {selectedPaymentMethod?.toUpperCase() || '(NOT SELECTED)'}
              </div>
              <button
                type="button"
                onClick={() => {
                  console.log(
                    '[GuestCheckout] selectedPaymentMethod:',
                    selectedPaymentMethod
                  )
                  handleSubmit()
                }}
                disabled={isSubmitting || passengers.length === 0 || !agreed}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg text-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing Payment...' : 'Complete Payment'}
              </button>
              {paymentResult &&
              paymentResult.provider === 'stripe' &&
              paymentResult.clientSecret ? (
                <div className="mt-6 p-4 border rounded-lg bg-green-50 text-green-800">
                  <div>Card payment - enter card information to complete:</div>
                  <div className="mt-4">
                    {/* Render StripeCardCheckout */}
                    <React.Suspense fallback={<div>Loading Stripe...</div>}>
                      <StripeCardCheckout
                        clientSecret={paymentResult.clientSecret}
                        bookingId={bookingId || ''}
                        onSuccess={(data: {
                          success?: boolean
                          data?: {
                            booking_id?: string
                            booking_reference?: string
                          }
                        }) => {
                          console.log(
                            '[GuestCheckout] Stripe payment confirmed:',
                            data
                          )
                          // Redirect to payment result page with bookingId (same as MoMo/PayOS)
                          const currentBookingId =
                            bookingId || data?.data?.booking_id
                          if (currentBookingId) {
                            // Store booking info for PaymentResult page
                            if (data?.data) {
                              sessionStorage.setItem(
                                'pendingBooking',
                                JSON.stringify(data.data)
                              )
                            }
                            navigate(
                              `/payment-result?bookingId=${currentBookingId}&status=success&method=card`
                            )
                          } else {
                            toast.success(
                              'Payment successful! Check your email for booking details.'
                            )
                          }
                        }}
                      />
                    </React.Suspense>
                  </div>
                </div>
              ) : (
                paymentResult && (
                  <div className="mt-6 p-4 border rounded-lg bg-green-50 text-green-800">
                    <div>Payment has been initiated.</div>
                    {paymentResult.paymentUrl && (
                      <div>
                        <a
                          href={paymentResult.paymentUrl}
                          className="text-blue-600 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Click here if not automatically redirected
                        </a>
                      </div>
                    )}
                    {paymentResult.qrCode && (
                      <div className="mt-2">
                        <img
                          src={paymentResult.qrCode}
                          alt="QR Code"
                          className="h-32"
                        />
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GuestCheckout
