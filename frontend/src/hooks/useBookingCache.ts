import { useEffect, useState, useCallback } from 'react'
import { useSessionCaching } from './useSessionCaching'
import { useBookingStore } from '@/store/bookingStore'

/**
 * Booking draft type definition
 */
interface BookingDraftData {
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
  savedAt?: string
}

/**
 * Hook for managing booking state with Redis caching
 * Automatically saves and restores booking progress
 */
export const useBookingCache = () => {
  const {
    cacheSeatSelection,
    getCachedSeatSelection,
    cacheBookingDraft,
    getCachedBookingDraft,
    clearSessionCache,
  } = useSessionCaching()

  const { selectedTrip } = useBookingStore()

  const [cachedData, setCachedData] = useState<{
    seats?: string[]
    draft?: BookingDraftData
  }>({})

  const [isLoading, setIsLoading] = useState(false)

  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = async () => {
      setIsLoading(true)
      try {
        // Try to restore seats
        const cachedSeats = await getCachedSeatSelection(selectedTrip?.trip_id)
        if (cachedSeats) {
          setCachedData((prev) => ({
            ...prev,
            seats: cachedSeats.selectedSeats,
          }))
        }

        // Try to restore draft
        const cachedDraft = await getCachedBookingDraft()
        if (cachedDraft) {
          setCachedData((prev) => ({
            ...prev,
            draft: cachedDraft,
          }))
        }
      } catch (error) {
        console.error('Failed to load cached data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCachedData()
  }, [getCachedSeatSelection, getCachedBookingDraft, selectedTrip?.trip_id])

  // Save seats with debouncing
  const saveSeatsTocache = useCallback(
    async (seats: string[]) => {
      if (!selectedTrip?.trip_id) return false
      return await cacheSeatSelection(selectedTrip.trip_id, seats, true)
    },
    [selectedTrip?.trip_id, cacheSeatSelection]
  )

  // Save booking draft with debouncing
  const saveBookingDraftToCache = useCallback(
    async (bookingData: {
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
    }) => {
      return await cacheBookingDraft(bookingData, true)
    },
    [cacheBookingDraft]
  )

  // Clear on successful booking
  const onBookingSuccess = useCallback(async () => {
    await clearSessionCache()
    setCachedData({})
  }, [clearSessionCache])

  return {
    cachedData,
    isLoading,
    saveSeatsTocache,
    saveBookingDraftToCache,
    onBookingSuccess,
    clearSessionCache,
  }
}
