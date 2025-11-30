import React, { useState } from 'react'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import {
  Search,
  Eye,
  Check,
  X,
  UserCheck,
  UserX,
  BarChart3,
} from 'lucide-react'

interface Operator {
  id: string
  name: string
  email: string
  phone: string
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED'
  createdAt: string
  performanceMetrics?: {
    totalTrips: number
    averageRating: number
    cancellationRate: number
  }
}

// Mock data - replace with API calls
const initialOperators: Operator[] = [
  {
    id: '1',
    name: 'Sapaco Tourist Company',
    email: 'contact@sapaco.vn',
    phone: '+84 28 1234 5678',
    status: 'APPROVED',
    createdAt: '2024-01-15',
    performanceMetrics: {
      totalTrips: 1250,
      averageRating: 4.2,
      cancellationRate: 2.1,
    },
  },
  {
    id: '2',
    name: 'The Sinh Tourist',
    email: 'info@thesinh.vn',
    phone: '+84 24 8765 4321',
    status: 'PENDING',
    createdAt: '2024-11-20',
    performanceMetrics: undefined,
  },
  {
    id: '3',
    name: 'Futa Bus Lines',
    email: 'admin@futa.vn',
    phone: '+84 28 9876 5432',
    status: 'SUSPENDED',
    createdAt: '2024-03-10',
    performanceMetrics: {
      totalTrips: 890,
      averageRating: 3.8,
      cancellationRate: 5.2,
    },
  },
]

const AdminOperatorManagement: React.FC = () => {
  const [operators, setOperators] = useState(initialOperators)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showDetails, setShowDetails] = useState<string | null>(null)

  const filteredOperators = operators.filter((operator) => {
    const matchesSearch =
      operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operator.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === 'ALL' || operator.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleApproveOperator = (operatorId: string) => {
    setOperators(
      operators.map((op) =>
        op.id === operatorId ? { ...op, status: 'APPROVED' } : op
      )
    )
    // In real app, send notification to operator
    alert('Operator approved successfully!')
  }

  const handleRejectOperator = (operatorId: string) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason) {
      setOperators(
        operators.map((op) =>
          op.id === operatorId ? { ...op, status: 'REJECTED' } : op
        )
      )
      // In real app, send rejection notification with reason
      alert('Operator rejected. Notification sent.')
    }
  }

  const handleSuspendOperator = (operatorId: string) => {
    const reason = prompt('Please provide a reason for suspension:')
    if (reason) {
      setOperators(
        operators.map((op) =>
          op.id === operatorId ? { ...op, status: 'SUSPENDED' } : op
        )
      )
      alert('Operator suspended.')
    }
  }

  const handleActivateOperator = (operatorId: string) => {
    setOperators(
      operators.map((op) =>
        op.id === operatorId ? { ...op, status: 'APPROVED' } : op
      )
    )
    alert('Operator activated.')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
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
                  <tr key={operator.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {operator.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {operator.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">
                        {operator.email}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {operator.phone}
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
                      {operator.performanceMetrics ? (
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm">
                            <div>
                              ⭐ {operator.performanceMetrics.averageRating}
                            </div>
                            <div className="text-muted-foreground">
                              {operator.performanceMetrics.totalTrips} trips
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No data
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(operator.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            setShowDetails(
                              showDetails === operator.id ? null : operator.id
                            )
                          }
                          className="text-primary hover:text-primary/80"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {operator.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApproveOperator(operator.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectOperator(operator.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {operator.status === 'APPROVED' && (
                          <button
                            onClick={() => handleSuspendOperator(operator.id)}
                            className="text-orange-600 hover:text-orange-800"
                            title="Suspend"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        )}

                        {operator.status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleActivateOperator(operator.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Activate"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operator Details Modal */}
        {showDetails && (
          <OperatorDetailsModal
            operator={operators.find((op) => op.id === showDetails)!}
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
  operator: Operator
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
                  operator.status === 'APPROVED'
                    ? 'bg-green-100 text-green-800'
                    : operator.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : operator.status === 'SUSPENDED'
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
              <p className="text-foreground">{operator.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                Phone
              </label>
              <p className="text-foreground">{operator.phone}</p>
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

          {operator.performanceMetrics && (
            <div className="border-t pt-4">
              <h3 className="text-md font-semibold mb-3">
                Performance Metrics
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {operator.performanceMetrics.totalTrips}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Trips
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {operator.performanceMetrics.averageRating}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Rating
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {operator.performanceMetrics.cancellationRate}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Cancellation Rate
                  </div>
                </div>
              </div>
            </div>
          )}
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
