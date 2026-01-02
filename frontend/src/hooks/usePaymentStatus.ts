import { useEffect, useState, useRef } from 'react'
import { API_BASE_URL } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { getAccessToken } from '@/api/auth'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED'

interface UsePaymentStatusResult {
  status: PaymentStatus | null
  loading: boolean
  error: string | null
}

export function usePaymentStatus(
  bookingId?: string,
  pollInterval = 2000,
  maxWait = 30000
): UsePaymentStatusResult {
  const [status, setStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fetchedRef = useRef(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!bookingId) return

    let stopped = false
    setLoading(true)
    setError(null)
    setStatus(null)
    fetchedRef.current = false

    const fetchStatus = async () => {
      try {
        // Nếu không có user (guest), gọi endpoint guest
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

        const res = await fetch(url, { headers })
        if (!res.ok) throw new Error('Failed to fetch payment status')
        const data = await res.json()
        const paymentStatus = data?.data?.paymentStatus
        if (!stopped) {
          setStatus((prev) => {
            if (prev !== paymentStatus) return paymentStatus
            return prev
          })
          if (!fetchedRef.current) {
            setLoading(false)
            fetchedRef.current = true
          }
          if (paymentStatus !== 'PENDING') {
            clearInterval(pollingRef.current!)
            clearTimeout(timeoutRef.current!)
          }
        }
      } catch (err: unknown) {
        if (!stopped) {
          let message = 'Failed to fetch payment status'
          if (err instanceof Error) message = err.message
          setError(message)
          setLoading(false)
        }
      }
    }

    fetchStatus()
    pollingRef.current = setInterval(fetchStatus, pollInterval)

    timeoutRef.current = setTimeout(() => {
      if (!stopped) {
        clearInterval(pollingRef.current!)
        setLoading(false)
        setError('Quá thời gian chờ xác nhận thanh toán.')
      }
    }, maxWait)

    return () => {
      stopped = true
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [bookingId, pollInterval, maxWait, user])

  return { status, loading, error }
}
