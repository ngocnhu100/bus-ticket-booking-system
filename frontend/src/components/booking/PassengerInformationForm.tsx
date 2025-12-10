import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBookingStore } from '@/store/bookingStore'
import type { PassengerInfo } from '../../api/bookings'

interface PassengerFormProps {
  seatInfos?: { seat_id: string; seat_code: string }[]
  onSubmit?: (passengers: PassengerInfo[]) => void // Optional - for backward compatibility
  onBack?: () => void
  isLoading?: boolean
}

interface PassengerFormData extends PassengerInfo {
  errors?: {
    fullName?: string
    phone?: string
    documentId?: string
  }
}

/**
 * Passenger Information Form Component
 * Collects passenger details for each selected seat
 * Integrates with booking store for state management
 */
export function PassengerInformationForm({
  seatInfos = [],
  onSubmit: propOnSubmit,
  onBack,
  isLoading = false,
}: PassengerFormProps) {
  const { setPassengers, setContactInfo } = useBookingStore()

  // Contact information state
  const [contactEmail] = useState('')
  const [contactPhone] = useState('')
  // contactErrors is used for type only, not value

  const [passengers, setPassengersState] = useState<PassengerFormData[]>(
    seatInfos.map((info) => ({
      fullName: '',
      phone: '',
      documentId: '',
      seatCode: info.seat_code,
      errors: {},
    }))
  )

  // Sync passengers state when seatInfos changes
  useEffect(() => {
    setPassengersState(
      seatInfos.map((info) => ({
        fullName: '',
        phone: '',
        documentId: '',
        seatCode: info.seat_code,
        errors: {},
      }))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seatInfos.length])

  // No redirect or navigation logic allowed for guest mode

  const validateAllPassengers = (): boolean => {
    let allValid = true
    const updatedPassengers = passengers.map((passenger) => {
      const errors: PassengerFormData['errors'] = {}

      if (!passenger.fullName || passenger.fullName.trim().length < 2) {
        errors.fullName = 'Full name is required (min 2 characters)'
        allValid = false
      }

      if (passenger.phone && passenger.phone.trim()) {
        const phoneRegex = /^(\+84|0)[0-9]{9,10}$/
        if (!phoneRegex.test(passenger.phone.trim())) {
          errors.phone = 'Invalid phone format (e.g., 0901234567)'
          allValid = false
        }
      }

      if (passenger.documentId && passenger.documentId.trim()) {
        const documentRegex = /^[0-9]{9,12}$/
        if (!documentRegex.test(passenger.documentId.trim())) {
          errors.documentId = 'Document ID must be 9-12 digits'
          allValid = false
        }
      }

      return { ...passenger, errors }
    })

    setPassengersState(updatedPassengers)
    return allValid
  }

  const validateContactInfo = (): boolean => {
    const errors: typeof contactErrors = {}
    let isValid = true

    // Email validation
    if (!contactEmail || !contactEmail.trim()) {
      errors.email = 'Email is required'
      isValid = false
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(contactEmail.trim())) {
        errors.email = 'Invalid email format'
        isValid = false
      }
    }

    // Phone validation
    if (!contactPhone || !contactPhone.trim()) {
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

  const handleInputChange = (
    index: number,
    field: keyof PassengerInfo,
    value: string
  ) => {
    setPassengersState((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value,
        errors: {
          ...updated[index].errors,
          [field]: undefined, // Clear error when user types
        },
      }
      return updated
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate both passengers and contact info
    const passengersValid = validateAllPassengers()
    const contactValid = validateContactInfo()

    if (!passengersValid || !contactValid) {
      return
    }

    // Clean up passengers data
    const cleanedPassengers: PassengerInfo[] = passengers.map((p) => ({
      fullName: p.fullName.trim(),
      phone: p.phone?.trim() || undefined,
      documentId: p.documentId?.trim() || undefined,
      seatCode: p.seatCode,
    }))

    // Save to store
    setPassengers(cleanedPassengers)
    setContactInfo(contactEmail.trim(), contactPhone.trim())

    // Only call onSubmit, never navigate
    if (propOnSubmit) {
      propOnSubmit(cleanedPassengers)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">Passenger Information</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please provide information for each passenger. Fields marked with *
            are required.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Passengers Section */}
            <div className="space-y-6">
              {passengers.map((passenger, index) => (
                <div
                  key={passenger.seatCode}
                  className="border rounded-lg p-4 bg-white dark:bg-white"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Passenger {index + 1}
                    </h3>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                      Seat {passenger.seatCode}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Full Name */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Full Name *
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g., Nguyen Van A"
                        value={passenger.fullName}
                        onChange={(e) =>
                          handleInputChange(index, 'fullName', e.target.value)
                        }
                        className={
                          passenger.errors?.fullName
                            ? 'border-red-500 focus:ring-red-500'
                            : ''
                        }
                        required
                      />
                      {passenger.errors?.fullName && (
                        <p className="text-red-500 text-sm mt-1">
                          {passenger.errors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Phone Number (Optional)
                      </label>
                      <Input
                        type="tel"
                        placeholder="e.g., 0901234567"
                        value={passenger.phone || ''}
                        onChange={(e) =>
                          handleInputChange(index, 'phone', e.target.value)
                        }
                        className={
                          passenger.errors?.phone
                            ? 'border-red-500 focus:ring-red-500'
                            : ''
                        }
                      />
                      {passenger.errors?.phone && (
                        <p className="text-red-500 text-sm mt-1">
                          {passenger.errors.phone}
                        </p>
                      )}
                    </div>

                    {/* Document ID */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        ID/Passport Number (Optional)
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g., 079012345678"
                        value={passenger.documentId || ''}
                        onChange={(e) =>
                          handleInputChange(index, 'documentId', e.target.value)
                        }
                        className={
                          passenger.errors?.documentId
                            ? 'border-red-500 focus:ring-red-500'
                            : ''
                        }
                      />
                      {passenger.errors?.documentId && (
                        <p className="text-red-500 text-sm mt-1">
                          {passenger.errors.documentId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            {onBack && (
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isLoading}
                  className="sm:w-auto"
                >
                  Back
                </Button>
              </div>
            )}
          </form>
        </div>
      </Card>
    </div>
  )
}
