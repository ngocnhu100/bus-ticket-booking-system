import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePaymentStatus } from '@/hooks/usePaymentStatus'
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
  if (status === 'PAID' && cancel === 'false') {
    return (
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-green-100 rounded-full">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
      </div>
    )
  }
  if (cancel === 'true' || status === 'CANCELLED') {
    return (
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-red-100 rounded-full">
          <XCircle className="w-16 h-16 text-red-600" />
        </div>
      </div>
    )
  }
  if (status === 'PENDING' || status === 'UNPAID') {
    return (
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-blue-100 rounded-full">
          <Clock className="w-16 h-16 text-blue-600 animate-pulse" />
        </div>
      </div>
    )
  }
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

      fetch(url, { headers })
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
  }, [bookingId, status, manualStatus, user])

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

  // If we have MoMo or PayOS result in URL, update booking status
  useEffect(() => {
    // Check if payment was successful
    const isMoMoSuccess =
      paymentResult.resultCode && paymentResult.resultCode === '0'
    const isPayOSSuccess =
      paymentResult.status === 'PAID' &&
      paymentResult.code === '00' &&
      paymentResult.cancel === 'false'

    if (bookingId && (isMoMoSuccess || isPayOSSuccess)) {
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

      // Fetch booking to get the actual amount
      fetch(url, { headers })
        .then((res) => res.json())
        .then((bookingData) => {
          const amount =
            bookingData.data?.pricing?.total ||
            bookingData.data?.total_price ||
            parseInt(paymentResult.amount || '0')

          // Determine payment method and transaction reference
          const paymentMethod = isPayOSSuccess ? 'payos' : 'momo'
          const transactionRef = isPayOSSuccess
            ? paymentResult.orderCode
            : paymentResult.orderId

          return fetch(
            `${API_BASE_URL}/bookings/internal/${bookingId}/confirm-payment`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentMethod,
                transactionRef,
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
  }, [
    bookingId,
    paymentResult.resultCode,
    paymentResult.orderId,
    paymentResult.code,
    paymentResult.status,
    paymentResult.orderCode,
    paymentResult.cancel,
    paymentResult.amount,
    user,
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
  const currentStatus = manualStatus || status
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
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Ticket className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                Redirecting to your ticket in{' '}
                <span className="font-bold text-lg text-green-600">
                  {redirectCountdown}
                </span>{' '}
                seconds...
              </p>
            </div>
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
              onClick={() => navigate('/booking-lookup')}
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
