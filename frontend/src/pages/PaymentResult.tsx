import React from 'react'
import { useNavigate } from 'react-router-dom'
import { usePaymentStatus } from '@/hooks/usePaymentStatus'

function getBookingIdFromQuery() {
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
  return params.get('bookingId') || ''
}

const statusMap: Record<string, string> = {
  PAID: 'Thanh toán thành công',
  PENDING: 'Chờ thanh toán',
  PROCESSING: 'Đang xử lý',
  CANCELLED: 'Đã hủy thanh toán',
  FAILED: 'Thanh toán thất bại',
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
  const bookingId = getBookingIdFromQuery()
  const { status, loading, error } = usePaymentStatus(bookingId)

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
  if (status === 'PAID') message = 'Thanh toán thành công!'
  else if (status === 'CANCELLED') message = 'Bạn đã hủy thanh toán.'
  else if (status === 'FAILED') message = 'Thanh toán thất bại.'
  else if (status === 'PENDING') message = 'Thanh toán đang chờ xử lý.'
  else message = 'Không xác định trạng thái thanh toán.'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <StatusIcon status={status || undefined} />
        <h1 className="text-2xl font-bold mb-4 text-black">
          Kết quả thanh toán
        </h1>
        <div className="mb-2">
          <span className="font-semibold text-black">Trạng thái: </span>
          <span className="font-bold text-lg text-black">
            {statusMap[status || ''] || status || 'Không xác định'}
          </span>
        </div>
        <div className="mb-2">
          <span className="font-semibold text-black">Mã booking: </span>
          <span className="text-black">{bookingId}</span>
        </div>
        <div className="mb-4 text-lg font-medium text-blue-600">{message}</div>
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
