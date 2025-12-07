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
      setError('Vui lòng nhập mã đặt vé')
      return
    }

    if (!contactEmail.trim() && !contactPhone.trim()) {
      setError('Vui lòng nhập email HOẶC số điện thoại')
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
        setError('Không tìm thấy đặt vé')
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorMessage =
          err.response.data?.error?.message ||
          'Không tìm thấy đặt vé hoặc thông tin không khớp'
        setError(errorMessage)
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.')
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
        return 'Đã xác nhận'
      case 'pending':
        return 'Chờ thanh toán'
      case 'cancelled':
        return 'Đã hủy'
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
          <h1 className="text-3xl font-bold mb-2">Tra Cứu Đặt Vé</h1>
          <p className="text-muted-foreground">
            Nhập mã đặt vé và thông tin liên hệ để tra cứu
          </p>
        </div>

        {/* Lookup Form */}
        <Card className="p-6 mb-6">
          <form onSubmit={handleLookup} className="space-y-4">
            {/* Booking Reference */}
            <div>
              <Label htmlFor="bookingReference" className="flex items-center">
                <Ticket className="w-4 h-4 mr-2" />
                Mã đặt vé *
              </Label>
              <Input
                id="bookingReference"
                type="text"
                placeholder="VD: BK202512064939"
                value={bookingReference}
                onChange={(e) => setBookingReference(e.target.value)}
                className="mt-2"
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Mã đặt vé gồm 16 ký tự, bắt đầu bằng BK
              </p>
            </div>

            {/* Contact Email */}
            <div>
              <Label htmlFor="contactEmail" className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Email liên hệ
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
                Số điện thoại liên hệ
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
              Vui lòng nhập <strong>email HOẶC số điện thoại</strong> bạn đã
              dùng khi đặt vé
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
                  Đang tra cứu...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Tra cứu đặt vé
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
                  <h2 className="text-2xl font-bold mb-2">Thông Tin Đặt Vé</h2>
                  <p className="text-muted-foreground">
                    Mã đặt vé: {booking.booking_reference}
                  </p>
                </div>
                <Badge className={getStatusColor(booking.status)}>
                  {getStatusText(booking.status)}
                </Badge>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Mã chuyến xe
                  </p>
                  <p className="font-medium">{booking.trip_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Tổng tiền
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
                    Số điện thoại
                  </p>
                  <p className="font-medium">{booking.contact_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Ngày đặt vé
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
                    <h3 className="font-semibold">Vé điện tử (E-Ticket)</h3>
                  </div>

                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 space-y-4">
                    {/* QR Code Display */}
                    {booking.eTicket.qrCode && (
                      <div className="flex flex-col items-center gap-4 pb-4 border-b border-white/50">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <img
                            src={booking.eTicket.qrCode}
                            alt="QR Code vé"
                            className="w-40 h-40"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            Quét mã QR để xác thực
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Xuất trình mã này khi lên xe
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
                      Tải xuống vé PDF
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Vé đã được gửi đến {booking.contact_email}
                    </p>
                  </div>
                </div>
              )}

              {/* Passengers */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">
                  Thông tin hành khách ({booking.passengers.length})
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
                        Ghế {passenger.seat_code}
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
                  In vé
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
                  Tra cứu vé khác
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Demo Instructions */}
        {!booking && (
          <Card className="p-6 bg-gray-50 mt-6">
            <h3 className="font-semibold mb-3">💡 Hướng dẫn test</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Bước 1:</strong> Tạo booking mới tại{' '}
                <a
                  href="/booking-demo"
                  className="text-blue-600 hover:underline"
                >
                  /booking-demo
                </a>
              </p>
              <p>
                <strong>Bước 2:</strong> Copy mã đặt vé (VD: BK202512064939)
              </p>
              <p>
                <strong>Bước 3:</strong> Nhập mã + email/phone đã dùng khi đặt
              </p>
              <p>
                <strong>Bước 4:</strong> Click "Tra cứu đặt vé"
              </p>
              <div className="mt-4 p-3 bg-white rounded border">
                <p className="font-medium mb-2">Test case mẫu:</p>
                <code className="text-xs">
                  Mã: BK202512064939
                  <br />
                  Email: testguest@example.com
                  <br />
                  Phone: 0901234567
                </code>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
