import { useState, useEffect, useMemo } from 'react'
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
  const { setPassengers } = useBookingStore()

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

  // Create stable dependency strings
  const passengersKey = useMemo(
    () =>
      passengers
        .map(
          (p) =>
            `${p.seatCode}:${p.fullName}:${p.phone || ''}:${p.documentId || ''}`
        )
        .join('|'),
    [passengers]
  )

  // Auto-sync passengers to parent when all have valid names
  useEffect(() => {
    // Only sync if all passengers have valid full names
    if (
      passengers.length > 0 &&
      passengers.every((p) => p.fullName && p.fullName.trim().length >= 2)
    ) {
      const cleanedPassengers: PassengerInfo[] = passengers.map((p) => ({
        fullName: p.fullName.trim(),
        phone: p.phone?.trim() || undefined,
        documentId: p.documentId?.trim() || undefined,
        seatCode: p.seatCode,
      }))

      // Save to store
      setPassengers(cleanedPassengers)

      // Call onSubmit to update parent
      if (propOnSubmit) {
        propOnSubmit(cleanedPassengers)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passengersKey])

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2 text-foreground">
            Passenger Information
          </h2>
          <p className="text-muted-foreground mb-6">
            Please provide information for each passenger. Fields marked with *
            are required.
          </p>

          <div>
            {/* Passengers Section */}
            <div className="space-y-6">
              {passengers.map((passenger, index) => (
                <div
                  key={passenger.seatCode}
                  className="border rounded-lg p-4 bg-white dark:bg-slate-800"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      Passenger {index + 1}
                    </h3>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                      Seat {passenger.seatCode}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Full Name */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold mb-2 text-foreground">
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
                      <label className="block text-sm font-semibold mb-2 text-foreground">
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
                      <label className="block text-sm font-semibold mb-2 text-foreground">
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
          </div>
        </div>
      </Card>
    </div>
  )
}
