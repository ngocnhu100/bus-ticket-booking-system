import { useState } from 'react'
import {
  Search,
  Mail,
  Phone,
  Ticket,
  AlertCircle,
  Download,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/landing/Header'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface BookingData {
  booking_id: string
  booking_reference: string
  trip_id: string
  contact_email: string
  contact_phone: string
  total_price: string
  status: string
  created_at: string
  passengers: Array<{
    full_name: string
    seat_code: string
    phone: string
  }>
  eTicket?: {
    ticketUrl: string | null
    qrCode: string | null
  }
}

export function BookingLookup() {
  const [bookingReference, setBookingReference] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<BookingData | null>(null)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBooking(null)

    // Validation
    if (!bookingReference.trim()) {
      setError('Please enter booking reference')
      return
    }

    if (!contactEmail.trim() && !contactPhone.trim()) {
      setError('Please enter email OR phone number')
      return
    }

    setLoading(true)

    try {
      // Build query params
      const params = new URLSearchParams()
      if (contactEmail.trim()) {
        params.append('contactEmail', contactEmail.trim())
      }
      if (contactPhone.trim()) {
        params.append('contactPhone', contactPhone.trim())
      }

      const url = `${API_BASE_URL}/bookings/${bookingReference}?${params.toString()}`
      console.log('Fetching:', url)

      const response = await axios.get(url)

      console.log('API Response:', response.data)

      if (response.data.success) {
        const bookingData = response.data.data
        console.log('Raw booking data:', JSON.stringify(bookingData, null, 2))
        console.log('Has eTicket?', bookingData.eTicket)
        console.log('ticket_url:', bookingData.ticket_url)
        console.log('qr_code_url:', bookingData.qr_code_url)

        // Map eTicket - backend might return both formats
        if (!bookingData.eTicket || !bookingData.eTicket.ticketUrl) {
          if (bookingData.ticket_url || bookingData.qr_code_url) {
            bookingData.eTicket = {
              ticketUrl: bookingData.ticket_url,
              qrCode: bookingData.qr_code_url,
            }
            console.log(
              'Created eTicket from snake_case fields:',
              bookingData.eTicket
            )
          }
        }

        setBooking(bookingData)
      } else {
        setError('Booking not found')
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorMessage =
          err.response.data?.error?.message ||
          'Booking not found or contact information does not match'
        setError(errorMessage)
      } else {
        setError('An error occurred. Please try again.')
      }
      console.error('Lookup error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'Confirmed'
      case 'pending':
        return 'Pending Payment'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Booking Lookup</h1>
          <p className="text-muted-foreground">
            Enter booking reference and contact information to look up your
            booking
          </p>
        </div>

        {/* Lookup Form */}
        <Card className="p-6 mb-6">
          <form onSubmit={handleLookup} className="space-y-4">
            {/* Booking Reference */}
            <div>
              <Label htmlFor="bookingReference" className="flex items-center">
                <Ticket className="w-4 h-4 mr-2" />
                Booking Reference *
              </Label>
              <Input
                id="bookingReference"
                type="text"
                placeholder="Ex: BK202512064939"
                value={bookingReference}
                onChange={(e) => setBookingReference(e.target.value)}
                className="mt-2"
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Booking reference has 16 characters, starts with BK
              </p>
            </div>

            {/* Contact Email */}
            <div>
              <Label htmlFor="contactEmail" className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Contact Email
              </Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="email@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="mt-2"
                disabled={loading}
              />
            </div>

            {/* Contact Phone */}
            <div>
              <Label htmlFor="contactPhone" className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Contact Phone
              </Label>
              <Input
                id="contactPhone"
                type="tel"
                placeholder="0901234567"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="mt-2"
                disabled={loading}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Please enter <strong>email OR phone number</strong> you used when
              booking
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Search className="w-4 h-4 mr-2 animate-spin" />
                  Looking up...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Look Up Booking
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Booking Result */}
        {booking && (
          <Card className="p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Booking Information
                  </h2>
                  <p className="text-muted-foreground">
                    Booking Reference: {booking.booking_reference}
                  </p>
                </div>
                <Badge className={getStatusColor(booking.status)}>
                  {getStatusText(booking.status)}
                </Badge>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Trip ID</p>
                  <p className="font-medium">{booking.trip_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Amount
                  </p>
                  <p className="font-bold text-lg text-green-600">
                    {parseFloat(booking.total_price).toLocaleString('vi-VN')}{' '}
                    VND
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{booking.contact_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Phone Number
                  </p>
                  <p className="font-medium">{booking.contact_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Booking Date
                  </p>
                  <p className="font-medium">
                    {new Date(booking.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              {/* E-Ticket Section */}
              {booking.eTicket && booking.eTicket.ticketUrl && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-4">
                    <Ticket className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">E-Ticket</h3>
                  </div>

                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 space-y-4">
                    {/* QR Code Display */}
                    {booking.eTicket.qrCode && (
                      <div className="flex flex-col items-center gap-4 pb-4 border-b border-white/50">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <img
                            src={booking.eTicket.qrCode}
                            alt="Boarding QR Code"
                            className="w-40 h-40"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            Scan QR code to verify
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Present this code when boarding
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Download Button */}
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() =>
                        window.open(booking.eTicket!.ticketUrl!, '_blank')
                      }
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download PDF Ticket
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Ticket sent to {booking.contact_email}
                    </p>
                  </div>
                </div>
              )}

              {/* Passengers */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">
                  Passenger Information ({booking.passengers.length})
                </h3>
                <div className="space-y-3">
                  {booking.passengers.map((passenger, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{passenger.full_name}</p>
                        {passenger.phone && (
                          <p className="text-sm text-muted-foreground">
                            {passenger.phone}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-base">
                        Seat {passenger.seat_code}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.print()}
                >
                  Print Ticket
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setBooking(null)
                    setBookingReference('')
                    setContactEmail('')
                    setContactPhone('')
                  }}
                >
                  Look up another booking
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Demo Instructions */}
        {!booking && (
          <Card className="p-6 bg-gray-50 mt-6">
            <h3 className="font-semibold mb-3">💡 Test Instructions</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Step 1:</strong> Create new booking at{' '}
                <a
                  href="/booking-demo"
                  className="text-blue-600 hover:underline"
                >
                  /booking-demo
                </a>
              </p>
              <p>
                <strong>Step 2:</strong> Copy booking reference (Ex:
                BK202512064939)
              </p>
              <p>
                <strong>Step 3:</strong> Enter reference + email/phone used when
                booking
              </p>
              <p>
                <strong>Step 4:</strong> Click "Look Up Booking"
              </p>
              <p>
                <strong>Step 5:</strong> View booking details with E-Ticket (QR
                code, PDF download)
              </p>
              <div className="mt-4 p-3 bg-white rounded border">
                <p className="font-medium mb-2">
                  Sample test case (with E-Ticket):
                </p>
                <code className="text-xs block space-y-1">
                  <span className="block">
                    Reference: <strong>BK20251207058</strong>
                  </span>
                  <span className="block">
                    Email: <strong>nguyenvana@example.com</strong>
                  </span>
                  <span className="block">
                    Phone: <strong>0901234567</strong>
                  </span>
                  <span className="block mt-2 text-green-600">
                    ✅ This booking includes E-Ticket
                  </span>
                  <span className="block text-muted-foreground">
                    • QR code for boarding verification
                  </span>
                  <span className="block text-muted-foreground">
                    • PDF ticket download available
                  </span>
                </code>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
