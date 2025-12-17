import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { getCancellationPreview, cancelBooking } from '@/api/bookings'
import { Card } from '@/components/ui/card'

interface CancellationPreviewData {
  canCancel: boolean
  booking: {
    reference: string // Backend returns 'reference', not 'booking_reference'
    status: string
    totalPrice: number // Backend returns 'totalPrice', not 'total_price'
  }
  trip: {
    departureTime: string
    hoursUntilDeparture: number
  }
  refund: {
    tier: string
    refundAmount: number
    processingFee: number
    totalRefund: number
    canRefund: boolean
  }
  policyTiers: Array<{
    name: string
    description: string
    refundPercentage: number
    processingFee: number
    timeRange: string
  }>
}

interface CancelBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  onSuccess?: () => void
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  bookingId,
  onSuccess,
}: CancelBookingDialogProps) {
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<CancellationPreviewData | null>(null)
  const [reason, setReason] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // Fetch cancellation preview when dialog opens
  useEffect(() => {
    if (open && bookingId) {
      fetchPreview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bookingId])

  const fetchPreview = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getCancellationPreview(bookingId)
      setPreview(response.data as unknown as CancellationPreviewData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load cancellation preview'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for cancellation')
      return
    }

    try {
      setCancelling(true)
      setError(null)
      await cancelBooking(bookingId, reason)
      setShowSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        if (onSuccess) onSuccess()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTimeUntilDeparture = (hours: number): string => {
    const days = Math.floor(hours / 24)
    const remainingHours = Math.floor(hours % 24)
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${
        remainingHours !== 1 ? 's' : ''
      }`
    }
    return `${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-destructive" />
            Cancel Booking
          </DialogTitle>
          <DialogDescription>
            Review the cancellation policy and refund details before proceeding
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
            <h3 className="text-xl font-semibold mb-2">Booking Cancelled</h3>
            <p className="text-muted-foreground">
              Your refund will be processed within 3-5 business days
            </p>
          </div>
        )}

        {preview && !loading && !showSuccess && (
          <div className="space-y-4">
            {/* Booking Info */}
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Booking Reference</p>
                  <p className="font-semibold">{preview.booking.reference}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Departure Time</p>
                  <p className="font-semibold">
                    {formatTime(preview.trip.departureTime)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Original Amount</p>
                  <p className="font-semibold">
                    {formatPrice(preview.booking.totalPrice)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">
                      Time Until Departure
                    </p>
                    <p className="font-semibold">
                      {formatTimeUntilDeparture(
                        preview.trip.hoursUntilDeparture
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Refund Details */}
            {preview.canCancel ? (
              <Card className="p-4 border-primary/50">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Refund Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Tier:</span>
                    <span className="font-semibold">{preview.refund.tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Refund Amount:
                    </span>
                    <span className="font-semibold text-green-600">
                      {formatPrice(preview.refund.refundAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Processing Fee:
                    </span>
                    <span className="font-semibold text-destructive">
                      -{formatPrice(preview.refund.processingFee)}
                    </span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between text-base">
                    <span className="font-semibold">Total Refund:</span>
                    <span className="font-bold text-green-600 text-lg">
                      {formatPrice(preview.refund.totalRefund)}
                    </span>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-4 border-destructive bg-destructive/5">
                <p className="text-destructive font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Cancellation not allowed (less than 2 hours before departure)
                </p>
              </Card>
            )}

            {/* Cancellation Policy */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Cancellation Policy</h3>
              <div className="space-y-2 text-sm">
                {preview.policyTiers.map((tier, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      tier.name === preview.refund.tier
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
                        <p className="font-semibold text-green-600">
                          {tier.refundPercentage}% refund
                        </p>
                        {tier.processingFee > 0 && (
                          <p className="text-xs text-destructive">
                            Fee: {formatPrice(tier.processingFee)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Cancellation Reason */}
            {preview.canCancel && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Cancellation *</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for cancelling this booking..."
                  value={reason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setReason(e.target.value)
                  }
                  rows={3}
                  className="resize-none"
                />
              </div>
            )}
          </div>
        )}

        {preview && !loading && !showSuccess && preview.canCancel && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={cancelling}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling || !reason.trim()}
            >
              {cancelling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
