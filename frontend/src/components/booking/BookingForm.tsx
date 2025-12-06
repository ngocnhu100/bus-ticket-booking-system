import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, User, Mail, Phone, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/context/AuthContext'
import { createBooking } from '@/api/booking.api'
import type { Trip } from '@/types/trip.types'
import type { Passenger } from '@/types/booking.types'

interface BookingFormProps {
  trip: Trip
  selectedSeats: string[]
  onSuccess?: (bookingReference: string) => void
  onCancel?: () => void
}

export function BookingForm({
  trip,
  selectedSeats,
  onSuccess,
  onCancel,
}: BookingFormProps) {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [isGuestMode, setIsGuestMode] = useState(!user)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Contact information
  const [contactEmail, setContactEmail] = useState(user?.email || '')
  const [contactPhone, setContactPhone] = useState('')

  // Passenger information
  const [passengers, setPassengers] = useState<Passenger[]>(
    selectedSeats.map((seat) => ({
      fullName: '',
      idNumber: '',
      phone: '',
      seatNumber: seat,
      price: trip.pricing.base_price,
    }))
  )

  const handlePassengerChange = (
    index: number,
    field: keyof Passenger,
    value: string | number
  ) => {
    const updated = [...passengers]
    updated[index] = { ...updated[index], [field]: value }
    setPassengers(updated)
  }

  const validateForm = (): string | null => {
    // Validate contact information for guest checkout
    if (isGuestMode) {
      if (!contactEmail || !contactPhone) {
        return 'Please provide both email and phone number for guest checkout'
      }
      if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
        return 'Please provide a valid email address'
      }
      if (contactPhone && !/^\+?[\d\s-()]+$/.test(contactPhone)) {
        return 'Please provide a valid phone number'
      }
    }

    // Validate passenger information
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i]
      if (!p.fullName.trim()) {
        return `Please provide full name for passenger ${i + 1}`
      }
      if (p.fullName.length < 3) {
        return `Full name for passenger ${i + 1} is too short`
      }
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const bookingData = {
        tripId: trip.trip_id,
        passengers: passengers.map((p) => ({
          fullName: p.fullName,
          seatNumber: p.seatNumber,
          documentType: p.idNumber ? 'CITIZEN_ID' : undefined,
          documentId: p.idNumber || undefined,
          phone: p.phone || undefined,
        })),
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        isGuestCheckout: isGuestMode,
        totalPrice: trip.pricing.base_price * selectedSeats.length,
      }

      const response = await createBooking(
        bookingData,
        isGuestMode ? null : token
      )

      if (response.success) {
        const bookingRef =
          response.data.booking_reference || response.data.bookingReference
        onSuccess?.(bookingRef)
        navigate(`/booking-confirmation/${bookingRef}`, {
          state: { booking: response.data },
        })
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create booking'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const totalPrice = selectedSeats.length * trip.pricing.base_price

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Guest Checkout Toggle */}
        {user && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Booking as guest</p>
                <p className="text-sm text-muted-foreground">
                  {isGuestMode
                    ? 'No login required for this booking'
                    : `Booking as ${user.email}`}
                </p>
              </div>
            </div>
            <Switch
              checked={isGuestMode}
              onCheckedChange={setIsGuestMode}
              aria-label="Toggle guest checkout"
            />
          </div>
        )}

        {/* Contact Information - Required for Guest Checkout */}
        {isGuestMode && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <p className="text-sm text-muted-foreground">
              We'll send your booking confirmation to this email or phone number
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">
                  Email Address {!contactPhone && '*'}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="pl-10"
                    required={!contactPhone}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">
                  Phone Number {!contactEmail && '*'}
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="+84 123 456 789"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="pl-10"
                    required={!contactEmail}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Passenger Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Passenger Information</h3>

          {passengers.map((passenger, index) => (
            <Card key={index} className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  Passenger {index + 1} - Seat {passenger.seatNumber}
                </h4>
                <span className="text-sm text-muted-foreground">
                  {trip.pricing.base_price.toLocaleString('vi-VN')} VND
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`passenger-${index}-name`}>Full Name *</Label>
                  <Input
                    id={`passenger-${index}-name`}
                    value={passenger.fullName}
                    onChange={(e) =>
                      handlePassengerChange(index, 'fullName', e.target.value)
                    }
                    placeholder="Nguyen Van A"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`passenger-${index}-id`}>
                    ID Number (Optional)
                  </Label>
                  <Input
                    id={`passenger-${index}-id`}
                    value={passenger.idNumber}
                    onChange={(e) =>
                      handlePassengerChange(index, 'idNumber', e.target.value)
                    }
                    placeholder="123456789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`passenger-${index}-phone`}>
                    Phone (Optional)
                  </Label>
                  <Input
                    id={`passenger-${index}-phone`}
                    type="tel"
                    value={passenger.phone}
                    onChange={(e) =>
                      handlePassengerChange(index, 'phone', e.target.value)
                    }
                    placeholder="+84 123 456 789"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Booking Summary */}
        <Card className="p-4 bg-muted">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Selected Seats:</span>
              <span className="font-medium">{selectedSeats.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Number of Tickets:</span>
              <span className="font-medium">{selectedSeats.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price per Ticket:</span>
              <span className="font-medium">
                {trip.pricing.base_price.toLocaleString('vi-VN')} VND
              </span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span>{totalPrice.toLocaleString('vi-VN')} VND</span>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Confirm Booking
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}
