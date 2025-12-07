import { useState, useCallback, useEffect, useRef } from 'react'
import {
  lockSeats,
  extendSeatLocks,
  releaseSeatLocks,
  releaseAllSeatLocks,
  getUserLocks,
} from '@/api/trips'
import type {
  SeatLockRequest,
  SeatLockResponse,
  SeatLockExtendResponse,
  SeatLockReleaseResponse,
  UserLocksResponse,
} from '@/api/trips'

export interface SeatLock {
  trip_id: string
  seat_code: string
  locked_at: string
  expires_at: string
}

export interface UseSeatLocksOptions {
  /** Auto-refresh locks every N seconds */
  autoRefreshInterval?: number
  /** Callback when locks expire */
  onLocksExpire?: (expiredLocks: SeatLock[]) => void
  /** Callback when lock operation fails */
  onError?: (error: Error) => void
  /** User ID to load locks on mount */
  userId?: string
  /** Trip ID to load locks for */
  tripId?: string
  /** Callback when locks are loaded */
  onLocksLoaded?: (locks: SeatLock[]) => void
}

export interface UseSeatLocksReturn {
  /** Current user's active locks */
  locks: SeatLock[]
  /** Loading state for operations */
  isLoading: boolean
  /** Error state */
  error: string | null
  /** Lock seats for checkout */
  lockSeats: (request: SeatLockRequest) => Promise<SeatLockResponse>
  /** Extend existing locks */
  extendLocks: (request: SeatLockRequest) => Promise<SeatLockExtendResponse>
  /** Release specific locks */
  releaseLocks: (request: SeatLockRequest) => Promise<SeatLockReleaseResponse>
  /** Release all user's locks */
  releaseAllLocks: (
    tripId: string,
    userId: string
  ) => Promise<SeatLockReleaseResponse>
  /** Refresh locks from server */
  refreshLocks: (tripId: string) => Promise<void>
  /** Clear error state */
  clearError: () => void
}

/**
 * useSeatLocks Hook
 *
 * Manages seat locking operations for preventing double bookings during checkout.
 * Provides functions to lock, extend, and release seat locks with automatic refresh.
 */
export function useSeatLocks(
  options: UseSeatLocksOptions = {}
): UseSeatLocksReturn {
  const {
    autoRefreshInterval = 30, // 30 seconds
    onLocksExpire,
    onError,
    userId,
    tripId,
    onLocksLoaded,
  } = options

  const [locks, setLocks] = useState<SeatLock[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use ref to store callback to avoid dependency issues
  const onLocksExpireRef = useRef(onLocksExpire)
  const onErrorRef = useRef(onError)

  // Update refs when callbacks change
  useEffect(() => {
    onLocksExpireRef.current = onLocksExpire
  }, [onLocksExpire])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  // Clear error state
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Handle errors
  const handleError = useCallback((error: Error) => {
    setError(error.message)
    onErrorRef.current?.(error)
  }, [])

  // Check for expired locks
  const checkExpiredLocks = useCallback(() => {
    const now = new Date()
    const expiredLocks = locks.filter(
      (lock) => new Date(lock.expires_at) <= now
    )

    if (expiredLocks.length > 0) {
      setLocks((prev) => prev.filter((lock) => !expiredLocks.includes(lock)))
      onLocksExpireRef.current?.(expiredLocks)
    }
  }, [locks])

  // Refresh locks from server
  const refreshLocks = useCallback(
    async (tripId: string) => {
      try {
        setIsLoading(true)
        const response: UserLocksResponse = await getUserLocks(tripId)
        const loadedLocks = response.data.locked_seats.map((seat) => ({
          trip_id: response.data.trip_id,
          seat_code: seat.seat_code,
          locked_at: seat.locked_at,
          expires_at: seat.expires_at,
        }))
        setLocks(loadedLocks)
        setError(null)
        onLocksLoaded?.(loadedLocks)
      } catch (err) {
        handleError(err as Error)
      } finally {
        setIsLoading(false)
      }
    },
    [handleError, onLocksLoaded]
  )

  // Load locks on mount if userId and tripId provided
  useEffect(() => {
    if (userId && tripId) {
      refreshLocks(tripId)
    }
  }, [userId, tripId, refreshLocks])

  // Lock seats
  const handleLockSeats = useCallback(
    async (request: SeatLockRequest): Promise<SeatLockResponse> => {
      try {
        setIsLoading(true)

        // 1. Send the request to the backend
        const response = await lockSeats(request)

        // 2. Refresh state
        await refreshLocks(request.tripId)

        setError(null)
        return response
      } catch (err) {
        handleError(err as Error)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [refreshLocks, handleError]
  )

  // Extend locks
  const handleExtendLocks = useCallback(
    async (request: SeatLockRequest): Promise<SeatLockExtendResponse> => {
      try {
        setIsLoading(true)
        // Separate userId
        const { userId, ...apiPayload } = request

        // Send cleaned payload
        const response = await extendSeatLocks(apiPayload)

        // Use userId locally
        await refreshLocks(userId)
        setError(null)
        return response
      } catch (err) {
        handleError(err as Error)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [refreshLocks, handleError]
  )

  // Release locks
  const handleReleaseLocks = useCallback(
    async (request: SeatLockRequest): Promise<SeatLockReleaseResponse> => {
      try {
        setIsLoading(true)
        // Separate userId
        const { userId, ...apiPayload } = request

        // Send cleaned payload
        const response = await releaseSeatLocks(apiPayload)

        // Use userId locally
        await refreshLocks(userId)
        setError(null)
        return response
      } catch (err) {
        handleError(err as Error)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [refreshLocks, handleError]
  )

  // Release all locks
  const handleReleaseAllLocks = useCallback(
    async (
      tripId: string,
      userId: string
    ): Promise<SeatLockReleaseResponse> => {
      try {
        setIsLoading(true)
        const response = await releaseAllSeatLocks(tripId, userId)
        // Clear all locks after successful release
        setLocks([])
        setError(null)
        return response
      } catch (err) {
        handleError(err as Error)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [handleError]
  )

  // Auto-refresh locks
  useEffect(() => {
    if (autoRefreshInterval <= 0) return

    const interval = setInterval(() => {
      checkExpiredLocks()
    }, autoRefreshInterval * 1000)

    return () => clearInterval(interval)
  }, [autoRefreshInterval, checkExpiredLocks])

  return {
    locks,
    isLoading,
    error,
    lockSeats: handleLockSeats,
    extendLocks: handleExtendLocks,
    releaseLocks: handleReleaseLocks,
    releaseAllLocks: handleReleaseAllLocks,
    refreshLocks,
    clearError,
  }
}
