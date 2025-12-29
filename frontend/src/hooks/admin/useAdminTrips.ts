import { useState, useCallback } from 'react'
import { useToast } from '../use-toast'
import { request } from '../../api/auth'
import type { Trip } from '../../types/trip.types'
import type { TripCancelRequest } from '../../types/adminTripTypes'

interface TripFilters {
  status?: string
  route_id?: string
  bus_id?: string
  operator_id?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  departure_date_from?: string
  departure_date_to?: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  total_pages: number
}

export function useAdminTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
  })
  const { toast } = useToast()
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const fetchTrips = useCallback(
    async (
      page = 1,
      limit = 10,
      filters: TripFilters = {},
      dateFilter?: string
    ) => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('limit', limit.toString())

        // Add filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.append(key, value)
          }
        })

        // Add date filter if provided (for backward compatibility)
        if (dateFilter) {
          params.append('departure_date', dateFilter)
        }

        const response = await request(`/trips?${params}`, {
          method: 'GET',
        })

        setTrips(response.data.trips || [])
        setPagination({
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          total_pages: response.data.total_pages,
        })

        return response.data
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch trips'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  const createTrip = useCallback(
    async (tripData: Partial<Trip>) => {
      setIsLoading(true)
      try {
        await request('/trips', {
          method: 'POST',
          body: tripData,
        })

        toast({
          title: 'Success',
          description: 'Trip created successfully',
        })

        // Refresh trips list
        await fetchTrips()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create trip'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [fetchTrips, toast]
  )

  const updateTrip = useCallback(
    async (tripId: string, tripData: Partial<Trip>) => {
      setIsLoading(true)
      try {
        await request(`/trips/${tripId}`, {
          method: 'PUT',
          body: tripData,
        })

        toast({
          title: 'Success',
          description: 'Trip updated successfully',
        })

        // Refresh trips list
        await fetchTrips()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update trip'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [fetchTrips, toast]
  )

  const deleteTrip = useCallback(
    async (tripId: string) => {
      setIsLoading(true)
      try {
        await request(`/trips/${tripId}`, {
          method: 'DELETE',
        })

        toast({
          title: 'Success',
          description: 'Trip deleted successfully',
        })

        // Refresh trips list
        await fetchTrips()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete trip'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [fetchTrips, toast]
  )

  const cancelTrip = useCallback(
    async (tripId: string, cancelData: TripCancelRequest = {}) => {
      setIsLoading(true)
      try {
        await request(`/trips/${tripId}/cancel`, {
          method: 'POST',
          body: cancelData,
        })

        toast({
          title: 'Success',
          description: 'Trip cancelled successfully',
        })

        // Refresh trips list
        await fetchTrips()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to cancel trip'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [fetchTrips, toast]
  )

  const updateTripStatus = useCallback(
    async (tripId: string, statusData: { status: string }) => {
      setIsLoading(true)
      try {
        await request(`/trips/${tripId}/status`, {
          method: 'PATCH',
          body: statusData,
        })

        toast({
          title: 'Success',
          description: 'Trip status updated successfully',
        })

        // Refresh trips list
        await fetchTrips()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update trip status'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [fetchTrips, toast]
  )

  const markDeparted = useCallback(
    async (tripId: string) => {
      setIsLoading(true)
      try {
        await request(`/trips/${tripId}/mark-departed`, {
          method: 'POST',
        })

        toast({
          title: 'Success',
          description: 'Trip marked as departed successfully',
        })

        // Refresh trips list
        await fetchTrips()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to mark trip as departed'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [fetchTrips, toast]
  )

  const markArrived = useCallback(
    async (tripId: string) => {
      setIsLoading(true)
      try {
        await request(`/trips/${tripId}/mark-arrived`, {
          method: 'POST',
        })

        toast({
          title: 'Success',
          description: 'Trip marked as arrived successfully',
        })

        // Refresh trips list
        await fetchTrips()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to mark trip as arrived'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [fetchTrips, toast]
  )

  const refundBooking = useCallback(
    async (bookingId: string, reason?: string) => {
      setIsLoading(true)
      try {
        const response = await request(`/bookings/admin/${bookingId}/refund`, {
          method: 'POST',
          body: JSON.stringify({
            reason: reason || 'Automatic refund from admin',
          }),
        })

        toast({
          title: 'Success',
          description: 'Refund processed successfully',
        })

        return response.data
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to process refund'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  return {
    trips,
    isLoading,
    error,
    pagination,
    fetchTrips,
    createTrip,
    updateTrip,
    deleteTrip,
    cancelTrip,
    updateTripStatus,
    markDeparted,
    markArrived,
    refundBooking,
    clearError,
  }
}
