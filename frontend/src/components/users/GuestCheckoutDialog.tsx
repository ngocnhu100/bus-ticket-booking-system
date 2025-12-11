import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBooking, type CreateBookingRequest } from '@/api/bookings'
import { AlertCircle, Loader2 } from 'lucide-react'

interface GuestCheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripId: string
  selectedSeats: string[]
  seatCodes: string[]
  totalPrice: number
}

interface FormData {
  fullName: string
  phone: string
  email: string
}

interface FormErrors {
  fullName?: string
  phone?: string
  email?: string
}

export function GuestCheckoutDialog({
  open,
  onOpenChange,
  tripId,
  selectedSeats,
  seatCodes,
  totalPrice,
}: GuestCheckoutDialogProps) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    email: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const normalizePhoneNumber = (phone: string): string => {
    // Remove all spaces
    const cleaned = phone.replace(/\s+/g, '')

    // If starts with 0, replace with +84
    if (cleaned.startsWith('0')) {
      return '+84' + cleaned.substring(1)
    }

    // If already starts with +84, return as is
    if (cleaned.startsWith('+84')) {
      return cleaned
    }

    // Otherwise, add +84 prefix
    return '+84' + cleaned
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters'
    }

    // Validate phone - accept multiple formats
    const normalizedPhone = normalizePhoneNumber(formData.phone)
    const phoneRegex = /^\+84[0-9]{9,10}$/

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!phoneRegex.test(normalizedPhone)) {
      newErrors.phone =
        'Phone must be 10 digits (e.g., 0973994154 or +84973994154)'
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    // Clear API error when user makes changes
    if (apiError) {
      setApiError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setApiError(null)

    try {
      // Normalize phone number before sending to API
      const normalizedPhone = normalizePhoneNumber(formData.phone)

      // Create passengers array with one passenger per seat
      const passengers = seatCodes.map((seatCode) => ({
        fullName: formData.fullName.trim(),
        phone: normalizedPhone,
        documentId: undefined,
        seatCode,
      }))

      const bookingRequest: CreateBookingRequest = {
        tripId,
        seats: seatCodes,
        passengers,
        contactEmail: formData.email.trim(),
        contactPhone: normalizedPhone,
        isGuestCheckout: true,
      }

      console.log('Creating guest booking:', bookingRequest)

      const response = await createBooking(bookingRequest)

      console.log('Booking created successfully:', response)

      // Store booking data for review/payment page
      sessionStorage.setItem('pendingBooking', JSON.stringify(response.data))

      // Navigate to review/payment page
      navigate(`/booking/${response.data.booking_id}/review`)
    } catch (error) {
      console.error('Error creating booking:', error)

      // Handle specific error types
      if (error instanceof Error) {
        const errorMessage = error.message

        if (errorMessage.includes('409') || errorMessage.includes('already')) {
          setApiError(
            'One or more selected seats are no longer available. Please select different seats.'
          )
        } else if (
          errorMessage.includes('400') ||
          errorMessage.includes('422')
        ) {
          setApiError('Invalid booking information. Please check your input.')
        } else if (errorMessage.includes('locked')) {
          setApiError('Seats are currently locked. Please try again shortly.')
        } else {
          setApiError(
            errorMessage || 'Failed to create booking. Please try again.'
          )
        }
      } else {
        setApiError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({ fullName: '', phone: '+84', email: '' })
    setErrors({})
    setApiError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Guest Checkout
          </DialogTitle>
          <DialogDescription className="text-base">
            Complete your booking without creating an account. You'll receive
            your e-ticket via email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Booking Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Selected Seats:</span>
              <span className="font-semibold">{seatCodes.join(', ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Passengers:</span>
              <span className="font-semibold">{selectedSeats.length}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Total:</span>
              <span className="text-lg font-bold text-primary">
                {totalPrice.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  {apiError}
                </p>
              </div>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-base font-semibold">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Nguyen Van A"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className={errors.fullName ? 'border-destructive' : ''}
              disabled={isSubmitting}
              autoComplete="name"
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base font-semibold">
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0973994154 or +84973994154"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={errors.phone ? 'border-destructive' : ''}
              disabled={isSubmitting}
              autoComplete="tel"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Accepts: 0973994154, +84973994154, or +84 973 994 154
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-semibold">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={errors.email ? 'border-destructive' : ''}
              disabled={isSubmitting}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Your e-ticket will be sent to this email
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Booking...
                </>
              ) : (
                'Continue to Payment'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
