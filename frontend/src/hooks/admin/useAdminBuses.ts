import { useState, useCallback } from 'react'
import { useToast } from '../use-toast'
import type { BusAdminData } from '../../types/trip.types'
import { request } from '../../api/auth'

export function useAdminBuses() {
  const [buses, setBuses] = useState<BusAdminData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchBuses = useCallback(
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

        const data = await request(`/trips/buses?${params.toString()}`, {
          method: 'GET',
        })
        setBuses(data.data)
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
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )
  const deleteBus = useCallback(
    async (busId: string) => {
      setIsLoading(true)
      setError(null)
      try {
        await request(`/trips/buses/${busId}`, {
          method: 'DELETE',
        })
        setBuses((prev) => prev.filter((bus) => bus.bus_id !== busId))
        toast({
          title: 'Success',
          description: 'Bus deleted successfully',
        })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to delete bus'
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

  const updateBus = useCallback(
    async (
      busId: string,
      busData: Omit<BusAdminData, 'bus_id' | 'created_at'>
    ) => {
      setIsLoading(true)
      try {
        await request(`/trips/buses/${busId}`, {
          method: 'PUT',
          body: busData,
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
      } finally {
        setIsLoading(false)
      }
    },
    [fetchBuses, toast]
  )

  return {
    buses,
    isLoading,
    error,
    fetchBuses,
    createBus,
    updateBus,
    deleteBus,
    //deactivateBus,
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
