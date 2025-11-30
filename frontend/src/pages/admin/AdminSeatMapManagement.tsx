import React, { useState } from 'react'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import { Plus, Edit, Trash2, Grid3X3, Save } from 'lucide-react'

interface Seat {
  id: string
  row: number
  column: number
  type: 'WINDOW' | 'AISLE' | 'MIDDLE' | 'STANDARD' | 'VIP'
  price: number
  isAvailable: boolean
}

interface SeatMap {
  id: string
  busId: string
  name: string
  rows: number
  columns: number
  seats: Seat[]
}

interface Bus {
  id: string
  name: string
}

// Mock data - replace with API calls
const initialSeatMaps: SeatMap[] = [
  {
    id: '1',
    busId: '1',
    name: 'Sapaco Tourist Standard Layout',
    rows: 12,
    columns: 4,
    seats: [
      {
        id: '1-1',
        row: 1,
        column: 1,
        type: 'WINDOW' as const,
        price: 0,
        isAvailable: true,
      },
      {
        id: '1-2',
        row: 1,
        column: 2,
        type: 'AISLE' as const,
        price: 0,
        isAvailable: true,
      },
      {
        id: '1-3',
        row: 1,
        column: 3,
        type: 'AISLE' as const,
        price: 0,
        isAvailable: true,
      },
      {
        id: '1-4',
        row: 1,
        column: 4,
        type: 'WINDOW' as const,
        price: 0,
        isAvailable: true,
      },
      // Add more seats...
    ],
  },
]

const mockBuses = [
  { id: '1', name: 'Sapaco Tourist 001' },
  { id: '2', name: 'The Sinh Tourist VIP' },
]

const AdminSeatMapManagement: React.FC = () => {
  const [seatMaps, setSeatMaps] = useState(initialSeatMaps)
  const [showEditor, setShowEditor] = useState(false)
  const [editingSeatMap, setEditingSeatMap] = useState<SeatMap | null>(null)

  const handleCreateSeatMap = () => {
    setEditingSeatMap(null)
    setShowEditor(true)
  }

  const handleEditSeatMap = (seatMap: SeatMap) => {
    setEditingSeatMap(seatMap)
    setShowEditor(true)
  }

  const handleDeleteSeatMap = (seatMapId: string) => {
    if (
      confirm(
        'Are you sure you want to delete this seat map? This action cannot be undone.'
      )
    ) {
      setSeatMaps(seatMaps.filter((sm) => sm.id !== seatMapId))
    }
  }

  const handleSaveSeatMap = (seatMapData: Omit<SeatMap, 'id'>) => {
    if (editingSeatMap) {
      setSeatMaps(
        seatMaps.map((sm) =>
          sm.id === editingSeatMap.id
            ? { ...seatMapData, id: editingSeatMap.id }
            : sm
        )
      )
    } else {
      setSeatMaps([...seatMaps, { ...seatMapData, id: crypto.randomUUID() }])
    }
    setShowEditor(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Seat Map Configuration
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and configure custom seat layouts for buses
            </p>
          </div>
          <button
            onClick={handleCreateSeatMap}
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Seat Map
          </button>
        </div>

        {/* Seat Maps List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seatMaps.map((seatMap) => (
            <div
              key={seatMap.id}
              className="bg-card rounded-lg border border-border p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {seatMap.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {seatMap.rows} rows × {seatMap.columns} columns
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSeatMap(seatMap)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-md"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSeatMap(seatMap.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Mini seat map preview */}
              <div className="bg-muted rounded-lg p-4 mb-4">
                <div className="grid grid-cols-4 gap-1 max-w-xs mx-auto">
                  {Array.from(
                    { length: Math.min(seatMap.rows * seatMap.columns, 16) },
                    (_, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-primary/20 rounded border border-primary/30 flex items-center justify-center text-xs"
                      >
                        {i + 1}
                      </div>
                    )
                  )}
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Preview ({seatMap.seats.length} seats)
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>
                  Bus: {mockBuses.find((b) => b.id === seatMap.busId)?.name}
                </p>
                <p>Total seats: {seatMap.seats.length}</p>
              </div>
            </div>
          ))}

          {/* Create new card */}
          <div
            onClick={handleCreateSeatMap}
            className="bg-muted/50 rounded-lg border-2 border-dashed border-border p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors"
          >
            <Grid3X3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-muted-foreground">
              Create New Seat Map
            </p>
          </div>
        </div>

        {/* Seat Map Editor Modal */}
        {showEditor && (
          <SeatMapEditorModal
            seatMap={editingSeatMap}
            buses={mockBuses}
            onSave={handleSaveSeatMap}
            onClose={() => setShowEditor(false)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminSeatMapManagement

// Seat Map Editor Modal Component
interface SeatMapEditorModalProps {
  seatMap?: SeatMap | null
  buses: Bus[]
  onSave: (seatMap: Omit<SeatMap, 'id'>) => void
  onClose: () => void
}

const SeatMapEditorModal: React.FC<SeatMapEditorModalProps> = ({
  seatMap,
  buses,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: seatMap?.name || '',
    busId: seatMap?.busId || '',
    rows: seatMap?.rows || 10,
    columns: seatMap?.columns || 4,
    seats: seatMap?.seats || [],
  })

  const [selectedSeatType, setSelectedSeatType] = useState<
    'STANDARD' | 'VIP' | 'WINDOW' | 'AISLE'
  >('STANDARD')

  // Initialize seats if creating new
  React.useEffect(() => {
    if (!seatMap && formData.rows && formData.columns) {
      const newSeats: {
        id: string
        row: number
        column: number
        type: 'STANDARD'
        price: number
        isAvailable: boolean
      }[] = []
      for (let row = 1; row <= formData.rows; row++) {
        for (let col = 1; col <= formData.columns; col++) {
          newSeats.push({
            id: `${row}-${col}`,
            row,
            column: col,
            type: 'STANDARD' as const,
            price: 0,
            isAvailable: true,
          })
        }
      }
      setFormData((prev) => ({ ...prev, seats: newSeats }))
    }
  }, [formData.rows, formData.columns, seatMap])

  const handleSeatClick = (seatId: string) => {
    setFormData((prev) => ({
      ...prev,
      seats: prev.seats.map((seat) =>
        seat.id === seatId ? { ...seat, type: selectedSeatType } : seat
      ),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.busId) {
      alert('Please fill in all required fields')
      return
    }

    onSave(formData)
  }

  const getSeatColor = (type: string) => {
    switch (type) {
      case 'VIP':
        return 'bg-purple-500'
      case 'WINDOW':
        return 'bg-blue-500'
      case 'AISLE':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {seatMap ? 'Edit Seat Map' : 'Create Seat Map'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Seat Map Name *
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
              <label className="block text-sm font-medium mb-1">Bus *</label>
              <select
                value={formData.busId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, busId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Select a bus</option>
                {buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Rows</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.rows}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      rows: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Columns
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.columns}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      columns: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Seat Type Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Seat Type to Apply
            </label>
            <div className="flex gap-2">
              {[
                { type: 'STANDARD', label: 'Standard', color: 'bg-gray-500' },
                { type: 'VIP', label: 'VIP', color: 'bg-purple-500' },
                { type: 'WINDOW', label: 'Window', color: 'bg-blue-500' },
                { type: 'AISLE', label: 'Aisle', color: 'bg-green-500' },
              ].map(({ type, label, color }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setSelectedSeatType(
                      type as 'STANDARD' | 'VIP' | 'WINDOW' | 'AISLE'
                    )
                  }
                  className={`px-3 py-2 rounded-md text-white text-sm font-medium ${
                    selectedSeatType === type
                      ? 'ring-2 ring-offset-2 ring-primary'
                      : ''
                  } ${color}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Seat Map Editor */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Seat Layout (Click seats to change type)
            </label>
            <div className="bg-muted p-6 rounded-lg overflow-x-auto">
              <div
                className="grid gap-2 mx-auto"
                style={{
                  gridTemplateColumns: `repeat(${formData.columns}, 1fr)`,
                  maxWidth: `${formData.columns * 50}px`,
                }}
              >
                {formData.seats.map((seat: Seat) => (
                  <button
                    key={seat.id}
                    type="button"
                    onClick={() => handleSeatClick(seat.id)}
                    className={`w-12 h-12 rounded border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold ${getSeatColor(seat.type)} hover:opacity-80 transition-opacity`}
                  >
                    {seat.row}-{seat.column}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total seats: {formData.seats.length}
            </p>
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
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Save className="mr-2 h-4 w-4" />
              {seatMap ? 'Update Seat Map' : 'Create Seat Map'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
