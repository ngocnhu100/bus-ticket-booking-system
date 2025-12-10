import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, UserCheck } from 'lucide-react'
import { PassengerInformationForm } from '@/components/booking/PassengerInformationForm'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

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
  const selectedSeats = propSeats ?? []
  const [contactEmail, setContactEmail] = React.useState('')
  const [contactPhone, setContactPhone] = React.useState('')
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

  const handleSubmit = (event?: React.FormEvent) => {
    if (event) event.preventDefault()
    setIsSubmitting(true)
    const contactValid = validateContactInfo()
    if (!contactValid || passengers.length === 0) {
      setIsSubmitting(false)
      return
    }
    if (onSubmit) {
      onSubmit({ contactEmail, contactPhone, passengers })
    }
    setIsSubmitting(false)
  }

  return (
    <div>
      <Card className="max-w-4xl mx-auto mb-8 rounded-2xl shadow-xl border border-border/70 bg-white dark:bg-slate-900">
        <CardHeader className="pb-0 pt-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-7 h-7 text-primary" />
            <CardTitle className="text-3xl font-bold text-center">
              Guest Checkout
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
              >
                <ChevronLeft className="w-4 h-4" />
                Quay lại chọn ghế
              </Button>
            </div>
          )}
          <div className="mb-8">
            <Card className="border rounded-xl shadow-sm bg-white dark:bg-white">
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-lg font-semibold text-primary">
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">
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
                        'w-full rounded-lg border px-3 py-2 ' +
                        (contactErrors.email
                          ? 'border-red-500 focus:ring-red-500'
                          : '')
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
                    <label className="block text-sm font-medium mb-2">
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
                      className={
                        'w-full rounded-lg border px-3 py-2 ' +
                        (contactErrors.phone
                          ? 'border-red-500 focus:ring-red-500'
                          : '')
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
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-full shadow-md text-lg transition-all duration-150"
            >
              {isSubmitting ? 'Processing...' : 'Continue to Summary'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GuestCheckout
