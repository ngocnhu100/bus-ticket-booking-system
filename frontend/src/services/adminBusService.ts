// services/adminBusService.ts
import { request } from '@/api/auth'

const API_BASE = '/trips'

export interface Bus {
  bus_id: string
  license_plate: string
  bus_model_name: string
  operator_name: string
  status: string
  has_seat_layout: boolean
  type: string
}

export interface SeatLayout {
  floors: number
  rows: Array<{
    row: number
    seats: (string | null)[]
  }>
  type?: string
}

export interface Seat {
  seat_number: string
  row: number
  col: number
  type: 'standard' | 'vip'
  price_multiplier: number
  price?: number
}

interface ValidationError {
  field: string
  message: string
}

class AdminBusService {
  // Validate seat layout to match backend schema
  private validateSeatLayout(layoutData: SeatLayout): ValidationError[] {
    const errors: ValidationError[] = []

    // Validate floors
    if (layoutData.floors === undefined || layoutData.floors === null) {
      errors.push({ field: 'floors', message: 'Floors is required' })
    } else if (
      !Number.isInteger(layoutData.floors) ||
      layoutData.floors < 1 ||
      layoutData.floors > 2
    ) {
      errors.push({
        field: 'floors',
        message: 'Floors must be an integer between 1 and 2',
      })
    }

    // Validate rows array
    if (!Array.isArray(layoutData.rows)) {
      errors.push({
        field: 'rows',
        message: 'Rows must be an array',
      })
    } else if (layoutData.rows.length === 0) {
      errors.push({
        field: 'rows',
        message: 'At least one row is required',
      })
    } else {
      layoutData.rows.forEach((rowData, index) => {
        // Validate row number
        if (!Number.isInteger(rowData.row) || rowData.row < 1) {
          errors.push({
            field: `rows[${index}].row`,
            message: 'Row must be a positive integer',
          })
        }

        // Validate seats array
        if (!Array.isArray(rowData.seats)) {
          errors.push({
            field: `rows[${index}].seats`,
            message: 'Seats must be an array',
          })
        } else {
          rowData.seats.forEach((seatCode, seatIndex) => {
            if (seatCode !== null && typeof seatCode !== 'string') {
              errors.push({
                field: `rows[${index}].seats[${seatIndex}]`,
                message: 'Seat code must be a string or null',
              })
            } else if (seatCode && !/^VIP\d+[A-Z]+|\d+[A-Z]+$/.test(seatCode)) {
              errors.push({
                field: `rows[${index}].seats[${seatIndex}]`,
                message:
                  'Seat code must be number(s) followed by letter(s), optionally prefixed with VIP',
              })
            }
          })
        }
      })
    }

    // Validate type (optional)
    if (layoutData.type !== undefined && typeof layoutData.type !== 'string') {
      errors.push({
        field: 'type',
        message: 'Type must be a string if provided',
      })
    }

    return errors
  }

  async getBuses(): Promise<Bus[]> {
    const response = await request(`${API_BASE}/buses`, {
      method: 'GET',
    })
    return response.data
  }

  async getSeatLayout(busId: string): Promise<SeatLayout> {
    const response = await request(`${API_BASE}/buses/${busId}/seat-layout`, {
      method: 'GET',
    })
    return response.data
  }

  async saveSeatLayout(busId: string, layoutData: SeatLayout): Promise<void> {
    // Validate layout data before sending to backend
    const validationErrors = this.validateSeatLayout(layoutData)
    if (validationErrors.length > 0) {
      const errorMessages = validationErrors
        .map((e) => `${e.field}: ${e.message}`)
        .join('\n')
      throw new Error(`Validation failed:\n${errorMessages}`)
    }

    return request(`${API_BASE}/buses/${busId}/seat-layout`, {
      method: 'POST',
      body: { layout_json: layoutData },
    })
  }

  async deleteSeatLayout(busId: string): Promise<void> {
    return request(`${API_BASE}/buses/${busId}/seat-layout`, {
      method: 'DELETE',
    })
  }
}

export const adminBusService = new AdminBusService()
