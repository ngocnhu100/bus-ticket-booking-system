import { useState, useEffect } from 'react'
import {
  Search,
  Mail,
  Phone,
  Ticket,
  AlertCircle,
  Download,
  Share2,
  Loader2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/landing/Header'
import { shareTicket } from '@/api/booking.api'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface BookingData {
  booking_id: string
  booking_reference: string
  trip_id: string
  contact_email: string
  contact_phone: string
  status: string
  created_at: string
  pricing: {
    subtotal: number
    service_fee: number
    total: number
    currency: string
  }
  passengers: Array<{
    full_name: string
    seat_code: string
    phone: string
  }>
  e_ticket?: {
    ticket_url: string | null
    qr_code_url: string | null
  }
  // Support camelCase responses from some endpoints
  eTicket?: {
    ticketUrl?: string | null
    qrCodeUrl?: string | null
    qrCode?: string | null
    ticket_url?: string | null
    qr_code_url?: string | null
  }
  trip_details?: {
    route: {
      origin: string
      destination: string
    }
    operator: {
      name: string
    }
    schedule: {
      departure_time: string
      arrival_time: string
    }
  }
}

type RawBooking = Partial<BookingData> & {
  bookingReference?: string
  reference?: string
  contactEmail?: string
  contactPhone?: string
  e_ticket?: {
    ticket_url?: string | null
    qr_code_url?: string | null
  }
  eTicket?: {
    ticketUrl?: string | null
    qrCodeUrl?: string | null
    qrCode?: string | null
    ticket_url?: string | null
    qr_code_url?: string | null
  }
}

// Normalize booking data coming from different API response shapes
const normalizeBookingData = (data: RawBooking): BookingData => {
  const rawETicket = data.e_ticket || data.eTicket || {}

  // Access various possible key shapes safely using index access
  const rt = rawETicket as Record<string, string | null | undefined>
  const ticketUrl =
    rt['ticket_url'] ?? rt['ticketUrl'] ?? rt['ticketurl'] ?? null
  const qrCodeUrl = rt['qr_code_url'] ?? rt['qrCodeUrl'] ?? rt['qrCode'] ?? null

  // Return normalized object. Cast to BookingData to satisfy TypeScript
  return {
    ...data,
    booking_reference:
      data.booking_reference ?? data.bookingReference ?? data.reference ?? '',
    contact_email: data.contact_email ?? data.contactEmail ?? '',
    contact_phone: data.contact_phone ?? data.contactPhone ?? '',
    e_ticket: {
      ticket_url: ticketUrl,
      qr_code_url: qrCodeUrl,
    },
  } as BookingData
}

export function BookingLookup() {
  const [bookingReference, setBookingReference] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [shareEmail, setShareEmail] = useState('')
  const [shareLoading, setShareLoading] = useState(false)
  const [shareSuccess, setShareSuccess] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)

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
      // Build query params for new guest lookup endpoint
      const params = new URLSearchParams()
      params.append('bookingReference', bookingReference.trim())

      if (contactEmail.trim()) {
        params.append('email', contactEmail.trim())
      }
      if (contactPhone.trim()) {
        params.append('phone', contactPhone.trim())
      }

      const url = `${API_BASE_URL}/bookings/guest/lookup?${params.toString()}`
      console.log('Fetching:', url)

      const response = await axios.get(url)

      console.log('API Response:', response.data)

      if (response.data.success) {
        const bookingData = normalizeBookingData(response.data.data)
        console.log('Raw booking data:', JSON.stringify(bookingData, null, 2))
        console.log('Share section check:', {
          status: bookingData.status,
          hasETicket: !!bookingData.e_ticket,
          hasTicketUrl: !!bookingData.e_ticket?.ticket_url,
          eTicket: bookingData.e_ticket,
        })

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

  // Extracted fetch logic so it can be called from useEffect when autoSearch param is present
  const fetchBooking = async (
    bookingRef: string,
    email?: string | null,
    phone?: string | null
  ) => {
    setError(null)
    setBooking(null)

    if (!bookingRef || !bookingRef.trim()) {
      return
    }

    if (!(email && email.trim()) && !(phone && phone.trim())) {
      // Don't perform auto-search if no contact info provided
      return
    }

    setLoading(true)

    try {
      const params = new URLSearchParams()
      params.append('bookingReference', bookingRef.trim())
      if (email && email.trim()) params.append('email', email.trim())
      if (phone && phone.trim()) params.append('phone', phone.trim())

      const url = `${API_BASE_URL}/bookings/guest/lookup?${params.toString()}`
      console.log('Auto Fetching:', url)

      const response = await axios.get(url)

      if (response.data.success) {
        const bookingData = normalizeBookingData(response.data.data)
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
      console.error('Auto lookup error:', err)
    } finally {
      setLoading(false)
    }
  }

  // On mount, read query params and optionally auto-search
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const br =
        params.get('bookingReference') || params.get('booking_reference')
      const email = params.get('email')
      const phone = params.get('phone')
      const auto = params.get('autoSearch') || params.get('auto_search')

      if (br) setBookingReference(br)
      if (email) setContactEmail(email)
      if (phone) setContactPhone(phone)

      if (br && (auto === '1' || auto === 'true')) {
        // Perform auto lookup only when autoSearch present
        fetchBooking(br, email, phone)
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // ignore
    }
  }, [])

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

  const handleShareTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    setShareError(null)
    setShareSuccess(null)

    if (!shareEmail.trim()) {
      setShareError('Please enter an email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(shareEmail)) {
      setShareError('Please enter a valid email address')
      return
    }

    if (!booking) return

    setShareLoading(true)

    try {
      await shareTicket(
        booking.booking_reference,
        shareEmail,
        contactPhone || undefined
      )
      setShareSuccess(`Ticket sent successfully to ${shareEmail}`)
      setShareEmail('')
    } catch (err) {
      if (err instanceof Error) {
        setShareError(err.message)
      } else {
        setShareError('Failed to share ticket. Please try again.')
      }
    } finally {
      setShareLoading(false)
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
                placeholder="Ex: BK20251209001"
                value={bookingReference}
                onChange={(e) => setBookingReference(e.target.value)}
                className="mt-2"
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Format: BKYYYYMMDDXXX (13 characters)
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
                placeholder="+84973994154 or 0973994154"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="mt-2"
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Vietnamese format: +84xxxxxxxxx or 0xxxxxxxxx
              </p>
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                    {booking.pricing.total.toLocaleString('vi-VN')} VND
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
              {booking.e_ticket && booking.e_ticket.ticket_url && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-4">
                    <Ticket className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">E-Ticket</h3>
                  </div>

                  <div className="bg-linear-to-br from-primary/5 to-primary/10 rounded-lg p-6 space-y-4">
                    {/* QR Code Display */}
                    {booking.e_ticket.qr_code_url && (
                      <div className="flex flex-col items-center gap-4 pb-4 border-b border-white/50">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <img
                            src={booking.e_ticket.qr_code_url}
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
                        window.open(booking.e_ticket!.ticket_url!, '_blank')
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
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
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

              {/* Share Ticket Section */}
              {booking.status === 'confirmed' &&
                booking.e_ticket?.ticket_url && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-4">
                      <Share2 className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Share E-Ticket</h3>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <p className="text-sm text-blue-800">
                        Send this ticket to another email address
                      </p>
                      <form
                        onSubmit={handleShareTicket}
                        className="flex gap-2 items-start"
                      >
                        <div className="flex-1">
                          <Input
                            type="email"
                            placeholder="recipient@example.com"
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                            disabled={shareLoading}
                            className="bg-white"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={shareLoading}
                          size="default"
                        >
                          {shareLoading ? (
                            <>Sending...</>
                          ) : (
                            <>
                              <Mail className="w-4 h-4 mr-2" />
                              Send
                            </>
                          )}
                        </Button>
                      </form>
                      {shareSuccess && (
                        <div className="bg-green-50 border border-green-200 rounded p-2 text-sm text-green-800">
                          ✅ {shareSuccess}
                        </div>
                      )}
                      {shareError && (
                        <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-800">
                          ❌ {shareError}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Actions */}
              <div className="pt-4 border-t flex gap-3">
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
        {/* {!booking && (
          <Card className="p-6 bg-gray-50 dark:bg-gray-800 mt-6">
            <h3 className="font-semibold mb-3">💡 Test Instructions</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Step 1:</strong> Enter booking reference below
              </p>
              <p>
                <strong>Step 2:</strong> Enter email OR phone used when booking
              </p>
              <p>
                <strong>Step 3:</strong> Click "Look Up Booking"
              </p>
              <p>
                <strong>Step 4:</strong> View booking details with E-Ticket (QR
                code, PDF download)
              </p>
              <p>
                <strong>Step 5:</strong> Share E-Ticket via email (for confirmed
                bookings)
              </p>
              <div className="mt-4 p-3 bg-white rounded border">
                <p className="font-medium mb-2">
                  Sample test case (with E-Ticket):
                </p>
                <code className="text-xs block space-y-1">
                  <span className="block">
                    Reference: <strong>BK20260115001</strong>
                  </span>
                  <span className="block">
                    Email: <strong>passenger@bus-ticket.com</strong>
                  </span>
                  <span className="block">
                    Phone: <strong>+84901234567</strong> or{' '}
                    <strong>0901234567</strong>
                  </span>
                  <span className="block mt-2 text-green-600">
                    ✅ This booking is available for testing
                  </span>
                  <span className="block text-blue-600">
                    📧 Test share: Enter any email to receive e-ticket
                  </span>
                  <span className="block text-muted-foreground">
                    • Format: BKYYYYMMDDXXX (13 characters)
                  </span>
                  <span className="block text-muted-foreground">
                    • Case-insensitive lookup supported
                  </span>
                </code>
              </div>
            </div>
          </Card>
        )} */}
      </div>
    </div>
  )
}
