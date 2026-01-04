import { useCallback } from 'react'
import { saveSeatSelection, getSeatSelection } from '@/api/seats'
import { request } from '@/api/auth'

/**
 * Hook for managing session caching
 * Handles saving and restoring booking data from Redis
 */
export const useSessionCaching = () => {
  // Get or create a persistent session ID
  const getSessionId = useCallback((): string => {
    let sessionId = localStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('sessionId', sessionId)
      console.log('🆕 Created new session ID:', sessionId)
    }
    return sessionId
  }, [])

  // Save seat selection
  const cacheSeatSelection = useCallback(
    async (
      tripId: string,
      selectedSeats: string[],
      silent = false
    ): Promise<boolean> => {
      if (!tripId || selectedSeats.length === 0) return false

      const sessionId = getSessionId()
      const result = await saveSeatSelection(sessionId, tripId, selectedSeats)

      if (result.success) {
        if (!silent) {
          console.log('✅ Seat selection cached to Redis')
        }
        return true
      } else {
        console.warn('⚠️ Failed to cache seats:', result.error?.message)
        return false
      }
    },
    [getSessionId]
  )

  // Get cached seat selection
  const getCachedSeatSelection = useCallback(
    async (
      tripId?: string
    ): Promise<{ tripId: string; selectedSeats: string[] } | null> => {
      const sessionId = getSessionId()
      const result = await getSeatSelection(sessionId)

      if (result.success && result.data?.selectedSeats) {
        if (tripId && result.data.tripId !== tripId) {
          console.warn('ℹ️ Cached seats are for different trip. Trip changed?')
          return null
        }
        console.log('🔄 Restored seats from cache:', result.data.selectedSeats)
        return result.data as { tripId: string; selectedSeats: string[] }
      }

      return null
    },
    [getSessionId]
  )

  // Save booking draft
  const cacheBookingDraft = useCallback(
    async (
      bookingData: {
        tripId: string
        seats: string[]
        passengers: Array<{
          fullName: string
          phone?: string
          documentId?: string
          seatCode: string
        }>
        contactEmail: string
        contactPhone: string
      },
      silent = false
    ): Promise<boolean> => {
      const sessionId = getSessionId()
      try {
        const response = await request('/bookings/draft', {
          method: 'POST',
          body: {
            sessionId,
            ...bookingData,
          },
        })

        if (!response.success) {
          throw new Error(
            response.error?.message || 'Failed to cache booking draft'
          )
        }

        if (!silent) {
          console.log('✅ Booking draft cached to Redis')
        }
        return true
      } catch (error) {
        console.warn('⚠️ Failed to cache booking draft:', error)
        return false
      }
    },
    [getSessionId]
  )

  // Get cached booking draft
  const getCachedBookingDraft = useCallback(async (): Promise<{
    tripId: string
    seats: string[]
    passengers: Array<{
      fullName: string
      phone?: string
      documentId?: string
      seatCode: string
    }>
    contactEmail: string
    contactPhone: string
  } | null> => {
    const sessionId = getSessionId()
    try {
      const result = await request(`/bookings/draft/${sessionId}`, {
        method: 'GET',
      })

      if (result.success && result.data) {
        console.log('🔄 Restored booking draft from cache')
        return result.data
      }

      return null
    } catch (error) {
      console.warn('⚠️ Failed to retrieve booking draft:', error)
      return null
    }
  }, [getSessionId])

  // Save pending payment
  const cachePendingPayment = useCallback(
    async (
      bookingId: string,
      paymentData: {
        paymentUrl?: string
        qrCode?: string
        provider?: string
        clientSecret?: string
      }
    ): Promise<boolean> => {
      if (!bookingId || !paymentData) return false

      const sessionId = getSessionId()
      try {
        const response = await request('/bookings/pending-payment', {
          method: 'POST',
          body: JSON.stringify({
            sessionId,
            bookingId,
            paymentData,
          }),
        })

        if (response.success) {
          console.log('✅ Pending payment cached to Redis')
          return true
        } else {
          console.warn(
            '⚠️ Failed to cache pending payment:',
            response.error?.message
          )
          return false
        }
      } catch (error) {
        console.warn('⚠️ Failed to cache pending payment:', error)
        return false
      }
    },
    [getSessionId]
  )

  // Get pending payment
  const getCachedPendingPayment = useCallback(async (): Promise<{
    bookingId: string
    paymentUrl?: string
    qrCode?: string
    provider?: string
    clientSecret?: string
  } | null> => {
    const sessionId = getSessionId()
    try {
      const response = await request(`/bookings/pending-payment/${sessionId}`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        console.log('🔄 Restored pending payment from cache:', response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.warn('ℹ️ No pending payment in cache:', error)
      return null
    }
  }, [getSessionId])

  // Clear session cache
  const clearSessionCache = useCallback(async (): Promise<void> => {
    const sessionId = getSessionId()
    try {
      const response = await request(
        `/bookings/session/clear?sessionId=${sessionId}`,
        {
          method: 'DELETE',
        }
      )

      if (response.success) {
        console.log('🗑️ Session cache cleared')
        localStorage.removeItem('sessionId')
      }
    } catch (error) {
      console.warn('⚠️ Failed to clear session:', error)
    }
  }, [getSessionId])

  return {
    getSessionId,
    cacheSeatSelection,
    getCachedSeatSelection,
    cacheBookingDraft,
    getCachedBookingDraft,
    cachePendingPayment,
    getCachedPendingPayment,
    clearSessionCache,
  }
}
