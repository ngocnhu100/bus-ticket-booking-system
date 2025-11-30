import React, { useState } from 'react'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import { Plus, Search, Edit, Trash2, MapPin } from 'lucide-react'

interface Route {
  id: string
  from: string
  to: string
  distance: number
  estimatedDuration: number
  pickupPoints: string[]
  dropoffPoints: string[]
  status: 'ACTIVE' | 'INACTIVE'
}

// Mock data - replace with API calls
const initialRoutes = [
  {
    id: '1',
    from: 'Ho Chi Minh City',
    to: 'Da Nang',
    distance: 850,
    estimatedDuration: 720, // 12 hours
    pickupPoints: ['Ben Thanh Market', 'Pham Ngu Lao', 'Tan Son Nhat Airport'],
    dropoffPoints: ['Da Nang Airport', 'Son Tra Peninsula', 'Marble Mountains'],
    status: 'ACTIVE' as const,
  },
  {
    id: '2',
    from: 'Hanoi',
    to: 'Ho Chi Minh City',
    distance: 1700,
    estimatedDuration: 1800, // 30 hours
    pickupPoints: ['Old Quarter', 'Noi Bai Airport', 'Ha Dong'],
    dropoffPoints: ['Tan Son Nhat Airport', 'Ben Thanh Market', 'Cu Chi'],
    status: 'ACTIVE' as const,
  },
]

const AdminRouteManagement: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>(initialRoutes)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingRoute, setEditingRoute] = useState<Route | null>(null)

  const filteredRoutes = routes.filter(
    (route) =>
      route.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.to.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateRoute = () => {
    setEditingRoute(null)
    setShowForm(true)
  }

  const handleEditRoute = (route: Route) => {
    setEditingRoute(route)
    setShowForm(true)
  }

  const handleDeleteRoute = (routeId: string) => {
    if (
      confirm(
        'Are you sure you want to delete this route? This action cannot be undone.'
      )
    ) {
      setRoutes(routes.filter((r) => r.id !== routeId))
    }
  }

  const handleSaveRoute = (routeData: Omit<Route, 'id'>) => {
    if (editingRoute) {
      setRoutes(
        routes.map((r) =>
          r.id === editingRoute.id ? { ...routeData, id: editingRoute.id } : r
        )
      )
    } else {
      setRoutes([...routes, { ...routeData, id: crypto.randomUUID() }])
    }
    setShowForm(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Route Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and manage bus routes for trip scheduling
            </p>
          </div>
          <button
            onClick={handleCreateRoute}
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Route
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>

        {/* Routes List */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Pickup Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredRoutes.map((route) => (
                  <tr key={route.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {route.from} → {route.to}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {route.distance} km
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {Math.floor(route.estimatedDuration / 60)}h{' '}
                      {route.estimatedDuration % 60}m
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="max-w-xs truncate">
                        {route.pickupPoints.join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          route.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}
                      >
                        {route.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditRoute(route)}
                        className="text-primary hover:text-primary/80 mr-4"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoute(route.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Route Form Modal */}
        {showForm && (
          <RouteFormModal
            route={editingRoute}
            onSave={handleSaveRoute}
            onClose={() => setShowForm(false)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

// Route Form Modal Component
interface RouteFormModalProps {
  route?: Route | null
  onSave: (route: Omit<Route, 'id'>) => void
  onClose: () => void
}

const RouteFormModal: React.FC<RouteFormModalProps> = ({
  route,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    from: route?.from || '',
    to: route?.to || '',
    distance: route?.distance || '',
    estimatedDuration: route?.estimatedDuration || '',
    pickupPoints: route?.pickupPoints || [''],
    dropoffPoints: route?.dropoffPoints || [''],
    status: route?.status || 'ACTIVE',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Basic validation
    if (
      !formData.from ||
      !formData.to ||
      !formData.distance ||
      !formData.estimatedDuration
    ) {
      alert('Please fill in all required fields')
      return
    }

    onSave({
      ...formData,
      distance: Number(formData.distance),
      estimatedDuration: Number(formData.estimatedDuration),
      pickupPoints: formData.pickupPoints.filter((p) => p.trim()),
      dropoffPoints: formData.dropoffPoints.filter((p) => p.trim()),
    })
  }

  const addPoint = (type: 'pickup' | 'dropoff') => {
    setFormData((prev) => ({
      ...prev,
      [type === 'pickup' ? 'pickupPoints' : 'dropoffPoints']: [
        ...prev[type === 'pickup' ? 'pickupPoints' : 'dropoffPoints'],
        '',
      ],
    }))
  }

  const updatePoint = (
    type: 'pickup' | 'dropoff',
    index: number,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type === 'pickup' ? 'pickupPoints' : 'dropoffPoints']: prev[
        type === 'pickup' ? 'pickupPoints' : 'dropoffPoints'
      ].map((point, i) => (i === index ? value : point)),
    }))
  }

  const removePoint = (type: 'pickup' | 'dropoff', index: number) => {
    setFormData((prev) => ({
      ...prev,
      [type === 'pickup' ? 'pickupPoints' : 'dropoffPoints']: prev[
        type === 'pickup' ? 'pickupPoints' : 'dropoffPoints'
      ].filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {route ? 'Edit Route' : 'Add New Route'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">From *</label>
              <input
                type="text"
                value={formData.from}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, from: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To *</label>
              <input
                type="text"
                value={formData.to}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, to: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Distance (km) *
              </label>
              <input
                type="number"
                value={formData.distance}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, distance: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Duration (minutes) *
              </label>
              <input
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    estimatedDuration: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Pickup Points
            </label>
            {formData.pickupPoints.map((point, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={point}
                  onChange={(e) => updatePoint('pickup', index, e.target.value)}
                  placeholder="Enter pickup point"
                  className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {formData.pickupPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePoint('pickup', index)}
                    className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-md"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addPoint('pickup')}
              className="text-primary hover:underline text-sm"
            >
              + Add pickup point
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Dropoff Points
            </label>
            {formData.dropoffPoints.map((point, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={point}
                  onChange={(e) =>
                    updatePoint('dropoff', index, e.target.value)
                  }
                  placeholder="Enter dropoff point"
                  className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {formData.dropoffPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePoint('dropoff', index)}
                    className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-md"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addPoint('dropoff')}
              className="text-primary hover:underline text-sm"
            >
              + Add dropoff point
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as 'ACTIVE' | 'INACTIVE',
                }))
              }
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              {route ? 'Update Route' : 'Create Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminRouteManagement
