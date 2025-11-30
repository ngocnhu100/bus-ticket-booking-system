import { useState, useCallback } from 'react'
import { useToast } from '../use-toast'
import type { OperatorAdminData } from '../../types/trip.types'

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

export function useAdminOperators() {
  const [operators, setOperators] = useState<OperatorAdminData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchOperators = useCallback(
    async (status?: string, page = 1, limit = 20) => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (status && status !== 'ALL') {
          params.append('status', status.toLowerCase())
        }
        params.append('page', page.toString())
        params.append('limit', limit.toString())

        const response = await fetch(
          `${API_BASE_URL}/admin/operators?${params}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch operators')
        }

        const data: PaginatedResponse<OperatorAdminData> = await response.json()
        setOperators(data.data)
        return data.pagination
      } catch {
        const message = 'Failed to fetch operators'
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

  const approveOperator = useCallback(
    async (operatorId: string, notes?: string) => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/operators/${operatorId}/approve`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify({
              approved: true,
              notes: notes || '',
            }),
          }
        )

        if (!response.ok) {
          throw new Error('Failed to approve operator')
        }

        toast({
          title: 'Success',
          description: 'Operator approved successfully',
        })

        // Refresh the list
        await fetchOperators()
      } catch {
        const message = 'Failed to approve operator'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
      } finally {
        setIsLoading(false)
      }
    },
    [fetchOperators, toast]
  )

  const rejectOperator = useCallback(
    async (operatorId: string, reason: string) => {
      setIsLoading(true)
      try {
        // API endpoint for reject - assuming it follows similar pattern
        const response = await fetch(
          `${API_BASE_URL}/admin/operators/${operatorId}/reject`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify({
              reason: reason,
            }),
          }
        )

        if (!response.ok) {
          throw new Error('Failed to reject operator')
        }

        toast({
          title: 'Success',
          description: 'Operator rejected successfully',
        })

        await fetchOperators()
      } catch {
        const message = 'Failed to reject operator'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
      } finally {
        setIsLoading(false)
      }
    },
    [fetchOperators, toast]
  )

  const suspendOperator = useCallback(
    async (operatorId: string, reason: string) => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/operators/${operatorId}/suspend`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify({
              reason: reason,
            }),
          }
        )

        if (!response.ok) {
          throw new Error('Failed to suspend operator')
        }

        toast({
          title: 'Success',
          description: 'Operator suspended successfully',
        })

        await fetchOperators()
      } catch {
        const message = 'Failed to suspend operator'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
      } finally {
        setIsLoading(false)
      }
    },
    [fetchOperators, toast]
  )

  const activateOperator = useCallback(
    async (operatorId: string) => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/operators/${operatorId}/activate`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify({
              status: 'approved',
            }),
          }
        )

        if (!response.ok) {
          throw new Error('Failed to activate operator')
        }

        toast({
          title: 'Success',
          description: 'Operator activated successfully',
        })

        await fetchOperators()
      } catch {
        const message = 'Failed to activate operator'
        setError(message)
        toast({
          title: 'Error',
          description: message,
        })
      } finally {
        setIsLoading(false)
      }
    },
    [fetchOperators, toast]
  )

  return {
    operators,
    isLoading,
    error,
    fetchOperators,
    approveOperator,
    rejectOperator,
    suspendOperator,
    activateOperator,
  }
}
