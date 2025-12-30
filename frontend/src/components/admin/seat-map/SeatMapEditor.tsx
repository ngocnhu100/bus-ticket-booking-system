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
import { ErrorModal } from '@/components/ui/error-modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table'

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

  // Calculate rows per floor: total rows / number of floors
  const rowsPerFloor = seatLayout.rows.length / (seatLayout.floors || 1)

  seatLayout.rows.forEach((rowData, rowIndex) => {
    if (rowData.seats && Array.isArray(rowData.seats)) {
      rowData.seats.forEach((seatData, colIndex) => {
        if (seatData) {
          let seatCode: string
          let price = 0
          let floor = 1

          // Handle both old format (string) and new format (object with code and price)
          if (typeof seatData === 'string') {
            seatCode = seatData
            // Determine seat type and set default price
            const isVip = seatCode.startsWith('VIP')
            price = isVip ? 50000 : 0
            // Determine floor based on row index
            floor = Math.floor(rowIndex / rowsPerFloor) + 1
          } else if (typeof seatData === 'object' && seatData.code) {
            seatCode = seatData.code
            price = seatData.price || 0
            floor = seatData.floor || Math.floor(rowIndex / rowsPerFloor) + 1
          } else {
            return // Skip invalid seat data
          }

          // Determine seat type from seat code
          const isVip = seatCode.startsWith('VIP')

          // Calculate row index within the floor
          const rowWithinFloor = rowIndex % rowsPerFloor

          seats.push({
            seat_number: seatCode,
            floor: floor, // 1-based floor number
            row: rowWithinFloor, // 0-based row index within floor
            col: colIndex, // 0-based column index
            type: isVip ? 'vip' : 'standard',
            price: price,
          })
          totalSeats++
        }
      })
    }
  })

  return {
    floors: seatLayout.floors || 1,
    rows: rowsPerFloor,
    columns: seatLayout.rows[0]?.seats?.length || 0,
    seats,
    total_seats: totalSeats,
  }
}

// Convert from internal LayoutData format to database SeatLayout format
const convertLayoutDataToSeatLayout = (layoutData: LayoutData): SeatLayout => {
  const rows: SeatLayout['rows'] = []

  // Initialize rows array for all floors
  // Total rows = layoutData.rows * layoutData.floors
  // Floor 1: rows 0 to (layoutData.rows - 1)
  // Floor 2: rows layoutData.rows to (layoutData.rows * 2 - 1)
  const totalRows = layoutData.rows * layoutData.floors

  for (let row = 0; row < totalRows; row++) {
    const seats: (
      | string
      | { code: string; price: number; floor?: number }
      | null
    )[] = []
    for (let col = 0; col < layoutData.columns; col++) {
      seats.push(null)
    }
    rows.push({ row: row + 1, seats }) // 1-based row number
  }

  // Fill in seats with code, price, and floor
  layoutData.seats.forEach((seat) => {
    // Calculate the actual row index in the layout array based on floor
    // Floor 1 (floor=1): rows 0 to (layoutData.rows - 1)
    // Floor 2 (floor=2): rows layoutData.rows to (layoutData.rows * 2 - 1)
    const actualRowIndex = (seat.floor - 1) * layoutData.rows + seat.row

    if (
      actualRowIndex < rows.length &&
      seat.col < rows[actualRowIndex].seats.length
    ) {
      rows[actualRowIndex].seats[seat.col] = {
        code: seat.seat_number,
        price: seat.price,
        floor: seat.floor, // Include floor information
      }
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
  const [currentFloor, setCurrentFloor] = useState<number>(1) // Track which floor user is editing
  const [errorModal, setErrorModal] = useState<{
    open: boolean
    title: string
    message: string
    details?: string
  }>({ open: false, title: '', message: '' })
  const [warningModal, setWarningModal] = useState<{
    open: boolean
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  })

  const generateSeatsFromTemplate = (templateName: string) => {
    const template = SEAT_TEMPLATES[templateName as keyof typeof SEAT_TEMPLATES]
    if (!template) return

    const seats: Seat[] = []
    let seatCounter = 1

    // Generate seats for all floors
    for (let floor = 1; floor <= template.layout.floors; floor++) {
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
            floor: floor, // Track which floor this seat belongs to
            row,
            col,
            type: isVip ? 'vip' : 'standard',
            price: isVip ? 50000 : 0,
          })
          seatCounter++
        }
      }
    }

    setLayoutData({
      ...template.layout,
      seats,
      total_seats: seats.length,
    })
    setCurrentFloor(1) // Reset to floor 1 after generating
  }

  const handleSeatClick = (row: number, col: number) => {
    const existingSeat = (layoutData.seats || []).find(
      (s: Seat) => s.floor === currentFloor && s.row === row && s.col === col
    )
    if (existingSeat) {
      // Edit existing seat - toggle between standard and VIP
      const newType = existingSeat.type === 'standard' ? 'vip' : 'standard'
      const seatNumber = existingSeat.seat_number.replace('VIP', '')
      const newSeatCode = newType === 'vip' ? `VIP${seatNumber}` : seatNumber

      setLayoutData({
        ...layoutData,
        seats: (layoutData.seats || []).map((s: Seat) =>
          s.floor === currentFloor && s.row === row && s.col === col
            ? { ...s, type: newType, seat_number: newSeatCode }
            : s
        ),
      })
    } else {
      // Add new seat - find next available seat number GLOBALLY (across all floors)
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
            floor: currentFloor, // Track which floor this seat is on
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

    // Check for duplicate seat codes
    const seatCodes = (layoutData.seats || []).map((s) => s.seat_number)
    const duplicates = seatCodes.filter(
      (code, index) => seatCodes.indexOf(code) !== index
    )
    if (duplicates.length > 0) {
      return `Duplicate seat codes found: ${[...new Set(duplicates)].join(', ')}`
    }

    // Validate floor consistency
    const invalidSeats = (layoutData.seats || []).filter(
      (s) => !s.floor || s.floor < 1 || s.floor > layoutData.floors
    )
    if (invalidSeats.length > 0) {
      return `${invalidSeats.length} seat(s) have invalid floor assignment`
    }

    // Validate row consistency per floor
    for (let floor = 1; floor <= layoutData.floors; floor++) {
      const floorSeats = (layoutData.seats || []).filter(
        (s) => s.floor === floor
      )
      const invalidRows = floorSeats.filter(
        (s) => s.row < 0 || s.row >= layoutData.rows
      )
      if (invalidRows.length > 0) {
        return `Floor ${floor}: ${invalidRows.length} seat(s) have invalid row index`
      }
    }

    return null
  }

  const handleSave = () => {
    const validationError = validateLayout()
    if (validationError) {
      setErrorModal({
        open: true,
        title: 'Validation Error',
        message: validationError,
      })
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
                    onChange={(e) => {
                      const newFloors = Number(e.target.value)

                      // Check if reducing floors and there are seats on removed floors
                      if (newFloors < layoutData.floors) {
                        const seatsOnRemovedFloors = (
                          layoutData.seats || []
                        ).filter((s) => s.floor > newFloors)

                        if (seatsOnRemovedFloors.length > 0) {
                          // Show warning and ask for confirmation
                          setWarningModal({
                            open: true,
                            title: 'Remove Floors?',
                            message: `You are reducing floors from ${layoutData.floors} to ${newFloors}. This will remove ${seatsOnRemovedFloors.length} seat(s) from floor(s) ${[...new Set(seatsOnRemovedFloors.map((s) => s.floor))].join(', ')}. Continue?`,
                            onConfirm: () => {
                              // Remove seats from removed floors
                              const filteredSeats = (
                                layoutData.seats || []
                              ).filter((s) => s.floor <= newFloors)
                              setLayoutData({
                                ...layoutData,
                                floors: newFloors,
                                seats: filteredSeats,
                                total_seats: filteredSeats.length,
                              })
                              if (
                                layoutData.currentFloor &&
                                layoutData.currentFloor > newFloors
                              ) {
                                setCurrentFloor(newFloors)
                              }
                              setWarningModal({
                                open: false,
                                title: '',
                                message: '',
                                onConfirm: () => {},
                                onCancel: () => {},
                              })
                            },
                            onCancel: () => {
                              setWarningModal({
                                open: false,
                                title: '',
                                message: '',
                                onConfirm: () => {},
                                onCancel: () => {},
                              })
                            },
                          })
                          return
                        }
                      }

                      setLayoutData({
                        ...layoutData,
                        floors: newFloors,
                      })
                      // Reset to floor 1 if current floor exceeds new floor count
                      if (currentFloor > newFloors) {
                        setCurrentFloor(1)
                      }
                    }}
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

              {/* Floor Selector - Only show if multiple floors */}
              {layoutData.floors > 1 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select Floor
                  </label>
                  <div className="flex gap-2">
                    {Array.from(
                      { length: layoutData.floors },
                      (_, i) => i + 1
                    ).map((floor) => (
                      <button
                        key={floor}
                        onClick={() => setCurrentFloor(floor)}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          currentFloor === floor
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        Floor {floor}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Visual Editor */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Seat Layout - Floor {currentFloor} (Click to add/edit seats)
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
                          (s: Seat) =>
                            s.floor === currentFloor &&
                            s.row === row &&
                            s.col === col
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

              {/* Seat Details Table */}
              {layoutData?.seats?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Seat Details - Floor {currentFloor} (
                    {
                      (layoutData?.seats || []).filter(
                        (s) => s.floor === currentFloor
                      ).length
                    }{' '}
                    seats)
                  </h3>
                  <div className="border border-border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="font-semibold text-foreground text-center">
                            Seat Code
                          </TableHead>
                          <TableHead className="font-semibold text-foreground text-center">
                            Type
                          </TableHead>
                          <TableHead className="font-semibold text-foreground text-center">
                            Price
                          </TableHead>
                          <TableHead className="font-semibold text-foreground text-center w-12">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(layoutData.seats || [])
                          .filter((seat) => seat.floor === currentFloor)
                          .map((seat: Seat) => {
                            const actualIndex = (
                              layoutData.seats || []
                            ).indexOf(seat)
                            return (
                              <TableRow
                                key={actualIndex}
                                className="hover:bg-muted/40 transition-colors"
                              >
                                <TableCell className="text-center">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${
                                      seat.type === 'vip'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {seat.seat_number}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
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
                                      const seatNumber =
                                        seat.seat_number.replace('VIP', '')
                                      const newSeatCode =
                                        newType === 'vip'
                                          ? `VIP${seatNumber}`
                                          : seatNumber

                                      setLayoutData({
                                        ...layoutData,
                                        seats: (layoutData.seats || []).map(
                                          (s: Seat, i: number) =>
                                            i === actualIndex
                                              ? {
                                                  ...s,
                                                  type: newType,
                                                  seat_number: newSeatCode,
                                                }
                                              : s
                                        ),
                                      })
                                    }}
                                    className="h-8 w-28"
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <input
                                    type="text"
                                    value={seat.price.toLocaleString('vi-VN')}
                                    onChange={(e) => {
                                      // Remove thousand separators and parse as number
                                      const numericValue =
                                        e.target.value.replace(/[^\d]/g, '')
                                      const parsedValue =
                                        Number(numericValue) || 0

                                      setLayoutData({
                                        ...layoutData,
                                        seats: (layoutData.seats || []).map(
                                          (s: Seat, i: number) =>
                                            i === actualIndex
                                              ? {
                                                  ...s,
                                                  price: parsedValue,
                                                }
                                              : s
                                        ),
                                      })
                                    }}
                                    onBlur={() => {
                                      // Force formatting on blur
                                      setLayoutData({
                                        ...layoutData,
                                        seats: (layoutData.seats || []).map(
                                          (s: Seat, i: number) =>
                                            i === actualIndex ? s : s
                                        ),
                                      })
                                    }}
                                    className="w-full px-3 py-2 text-center border border-border rounded-md font-medium text-foreground bg-background hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                                    placeholder="0"
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <button
                                    onClick={() =>
                                      handleDeleteSeat(actualIndex)
                                    }
                                    className="inline-flex items-center justify-center p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Delete seat"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Preview Mode */
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Preview</h3>
              {Array.from({ length: layoutData.floors }, (_, floorIndex) => {
                const floor = floorIndex + 1
                const floorSeats = (layoutData.seats || []).filter(
                  (s) => s.floor === floor
                )
                return (
                  <div
                    key={floor}
                    className="border border-border rounded-md p-6 bg-white"
                  >
                    <div className="text-center mb-4">
                      <h4 className="font-medium">
                        {bus.license_plate} - Floor {floor}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Front of Bus
                      </p>
                    </div>
                    <div
                      className="grid gap-1 mx-auto w-fit"
                      style={{
                        gridTemplateColumns: `repeat(${layoutData.columns}, 40px)`,
                      }}
                    >
                      {Array.from({ length: layoutData.rows }, (_, row) =>
                        Array.from({ length: layoutData.columns }, (_, col) => {
                          const seat = floorSeats.find(
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
                        Floor {floor} Seats: {floorSeats.length}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div className="border border-border rounded-md p-4 bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  <strong>Total Seats:</strong>{' '}
                  {(layoutData.seats || []).length}
                </p>
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

      {/* Error Modal */}
      <ErrorModal
        open={errorModal.open}
        onClose={() => setErrorModal({ open: false, title: '', message: '' })}
        title={errorModal.title}
        message={errorModal.message}
        details={errorModal.details}
      />

      {/* Warning Modal for Floor Reduction */}
      <ConfirmDialog
        open={warningModal.open}
        onClose={warningModal.onCancel}
        onConfirm={warningModal.onConfirm}
        title={warningModal.title}
        message={warningModal.message}
        confirmText="Remove & Continue"
        cancelText="Cancel"
      />
    </div>
  )
}

export default SeatMapEditor
