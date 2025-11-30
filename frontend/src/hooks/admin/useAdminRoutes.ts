import { useState, useCallback } from 'react'
import { useToast } from '../use-toast'
import type { RouteAdminData } from '../../types/trip.types'

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

export function useAdminRoutes() {
  const [routes, setRoutes] = useState<RouteAdminData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchRoutes = useCallback(
    async (page = 1, limit = 20, searchTerm = '') => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('limit', limit.toString())
        if (searchTerm) {
          params.append('search', searchTerm)
        }

        const response = await fetch(`${API_BASE_URL}/admin/routes?${params}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        })

        if (!response.ok) {
          throw new Error(
            `Failed to fetch routes: ${response.status} ${response.statusText}`
          )
        }

        const data: PaginatedResponse<RouteAdminData> = await response.json()
        setRoutes(data.data)
        return data.pagination
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
    async (routeData: Omit<RouteAdminData, 'routeId' | 'createdAt'>) => {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/admin/routes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({
            operatorId: routeData.operatorId,
            origin: routeData.origin,
            destination: routeData.destination,
            distanceKm: routeData.distanceKm,
            estimatedMinutes: routeData.estimatedMinutes,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create route')
        }

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
      routeData: Omit<RouteAdminData, 'routeId' | 'createdAt'>
    ) => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/routes/${routeId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(routeData),
          }
        )

        if (!response.ok) {
          throw new Error('Failed to update route')
        }

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
        const response = await fetch(
          `${API_BASE_URL}/admin/routes/${routeId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(
            'Failed to delete route. It may have active trips associated.'
          )
        }

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

  return {
    routes,
    isLoading,
    error,
    fetchRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
  }
}
