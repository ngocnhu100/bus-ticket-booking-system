import { useState, useCallback } from 'react'
import { useToast } from '../use-toast'
import type { BusAdminData } from '../../types/trip.types'

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

        const response = await fetch(`${API_BASE_URL}/admin/buses?${params}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch buses')
        }

        const data: PaginatedResponse<BusAdminData> = await response.json()
        setBuses(data.data)
        return data.data
      } catch {
        const message = 'Failed to upload image'
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
    async (busData: Omit<BusAdminData, 'busId' | 'createdAt'>) => {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/admin/buses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify(busData),
        })

        if (!response.ok) {
          throw new Error('Failed to create bus')
        }

        toast({
          title: 'Success',
          description: 'Bus created successfully',
        })

        await fetchBuses()
      } catch {
        const message = 'Failed to create bus'
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

  const updateBus = useCallback(
    async (
      busId: string,
      busData: Omit<BusAdminData, 'busId' | 'createdAt'>
    ) => {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/admin/buses/${busId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify(busData),
        })

        if (!response.ok) {
          throw new Error('Failed to update bus')
        }

        toast({
          title: 'Success',
          description: 'Bus updated successfully',
        })

        await fetchBuses()
      } catch {
        const message = 'Failed to update bus'
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

  const deactivateBus = useCallback(
    async (busId: string) => {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/admin/buses/${busId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ status: 'INACTIVE' }),
        })

        if (!response.ok) {
          throw new Error('Failed to deactivate bus')
        }

        toast({
          title: 'Success',
          description: 'Bus deactivated successfully',
        })

        await fetchBuses()
      } catch {
        const message = 'Failed to deactivate bus'
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
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
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

  return {
    buses,
    isLoading,
    error,
    fetchBuses,
    createBus,
    updateBus,
    deactivateBus,
    uploadBusImage,
  }
}
