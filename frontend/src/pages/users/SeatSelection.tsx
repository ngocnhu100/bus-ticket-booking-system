import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { SeatMap } from '@/components/users/SeatMap'
import GuestCheckout from '@/components/booking/GuestCheckout'
import { ChevronLeft, ArrowRight, Lock, Clock, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useSeatLocks } from '@/hooks/useSeatLocks'
import { useAuth } from '@/context/AuthContext'
import { useBookingStore } from '@/store/bookingStore'
import type { Seat, SeatMapData, Trip } from '@/types/trip.types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const MAX_SELECTABLE_SEATS = import.meta.env.VITE_MAX_SELECTABLE_SEATS
  ? parseInt(import.meta.env.VITE_MAX_SELECTABLE_SEATS)
  : 5

/**
 * Format time from a date string
 */
function formatTime(dateString: string | undefined): string {
  if (!dateString) return 'Unknown'
  try {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return 'Unknown'
  }
}

/**
 * Format price in VND
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price)
}

/**
 * SeatSelection Page
 * Allows users to select seats for their chosen trip
 */
export function SeatSelection() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { setSelectedTrip, setSelectedSeats: setBookingSeats } =
    useBookingStore()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [seatMapData, setSeatMapData] = useState<SeatMapData | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [serviceFee, setServiceFee] = useState(0)
  const [totalWithFee, setTotalWithFee] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [operationInProgress, setOperationInProgress] = useState(false)
  const [showGuestCheckout, setShowGuestCheckout] = useState(false)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const transferInProgressRef = useRef(false)
  const [seatMapLoading, setSeatMapLoading] = useState(false)
  const seatMapDataRef = useRef<SeatMapData | null>(null)
  const hasCompletedTransferRef = useRef(false)
  const isUserActionRef = useRef(false) // Track if user just made a selection/deselection
  const lockExpirationInProgressRef = useRef(false) // Track if lock expiration is being handled

  // Generate or load session ID for guest users
  const [guestSessionId] = useState<string | null>(() => {
    if (!user) {
      // Try to load existing session ID from sessionStorage
      const stored = sessionStorage.getItem('guestSessionId')
      if (stored) {
        return stored
      }
      // Generate new session ID and store it
      const newSessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('guestSessionId', newSessionId)
      return newSessionId
    }
    return null
  })

  const isGuest = !user

  // Separate function to fetch seat map
  const fetchSeatMap = useCallback(async () => {
    if (!tripId) return

    try {
      const seatsResponse = await fetch(`${API_BASE_URL}/trips/${tripId}/seats`)
      if (!seatsResponse.ok) {
        throw new Error('Failed to fetch seat map')
      }
      const seatsResult = await seatsResponse.json()
      const seatsData = seatsResult.data.seat_map || seatsResult
      setSeatMapData(seatsData)
      seatMapDataRef.current = seatsData
    } catch (err) {
      console.error('Error fetching seat map:', err)
      setError(err instanceof Error ? err.message : 'Failed to load seat map')
    }
  }, [tripId])

  // Function to fetch trip details and seat map
  const fetchTripAndSeats = useCallback(async () => {
    if (!tripId) {
      setError('Trip ID is missing')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch trip details
      const tripResponse = await fetch(`${API_BASE_URL}/trips/${tripId}`)
      if (!tripResponse.ok) {
        throw new Error('Failed to fetch trip details')
      }
      const tripResult = await tripResponse.json()
      const tripData = tripResult.data || tripResult
      setTrip(tripData)

      // Fetch seat map
      await fetchSeatMap()
    } catch (err) {
      console.error('Error fetching trip/seats:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to load trip details'
      )
    } finally {
      setLoading(false)
    }
  }, [tripId, fetchSeatMap])

  // Seat locking functionality
  const {
    locks: userLocks,
    lockSeats: lockSeatsApi,
    releaseLocks: releaseLocksApi,
    releaseAllLocks: releaseAllLocksApi,
    transferGuestLocks: transferGuestLocksApi,
    refreshLocks,
  } = useSeatLocks({
    autoRefreshInterval: 30, // Refresh every 30 seconds
    onLocksExpire: (expiredLocks) => {
      // Remove expired seats from selectedSeats
      if (expiredLocks.length > 0 && seatMapDataRef.current) {
        const expiredSeatIds = expiredLocks
          .map((lock) => {
            const seat = seatMapDataRef.current!.seats.find(
              (s: Seat) => s.seat_code === lock.seat_code
            )
            return seat?.seat_id
          })
          .filter(Boolean) as string[]

        setSelectedSeats((prev) =>
          prev.filter((id) => !expiredSeatIds.includes(id))
        )
      }
      // Refresh seat map when locks expire
      if (tripId) {
        fetchSeatMap()
      }
    },
    onError: (error) => {
      console.error('Seat lock error:', error)
      setError(`Lock operation failed: ${error.message}`)
    },
    userId: user?.userId.toString(),
    tripId,
    isGuest,
    sessionId: user ? user.userId.toString() : guestSessionId || undefined,
    maxSeats: MAX_SELECTABLE_SEATS,
  })

  // Debounced refresh function to prevent multiple concurrent refreshes
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    refreshTimeoutRef.current = setTimeout(async () => {
      // Skip if lock expiration is in progress
      if (lockExpirationInProgressRef.current) {
        return
      }

      try {
        await refreshLocks(tripId!)
      } catch (err) {
        console.error('Error refreshing locks:', err)
      } finally {
        // Ensure operationInProgress is set to false only after refresh completes
        setOperationInProgress(false)
      }
    }, 300) // Wait 300ms after last operation
  }, [tripId, refreshLocks])

  // Memoized callback for when a lock expires
  const handleLockExpire = useCallback(
    async (seatCode: string) => {
      console.log(
        'LockExpire: Starting expiration handling for seat:',
        seatCode
      )

      // Mark that lock expiration is in progress
      lockExpirationInProgressRef.current = true

      // Immediately remove the expired seat from selectedSeats
      if (seatMapDataRef.current) {
        const expiredSeat = seatMapDataRef.current.seats.find(
          (s: Seat) => s.seat_code === seatCode
        )
        console.log('LockExpire: Found expired seat object:', expiredSeat)
        if (expiredSeat?.seat_id) {
          console.log(
            'LockExpire: Removing seat_id from selectedSeats:',
            expiredSeat.seat_id
          )
          setSelectedSeats((prev) =>
            prev.filter((id) => id !== expiredSeat.seat_id)
          )
        }
      }

      // Add a small delay to ensure lock expiration is processed on backend
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Refresh both seat map and user locks when a lock expires
      console.log('LockExpire: Refreshing seat map and user locks')
      await Promise.all([fetchSeatMap(), refreshLocks(tripId!)])

      // Add another small delay and refresh again to ensure UI is fully updated
      //await new Promise((resolve) => setTimeout(resolve, 200))
      //await fetchSeatMap()

      // Clear the lock expiration flag
      lockExpirationInProgressRef.current = false
      console.log(
        'LockExpire: Completed expiration handling for seat:',
        seatCode
      )
    },
    [fetchSeatMap, refreshLocks, tripId]
  )

  // Fetch trip details and seat map
  useEffect(() => {
    fetchTripAndSeats()
  }, [fetchTripAndSeats])

  // Cleanup locks and timeouts when component unmounts
  useEffect(() => {
    const currentTimeout = refreshTimeoutRef.current
    return () => {
      // Clear any pending refresh timeout
      if (currentTimeout) {
        clearTimeout(currentTimeout)
      }
      // Release all locks when leaving the page
      if (user && selectedSeats.length > 0 && tripId) {
        releaseAllLocksApi(tripId).catch((err: Error) => {
          console.error('Error releasing locks on unmount:', err)
        })
      }
      // Clear guest session ID when user logs in
      if (user && guestSessionId) {
        sessionStorage.removeItem('guestSessionId')
      }
    }
  }, [user, selectedSeats.length, tripId, releaseAllLocksApi, guestSessionId])

  // Transfer guest locks when user logs in
  useEffect(() => {
    const transferGuestLocksOnLogin = async () => {
      // Prevent multiple concurrent transfers
      if (transferInProgressRef.current) return
      if (!user || !tripId || !guestSessionId) return

      transferInProgressRef.current = true
      setOperationInProgress(true) // Prevent useEffect from interfering
      setSeatMapLoading(true)
      try {
        const result = await transferGuestLocksApi(
          tripId,
          guestSessionId,
          MAX_SELECTABLE_SEATS
        )

        // Add delay to ensure backend processes transfer before refreshing locks
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Check if any seats were rejected due to limit (use snake_case from backend)
        const rejectedSeats = result.data?.rejected_seats || []
        const transferredSeats = result.data?.transferred_seats || []

        // Show error if seats were rejected
        if (rejectedSeats.length > 0) {
          setError(
            `${rejectedSeats.length} seat(s) could not be transferred because you already had the maximum number of seats locked. Only ${transferredSeats.length} seat(s) were transferred.`
          )
        }

        // Show success message if seats were transferred
        // if (transferredSeats.length > 0 && rejectedSeats.length === 0) {
        // }

        // Then refresh seat map to show updated lock ownership
        if (tripId) {
          const seatsResponse = await fetch(
            `${API_BASE_URL}/trips/${tripId}/seats`
          )
          if (seatsResponse.ok) {
            const seatsResult = await seatsResponse.json()
            const seatsData = seatsResult.data.seat_map || seatsResult

            // Update seat map first
            setSeatMapData(seatsData)

            // Update selectedSeats with transferred seats using the fresh seat map
            if (transferredSeats.length > 0) {
              const transferredSeatIds = transferredSeats
                .map((seatCode: string) => {
                  const seat = seatsData.seats.find(
                    (s: Seat) => s.seat_code === seatCode
                  )
                  console.log(
                    'Transfer: seatCode',
                    seatCode,
                    'found seat',
                    seat
                  )
                  return seat?.seat_id
                })
                .filter(Boolean) as string[]

              console.log(
                'Transfer: transferredSeats (codes)',
                transferredSeats
              )
              console.log('Transfer: transferredSeatIds', transferredSeatIds)

              // Fetch current user locks from the API to ensure we have all locks
              try {
                // Use refreshLocks instead of direct fetch to include proper authentication
                await refreshLocks(tripId)
                const allUserLocks = userLocks

                const existingUserLockIds = allUserLocks
                  .filter((lock) => new Date(lock.expires_at) > new Date()) // Only include non-expired locks
                  .map(
                    (lock: {
                      seat_code: string
                      locked_at: string
                      expires_at: string
                    }) => {
                      const seat = seatsData.seats.find(
                        (s: Seat) => s.seat_code === lock.seat_code
                      )
                      return seat?.seat_id
                    }
                  )
                  .filter(Boolean) as string[]

                // Only include successfully transferred seats + existing user locks (not rejected ones)
                const allLockedSeatIds = [
                  ...new Set([...transferredSeatIds, ...existingUserLockIds]),
                ]
                setSelectedSeats(allLockedSeatIds)
              } catch (error) {
                console.error('Error fetching user locks:', error)
                // Fallback if fetch fails: only use transferred seats
                setSelectedSeats(transferredSeatIds)
              }
              seatMapDataRef.current = seatsData
              hasCompletedTransferRef.current = true
            } else {
              // No seats were transferred - keep selectedSeats empty
              setSelectedSeats([])
            }
          }
        }

        // Transfer complete, allow normal operations
        setOperationInProgress(false)

        // Clear the guest session ID after successful transfer
        sessionStorage.removeItem('guestSessionId')
      } catch (error) {
        console.error('Failed to transfer guest locks:', error)
        setOperationInProgress(false)
        setError(
          error instanceof Error
            ? `Failed to transfer locks: ${error.message}`
            : 'Failed to transfer guest locks'
        )
        // Don't clear session ID on failure, user can try again
      } finally {
        setSeatMapLoading(false)
        transferInProgressRef.current = false
      }
    }

    transferGuestLocksOnLogin()
  }, [user, tripId, guestSessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate total price based on selected seats (excluding booking-locked and occupied seats)
  useEffect(() => {
    const filteredSeats =
      seatMapData?.seats?.filter(
        (seat) =>
          seat.seat_id &&
          selectedSeats.includes(seat.seat_id) &&
          seat.locked_by !== 'booking' &&
          seat.status !== 'occupied'
      ) || []
    if (seatMapData && filteredSeats.length > 0) {
      const subtotal = filteredSeats.reduce((sum, seat) => {
        return sum + (seat?.price || 0)
      }, 0)
      setTotalPrice(subtotal)
      // Service fee: 3% + 10,000 VND fixed fee (matches backend calculation)
      const percentageFee = subtotal * 0.03
      const fixedFee = 10000
      const fee = Math.round(percentageFee + fixedFee)
      setServiceFee(fee)
      setTotalWithFee(subtotal + fee)
    } else {
      setTotalPrice(0)
      setServiceFee(0)
      setTotalWithFee(0)
    }
  }, [selectedSeats, seatMapData])

  // Restore selectedSeats from userLocks on mount/refresh (but not after user deselection or lock expiration)
  useEffect(() => {
    // Skip restoration if lock expiration is in progress
    // This check must come FIRST before any other checks to ensure lock expiration is handled completely
    if (lockExpirationInProgressRef.current) {
      return
    }

    // Skip restoration if user just made an action and deselected everything
    // (but only after confirming lock expiration is not in progress)
    if (isUserActionRef.current && selectedSeats.length === 0) {
      isUserActionRef.current = false
      return
    }

    // Skip if operation is in progress to avoid interfering with optimistic updates
    if (operationInProgress) {
      return
    }

    if (userLocks.length > 0 && seatMapData) {
      const lockedSeatIds = userLocks
        .filter((lock) => new Date(lock.expires_at) > new Date()) // Only include non-expired locks
        .map(
          (lock) =>
            seatMapData.seats.find((seat) => seat.seat_code === lock.seat_code)
              ?.seat_id
        )
        .filter(Boolean) as string[]

      // Only update if the locked seats don't match selectedSeats
      const sortedLocked = lockedSeatIds.sort()
      const sortedSelected = selectedSeats.sort()
      if (JSON.stringify(sortedLocked) !== JSON.stringify(sortedSelected)) {
        setSelectedSeats(lockedSeatIds)
      }
    }
    // Never auto-clear selectedSeats when locks are empty
    // Locks may be empty during initial load or transient states
    // User selections should only be cleared by explicit user deselection or lock expiration
  }, [userLocks, seatMapData, operationInProgress]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSeatSelect = async (seat: Seat, isSelected: boolean) => {
    if (!seat.seat_id || !tripId) return

    // Check if this seat is already being processed
    const isAlreadySelected = selectedSeats.includes(seat.seat_id)
    if (isSelected && isAlreadySelected) return // Already selected
    if (!isSelected && !isAlreadySelected) return // Already deselected

    // Enforce seat limit when selecting new seats
    if (isSelected && selectedSeats.length >= MAX_SELECTABLE_SEATS) {
      setError(`Maximum ${MAX_SELECTABLE_SEATS} seats can be selected`)
      return
    }

    // Only prevent concurrent SELECTION operations, allow deselection anytime
    if (operationInProgress && isSelected) return

    // Mark that user is making an action
    isUserActionRef.current = true

    setOperationInProgress(true)

    // Optimistic update: immediately update selectedSeats
    const newSelectedSeats = isSelected
      ? [...selectedSeats, seat.seat_id]
      : selectedSeats.filter((id) => id !== seat.seat_id)
    setSelectedSeats(newSelectedSeats)

    try {
      if (isSelected) {
        // Lock the seat when selecting
        await lockSeatsApi({
          tripId,
          seatCodes: [seat.seat_code],
          userId: user?.userId.toString() || guestSessionId!,
          sessionId: user
            ? user.userId.toString()
            : guestSessionId || undefined,
        })
        // Refresh seat map first to show updated lock status
        await fetchSeatMap()
        // Debounced refresh of locks
        debouncedRefresh()
      } else {
        // Release the lock when deselecting
        await releaseLocksApi({
          tripId,
          seatCodes: [seat.seat_code],
          userId: user?.userId.toString() || guestSessionId!,
          sessionId: user
            ? user.userId.toString()
            : guestSessionId || undefined,
        })
        // Refresh seat map first to show updated lock status
        await fetchSeatMap()
        // Immediately refresh locks without debounce for deselection
        await refreshLocks(tripId)
        setOperationInProgress(false)
        // Clear user action flag after deselection
        isUserActionRef.current = false
      }
    } catch (err) {
      console.error('Error managing seat lock:', err)
      // Revert optimistic update on error
      setSelectedSeats(selectedSeats)
      setError(
        err instanceof Error
          ? `Failed to ${isSelected ? 'lock' : 'release'} seat: ${err.message}`
          : 'Failed to update seat selection'
      )
      setOperationInProgress(false)
    }
  }

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat')
      return
    }

    // Save trip and seats to booking store before checkout
    if (trip) {
      // Convert Trip type to match booking store's expected format
      const tripForStore = {
        ...trip,
        route: {
          ...trip.route,
          distance: trip.route.distance_km,
          estimated_duration: trip.route.estimated_minutes,
        },
      }
      setSelectedTrip(
        tripForStore as unknown as Parameters<typeof setSelectedTrip>[0]
      )
    }
    const selectedSeatObjects = getFilteredSelectedSeats()
    setBookingSeats(selectedSeatObjects.map((s) => s.seat_code))

    // Show checkout for all users (guests and authenticated)
    setShowGuestCheckout(true)
  }

  const getSelectedSeatCodes = () => {
    if (!seatMapData?.seats) return '-'
    // Filter out seats locked by "booking" and occupied seats
    const selectedSeatObjects = seatMapData.seats.filter(
      (seat) =>
        seat.seat_id &&
        selectedSeats.includes(seat.seat_id) &&
        seat.locked_by !== 'booking' &&
        seat.status !== 'occupied'
    )
    return selectedSeatObjects.length > 0
      ? selectedSeatObjects.map((seat) => seat.seat_code).join(', ')
      : '-'
  }

  // Helper to get filtered selected seats (excluding booking-locked and occupied seats)
  const getFilteredSelectedSeats = () => {
    if (!seatMapData?.seats) return []
    return seatMapData.seats.filter(
      (seat) =>
        seat.seat_id &&
        selectedSeats.includes(seat.seat_id) &&
        seat.locked_by !== 'booking' &&
        seat.status !== 'occupied'
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading trip details...</p>
        </div>
      </div>
    )
  }

  if (!seatMapData || !trip) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Error Loading Trip
            </h2>
            <p className="text-muted-foreground mb-4">
              Failed to load trip details. Please try again.
            </p>
            <Button onClick={() => fetchTripAndSeats()}>Refresh</Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Custom Header for Seat Selection */}
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Back Button and Logo */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🚌</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">
                BusGo
              </span>
            </div>
          </div>

          {/* Dashboard Button and Theme Toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isGuest ? (
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <span className="hidden sm:inline">Login</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
                <Button
                  onClick={logout}
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <div className="bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              Select Your Seats
            </h1>
          </div>

          {/* Trip Details Header */}
          {trip && (
            <Card className="p-4 bg-card border border-border/50 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    Trip Details:
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {trip.route?.origin || 'Unknown'}
                  </span>
                  <ArrowRight className="w-4 h-4 inline mx-1" />
                  <span className="text-sm font-semibold text-foreground">
                    {trip.route?.destination || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{trip.operator?.name || 'Unknown'}</span>
                  <span>
                    {formatTime(trip.schedule?.departure_time)}
                    {' - '}
                    {formatTime(trip.schedule?.arrival_time)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Main Content Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Seat Map */}
            <div className="flex-1 space-y-4">
              {/* Seat Map Component */}
              {seatMapData && (
                <div className="relative">
                  {seatMapLoading && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-50">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-white text-sm font-medium">
                          Updating seats...
                        </p>
                      </div>
                    </div>
                  )}
                  <SeatMap
                    seatMapData={seatMapData}
                    selectedSeats={selectedSeats}
                    onSeatSelect={handleSeatSelect}
                    maxSelectable={MAX_SELECTABLE_SEATS}
                    operationInProgress={operationInProgress}
                    userLocks={userLocks}
                    onLockExpire={handleLockExpire}
                    currentUserId={
                      user?.userId.toString() || guestSessionId || undefined
                    }
                  />
                </div>
              )}
            </div>

            {/* Right Column - Booking Summary */}
            <div className="lg:w-80 xl:w-96 shrink-0">
              <Card className="p-4 bg-card border border-border/50">
                <h3 className="text-base font-semibold text-foreground mb-3">
                  BOOKING SUMMARY
                </h3>

                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Selected Seats:</p>
                    <p className="font-semibold text-foreground">
                      {getSelectedSeatCodes()}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Passengers:</p>
                    <p className="font-semibold text-foreground">
                      {getFilteredSelectedSeats().length}
                    </p>
                  </div>

                  {/* Lock Status Information */}
                  {getFilteredSelectedSeats().length > 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Seats Locked
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Your selected seats are temporarily reserved for 10
                        minutes. Complete your booking before the time expires.
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-600">
                          Auto-release in 10 minutes
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/50">
                    <p className="text-muted-foreground">
                      Base fare (per seat):
                    </p>
                    <p className="font-semibold text-foreground">
                      {formatPrice(trip?.pricing?.base_price || 0)}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Subtotal:</p>
                    <p className="font-semibold text-foreground">
                      {formatPrice(totalPrice)}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Service fee:</p>
                    <p className="font-semibold text-foreground">
                      {formatPrice(serviceFee)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/50 border-b">
                    <p className="text-muted-foreground">Total:</p>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(totalWithFee)}
                    </p>
                  </div>

                  <Button
                    onClick={handleContinue}
                    disabled={getFilteredSelectedSeats().length === 0}
                    className="w-full mt-3"
                    size="sm"
                  >
                    Continue to Checkout
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {error && (
        <Dialog open={true} onOpenChange={() => setError(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Error</DialogTitle>
              <DialogDescription>{error}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => {
                  setError(null)
                  fetchSeatMap()
                  refreshLocks(tripId!)
                }}
              >
                Refresh
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Guest Checkout - Conditionally render instead of dialog */}
      {showGuestCheckout && (
        <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
          <GuestCheckout
            selectedSeats={getFilteredSelectedSeats()
              .filter((seat) => seat.seat_id !== undefined)
              .map((seat) => ({
                seat_id: seat.seat_id!,
                seat_code: seat.seat_code,
              }))}
            onBack={() => setShowGuestCheckout(false)}
          />
        </div>
      )}
    </div>
  )
}
export default SeatSelection
