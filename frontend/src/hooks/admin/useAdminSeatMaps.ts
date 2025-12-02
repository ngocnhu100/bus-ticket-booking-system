import { useState, useCallback } from 'react'
import { useToast } from '../use-toast'
import type { SeatMapData } from '../../types/trip.types'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export interface SeatMapTemplate {
  templateId: string
  name: string
  layout: string
  rows: number
  columns: number
  description?: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

interface SeatMapApiResponse {
  tripId: string
  busId?: string
  seatMap?: {
    layout: string
    rows: number
    columns: number
    seats: Array<{
      seat_id: string
      seat_code: string
      row: number
      column: number
      seat_type: 'standard' | 'vip' | 'window' | 'aisle'
      position: 'window' | 'aisle'
      price: number
      status: 'available' | 'occupied' | 'locked' | 'disabled'
    }>
  }
  layout?: string
  rows?: number
  columns?: number
  seats?: Array<{
    seat_id: string
    seat_code: string
    row: number
    column: number
    seat_type: 'standard' | 'vip' | 'window' | 'aisle'
    position: 'window' | 'aisle'
    price: number
    status: 'available' | 'occupied' | 'locked' | 'disabled'
  }>
}

// Transform API response which may have nested seatMap structure
// API can return either { seatMap: { layout, rows, columns, seats } } or flat structure
// Primary key is tripId
function transformSeatMapResponse(
  apiResponse: SeatMapApiResponse
): SeatMapData {
  const seatMapData = apiResponse.seatMap || apiResponse
  return {
    trip_id: apiResponse.tripId,
    layout: seatMapData.layout || '',
    rows: seatMapData.rows || 0,
    columns: seatMapData.columns || 0,
    seats: seatMapData.seats || [],
  }
}

export function useAdminSeatMaps() {
  const [seatMap, setSeatMap] = useState<SeatMapData | null>(null)
  const [templates, setTemplates] = useState<SeatMapTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchSeatMap = useCallback(
    async (tripIdOrBusId: string, isBusId: boolean = false) => {
      setIsLoading(true)
      setError(null)
      try {
        const endpoint = isBusId
          ? `/admin/buses/${tripIdOrBusId}/seat-map`
          : `/trips/${tripIdOrBusId}/seats`

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        })

        if (!response.ok) {
          if (response.status === 404) {
            setSeatMap(null)
            return null
          }
          throw new Error('Failed to fetch seat map')
        }

        const apiData = await response.json()
        const transformedData = transformSeatMapResponse(
          apiData.data || apiData
        )
        setSeatMap(transformedData)
        return transformedData
      } catch {
        const message = 'Failed to fetch seat map'
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

  const saveSeatMap = useCallback(
    async (
      busId: string,
      seatMapData: Omit<SeatMapData, 'tripId' | 'busId'>
    ) => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/buses/${busId}/seat-map`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify({
              ...seatMapData,
              busId,
            }),
          }
        )

        if (!response.ok) {
          throw new Error('Failed to save seat map')
        }

        toast({
          title: 'Success',
          description: 'Seat map saved successfully',
        })

        const apiData = await response.json()
        const transformedData = transformSeatMapResponse(
          apiData.data || apiData
        )
        setSeatMap(transformedData)
        return transformedData
      } catch {
        const message = 'Failed to save seat map'
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

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/admin/seat-map-templates`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }

      const data: ApiResponse<SeatMapTemplate[]> = await response.json()
      setTemplates(data.data)
      return data.data
    } catch {
      const message = 'Failed to fetch seat map templates'
      setError(message)
      toast({
        title: 'Error',
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const applyTemplate = useCallback(
    async (busId: string, templateId: string) => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/buses/${busId}/seat-map/apply-template`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify({ templateId }),
          }
        )

        if (!response.ok) {
          throw new Error('Failed to apply template')
        }

        toast({
          title: 'Success',
          description: 'Template applied successfully',
        })

        const apiData = await response.json()
        const transformedData = transformSeatMapResponse(
          apiData.data || apiData
        )
        setSeatMap(transformedData)
        return transformedData
      } catch {
        const message = 'Failed to apply template'
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

  return {
    seatMap,
    templates,
    isLoading,
    error,
    fetchSeatMap,
    saveSeatMap,
    fetchTemplates,
    applyTemplate,
  }
}
