import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import {
  Search,
  Eye,
  Check,
  X,
  UserCheck,
  UserX,
  BarChart3,
  Loader,
} from 'lucide-react'
import type { OperatorAdminData } from '@/types/trip.types'
import { useAdminOperators } from '@/hooks/admin/useAdminOperators'
import { OperatorDetailsDrawer } from '@/components/admin/OperatorDetailsDrawer'
import { OperatorFormDrawer } from '@/components/admin/OperatorFormDrawer'

const AdminOperatorManagement: React.FC = () => {
  const {
    operators,
    isLoading,
    fetchOperators,
    approveOperator,
    rejectOperator,
    suspendOperator,
    activateOperator,
  } = useAdminOperators()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showDetails, setShowDetails] = useState<string | null>(null)
  const [editingOperator, setEditingOperator] =
    useState<OperatorAdminData | null>(null)
  const [showFormDrawer, setShowFormDrawer] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    // Fetch operators on component mount and when status filter changes
    const status =
      statusFilter !== 'ALL' ? statusFilter.toLowerCase() : undefined
    fetchOperators(status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const filteredOperators = operators.filter((operator) => {
    const matchesSearch =
      operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operator.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleApproveOperator = async (operator_id: string) => {
    const notes = prompt('Add notes (optional):')
    if (notes !== null) {
      setActionLoading(operator_id)
      try {
        await approveOperator(operator_id, notes || undefined)
      } finally {
        setActionLoading(null)
      }
    }
  }

  const handleRejectOperator = async (operator_id: string) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason) {
      setActionLoading(operator_id)
      try {
        await rejectOperator(operator_id, reason)
      } finally {
        setActionLoading(null)
      }
    }
  }

  const handleStatusChange = async (operator_id: string, newStatus: string) => {
    const operator = operators.find((op) => op.operator_id === operator_id)
    if (!operator) return

    setActionLoading(operator_id)
    try {
      if (newStatus === 'approved' && operator.status !== 'approved') {
        await approveOperator(operator_id, 'Status updated via admin panel')
      } else if (newStatus === 'rejected' && operator.status !== 'rejected') {
        await rejectOperator(operator_id, 'Status updated via admin panel')
      } else if (newStatus === 'suspended' && operator.status !== 'suspended') {
        await suspendOperator(operator_id, 'Status updated via admin panel')
      } else if (newStatus === 'pending' && operator.status !== 'pending') {
        await activateOperator(operator_id)
      }
      setShowFormDrawer(false)
      setEditingOperator(null)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSuspendOperator = async (operator_id: string) => {
    const reason = prompt('Please provide a reason for suspension:')
    if (reason) {
      setActionLoading(operator_id)
      try {
        await suspendOperator(operator_id, reason)
      } finally {
        setActionLoading(null)
      }
    }
  }

  const handleActivateOperator = async (operator_id: string) => {
    setActionLoading(operator_id)
    try {
      await activateOperator(operator_id)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    const upperStatus = status.toUpperCase()
    switch (upperStatus) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'SUSPENDED':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (isLoading && operators.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-12">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Operator Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage bus operators and their platform access
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search operators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Operators List */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredOperators.map((operator) => (
                  <tr key={operator.operator_id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {operator.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {operator.operator_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">
                        {operator.contact_email}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {operator.contact_phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(operator.status)}`}
                      >
                        {operator.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div>⭐ {operator.rating.toFixed(1)}</div>
                          <div className="text-muted-foreground">
                            {operator.total_routes} routes
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(operator.created_at || '').toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            setShowDetails(
                              showDetails === operator.operator_id
                                ? null
                                : operator.operator_id
                            )
                          }
                          className="text-primary hover:text-primary/80 disabled:opacity-50"
                          title="View Details"
                          disabled={actionLoading === operator.operator_id}
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {operator.status === 'pending' && (
                          <>
                            <button
                              onClick={() =>
                                handleApproveOperator(operator.operator_id)
                              }
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                              title="Approve"
                              disabled={actionLoading === operator.operator_id}
                            >
                              {actionLoading === operator.operator_id ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                handleRejectOperator(operator.operator_id)
                              }
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Reject"
                              disabled={actionLoading === operator.operator_id}
                            >
                              {actionLoading === operator.operator_id ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}

                        {operator.status === 'approved' && (
                          <button
                            onClick={() =>
                              handleSuspendOperator(operator.operator_id)
                            }
                            className="text-orange-600 hover:text-orange-800 disabled:opacity-50"
                            title="Suspend"
                            disabled={actionLoading === operator.operator_id}
                          >
                            {actionLoading === operator.operator_id ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserX className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        {operator.status === 'suspended' && (
                          <button
                            onClick={() =>
                              handleActivateOperator(operator.operator_id)
                            }
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            title="Activate"
                            disabled={actionLoading === operator.operator_id}
                          >
                            {actionLoading === operator.operator_id ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredOperators.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No operators found</p>
            </div>
          )}
        </div>

        {/* Operator Details Modal */}
        {/* Operator Details Drawer */}
        <OperatorDetailsDrawer
          open={showDetails !== null}
          onClose={() => setShowDetails(null)}
          operator={
            operators.find((op) => op.operator_id === showDetails) || null
          }
        />

        {/* Operator Status Update Drawer */}
        <OperatorFormDrawer
          open={showFormDrawer}
          onClose={() => {
            setShowFormDrawer(false)
            setEditingOperator(null)
          }}
          operator={editingOperator}
          onSubmit={handleStatusChange}
          isLoading={actionLoading === editingOperator?.operator_id}
        />
      </div>
    </DashboardLayout>
  )
}

export default AdminOperatorManagement
