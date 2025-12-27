import { useState, useCallback } from 'react'
import { useToast } from '../use-toast'
import type { BusAdminData } from '../../types/trip.types'
import { request } from '../../api/auth'

interface BusModel {
  bus_model_id: string
  name: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function useAdminBuses() {
  const [buses, setBuses] = useState<BusAdminData[]>([])
  const [busModels, setBusModels] = useState<BusModel[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchBuses = useCallback(
    async (
      page = 1,
      limit = 20,
      searchTerm = '',
      filters: {
        type?: string
        status?: string
        operator_id?: string
        has_seat_layout?: string
      } = {}
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

        // Add filters to params
        if (filters.type) params.append('type', filters.type)
        if (filters.status) params.append('status', filters.status)
        if (filters.operator_id)
          params.append('operator_id', filters.operator_id)
        if (filters.has_seat_layout)
          params.append('has_seat_layout', filters.has_seat_layout)

        const data = await request(`/trips/buses?${params.toString()}`, {
          method: 'GET',
        })

        setBuses(data.data || [])

        // Extract pagination data from response
        if (data.pagination) {
          setPagination({
            page: data.pagination.page || page,
            limit: data.pagination.limit || limit,
            total: data.pagination.total || 0,
            totalPages: data.pagination.totalPages || 0,
          })
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to fetch buses'
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

  const fetchBusModels = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await request('/trips/bus-models', {
        method: 'GET',
      })
      setBusModels(data.data || [])
    } catch {
      const message = 'Failed to fetch bus models'
      setError(message)
      toast({
        title: 'Error',
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const createBus = useCallback(
    async (busData: Partial<BusAdminData>) => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await request('/trips/buses', {
          method: 'POST',
          body: busData,
        })

        // Use response data if available, otherwise use sent data
        const createdBus = response.data || busData
        setBuses((prev) => [...prev, createdBus])
        toast({
          title: 'Success',
          description: 'Bus created successfully',
        })
        return createdBus
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to create bus'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
        throw error // Re-throw to allow caller to handle
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )
  const deactivateBus = useCallback(
    async (busId: string) => {
      setIsLoading(true)
      setError(null)
      try {
        await request(`/trips/buses/${busId}/deactivate`, {
          method: 'PUT',
        })
        setBuses((prev) =>
          prev.map((bus) =>
            bus.bus_id === busId ? { ...bus, status: 'maintenance' } : bus
          )
        )
        toast({
          title: 'Success',
          description: 'Bus deactivated successfully',
        })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to deactivate bus'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
        throw error // Re-throw to allow caller to handle
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  const activateBus = useCallback(
    async (busId: string) => {
      setIsLoading(true)
      setError(null)
      try {
        await request(`/trips/buses/${busId}/activate`, {
          method: 'PUT',
        })
        setBuses((prev) =>
          prev.map((bus) =>
            bus.bus_id === busId ? { ...bus, status: 'active' } : bus
          )
        )
        toast({
          title: 'Success',
          description: 'Bus activated successfully',
        })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to activate bus'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
        throw error // Re-throw to allow caller to handle
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  const updateBus = useCallback(
    async (
      busId: string,
      busData: Omit<BusAdminData, 'bus_id' | 'created_at'>
    ) => {
      setIsLoading(true)
      try {
        // Remove operator_id from update data since it cannot be changed
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { operator_id, ...updateData } = busData

        await request(`/trips/buses/${busId}`, {
          method: 'PUT',
          body: updateData,
        })

        toast({
          title: 'Success',
          description: 'Bus updated successfully',
        })

        await fetchBuses()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to update bus'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
        throw error // Re-throw to allow caller to handle
      } finally {
        setIsLoading(false)
      }
    },
    [fetchBuses, toast]
  )

  return {
    buses,
    busModels,
    pagination,
    isLoading,
    error,
    fetchBuses,
    fetchBusModels,
    createBus,
    updateBus,
    deactivateBus,
    activateBus,
    //uploadBusImage,
  }
}
/* 
  const deactivateBus = useCallback(
    async (busId: string) => {
      setIsLoading(true)
      try {
        await request(`/admin/buses/${busId}`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'INACTIVE' }),
        })

        toast({
          title: 'Success',
          description: 'Bus deactivated successfully',
        })

        await fetchBuses()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to deactivate bus'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
      } finally {
        setIsLoading(false)
      }
    },
    [fetchBuses, toast]
  )

  const uploadBusImage = useCallback(
    async (busId: string, file: File) => {
      setIsLoading(true)
      try {
        const formData = new FormData()
        formData.append('image', file)

        const response = await fetch(
          `${API_BASE_URL}/admin/buses/${busId}/upload-image`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
            },
            body: formData,
          }
        )

        if (!response.ok) {
          throw new Error('Failed to upload bus image')
        }

        toast({
          title: 'Success',
          description: 'Bus image uploaded successfully',
        })

        await fetchBuses()
      } catch {
        const message = 'Failed to upload bus image'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
      } finally {
        setIsLoading(false)
      }
    },
    [fetchBuses, toast]
  )
 */
