import React, { useState } from 'react'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import { Plus, Edit, Trash2, Grid3X3 } from 'lucide-react'
import type { SeatMapData, Seat } from '@/types/trip.types'

// Mock data - replace with API calls
const initialSeatMaps: SeatMapData[] = [
  {
    trip_id: '1',
    layout: '2-2',
    rows: 12,
    columns: 4,
    seats: [
      {
        seat_id: '1-1',
        seat_code: 'A1',
        row: 1,
        column: 1,
        seat_type: 'standard',
        position: 'window',
        price: 0,
        status: 'available',
      },
      {
        seat_id: '1-2',
        seat_code: 'A2',
        row: 1,
        column: 2,
        seat_type: 'standard',
        position: 'aisle',
        price: 0,
        status: 'available',
      },
      {
        seat_id: '1-3',
        seat_code: 'A3',
        row: 1,
        column: 3,
        seat_type: 'standard',
        position: 'aisle',
        price: 0,
        status: 'available',
      },
      {
        seat_id: '1-4',
        seat_code: 'A4',
        row: 1,
        column: 4,
        seat_type: 'standard',
        position: 'window',
        price: 0,
        status: 'available',
      },
    ],
  },
]

const AdminSeatMapManagement: React.FC = () => {
  const [seatMaps, setSeatMaps] = useState(initialSeatMaps)
  const [showEditor, setShowEditor] = useState(false)
  const [editingSeatMap, setEditingSeatMap] = useState<SeatMapData | null>(null)

  const handleCreateSeatMap = () => {
    setEditingSeatMap(null)
    setShowEditor(true)
  }

  const handleEditSeatMap = (seatMap: SeatMapData) => {
    setEditingSeatMap(seatMap)
    setShowEditor(true)
  }

  const handleDeleteSeatMap = (trip_id: string) => {
    if (
      confirm(
        'Are you sure you want to delete this seat map? This action cannot be undone.'
      )
    ) {
      setSeatMaps(seatMaps.filter((sm) => sm.trip_id !== trip_id))
    }
  }

  const handleSaveSeatMap = (seatMapData: Omit<SeatMapData, 'trip_id'>) => {
    if (editingSeatMap) {
      setSeatMaps(
        seatMaps.map((sm) =>
          sm.trip_id === editingSeatMap.trip_id
            ? { ...seatMapData, trip_id: editingSeatMap.trip_id }
            : sm
        )
      )
    } else {
      setSeatMaps([
        ...seatMaps,
        { ...seatMapData, trip_id: crypto.randomUUID() },
      ])
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
              Seat Map Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and manage bus seat layouts for trips
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
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Trip ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Layout
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Dimensions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Seats
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {seatMaps.map((seatMap) => (
                  <tr key={seatMap.trip_id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {seatMap.trip_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {seatMap.layout}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {seatMap.rows} rows × {seatMap.columns} columns
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {seatMap.seats.length} seats
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditSeatMap(seatMap)}
                        className="inline-flex items-center text-primary hover:text-primary/80"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSeatMap(seatMap.trip_id)}
                        className="inline-flex items-center text-destructive hover:text-destructive/80"
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

        {/* Seat Map Editor Modal */}
        {showEditor && (
          <SeatMapEditor
            seatMap={editingSeatMap}
            onSave={handleSaveSeatMap}
            onClose={() => setShowEditor(false)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

// Seat Map Editor Component
interface SeatMapEditorProps {
  seatMap?: SeatMapData | null
  onSave: (seatMap: Omit<SeatMapData, 'trip_id'>) => void
  onClose: () => void
}

const SeatMapEditor: React.FC<SeatMapEditorProps> = ({
  seatMap,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    layout: seatMap?.layout || '2-2',
    rows: seatMap?.rows || 10,
    columns: seatMap?.columns || 4,
    seats: seatMap?.seats || [],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.layout || !formData.rows || !formData.columns) {
      alert('Please fill in all required fields')
      return
    }

    // Generate seats if not editing
    let seats = formData.seats
    if (!seatMap || seats.length === 0) {
      seats = generateSeats(formData.rows, formData.columns)
    }

    onSave({
      layout: formData.layout,
      rows: formData.rows,
      columns: formData.columns,
      seats,
    })
  }

  const generateSeats = (rows: number, columns: number): Seat[] => {
    const seats: Seat[] = []
    const seat_types = ['standard', 'vip', 'window', 'aisle'] as const

    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= columns; col++) {
        const seat_code = `${String.fromCharCode(64 + row)}${col}`
        const position = col === 1 || col === columns ? 'window' : 'aisle'
        const seat_type = seat_types[(Math.random() * 2) | 0] // Random between standard and vip

        seats.push({
          seat_id: `${row}-${col}`,
          seat_code,
          row,
          column: col,
          seat_type,
          position,
          price: seat_type === 'vip' ? 50000 : 30000,
          status: 'available',
        })
      }
    }

    return seats
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          {seatMap ? 'Edit Seat Map' : 'Create Seat Map'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Layout Pattern *
            </label>
            <input
              type="text"
              value={formData.layout}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, layout: e.target.value }))
              }
              className="w-full px-3 py-2 border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g., 2-2, 2-3"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Rows *
              </label>
              <input
                type="number"
                value={formData.rows}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    rows: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Columns *
              </label>
              <input
                type="number"
                value={formData.columns}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    columns: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                min="1"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
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
              {seatMap ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminSeatMapManagement
