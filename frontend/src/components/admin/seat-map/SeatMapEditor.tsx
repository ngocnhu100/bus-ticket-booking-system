import React, { useState } from 'react'
import { Save, Eye, Trash2 } from 'lucide-react'
import type {
  Seat,
  LayoutData,
  SeatMapEditorProps,
  SeatTemplate,
  SeatLayout,
} from '@/types/seatMap'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import Input from '@/components/Input'

// Seat layout templates
const SEAT_TEMPLATES: Record<string, SeatTemplate> = {
  '2-2 Standard': {
    rows: 12,
    columns: 4,
    layout: {
      floors: 1,
      rows: 12,
      columns: 4,
      seats: [],
      total_seats: 48,
    },
  },
  '2-3 VIP': {
    rows: 10,
    columns: 5,
    layout: {
      floors: 1,
      rows: 10,
      columns: 5,
      seats: [],
      total_seats: 50,
    },
  },
  'Sleeper Double': {
    rows: 8,
    columns: 4,
    layout: {
      floors: 2,
      rows: 8,
      columns: 4,
      seats: [],
      total_seats: 32,
    },
  },
}

// Convert from database SeatLayout format to internal LayoutData format
const convertSeatLayoutToLayoutData = (seatLayout: SeatLayout): LayoutData => {
  const seats: Seat[] = []
  let totalSeats = 0

  seatLayout.rows.forEach((rowData, rowIndex) => {
    if (rowData.seats && Array.isArray(rowData.seats)) {
      rowData.seats.forEach((seatCode, colIndex) => {
        if (seatCode) {
          // Determine seat type and parse the seat code
          // Format: "1A", "2B", "VIP1A", "VIP2B", etc.
          const isVip = seatCode.startsWith('VIP')

          seats.push({
            seat_number: seatCode,
            row: rowIndex, // 0-based row index
            col: colIndex, // 0-based column index
            type: isVip ? 'vip' : 'standard',
            price: isVip ? 50000 : 0,
          })
          totalSeats++
        }
      })
    }
  })

  return {
    floors: seatLayout.floors,
    rows: seatLayout.rows.length,
    columns: seatLayout.rows[0]?.seats?.length || 0,
    seats,
    total_seats: totalSeats,
  }
}

// Convert from internal LayoutData format to database SeatLayout format
const convertLayoutDataToSeatLayout = (layoutData: LayoutData): SeatLayout => {
  const rows: SeatLayout['rows'] = []

  // Initialize rows array
  for (let row = 0; row < layoutData.rows; row++) {
    const seats: (string | null)[] = []
    for (let col = 0; col < layoutData.columns; col++) {
      seats.push(null)
    }
    rows.push({ row: row + 1, seats }) // 1-based row number
  }

  // Fill in seats
  layoutData.seats.forEach((seat) => {
    if (seat.row < rows.length && seat.col < rows[seat.row].seats.length) {
      const seatCode = seat.seat_number
      rows[seat.row].seats[seat.col] = seatCode
    }
  })

  return {
    floors: layoutData.floors,
    rows,
    type: 'standard', // Default type
  }
}

const SeatMapEditor: React.FC<SeatMapEditorProps> = ({
  bus,
  initialLayout,
  onSave,
  onClose,
  loading,
}) => {
  const [layoutData, setLayoutData] = useState<LayoutData>(() => {
    // If we have initial layout data, use it directly
    console.log('Initial Layout:', initialLayout)
    if (
      initialLayout &&
      typeof initialLayout === 'object' &&
      'seats' in initialLayout &&
      Array.isArray(initialLayout.seats)
    ) {
      return initialLayout as LayoutData
    }

    // If initialLayout is in SeatLayout format (database format), convert it
    if (
      initialLayout &&
      typeof initialLayout === 'object' &&
      'rows' in initialLayout &&
      Array.isArray(initialLayout.rows)
    ) {
      return convertSeatLayoutToLayoutData(initialLayout as SeatLayout)
    }

    // Default empty layout
    return {
      floors: 1,
      rows: 12,
      columns: 4,
      seats: [],
      total_seats: 0,
    }
  })

  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)

  const generateSeatsFromTemplate = (templateName: string) => {
    const template = SEAT_TEMPLATES[templateName as keyof typeof SEAT_TEMPLATES]
    if (!template) return

    const seats: Seat[] = []
    let seatCounter = 1

    for (let row = 0; row < template.rows; row++) {
      for (let col = 0; col < template.columns; col++) {
        // Skip some positions for aisles
        if (
          (template.columns === 4 && col === 2) ||
          (template.columns === 5 && (col === 2 || col === 3))
        ) {
          continue
        }

        // Generate seat code format: number + letter (e.g., "1A", "2B", "VIP1A")
        const seatLetter = String.fromCharCode(65 + col) // A, B, C, D, E
        const isVip = templateName.includes('VIP')
        const seatCode = isVip
          ? `VIP${seatCounter}${seatLetter}`
          : `${seatCounter}${seatLetter}`

        seats.push({
          seat_number: seatCode,
          row,
          col,
          type: isVip ? 'vip' : 'standard',
          price: isVip ? 50000 : 0,
        })
        seatCounter++
      }
    }

    setLayoutData({
      ...template.layout,
      seats,
      total_seats: seats.length,
    })
  }

  const handleSeatClick = (row: number, col: number) => {
    const existingSeat = (layoutData.seats || []).find(
      (s: Seat) => s.row === row && s.col === col
    )
    if (existingSeat) {
      // Edit existing seat - toggle between standard and VIP
      const newType = existingSeat.type === 'standard' ? 'vip' : 'standard'
      const seatNumber = existingSeat.seat_number.replace('VIP', '')
      const newSeatCode = newType === 'vip' ? `VIP${seatNumber}` : seatNumber

      setLayoutData({
        ...layoutData,
        seats: (layoutData.seats || []).map((s: Seat) =>
          s.row === row && s.col === col
            ? { ...s, type: newType, seat_number: newSeatCode }
            : s
        ),
      })
    } else {
      // Add new seat - find next available seat number
      const existingNumbers = (layoutData.seats || [])
        .map((s) => {
          const num = s.seat_number.replace('VIP', '')
          return parseInt(num.match(/^\d+/)?.[0] || '0')
        })
        .filter((n) => !isNaN(n) && n > 0)

      const maxNumber =
        existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0
      const seatLetter = String.fromCharCode(65 + col) // A, B, C, D, E
      const seatCode = `${maxNumber + 1}${seatLetter}`

      setLayoutData({
        ...layoutData,
        seats: [
          ...(layoutData.seats || []),
          {
            seat_number: seatCode,
            row,
            col,
            type: 'standard',
            price: 0,
          },
        ],
        total_seats: layoutData.total_seats + 1,
      })
    }
  }

  const handleDeleteSeat = (index: number) => {
    setLayoutData({
      ...layoutData,
      seats: (layoutData.seats || []).filter((_, i) => i !== index),
      total_seats: Math.max(0, layoutData.total_seats - 1),
    })
  }

  const validateLayout = () => {
    if ((layoutData.seats || []).length === 0) {
      return 'Layout must have at least one seat'
    }
    return null
  }

  const handleSave = () => {
    const validationError = validateLayout()
    if (validationError) {
      alert(validationError)
      return
    }
    // Convert to database format before saving
    const seatLayout = convertLayoutDataToSeatLayout(layoutData)
    onSave(seatLayout)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Seat Map Editor - {bus.license_plate}
            </h2>
            <p className="text-sm text-muted-foreground">
              {bus.bus_model_name} • {bus.operator_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted"
            >
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              disabled={loading}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!showPreview ? (
            <div className="space-y-6">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start with Template
                </label>
                <CustomDropdown
                  options={[
                    { id: '', label: 'Select a template...' },
                    ...Object.keys(SEAT_TEMPLATES).map((template) => ({
                      id: template,
                      label: template,
                    })),
                  ]}
                  value={selectedTemplate}
                  onChange={(value) => {
                    setSelectedTemplate(value)
                    if (value) {
                      generateSeatsFromTemplate(value)
                    }
                  }}
                  placeholder="Select a template..."
                />
              </div>

              {/* Layout Configuration */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Floors
                  </label>
                  <input
                    type="number"
                    value={layoutData.floors}
                    onChange={(e) =>
                      setLayoutData({
                        ...layoutData,
                        floors: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    min="1"
                    max="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Rows
                  </label>
                  <input
                    type="number"
                    value={layoutData.rows}
                    onChange={(e) =>
                      setLayoutData({
                        ...layoutData,
                        rows: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    min="1"
                    max="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Columns
                  </label>
                  <input
                    type="number"
                    value={layoutData.columns}
                    onChange={(e) =>
                      setLayoutData({
                        ...layoutData,
                        columns: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    min="1"
                    max="6"
                  />
                </div>
              </div>

              {/* Visual Editor */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Seat Layout (Click to add/edit seats)
                </label>
                <div className="border border-border rounded-md p-4 bg-muted/20">
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${layoutData.columns}, 1fr)`,
                    }}
                  >
                    {Array.from({ length: layoutData.rows }, (_, row) =>
                      Array.from({ length: layoutData.columns }, (_, col) => {
                        const seat = (layoutData.seats || []).find(
                          (s: Seat) => s.row === row && s.col === col
                        )
                        return (
                          <div
                            key={`${row}-${col}`}
                            onClick={() => handleSeatClick(row, col)}
                            className={`aspect-square border-2 rounded cursor-pointer flex items-center justify-center text-xs font-medium transition-colors ${
                              seat
                                ? seat.type === 'vip'
                                  ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                                  : 'bg-blue-100 border-blue-300 text-blue-800'
                                : 'border-dashed border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {seat ? seat.seat_number : '+'}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Legend: <span className="text-blue-600">Standard</span> •
                  <span className="text-yellow-600"> VIP</span> • Click cells to
                  cycle through types
                </div>
              </div>

              {/* Seat Details */}
              <div>
                {layoutData?.seats?.length > 0 && (
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    Seat Details
                  </h3>
                )}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {/* Column Headers */}
                  {layoutData?.seats?.length > 0 && (
                    <div className="flex items-center justify-between px-2 py-1 bg-muted/30 rounded text-xs font-medium text-muted-foreground">
                      <span>Seat</span>
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-center">Type</span>
                        <span className="w-24 text-center">Price</span>
                        <span className="w-10 text-center">Action</span>
                      </div>
                    </div>
                  )}
                  {(layoutData.seats || []).map((seat: Seat, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded"
                    >
                      <span className="text-sm font-medium">
                        {seat.seat_number}
                      </span>
                      <div className="flex items-center gap-2">
                        <div>
                          <CustomDropdown
                            options={[
                              {
                                id: 'standard',
                                label: 'Standard',
                              },
                              { id: 'vip', label: 'VIP' },
                            ]}
                            value={seat.type}
                            onChange={(value) => {
                              const newType = value as Seat['type']
                              const seatNumber = seat.seat_number.replace(
                                'VIP',
                                ''
                              )
                              const newSeatCode =
                                newType === 'vip'
                                  ? `VIP${seatNumber}`
                                  : seatNumber

                              setLayoutData({
                                ...layoutData,
                                seats: (layoutData.seats || []).map(
                                  (s: Seat, i: number) =>
                                    i === index
                                      ? {
                                          ...s,
                                          type: newType,
                                          seat_number: newSeatCode,
                                        }
                                      : s
                                ),
                              })
                            }}
                            className="mt-1 h-8 w-32"
                          />
                        </div>
                        <div className="min-w-20 max-w-24">
                          <Input
                            label="Price"
                            hideLabel={true}
                            type="text"
                            value={seat.price.toLocaleString()}
                            onChange={(e) => {
                              // Remove thousand separators and parse as number
                              const numericValue = e.target.value.replace(
                                /,/g,
                                ''
                              )
                              const parsedValue = Number(numericValue) || 0

                              setLayoutData({
                                ...layoutData,
                                seats: (layoutData.seats || []).map(
                                  (s: Seat, i: number) =>
                                    i === index
                                      ? {
                                          ...s,
                                          price: parsedValue,
                                        }
                                      : s
                                ),
                              })
                            }}
                            className="h-8 font-medium text-right w-full"
                            placeholder="0"
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteSeat(index)}
                          className="text-red-500 hover:text-red-600 transition-colors"
                          title="Delete seat"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Preview Mode */
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Preview</h3>
              <div className="border border-border rounded-md p-6 bg-white">
                <div className="text-center mb-4">
                  <h4 className="font-medium">{bus.license_plate}</h4>
                  <p className="text-sm text-muted-foreground">Front of Bus</p>
                </div>
                <div
                  className="grid gap-1 mx-auto w-fit"
                  style={{
                    gridTemplateColumns: `repeat(${layoutData.columns}, 40px)`,
                  }}
                >
                  {Array.from({ length: layoutData.rows }, (_, row) =>
                    Array.from({ length: layoutData.columns }, (_, col) => {
                      const seat = (layoutData.seats || []).find(
                        (s: Seat) => s.row === row && s.col === col
                      )
                      return (
                        <div
                          key={`${row}-${col}`}
                          className={`w-10 h-10 border rounded flex items-center justify-center text-xs ${
                            seat
                              ? seat.type === 'vip'
                                ? 'bg-yellow-200 border-yellow-400'
                                : 'bg-blue-200 border-blue-400'
                              : 'bg-gray-100 border-gray-300'
                          }`}
                        >
                          {seat ? seat.seat_number : ''}
                        </div>
                      )
                    })
                  )}
                </div>
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Total Seats: {(layoutData.seats || []).length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Layout'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SeatMapEditor
