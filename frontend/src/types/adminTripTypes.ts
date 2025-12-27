// ============================================================================
// ADMIN TRIP MANAGEMENT TYPES
// ============================================================================

import type { Trip, TripCreateRequest, TripUpdateRequest } from './trip.types'

export type TripData = Trip
export type { TripCreateRequest, TripUpdateRequest }

export interface TripListResponse {
  success: boolean
  data: {
    trips: TripData[]
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

export interface TripCancelRequest {
  reason?: string
  process_refunds?: boolean
}

export interface AssignBusRequest {
  bus_id: string
}

export interface AssignRouteRequest {
  route_id: string
}

export interface TripStatusUpdateRequest {
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
}

export interface TripFilterParams {
  status?: string
  route_id?: string
  bus_id?: string
  operator_id?: string
  search?: string
  departure_date_from?: string
  departure_date_to?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  limit?: number
  page?: number
}
