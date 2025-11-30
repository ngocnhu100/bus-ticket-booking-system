import React, { useState } from 'react'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import { Plus, Search, Edit, Trash2, Bus } from 'lucide-react'

interface Bus {
  id: string
  name: string
  model: string
  plateNumber: string
  type: 'STANDARD' | 'LIMOUSINE' | 'SLEEPER'
  capacity: number
  amenities: string[]
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
  imageUrl?: string
}

interface BusFormData {
  name: string
  model: string
  plateNumber: string
  type: string
  capacity: string
  status: string
  imageUrl: string
}

// Mock data - replace with API calls
const initialBuses: Bus[] = [
  {
    id: '1',
    name: 'Sapaco Tourist 001',
    model: 'Mercedes-Benz Sprinter',
    plateNumber: '51A-12345',
    type: 'STANDARD',
    capacity: 45,
    amenities: ['WiFi', 'AC', 'Toilet'],
    status: 'ACTIVE',
    imageUrl: undefined,
  },
  {
    id: '2',
    name: 'The Sinh Tourist VIP',
    model: 'Hyundai Universe',
    plateNumber: '30A-67890',
    type: 'LIMOUSINE',
    capacity: 40,
    amenities: ['WiFi', 'AC', 'Toilet', 'Entertainment'],
    status: 'ACTIVE',
    imageUrl: undefined,
  },
]

const AdminBusManagement: React.FC = () => {
  const [buses, setBuses] = useState(initialBuses)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingBus, setEditingBus] = useState<Bus | null>(null)

  const filteredBuses = buses.filter(
    (bus) =>
      bus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.model.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateBus = () => {
    setEditingBus(null)
    setShowForm(true)
  }

  const handleEditBus = (bus: Bus) => {
    setEditingBus(bus)
    setShowForm(true)
  }

  const handleDeleteBus = (busId: string) => {
    if (
      confirm(
        'Are you sure you want to delete this bus? This action cannot be undone.'
      )
    ) {
      setBuses(buses.filter((b) => b.id !== busId))
    }
  }

  const handleSaveBus = (busData: Omit<Bus, 'id'>) => {
    if (editingBus) {
      setBuses(
        buses.map((b) =>
          b.id === editingBus.id ? { ...busData, id: editingBus.id } : b
        )
      )
    } else {
      setBuses([...buses, { ...busData, id: crypto.randomUUID() }])
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
              Bus Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage the bus fleet and assign buses to trips
            </p>
          </div>
          <button
            onClick={handleCreateBus}
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Bus
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search buses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>

        {/* Buses List */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Bus Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amenities
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
                {filteredBuses.map((bus) => (
                  <tr key={bus.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Bus className="h-8 w-8 text-muted-foreground mr-3" />
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {bus.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {bus.model} • {bus.plateNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          bus.type === 'STANDARD'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                            : bus.type === 'LIMOUSINE'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        }`}
                      >
                        {bus.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {bus.capacity} seats
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="flex flex-wrap gap-1">
                        {bus.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs bg-muted rounded"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          bus.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}
                      >
                        {bus.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditBus(bus)}
                        className="text-primary hover:text-primary/80 mr-4"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBus(bus.id)}
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

        {/* Bus Form Modal */}
        {showForm && (
          <BusFormModal
            bus={editingBus}
            onSave={handleSaveBus}
            onClose={() => setShowForm(false)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

// Bus Form Modal Component
interface BusFormModalProps {
  bus?: Bus | null
  onSave: (bus: Omit<Bus, 'id'>) => void
  onClose: () => void
}

const BusFormModal: React.FC<BusFormModalProps> = ({
  bus,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<BusFormData>({
    name: bus?.name || '',
    model: bus?.model || '',
    plateNumber: bus?.plateNumber || '',
    type: bus?.type || 'STANDARD',
    capacity: bus?.capacity?.toString() || '',
    status: bus?.status || 'ACTIVE',
    imageUrl: bus?.imageUrl || '',
  })

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    bus?.amenities || []
  )

  const availableAmenities = [
    'WiFi',
    'AC',
    'Toilet',
    'Entertainment',
    'USB Charging',
    'Snacks',
    'Blankets',
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Basic validation
    if (
      !formData.name ||
      !formData.model ||
      !formData.plateNumber ||
      !formData.capacity
    ) {
      alert('Please fill in all required fields')
      return
    }

    onSave({
      ...formData,
      capacity: Number(formData.capacity),
      type: formData.type as Bus['type'],
      status: formData.status as Bus['status'],
      amenities: selectedAmenities,
    })
  }

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {bus ? 'Edit Bus' : 'Add New Bus'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Bus Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model *</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, model: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Plate Number *
              </label>
              <input
                type="text"
                value={formData.plateNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    plateNumber: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Capacity *
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, capacity: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bus Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, type: e.target.value }))
              }
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="STANDARD">Standard</option>
              <option value="LIMOUSINE">Limousine</option>
              <option value="SLEEPER">Sleeper</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Amenities</label>
            <div className="grid grid-cols-2 gap-2">
              {availableAmenities.map((amenity) => (
                <label key={amenity} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="mr-2"
                  />
                  <span className="text-sm">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value }))
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
              {bus ? 'Update Bus' : 'Create Bus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminBusManagement
