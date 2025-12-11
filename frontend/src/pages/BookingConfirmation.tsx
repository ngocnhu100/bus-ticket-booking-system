import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Download,
  Mail,
  Ticket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Header } from '@/components/landing/Header'
import { getBookingByReference } from '@/api/booking.api'
import type { Booking } from '@/types/booking.types'

export function BookingConfirmation() {
  const { bookingReference } = useParams<{ bookingReference: string }>()
  const location = useLocation()
  const [booking, setBooking] = useState<Booking | null>(
    location.state?.booking || null
  )
  const [loading, setLoading] = useState(!location.state?.booking)
  const [error, setError] = useState<string | null>(null)

  const fetchBooking = async () => {
    if (!bookingReference) return

    setLoading(true)
    try {
      const response = await getBookingByReference(bookingReference)
      setBooking(response.data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load booking details'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // If booking wasn't passed via state, fetch it
    if (!booking && bookingReference) {
      fetchBooking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingReference])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading booking details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto p-8 text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Booking Not Found</h1>
            <p className="text-muted-foreground">
              {error ||
                'We could not find the booking you are looking for. Please check your booking reference.'}
            </p>
            <Button asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'cancelled':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'failed':
      case 'refunded':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Success Header */}
          <Card className="p-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
            <p className="text-muted-foreground">
              Your booking has been successfully created. We've sent a
              confirmation to {booking.contact_email || booking.contact_phone}.
            </p>
          </Card>

          {/* Booking Reference */}
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Booking Reference</p>
              <p className="text-3xl font-bold font-mono tracking-wider">
                {booking.booking_reference}
              </p>
              <p className="text-sm text-muted-foreground">
                Please save this reference number for your records
              </p>
            </div>
          </Card>

          {/* Status Information */}
          <Card className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Booking Status
                </p>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    booking.status
                  )}`}
                >
                  {booking.status.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Payment Status
                </p>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(
                    booking.payment_status || 'pending'
                  )}`}
                >
                  {(booking.payment_status || 'pending').toUpperCase()}
                </span>
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Contact Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {booking.contact_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{booking.contact_email}</p>
                  </div>
                </div>
              )}
              {booking.contact_phone && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{booking.contact_phone}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Passenger Details */}
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Passenger Details</h2>
            <div className="space-y-3">
              {booking.passengers.map((passenger, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{passenger.fullName}</p>
                    <div className="text-sm text-muted-foreground space-x-4">
                      {passenger.phone && <span>{passenger.phone}</span>}
                      {passenger.passenger?.documentId && (
                        <span>ID: {passenger.passenger.documentId}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Seat {passenger.seatNumber}</p>
                    {passenger.price && (
                      <p className="text-sm text-muted-foreground">
                        {passenger.price.toLocaleString('vi-VN')} VND
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Total Amount */}
          <Card className="p-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold">Total Amount</span>
              <span className="text-2xl font-bold">
                {(booking.total_price || 0).toLocaleString('vi-VN')} VND
              </span>
            </div>
          </Card>

          {/* E-Ticket Section */}
          {booking.e_ticket && booking.e_ticket.ticket_url && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Ticket className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Your E-Ticket</h2>
              </div>

              <div className="bg-linear-to-br from-primary/5 to-primary/10 rounded-lg p-6 space-y-4">
                {/* QR Code Display */}
                {booking.e_ticket.qr_code_url && (
                  <div className="flex flex-col items-center gap-4 pb-4 border-b">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <img
                        src={booking.e_ticket.qr_code_url}
                        alt="Ticket QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        Scan QR Code for Verification
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Show this code at the boarding gate
                      </p>
                    </div>
                  </div>
                )}

                {/* Download Button */}
                <div className="flex flex-col gap-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() =>
                      window.open(booking.e_ticket!.ticket_url!, '_blank')
                    }
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download PDF Ticket
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Your ticket has been sent to {booking.contact_email}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Booking Details */}
          <Card className="p-6 space-y-2">
            <h3 className="font-semibold mb-3">Booking Information</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booking ID:</span>
                <span className="font-mono">{booking.booking_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{formatDate(booking.created_at)}</span>
              </div>
              {booking.locked_until && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reserved Until:</span>
                  <span>{formatDate(booking.locked_until)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.print()}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button asChild className="flex-1">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
