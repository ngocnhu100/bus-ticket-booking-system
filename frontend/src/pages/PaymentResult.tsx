import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePaymentStatus } from '@/hooks/usePaymentStatus'
import { API_BASE_URL } from '@/lib/api'

interface BookingInfo {
  bookingReference: string
  contactEmail: string
  contactPhone: string
}

// Lấy bookingId từ query hoặc fallback từ apptransid (ZaloPay)
async function getBookingIdFromQueryAsync() {
  const params = new URLSearchParams(window.location.search)
  // Ưu tiên lấy từ extraData (base64)
  const extraData = params.get('extraData')
  if (extraData) {
    try {
      const decoded = atob(extraData)
      const extra = JSON.parse(decoded)
      if (extra.bookingId) return extra.bookingId
    } catch {
      // ignore
    }
  }
  // Fallback: lấy bookingId trực tiếp từ query nếu có
  const bookingId = params.get('bookingId')
  if (bookingId) return bookingId
  // Nếu là ZaloPay, thử lấy từ apptransid (orderId)
  const apptransid = params.get('apptransid')
  if (apptransid) {
    // Gọi API backend để tra cứu bookingId từ apptransid
    try {
      const res = await fetch(
        `${API_BASE_URL}/payments/zalopay/booking-id?apptransid=${apptransid}`
      )
      const data = await res.json()
      if (data.success && data.bookingId) return data.bookingId
    } catch {
      // ignore
    }
  }
  return ''
}

function getPaymentResultFromQuery() {
  const params = new URLSearchParams(window.location.search)
  return {
    resultCode: params.get('resultCode'),
    orderId: params.get('orderId'),
    message: params.get('message'),
  }
}

const statusMap: Record<string, string> = {
  PAID: 'Thanh toán thành công',
  PENDING: 'Chờ thanh toán',
  PROCESSING: 'Đang xử lý',
  CANCELLED: 'Đã hủy thanh toán',
  FAILED: 'Thanh toán thất bại',
  UNPAID: 'Chưa thanh toán',
}

function StatusIcon({ status, cancel }: { status?: string; cancel?: string }) {
  if (status === 'PAID' && cancel === 'false') {
    return (
      <svg
        className="mx-auto mb-4"
        width="80"
        height="80"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" fill="#dcfce7" />
        <path d="M8 12l2.5 2.5L16 9" />
      </svg>
    )
  }
  if (cancel === 'true' || status === 'CANCELLED') {
    return (
      <svg
        className="mx-auto mb-4"
        width="80"
        height="80"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ef4444"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" fill="#fee2e2" />
        <path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    )
  }
  if (status === 'PENDING' || status === 'UNPAID') {
    return (
      <svg
        className="mx-auto mb-4 animate-spin"
        width="80"
        height="80"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" fill="#dbeafe" />
        <path d="M12 6v6l4 2" />
      </svg>
    )
  }
  return (
    <svg
      className="mx-auto mb-4"
      width="80"
      height="80"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#f59e42"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" fill="#fef9c3" />
      <path d="M12 8v4m0 4h.01" />
    </svg>
  )
}

const PaymentResult: React.FC = () => {
  const navigate = useNavigate()
  const [bookingId, setBookingId] = useState<string>('')
  const paymentResult = getPaymentResultFromQuery()
  const { status, loading, error } = usePaymentStatus(bookingId)
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null)
  const [redirectCountdown, setRedirectCountdown] = useState<number>(5)
  const [manualStatus, setManualStatus] = useState<string | null>(null)

  // Handler to navigate to booking lookup page
  const handleViewTicket = useCallback(() => {
    if (!bookingInfo) return
    const params = new URLSearchParams({
      bookingReference: bookingInfo.bookingReference,
      email: bookingInfo.contactEmail,
      phone: bookingInfo.contactPhone,
      autoSearch: '1',
    })
    navigate(`/booking-lookup?${params.toString()}`)
  }, [bookingInfo, navigate])

  // Fetch booking info for redirect to lookup page
  // Lấy bookingId từ query hoặc tra cứu từ apptransid nếu cần
  useEffect(() => {
    getBookingIdFromQueryAsync().then(setBookingId)
  }, [])

  useEffect(() => {
    const currentStatus = manualStatus || status
    if (bookingId && currentStatus === 'PAID') {
      fetch(`${API_BASE_URL}/bookings/${bookingId}/guest`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setBookingInfo({
              bookingReference:
                data.data.bookingReference || data.data.booking_reference,
              contactEmail: data.data.contactEmail || data.data.contact_email,
              contactPhone: data.data.contactPhone || data.data.contact_phone,
            })
          }
        })
        .catch((err) => {
          console.error('[PaymentResult] Failed to fetch booking info:', err)
        })
    }
  }, [bookingId, status, manualStatus])

  // Auto redirect countdown when payment successful
  useEffect(() => {
    const currentStatus = manualStatus || status
    if (currentStatus === 'PAID' && bookingInfo) {
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            handleViewTicket()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [status, manualStatus, bookingInfo, handleViewTicket])

  // If we have MoMo result in URL, update booking status
  useEffect(() => {
    if (
      bookingId &&
      paymentResult.resultCode &&
      paymentResult.resultCode === '0'
    ) {
      // Fetch booking to get the actual amount
      fetch(`${API_BASE_URL}/bookings/${bookingId}/guest`)
        .then((res) => res.json())
        .then((bookingData) => {
          const amount =
            bookingData.data?.pricing?.total ||
            bookingData.data?.total_price ||
            parseInt(paymentResult.amount || '0')

          return fetch(
            `${API_BASE_URL}/bookings/internal/${bookingId}/confirm-payment`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentMethod: 'momo',
                transactionRef: paymentResult.orderId,
                amount: amount,
                paymentStatus: 'paid',
              }),
            }
          )
        })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setManualStatus('PAID')
          }
        })
        .catch((err) => {
          console.error('[PaymentResult] Error confirming payment:', err)
        })
    }
  }, [bookingId, paymentResult.resultCode, paymentResult.orderId, paymentResult.amount])

  if (!bookingId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-black">
            Không tìm thấy bookingId
          </h1>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => navigate('/')}
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    )
  }

  if (loading && !status) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-black">
            Đang kiểm tra trạng thái thanh toán...
          </h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Lỗi: {error}</h1>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => navigate('/')}
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    )
  }

  let message = ''
  const currentStatus = manualStatus || status
  if (currentStatus === 'PAID') message = 'Thanh toán thành công!'
  else if (currentStatus === 'CANCELLED') message = 'Bạn đã hủy thanh toán.'
  else if (currentStatus === 'FAILED') message = 'Thanh toán thất bại.'
  else if (currentStatus === 'PENDING') message = 'Thanh toán đang chờ xử lý.'
  else if (currentStatus === 'UNPAID')
    message = 'Chưa thanh toán. Đang chờ xác nhận từ cổng thanh toán...'
  else message = 'Không xác định trạng thái thanh toán.'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <StatusIcon status={currentStatus || undefined} />
        <h1 className="text-2xl font-bold mb-4 text-black">
          Kết quả thanh toán
        </h1>
        <div className="mb-2">
          <span className="font-semibold text-black">Trạng thái: </span>
          <span className="font-bold text-lg text-black">
            {statusMap[currentStatus || ''] ||
              currentStatus ||
              'Không xác định'}
          </span>
        </div>
        <div className="mb-2">
          <span className="font-semibold text-black">Mã booking: </span>
          <span className="text-black">{bookingId}</span>
        </div>
        <div className="mb-4 text-lg font-medium text-blue-600">{message}</div>

        {/* View Ticket Button for successful payments */}
        {currentStatus === 'PAID' && bookingInfo && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800 mb-3">
              Tự động chuyển đến trang xem vé trong{' '}
              <span className="font-bold text-lg">{redirectCountdown}</span>{' '}
              giây...
            </p>
            <button
              className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition"
              onClick={handleViewTicket}
            >
              Xem vé của tôi ngay
            </button>
          </div>
        )}

        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => navigate('/')}
        >
          Quay về trang chủ
        </button>
      </div>
    </div>
  )
}

export default PaymentResult
