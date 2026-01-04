import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePaymentStatus } from '@/hooks/usePaymentStatus'
import { useSessionCaching } from '@/hooks/useSessionCaching'
import { API_BASE_URL } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { getAccessToken } from '@/api/auth'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Home,
  Ticket,
} from 'lucide-react'

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
  // Fallback: lấy bookingId trực tiếp từ query nếu có (ưu tiên cao nhất)
  const bookingId = params.get('bookingId')
  if (bookingId) return bookingId

  // PayOS: lấy từ parameter 'id' (lưu ý: đây là transaction ID, có thể không phải bookingId)
  const payosId = params.get('id')
  if (payosId) return payosId

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
    // MoMo params
    resultCode: params.get('resultCode'),
    orderId: params.get('orderId'),
    message: params.get('message'),
    amount: params.get('amount'),
    // PayOS params
    code: params.get('code'),
    status: params.get('status'),
    orderCode: params.get('orderCode'),
    cancel: params.get('cancel'),
    // Stripe/Card params
    method: params.get('method'),
  }
}

const statusMap: Record<string, string> = {
  PAID: 'Payment Successful',
  PENDING: 'Payment Pending',
  PROCESSING: 'Processing Payment',
  CANCELLED: 'Payment Cancelled',
  FAILED: 'Payment Failed',
  UNPAID: 'Payment Unpaid',
}

function StatusIcon({
  status,
  cancel,
}: {
  status?: string
  cancel?: string | null
}) {
  // Check for successful payment (PAID or success for card)
  if ((status === 'PAID' || status === 'success') && cancel !== 'true') {
    return (
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-green-100 rounded-full">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
      </div>
    )
  }
  // Failed/Cancelled: Show red X for failed or cancelled payments
  if (status === 'FAILED' || status === 'CANCELLED' || cancel === 'true') {
    return (
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-red-100 rounded-full">
          <XCircle className="w-16 h-16 text-red-600" />
        </div>
      </div>
    )
  }
  // Pending: Show blue clock for pending/unpaid status
  if (status === 'PENDING' || status === 'UNPAID') {
    return (
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-blue-100 rounded-full">
          <Clock className="w-16 h-16 text-blue-600 animate-pulse" />
        </div>
      </div>
    )
  }
  // Unknown/Default: Show yellow alert circle
  return (
    <div className="flex justify-center mb-6">
      <div className="p-4 bg-yellow-100 rounded-full">
        <AlertCircle className="w-16 h-16 text-yellow-600" />
      </div>
    </div>
  )
}

const PaymentResult: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { clearSessionCache } = useSessionCaching()
  const [bookingId, setBookingId] = useState<string>('')
  const paymentResult = getPaymentResultFromQuery()
  const { status, loading, error } = usePaymentStatus(bookingId)
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null)
  const [manualStatus, setManualStatus] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  // Helper: Fetch with retry and timeout
  const fetchWithRetry = useCallback(
    async (url: string, options: RequestInit = {}, retries = 3) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          })
          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          return await response.json()
        } catch (err) {
          console.error(
            `[PaymentResult] Attempt ${attempt}/${retries} failed:`,
            err
          )

          if (attempt === retries) {
            throw err
          }

          // Exponential backoff: 1s, 2s, 4s
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
          )
        }
      }
    },
    []
  )

  // Calculate payment status from URL parameters (derived state)
  const paymentStatusFromUrl = React.useMemo(() => {
    const isMoMoFailed =
      paymentResult.resultCode && paymentResult.resultCode !== '0'
    const isPayOSCancelled =
      paymentResult.cancel === 'true' || paymentResult.code === '01'
    const isCardSuccess =
      paymentResult.status === 'success' && paymentResult.method === 'card'

    if (isMoMoFailed) return 'FAILED'
    if (isPayOSCancelled) return 'CANCELLED'
    if (isCardSuccess) return 'PAID' // Card payment success
    return null
  }, [
    paymentResult.resultCode,
    paymentResult.cancel,
    paymentResult.code,
    paymentResult.status,
    paymentResult.method,
  ])

  // Handler to navigate to booking lookup page (auto fill)
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

  // Handler for 'Check Booking Status' button: auto fill if possible
  const handleCheckBookingStatus = useCallback(() => {
    if (bookingInfo) {
      const params = new URLSearchParams({
        bookingReference: bookingInfo.bookingReference,
        email: bookingInfo.contactEmail,
        phone: bookingInfo.contactPhone,
        autoSearch: '1',
      })
      navigate(`/booking-lookup?${params.toString()}`)
    } else {
      navigate('/booking-lookup')
    }
  }, [bookingInfo, navigate])

  // Fetch booking info for redirect to lookup page
  // Lấy bookingId từ query hoặc tra cứu từ apptransid nếu cần
  useEffect(() => {
    getBookingIdFromQueryAsync().then(setBookingId)
  }, [])

  // Clear session cache when payment is successful
  useEffect(() => {
    if (status === 'PAID') {
      console.log('🎉 Payment successful - clearing session cache')
      clearSessionCache()
    }
  }, [status, clearSessionCache])

  // MERGED EFFECT: Handle both payment confirmation AND booking info fetch
  // This prevents race condition from 2 separate useEffects
  useEffect(() => {
    if (!bookingId || isProcessing) return

    const currentStatus = paymentStatusFromUrl || manualStatus || status

    // Check if we need to confirm payment
    const isMoMoSuccess =
      paymentResult.resultCode && paymentResult.resultCode === '0'
    const isPayOSSuccess =
      paymentResult.status === 'PAID' &&
      paymentResult.code === '00' &&
      paymentResult.cancel === 'false'
    const isCardSuccess =
      paymentResult.status === 'success' && paymentResult.method === 'card'

    // Scenario 1: Need to confirm payment from gateway
    if (isMoMoSuccess || isPayOSSuccess || isCardSuccess) {
      const confirmPayment = async () => {
        setIsProcessing(true)

        try {
          const url = user
            ? `${API_BASE_URL}/bookings/${bookingId}`
            : `${API_BASE_URL}/bookings/${bookingId}/guest`

          const headers: HeadersInit = {}
          if (user) {
            const token = getAccessToken()
            if (token) {
              headers['Authorization'] = `Bearer ${token}`
            }
          }

          // Fetch booking data with retry
          const bookingData = await fetchWithRetry(url, { headers })

          // For non-card payments, confirm via internal API
          if (!isCardSuccess) {
            const amount =
              bookingData.data?.pricing?.total ||
              bookingData.data?.total_price ||
              parseInt(paymentResult.amount || '0')

            const paymentMethod = isPayOSSuccess ? 'payos' : 'momo'
            const transactionRef = isPayOSSuccess
              ? paymentResult.orderCode
              : paymentResult.orderId

            await fetchWithRetry(
              `${API_BASE_URL}/bookings/internal/${bookingId}/confirm-payment`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentMethod,
                  transactionRef,
                  amount,
                  paymentStatus: 'paid',
                }),
              }
            )
          }

          // Set booking info
          setManualStatus('PAID')
          setBookingInfo({
            bookingReference:
              bookingData.data.bookingReference ||
              bookingData.data.booking_reference,
            contactEmail:
              bookingData.data.contactEmail || bookingData.data.contact_email,
            contactPhone:
              bookingData.data.contactPhone || bookingData.data.contact_phone,
          })
        } catch (err) {
          console.error('[PaymentResult] Payment confirmation failed:', err)
        } finally {
          setIsProcessing(false)
        }
      }

      confirmPayment()
    }
    // Scenario 2: Already PAID, just fetch booking info
    else if (currentStatus === 'PAID' && !bookingInfo) {
      const fetchInfo = async () => {
        setIsProcessing(true)

        try {
          const url = user
            ? `${API_BASE_URL}/bookings/${bookingId}`
            : `${API_BASE_URL}/bookings/${bookingId}/guest`

          const headers: HeadersInit = {}
          if (user) {
            const token = getAccessToken()
            if (token) {
              headers['Authorization'] = `Bearer ${token}`
            }
          }

          const data = await fetchWithRetry(url, { headers })

          if (data.success && data.data) {
            setBookingInfo({
              bookingReference:
                data.data.bookingReference || data.data.booking_reference,
              contactEmail: data.data.contactEmail || data.data.contact_email,
              contactPhone: data.data.contactPhone || data.data.contact_phone,
            })
          }
        } catch (err) {
          console.error('[PaymentResult] Failed to fetch booking info:', err)
        } finally {
          setIsProcessing(false)
        }
      }

      fetchInfo()
    }
    // Scenario 3: Failed/Cancelled, fetch booking info for auto-fill
    else if (
      (currentStatus === 'FAILED' || currentStatus === 'CANCELLED') &&
      !bookingInfo
    ) {
      const fetchInfo = async () => {
        setIsProcessing(true)

        try {
          const url = user
            ? `${API_BASE_URL}/bookings/${bookingId}`
            : `${API_BASE_URL}/bookings/${bookingId}/guest`

          const headers: HeadersInit = {}
          if (user) {
            const token = getAccessToken()
            if (token) {
              headers['Authorization'] = `Bearer ${token}`
            }
          }

          const data = await fetchWithRetry(url, { headers })

          if (data.success && data.data) {
            setBookingInfo({
              bookingReference:
                data.data.bookingReference || data.data.booking_reference,
              contactEmail: data.data.contactEmail || data.data.contact_email,
              contactPhone: data.data.contactPhone || data.data.contact_phone,
            })
          }
        } catch (err) {
          console.error(
            '[PaymentResult] Failed to fetch booking info for failed/cancelled payment:',
            err
          )
        } finally {
          setIsProcessing(false)
        }
      }

      fetchInfo()
    }
  }, [
    bookingId,
    status,
    manualStatus,
    paymentStatusFromUrl,
    user,
    isProcessing,
    bookingInfo,
    paymentResult.resultCode,
    paymentResult.orderId,
    paymentResult.code,
    paymentResult.status,
    paymentResult.orderCode,
    paymentResult.cancel,
    paymentResult.amount,
    paymentResult.method,
    fetchWithRetry,
  ])

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gray-100 rounded-full">
              <AlertCircle className="w-12 h-12 text-gray-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Booking ID Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn't find your booking information. Please try again or
            contact support.
          </p>
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-2"
            onClick={() => navigate('/')}
          >
            <Home className="w-5 h-5" />
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  if (loading && !status) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-100 rounded-full">
              <Clock className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Checking Payment Status
          </h1>
          <p className="text-gray-600">
            Please wait while we verify your payment...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-100 rounded-full">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error: {error}
          </h1>
          <p className="text-gray-600 mb-6">
            Something went wrong while processing your payment. Please try
            again.
          </p>
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-2"
            onClick={() => navigate('/')}
          >
            <Home className="w-5 h-5" />
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  let message = ''
  const currentStatus = paymentStatusFromUrl || manualStatus || status
  if (currentStatus === 'PAID')
    message = 'Your payment has been processed successfully!'
  else if (currentStatus === 'CANCELLED')
    message = 'Payment has been cancelled.'
  else if (currentStatus === 'FAILED')
    message = 'Payment failed. Please try again.'
  else if (currentStatus === 'PENDING') message = 'Payment is being processed.'
  else if (currentStatus === 'UNPAID')
    message =
      'Payment not completed. Waiting for confirmation from payment gateway...'
  else message = 'Payment status unknown.'

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8 text-center border border-gray-100">
        <StatusIcon
          status={currentStatus || undefined}
          cancel={paymentResult.cancel}
        />

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Result
        </h1>

        <div className="mb-6">
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
            {statusMap[currentStatus || ''] ||
              currentStatus ||
              'Unknown Status'}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-600">
              Booking ID:
            </span>
            <span className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded border">
              {bookingId}
            </span>
          </div>

          {paymentResult.orderCode && (
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-600">
                Order Code:
              </span>
              <span className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded border">
                {paymentResult.orderCode}
              </span>
            </div>
          )}

          {paymentResult.amount && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Amount:</span>
              <span className="text-sm font-semibold text-green-600">
                {parseInt(paymentResult.amount).toLocaleString()} VND
              </span>
            </div>
          )}
        </div>

        <div
          className={`mb-6 p-4 rounded-xl text-center ${
            currentStatus === 'PAID'
              ? 'bg-green-50 border border-green-200'
              : currentStatus === 'CANCELLED'
                ? 'bg-red-50 border border-red-200'
                : currentStatus === 'FAILED'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-blue-50 border border-blue-200'
          }`}
        >
          <p
            className={`text-lg font-medium ${
              currentStatus === 'PAID'
                ? 'text-green-800'
                : currentStatus === 'CANCELLED' || currentStatus === 'FAILED'
                  ? 'text-red-800'
                  : 'text-blue-800'
            }`}
          >
            {message}
          </p>
        </div>

        {/* View Ticket Button for successful payments */}
        {currentStatus === 'PAID' && bookingInfo && (
          <div className="mb-6">
            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              onClick={handleViewTicket}
            >
              <Ticket className="w-5 h-5" />
              View My Ticket Now
            </button>
          </div>
        )}

        <div className="space-y-3">
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            onClick={() => navigate('/')}
          >
            <Home className="w-5 h-5" />
            Return to Home
          </button>

          {currentStatus !== 'PAID' && (
            <button
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition duration-200 text-sm"
              onClick={handleCheckBookingStatus}
            >
              Check Booking Status
            </button>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Need help? Contact our support team for assistance with your
            booking.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PaymentResult
