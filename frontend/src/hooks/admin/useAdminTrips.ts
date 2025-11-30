import { useState, useCallback } from 'react'
import { useToast } from '../use-toast'
import type { TripFormData } from '../../types/trip.types'

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// Transform API response to match TripFormData interface
// API returns { schedule: { departureTime, arrivalTime } }
// We flatten it to top-level departureTime and arrivalTime
function transformTripResponse(apiTrip: Record<string, unknown>): TripFormData {
  return {
    tripId: apiTrip.tripId as string | undefined,
    routeId: apiTrip.routeId as string,
    busId: apiTrip.busId as string,
    departureTime:
      ((apiTrip.schedule as Record<string, unknown>)
        ?.departureTime as string) || (apiTrip.departureTime as string),
    arrivalTime:
      ((apiTrip.schedule as Record<string, unknown>)?.arrivalTime as string) ||
      (apiTrip.arrivalTime as string),
    basePrice: apiTrip.basePrice as number,
    status: apiTrip.status as 'active' | 'inactive',
    isRecurring: (apiTrip.isRecurring as boolean) || false,
    recurrencePattern:
      (apiTrip.recurrencePattern as 'daily' | 'weekly' | 'monthly') ||
      undefined,
    createdAt: apiTrip.createdAt as string | undefined,
  }
}

export function useAdminTrips() {
  const [trips, setTrips] = useState<TripFormData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchTrips = useCallback(
    async (page = 1, limit = 20, filters?: Record<string, string>) => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('limit', limit.toString())

        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value)
          })
        }

        const response = await fetch(`${API_BASE_URL}/admin/trips?${params}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch trips')
        }

        const data: PaginatedResponse<Record<string, unknown>> =
          await response.json()
        const transformedTrips = data.data.map(transformTripResponse)
        setTrips(transformedTrips)
        return data.pagination
      } catch {
        const message = 'Failed to fetch trips'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  const createTrip = useCallback(
    async (tripData: Omit<TripFormData, 'tripId' | 'createdAt'>) => {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/admin/trips`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify(tripData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.message || 'Failed to create trip')
        }

        await response.json()

        toast({
          title: 'Success',
          description: 'Trip created successfully',
        })

        await fetchTrips()
      } catch {
        const message = 'Failed to create trip'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
      } finally {
        setIsLoading(false)
      }
    },
    [fetchTrips, toast]
  )

  const updateTrip = useCallback(
    async (
      tripId: string,
      tripData: Omit<TripFormData, 'tripId' | 'createdAt'>
    ) => {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/admin/trips/${tripId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify(tripData),
        })

        if (!response.ok) {
          throw new Error('Failed to update trip')
        }

        toast({
          title: 'Success',
          description: 'Trip updated successfully',
        })

        await fetchTrips()
      } catch {
        const message = 'Failed to update trip'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
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
        const response = await fetch(`${API_BASE_URL}/admin/trips/${tripId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to delete trip')
        }

        toast({
          title: 'Success',
          description: 'Trip deleted successfully',
        })

        await fetchTrips()
      } catch {
        const message = 'Failed to delete trip'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
      } finally {
        setIsLoading(false)
      }
    },
    [fetchTrips, toast]
  )

  const checkConflicts = useCallback(
    async (routeId: string, departureTime: string, arrivalTime: string) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/trips/conflicts?routeId=${routeId}&departureTime=${departureTime}&arrivalTime=${arrivalTime}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to check conflicts')
        }

        const data = await response.json()
        return data.data.conflicts || []
      } catch {
        console.error('Failed to check conflicts')
        return []
      }
    },
    []
  )

  return {
    trips,
    isLoading,
    error,
    fetchTrips,
    createTrip,
    updateTrip,
    deleteTrip,
    checkConflicts,
  }
}
