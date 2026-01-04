/**
 * Seat Selection API
 * Handles saving and retrieving seat selections from Redis
 */

import { request } from './auth'

export interface SeatSelectionData {
  sessionId: string
  tripId: string
  selectedSeats: string[]
}

/**
 * Save seat selection to Redis
 * TTL: 15 minutes (configurable)
 */
export const saveSeatSelection = async (
  sessionId: string,
  tripId: string,
  selectedSeats: string[]
): Promise<{
  success: boolean
  message?: string
  data?: SeatSelectionData
  error?: { code: string; message: string }
}> => {
  try {
    return await request('/bookings/seats/select', {
      method: 'POST',
      body: {
        sessionId,
        tripId,
        selectedSeats,
      },
    })
  } catch (error) {
    console.error('❌ Error saving seat selection:', error)
    return {
      success: false,
      error: {
        code: 'SEAT_SAVE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * Get seat selection from Redis
 * Returns null if not found or expired
 */
export const getSeatSelection = async (
  sessionId: string
): Promise<{
  success: boolean
  data?: {
    tripId: string
    selectedSeats: string[]
    selectedAt: string
  } | null
  message?: string
  error?: { code: string; message: string }
}> => {
  try {
    return await request(`/bookings/seats/selection/${sessionId}`, {
      method: 'GET',
    })
  } catch (error) {
    console.error('❌ Error getting seat selection:', error)
    return {
      success: false,
      error: {
        code: 'SEAT_RETRIEVAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * Check session stats to see active seat sessions
 * Admin only endpoint
 */
export const getSessionStats = async (): Promise<{
  success: boolean
  data?: {
    draftBookings: number
    activeSeatSessions: number
    pendingPayments: number
    timestamp: string
  }
  error?: { code: string; message: string }
}> => {
  try {
    return await request('/bookings/session/stats', {
      method: 'GET',
    })
  } catch (error) {
    console.error('❌ Error getting session stats:', error)
    return {
      success: false,
      error: {
        code: 'SESSION_STATS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}
