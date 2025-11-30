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
      operator.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleApproveOperator = async (operatorId: string) => {
    const notes = prompt('Add notes (optional):')
    if (notes !== null) {
      setActionLoading(operatorId)
      try {
        await approveOperator(operatorId, notes || undefined)
      } finally {
        setActionLoading(null)
      }
    }
  }

  const handleRejectOperator = async (operatorId: string) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason) {
      setActionLoading(operatorId)
      try {
        await rejectOperator(operatorId, reason)
      } finally {
        setActionLoading(null)
      }
    }
  }

  const handleSuspendOperator = async (operatorId: string) => {
    const reason = prompt('Please provide a reason for suspension:')
    if (reason) {
      setActionLoading(operatorId)
      try {
        await suspendOperator(operatorId, reason)
      } finally {
        setActionLoading(null)
      }
    }
  }

  const handleActivateOperator = async (operatorId: string) => {
    setActionLoading(operatorId)
    try {
      await activateOperator(operatorId)
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
                  <tr key={operator.operatorId} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {operator.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {operator.operatorId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">
                        {operator.contactEmail}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {operator.contactPhone}
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
                            {operator.totalRoutes} routes
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(operator.createdAt || '').toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            setShowDetails(
                              showDetails === operator.operatorId
                                ? null
                                : operator.operatorId
                            )
                          }
                          className="text-primary hover:text-primary/80 disabled:opacity-50"
                          title="View Details"
                          disabled={actionLoading === operator.operatorId}
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {operator.status === 'pending' && (
                          <>
                            <button
                              onClick={() =>
                                handleApproveOperator(operator.operatorId)
                              }
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                              title="Approve"
                              disabled={actionLoading === operator.operatorId}
                            >
                              {actionLoading === operator.operatorId ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                handleRejectOperator(operator.operatorId)
                              }
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Reject"
                              disabled={actionLoading === operator.operatorId}
                            >
                              {actionLoading === operator.operatorId ? (
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
                              handleSuspendOperator(operator.operatorId)
                            }
                            className="text-orange-600 hover:text-orange-800 disabled:opacity-50"
                            title="Suspend"
                            disabled={actionLoading === operator.operatorId}
                          >
                            {actionLoading === operator.operatorId ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserX className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        {operator.status === 'suspended' && (
                          <button
                            onClick={() =>
                              handleActivateOperator(operator.operatorId)
                            }
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            title="Activate"
                            disabled={actionLoading === operator.operatorId}
                          >
                            {actionLoading === operator.operatorId ? (
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
        {showDetails && (
          <OperatorDetailsModal
            operator={operators.find((op) => op.operatorId === showDetails)!}
            onClose={() => setShowDetails(null)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminOperatorManagement

// Operator Details Modal Component
interface OperatorDetailsModalProps {
  operator: OperatorAdminData
  onClose: () => void
}

const OperatorDetailsModal: React.FC<OperatorDetailsModalProps> = ({
  operator,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">Operator Details</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                Name
              </label>
              <p className="text-foreground">{operator.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                Status
              </label>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  operator.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : operator.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : operator.status === 'suspended'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                }`}
              >
                {operator.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="text-foreground">{operator.contactEmail}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                Phone
              </label>
              <p className="text-foreground">{operator.contactPhone}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              Created
            </label>
            <p className="text-foreground">
              {new Date(operator.createdAt).toLocaleDateString()}
            </p>
          </div>
          {operator.approvedAt && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                Approved
              </label>
              <p className="text-foreground">
                {new Date(operator.approvedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="text-md font-semibold mb-3">Performance Metrics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {operator.totalRoutes}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Routes
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {operator.rating?.toFixed(1) || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {operator.totalBuses || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Buses</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
