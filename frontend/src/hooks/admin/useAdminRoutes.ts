import { useState, useCallback } from 'react'
import { useToast } from '../use-toast'
import { request } from '../../api/auth'
import type { RouteAdminData } from '../../types/trip.types'

interface StopData {
  name: string
  address: string
  time: string
  type: 'pickup' | 'dropoff'
}

export function useAdminRoutes() {
  const [routes, setRoutes] = useState<RouteAdminData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchRoutes = useCallback(
    async (
      page = 1,
      limit = 20,
      searchTerm = '',
      minDistance?: number,
      maxDistance?: number,
      minDuration?: number,
      maxDuration?: number,
      origin?: string,
      destination?: string
    ) => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('limit', limit.toString())
        if (searchTerm) {
          params.append('search', searchTerm)
        }
        if (minDistance !== undefined) {
          params.append('min_distance', minDistance.toString())
        }
        if (maxDistance !== undefined) {
          params.append('max_distance', maxDistance.toString())
        }
        if (minDuration !== undefined) {
          params.append('min_duration', minDuration.toString())
        }
        if (maxDuration !== undefined) {
          params.append('max_duration', maxDuration.toString())
        }
        if (origin) {
          params.append('origin', origin)
        }
        if (destination) {
          params.append('destination', destination)
        }

        const response = await request(`/trips/routes?${params}`, {
          method: 'GET',
        })

        setRoutes(response.data)
        return response.pagination
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch routes'
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

  const createRoute = useCallback(
    async (routeData: Omit<RouteAdminData, 'route_id' | 'created_at'>) => {
      setIsLoading(true)
      try {
        await request('/trips/routes', {
          method: 'POST',
          body: {
            origin: routeData.origin,
            destination: routeData.destination,
            distance_km: routeData.distance_km,
            estimated_minutes: routeData.estimated_minutes,
            pickup_points: routeData.pickup_points,
            dropoff_points: routeData.dropoff_points,
            route_stops: routeData.route_stops,
          },
        })

        toast({
          title: 'Success',
          description: 'Route created successfully',
        })

        await fetchRoutes()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create route'
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
    [fetchRoutes, toast]
  )

  const updateRoute = useCallback(
    async (
      routeId: string,
      routeData: Omit<RouteAdminData, 'route_id' | 'created_at'>
    ) => {
      setIsLoading(true)
      try {
        await request(`/trips/routes/${routeId}`, {
          method: 'PUT',
          body: routeData,
        })

        toast({
          title: 'Success',
          description: 'Route updated successfully',
        })

        await fetchRoutes()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update route'
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
    [fetchRoutes, toast]
  )

  const deleteRoute = useCallback(
    async (routeId: string) => {
      setIsLoading(true)
      try {
        await request(`/trips/routes/${routeId}`, {
          method: 'DELETE',
        })

        toast({
          title: 'Success',
          description: 'Route deleted successfully',
        })

        await fetchRoutes()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete route'
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
    [fetchRoutes, toast]
  )

  const addStop = useCallback(
    async (routeId: string, stopData: StopData) => {
      setIsLoading(true)
      try {
        await request(`/routes/${routeId}/stops`, {
          method: 'POST',
          body: stopData,
        })

        toast({
          title: 'Success',
          description: 'Stop added successfully',
        })

        await fetchRoutes()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to add stop'
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
    [fetchRoutes, toast]
  )

  return {
    routes,
    isLoading,
    error,
    fetchRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
    addStop,
  }
}
