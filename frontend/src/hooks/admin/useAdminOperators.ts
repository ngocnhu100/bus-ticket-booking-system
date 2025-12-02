import { useState, useCallback } from 'react'
import { useToast } from '../use-toast'
import { request } from '../../api/auth'
import type { OperatorAdminData } from '../../types/trip.types'

// Backend operator response type
interface BackendOperatorData {
  operatorId: string
  name: string
  contactEmail: string
  contactPhone: string
  status: string
  rating?: number
  logoUrl?: string
  approvedAt?: string
  createdAt: string
  totalRoutes: number
  totalBuses: number
}

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

        const data = await request(`/trips/admin/operators?${params}`, {
          method: 'GET',
        })

        // Transform backend data to match frontend interface
        const transformedOperators = data.data.map(
          (op: BackendOperatorData) => ({
            operator_id: op.operatorId,
            name: op.name,
            contact_email: op.contactEmail,
            contact_phone: op.contactPhone,
            status: op.status as OperatorAdminData['status'],
            total_routes: op.totalRoutes || 0,
            total_buses: op.totalBuses || 0,
            rating: op.rating || 0,
            approved_at: op.approvedAt,
            created_at: op.createdAt,
          })
        )

        setOperators(transformedOperators)
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
        await request(`/trips/admin/operators/${operatorId}/approve`, {
          method: 'PUT',
          body: {
            approved: true,
            notes: notes || '',
          },
        })

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
        await request(`/trips/admin/operators/${operatorId}/reject`, {
          method: 'PUT',
          body: {
            reason: reason,
          },
        })

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
        await request(`/trips/admin/operators/${operatorId}/suspend`, {
          method: 'PUT',
          body: {
            reason: reason,
          },
        })

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
        await request(`/trips/admin/operators/${operatorId}/activate`, {
          method: 'PUT',
          body: {
            status: 'approved',
          },
        })

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
