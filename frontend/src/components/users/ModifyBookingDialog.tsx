import { useState, useEffect } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { CheckCircle2, Loader2, AlertCircle, Edit3 } from 'lucide-react'
import { getModificationPreview, modifyBooking } from '@/api/bookings'
import { SeatMap } from './SeatMap'
import type { Seat, SeatMapData } from '@/types/trip.types'

interface ModificationPreviewData {
  canModify: boolean
  booking: {
    id: string
    reference: string
    status: string
    totalPrice: number
  }
  trip: {
    departureTime: string
    hoursUntilDeparture: number
  }
  currentPassengers: Array<{
    ticketId: string
    seatCode: string
    fullName: string
    phone: string
    documentId: string
  }>
  policy: {
    tier: string
    tierDescription: string
    baseFee: number
    seatChangeFee: number
    allowSeatChange: boolean
    allowPassengerUpdate: boolean
  }
  policyTiers: Array<{
    name: string
    description: string
    modificationFee: number
    seatChangeFee: number
    allowSeatChange: boolean
    allowPassengerUpdate: boolean
    timeRange: string
  }>
}

interface ModifyBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  tripId: string
  onSuccess?: () => void
}

export function ModifyBookingDialog({
  open,
  onOpenChange,
  bookingId,
  tripId,
  onSuccess,
}: ModifyBookingDialogProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ModificationPreviewData | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'passenger' | 'seat'>('passenger')

  // Passenger updates state
  const [passengerUpdates, setPassengerUpdates] = useState<
    Array<{
      ticketId: string
      fullName: string
      phone: string
      documentId: string
    }>
  >([])

  // Seat changes state
  const [seatChanges, setSeatChanges] = useState<
    Array<{
      ticketId: string
      oldSeatCode: string
      newSeatCode: string
    }>
  >([])

  // Seat map data
  const [seatMapData, setSeatMapData] = useState<SeatMapData | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])

  // Fetch modification preview when dialog opens
  useEffect(() => {
    if (open && bookingId) {
      fetchPreview()
      fetchSeatMap()
    } else {
      // Reset state when closing
      setPassengerUpdates([])
      setSeatChanges([])
      setSelectedSeats([])
      setShowSuccess(false)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bookingId])

  // Initialize passenger updates from preview
  useEffect(() => {
    if (preview) {
      setPassengerUpdates(
        preview.currentPassengers.map((p) => ({
          ticketId: p.ticketId,
          fullName: p.fullName,
          phone: p.phone,
          documentId: p.documentId,
        }))
      )
    }
  }, [preview])

  const fetchPreview = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getModificationPreview(bookingId)
      setPreview(response.data as unknown as ModificationPreviewData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load modification preview'
      )
    } finally {
      setLoading(false)
    }
  }

  const fetchSeatMap = async () => {
    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const response = await fetch(`${API_BASE_URL}/trips/${tripId}/seats`)
      const result = await response.json()
      setSeatMapData(result.data.seat_map || result.data)
    } catch (err) {
      console.error('Failed to load seat map:', err)
    }
  }

  const handlePassengerChange = (
    ticketId: string,
    field: 'fullName' | 'phone' | 'documentId',
    value: string
  ) => {
    setPassengerUpdates((prev) =>
      prev.map((p) => (p.ticketId === ticketId ? { ...p, [field]: value } : p))
    )
  }

  const handleSeatSelect = (seat: Seat, isSelected: boolean) => {
    if (!preview || !seat.seat_id) return

    const seatId = seat.seat_id
    const seatCode = seat.seat_code

    if (isSelected) {
      // Allow selecting only one seat at a time for simplicity
      if (selectedSeats.length >= preview.currentPassengers.length) {
        setError(
          `You can only select ${preview.currentPassengers.length} seat(s)`
        )
        return
      }
      setSelectedSeats([...selectedSeats, seatId])

      // Find the first passenger without a seat change
      const passengerIndex = selectedSeats.length
      const passenger = preview.currentPassengers[passengerIndex]
      if (passenger) {
        setSeatChanges((prev) => [
          ...prev,
          {
            ticketId: passenger.ticketId,
            oldSeatCode: passenger.seatCode,
            newSeatCode: seatCode,
          },
        ])
      }
    } else {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId))
      // Remove seat change for this seat
      setSeatChanges((prev) =>
        prev.filter((change) => change.newSeatCode !== seatCode)
      )
    }
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError(null)

      // Check if any changes were made
      const hasPassengerChanges = passengerUpdates.some((update, index) => {
        const original = preview?.currentPassengers[index]
        return (
          original &&
          (update.fullName !== original.fullName ||
            update.phone !== original.phone ||
            update.documentId !== original.documentId)
        )
      })

      const hasSeatChanges = seatChanges.length > 0

      if (!hasPassengerChanges && !hasSeatChanges) {
        setError(
          'No changes detected. Please modify passenger info or select new seats.'
        )
        setSubmitting(false)
        return
      }

      // Prepare modification data
      const modifications: Record<string, unknown> = {}

      if (hasPassengerChanges) {
        modifications.passengerUpdates = passengerUpdates
          .filter((update, index) => {
            const original = preview?.currentPassengers[index]
            return (
              original &&
              (update.fullName !== original.fullName ||
                update.phone !== original.phone ||
                update.documentId !== original.documentId)
            )
          })
          .map((update) => ({
            ticketId: update.ticketId,
            fullName: update.fullName,
            phone: update.phone,
            documentId: update.documentId,
          }))
      }

      if (hasSeatChanges) {
        modifications.seatChanges = seatChanges
      }

      await modifyBooking(bookingId, modifications)
      setShowSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        if (onSuccess) onSuccess()
      }, 2000)
    } catch (err) {
      const error = err as {
        response?: { data?: { error?: { message?: string } } }
        message?: string
      }
      setError(
        error.response?.data?.error?.message ||
          error.message ||
          'Failed to modify booking'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const calculateTotalFee = () => {
    if (!preview) return 0
    const baseFee = preview.policy.baseFee
    const seatFee = seatChanges.length * preview.policy.seatChangeFee
    return baseFee + seatFee
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Edit3 className="w-6 h-6 text-primary" />
            Modify Booking
          </DialogTitle>
          <DialogDescription>
            Update passenger information or change seat assignments
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {showSuccess && (
          <div className="p-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Booking Modified</h3>
            <p className="text-muted-foreground">
              Your booking has been updated successfully
            </p>
          </div>
        )}

        {preview && !loading && !showSuccess && (
          <div className="space-y-4">
            {/* Policy Info */}
            <Card className="p-4 border-primary/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Booking Reference</p>
                  <p className="font-semibold">{preview.booking.reference}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Tier</p>
                  <p className="font-semibold">{preview.policy.tier}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Base Fee</p>
                  <p className="font-semibold text-amber-600">
                    {formatPrice(preview.policy.baseFee)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Seat Change Fee</p>
                  <p className="font-semibold text-amber-600">
                    {formatPrice(preview.policy.seatChangeFee)}/seat
                  </p>
                </div>
              </div>
            </Card>

            {preview.canModify ? (
              <>
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as 'passenger' | 'seat')}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="passenger">
                      Passenger Information
                    </TabsTrigger>
                    <TabsTrigger
                      value="seat"
                      disabled={!preview.policy.allowSeatChange}
                    >
                      Change Seats
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="passenger" className="space-y-4">
                    {passengerUpdates.map((passenger, index) => (
                      <Card key={passenger.ticketId} className="p-4">
                        <h3 className="font-semibold mb-3">
                          Passenger {index + 1} - Seat:{' '}
                          {preview.currentPassengers[index]?.seatCode}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor={`name-${index}`}>Full Name</Label>
                            <Input
                              id={`name-${index}`}
                              value={passenger.fullName}
                              onChange={(e) =>
                                handlePassengerChange(
                                  passenger.ticketId,
                                  'fullName',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor={`phone-${index}`}>Phone</Label>
                            <Input
                              id={`phone-${index}`}
                              value={passenger.phone}
                              onChange={(e) =>
                                handlePassengerChange(
                                  passenger.ticketId,
                                  'phone',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor={`doc-${index}`}>Document ID</Label>
                            <Input
                              id={`doc-${index}`}
                              value={passenger.documentId}
                              onChange={(e) =>
                                handlePassengerChange(
                                  passenger.ticketId,
                                  'documentId',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="seat">
                    {seatMapData ? (
                      <div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Current seats:{' '}
                          {preview.currentPassengers
                            .map((p) => p.seatCode)
                            .join(', ')}
                        </p>
                        <SeatMap
                          seatMapData={seatMapData}
                          selectedSeats={selectedSeats}
                          onSeatSelect={handleSeatSelect}
                          maxSelectable={preview.currentPassengers.length}
                        />
                        {seatChanges.length > 0 && (
                          <Card className="mt-4 p-4">
                            <h4 className="font-semibold mb-2">
                              Seat Changes:
                            </h4>
                            {seatChanges.map((change, index) => (
                              <p key={index} className="text-sm">
                                {change.oldSeatCode} → {change.newSeatCode}
                              </p>
                            ))}
                          </Card>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Total Fee Summary */}
                <Card className="p-4 border-primary/50">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Modification Fee:</span>
                      <span className="font-semibold">
                        {formatPrice(preview.policy.baseFee)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Seat Change Fee ({seatChanges.length} seat
                        {seatChanges.length !== 1 ? 's' : ''}):
                      </span>
                      <span className="font-semibold">
                        {formatPrice(
                          seatChanges.length * preview.policy.seatChangeFee
                        )}
                      </span>
                    </div>
                    <div className="h-px bg-border my-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total Fee:</span>
                      <span className="font-bold text-amber-600 text-lg">
                        {formatPrice(calculateTotalFee())}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Modification Policy */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Modification Policy</h3>
                  <div className="space-y-2 text-sm">
                    {preview.policyTiers.map((tier, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          tier.name === preview.policy.tier
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{tier.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {tier.timeRange}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-amber-600">
                              {formatPrice(tier.modificationFee)}
                            </p>
                            {tier.seatChangeFee > 0 && (
                              <p className="text-xs text-muted-foreground">
                                +{formatPrice(tier.seatChangeFee)}/seat
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-4 border-destructive bg-destructive/5">
                <p className="text-destructive font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Modifications not allowed (less than 2 hours before departure)
                </p>
              </Card>
            )}
          </div>
        )}

        {preview && !loading && !showSuccess && preview.canModify && (
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes ({formatPrice(calculateTotalFee())})
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
