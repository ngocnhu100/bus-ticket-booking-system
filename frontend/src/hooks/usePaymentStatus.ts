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
  pollInterval = 3000, // Increased from 2s to 3s to reduce load
  maxWait = 30000
): UsePaymentStatusResult {
  const [status, setStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fetchedRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!bookingId) return

    let stopped = false
    setLoading(true)
    setError(null)
    setStatus(null)
    fetchedRef.current = false

    const fetchStatus = async () => {
      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new AbortController for this request
      const controller = new AbortController()
      abortControllerRef.current = controller

      // Timeout for this specific request (8s < pollInterval)
      const requestTimeout = setTimeout(() => controller.abort(), 8000)

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

        const res = await fetch(url, {
          headers,
          signal: controller.signal,
        })

        clearTimeout(requestTimeout)

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
        clearTimeout(requestTimeout)

        // Ignore abort errors (normal when cancelling)
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

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
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [bookingId, pollInterval, maxWait, user])

  return { status, loading, error }
}
