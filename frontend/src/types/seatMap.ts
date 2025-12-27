// types/seatMap.ts
export interface SeatData {
  code: string
  floor?: number
  price?: number
}

export interface Seat {
  seat_number: string
  floor: number // 1-based floor number
  row: number
  col: number
  type: 'standard' | 'vip' | 'window' | 'aisle'
  price: number
}

export interface LayoutData {
  floors: number
  rows: number
  columns: number
  seats: Seat[]
  total_seats: number
  currentFloor?: number
}

export interface BackendLayoutRow {
  row: number
  seats: (string | null | SeatData)[]
}

export interface BackendLayout {
  type?: string
  floors?: number
  rows: BackendLayoutRow[]
}

export interface SeatLayout {
  floors: number
  rows: Array<{
    row: number
    seats: (string | null | SeatData)[]
  }>
  type?: string
}

export interface Bus {
  bus_id: string
  license_plate: string
  bus_model_name: string
  operator_name: string
  status: string
  has_seat_layout: boolean
  type: string
}

export interface SeatMapEditorProps {
  bus: Bus
  initialLayout: LayoutData | SeatLayout | null
  onSave: (layoutData: SeatLayout) => void
  onClose: () => void
  loading: boolean
}

export interface SeatTemplate {
  rows: number
  columns: number
  layout: {
    floors: number
    rows: number
    columns: number
    seats: Seat[]
    total_seats: number
  }
}
