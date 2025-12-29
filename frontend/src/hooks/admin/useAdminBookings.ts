import { useState, useCallback } from 'react'
import { useToast } from '../use-toast'
import type { BookingAdminData } from '../../types/trip.types'
import { request } from '../../api/auth'

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface FetchBookingsParams {
  page?: number
  limit?: number
  status?: string
  payment_status?: string
  fromDate?: string
  toDate?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export function useAdminBookings() {
  const [bookings, setBookings] = useState<BookingAdminData[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchBookings = useCallback(
    async (params: FetchBookingsParams = {}) => {
      setIsLoading(true)
      setError(null)
      try {
        const searchParams = new URLSearchParams()

        if (params.page) searchParams.append('page', params.page.toString())
        if (params.limit) searchParams.append('limit', params.limit.toString())
        if (params.status) searchParams.append('status', params.status)
        if (params.payment_status)
          searchParams.append('payment_status', params.payment_status)
        if (params.fromDate) searchParams.append('fromDate', params.fromDate)
        if (params.toDate) searchParams.append('toDate', params.toDate)
        if (params.sortBy) searchParams.append('sortBy', params.sortBy)
        if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder)

        console.log(
          '[FE Request] GET /bookings/admin?' + searchParams.toString()
        )

        const data = await request(
          `/bookings/admin?${searchParams.toString()}`,
          {
            method: 'GET',
          }
        )

        console.log('[FE Response] Bookings data:', data)

        // Validate response structure
        if (!data) {
          console.error('[FE Error] No data returned from API')
          throw new Error('No data returned from API')
        }

        if (!Array.isArray(data.data)) {
          console.error(
            '[FE Error] Invalid response structure. Expected data.data to be array:',
            data
          )
          // Try to handle different response structures
          if (Array.isArray(data)) {
            setBookings(data)
          } else {
            setBookings([])
          }
        } else {
          console.log('[FE] Setting bookings, count:', data.data.length)
          console.log('[FE] First booking sample:', data.data[0])
          setBookings(data.data)
        }

        // Extract pagination data from response
        if (data.pagination) {
          setPagination({
            page: data.pagination.page || params.page || 1,
            limit: data.pagination.limit || params.limit || 20,
            total: data.pagination.total || 0,
            totalPages: data.pagination.totalPages || 0,
          })
        }

        return data.pagination
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to fetch bookings'
        setError(message)
        console.error('[FE Error] Fetch bookings failed:', error)

        // Set empty data on error
        setBookings([])
        setPagination({
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        })

        toast({
          title: 'Error',
          description: message,
        })

        // Don't throw - let component handle empty state
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  const fetchBookingDetails = useCallback(
    async (bookingId: string): Promise<BookingAdminData> => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await request(`/bookings/admin/${bookingId}`, {
          method: 'GET',
        })

        return data.data
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to fetch booking details'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  const updateBookingStatus = useCallback(
    async (
      bookingId: string,
      status: 'confirmed' | 'cancelled' | 'completed'
    ) => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await request(`/bookings/admin/${bookingId}/status`, {
          method: 'PUT',
          body: { status },
        })

        // Update the booking in the list
        setBookings((prev) =>
          prev.map((booking) =>
            booking.booking_id === bookingId
              ? { ...booking, status, updated_at: new Date().toISOString() }
              : booking
          )
        )

        toast({
          title: 'Success',
          description: data.message || 'Booking status updated successfully',
        })

        return data.data
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to update booking status'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  const processRefund = useCallback(
    async (bookingId: string, refundAmount: number, reason?: string) => {
      setIsLoading(true)
      setError(null)
      try {
        console.log('[Hook] Processing refund:', {
          bookingId,
          refundAmount,
          reason,
        })

        const data = await request(`/bookings/admin/${bookingId}/refund`, {
          method: 'POST',
          body: {
            refundAmount,
            reason: reason || 'Admin-initiated refund',
          },
        })

        console.log('[Hook] Refund response:', data)

        // Update the booking in the list
        setBookings((prev) =>
          prev.map((booking) =>
            booking.booking_id === bookingId
              ? {
                  ...booking,
                  status: 'cancelled' as const,
                  payment_status: 'refunded' as const,
                  refund_amount: refundAmount,
                  cancellation_reason: reason,
                  updated_at: new Date().toISOString(),
                }
              : booking
          )
        )

        toast({
          title: 'Success',
          description: data.message || 'Refund processed successfully',
        })

        console.log('[Hook] Refund processed successfully')
        return data.data
      } catch (error) {
        console.error('[Hook] Refund processing failed:', error)

        const message =
          error instanceof Error ? error.message : 'Failed to process refund'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  return {
    bookings,
    pagination,
    isLoading,
    error,
    fetchBookings,
    fetchBookingDetails,
    updateBookingStatus,
    processRefund,
  }
}
