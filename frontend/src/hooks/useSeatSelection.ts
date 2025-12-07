/**
 * useSeatSelection Hook
 *
 * Custom hook for managing seat selection state and business logic.
 * Handles seat selection, validation, price calculation, and state management.
 */

import { useState, useCallback, useMemo } from 'react'
import type { Seat } from '@/types/trip.types'

interface UseSeatSelectionOptions {
  /** Maximum selectable seats */
  maxSelectable?: number
  /** Initial selected seat IDs */
  initialSeats?: string[]
  /** Callback on selection change */
  onSelectionsChange?: (seats: Seat[]) => void
}

interface SeatSelectionState {
  /** Selected seat IDs */
  selectedSeatIds: string[]
  /** Selected seat objects */
  selectedSeats: Seat[]
  /** Total price of selected seats */
  totalPrice: number
  /** Can add more seats */
  canAddMore: boolean
  /** Number of remaining slots */
  remainingSlots: number
}

/**
 * Hook for managing seat selection
 *
 * @example
 * ```tsx
 * const {
 *   selectedSeatIds,
 *   selectedSeats,
 *   totalPrice,
 *   toggleSeat,
 *   clearSelection,
 *   isSelected,
 * } = useSeatSelection({ maxSelectable: 2 })
 * ```
 */
export function useSeatSelection({
  maxSelectable = 10,
  initialSeats = [],
  onSelectionsChange,
}: UseSeatSelectionOptions) {
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>(initialSeats)
  const [selectedSeatsData, setSelectedSeatsData] = useState<Seat[]>([])

  // Calculate state
  const state = useMemo<SeatSelectionState>(() => {
    const totalPrice = selectedSeatsData.reduce(
      (sum, seat) => sum + seat.price,
      0
    )
    const remainingSlots = maxSelectable - selectedSeatIds.length

    return {
      selectedSeatIds,
      selectedSeats: selectedSeatsData,
      totalPrice,
      canAddMore: remainingSlots > 0,
      remainingSlots,
    }
  }, [selectedSeatIds, selectedSeatsData, maxSelectable])

  /**
   * Check if a seat is selected
   */
  const isSelected = useCallback(
    (seatId: string) => selectedSeatIds.includes(seatId),
    [selectedSeatIds]
  )

  /**
   * Toggle seat selection
   */
  const toggleSeat = useCallback(
    (seat: Seat) => {
      if (!isSelectable(seat)) {
        return false
      }
      if (!seat.seat_id) {
        return false
      }

      const isCurrentlySelected = isSelected(seat.seat_id)

      // Check if we can add more
      if (!isCurrentlySelected && selectedSeatIds.length >= maxSelectable) {
        return false
      }

      let newSelectedIds: string[]
      let newSelectedSeats: Seat[]

      if (isCurrentlySelected) {
        // Deselect
        newSelectedIds = selectedSeatIds.filter((id) => id !== seat.seat_id)
        newSelectedSeats = selectedSeatsData.filter(
          (s) => s.seat_id !== seat.seat_id
        )
      } else {
        // Select
        newSelectedIds = [...selectedSeatIds, seat.seat_id]
        newSelectedSeats = [...selectedSeatsData, seat]
      }

      setSelectedSeatIds(newSelectedIds)
      setSelectedSeatsData(newSelectedSeats)
      onSelectionsChange?.(newSelectedSeats)

      return true
    },
    [
      selectedSeatIds,
      selectedSeatsData,
      maxSelectable,
      isSelected,
      onSelectionsChange,
    ]
  )

  /**
   * Select multiple seats
   */
  const selectMultiple = useCallback(
    (seats: Seat[]) => {
      const available = seats.filter((s) => isSelectable(s))
      const canSelect = available.slice(
        0,
        maxSelectable - selectedSeatIds.length
      )

      const newSelectedIds = [
        ...selectedSeatIds,
        ...canSelect.map((s) => s.seat_id),
      ]
      const newSelectedSeats = [...selectedSeatsData, ...canSelect]

      setSelectedSeatIds(newSelectedIds)
      setSelectedSeatsData(newSelectedSeats)
      onSelectionsChange?.(newSelectedSeats)
    },
    [selectedSeatIds, selectedSeatsData, maxSelectable, onSelectionsChange]
  )

  /**
   * Deselect specific seats
   */
  const deselectSeats = useCallback(
    (seatIds: string[]) => {
      const newSelectedIds = selectedSeatIds.filter(
        (id) => !seatIds.includes(id)
      )
      const newSelectedSeats = selectedSeatsData.filter(
        (s) => !seatIds.includes(s.seat_id)
      )

      setSelectedSeatIds(newSelectedIds)
      setSelectedSeatsData(newSelectedSeats)
      onSelectionsChange?.(newSelectedSeats)
    },
    [selectedSeatIds, selectedSeatsData, onSelectionsChange]
  )

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedSeatIds([])
    setSelectedSeatsData([])
    onSelectionsChange?.([])
  }, [onSelectionsChange])

  /**
   * Replace all selections
   */
  const setSelection = useCallback(
    (seats: Seat[]) => {
      const available = seats.filter((s) => isSelectable(s))
      const toSelect = available.slice(0, maxSelectable)

      setSelectedSeatIds(toSelect.map((s) => s.seat_id))
      setSelectedSeatsData(toSelect)
      onSelectionsChange?.(toSelect)
    },
    [maxSelectable, onSelectionsChange]
  )

  /**
   * Get seat selection statistics
   */
  const getStats = useCallback(() => {
    return {
      count: selectedSeatIds.length,
      totalPrice: state.totalPrice,
      types: selectedSeatsData.reduce(
        (acc, seat) => {
          acc[seat.seat_type] = (acc[seat.seat_type] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
      positions: selectedSeatsData.reduce(
        (acc, seat) => {
          acc[seat.position] = (acc[seat.position] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
    }
  }, [selectedSeatIds, selectedSeatsData, state.totalPrice])

  /**
   * Validate if current selection is valid
   */
  const isValid = useCallback(() => {
    return selectedSeatIds.length > 0 && selectedSeatIds.length <= maxSelectable
  }, [selectedSeatIds, maxSelectable])

  return {
    // State
    ...state,

    // Actions
    toggleSeat,
    selectMultiple,
    deselectSeats,
    clearSelection,
    setSelection,

    // Utilities
    isSelected,
    getStats,
    isValid,
  }
}

/**
 * Helper function to check if seat is selectable
 */
function isSelectable(seat: Seat): boolean {
  return seat.status === 'available'
}
