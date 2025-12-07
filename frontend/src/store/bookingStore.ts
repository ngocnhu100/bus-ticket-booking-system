import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Trip } from '../api/trips'
import type { PassengerInfo } from '../api/bookings'

export interface BookingState {
  // Selected trip and seats
  selectedTrip: Trip | null
  selectedSeats: string[]

  // Passenger information
  passengers: PassengerInfo[]

  // Contact information
  contactEmail: string
  contactPhone: string

  // Actions
  setSelectedTrip: (trip: Trip) => void
  setSelectedSeats: (seats: string[]) => void
  setPassengers: (passengers: PassengerInfo[]) => void
  setContactInfo: (email: string, phone: string) => void
  clearBooking: () => void

  // Helper to check if booking is ready
  isReadyForSummary: () => boolean
}

/**
 * Booking Store - Manages the entire booking flow state
 * Persisted to localStorage to survive page refreshes
 */
export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedTrip: null,
      selectedSeats: [],
      passengers: [],
      contactEmail: '',
      contactPhone: '',

      // Set selected trip
      setSelectedTrip: (trip) => {
        set({ selectedTrip: trip })
      },

      // Set selected seats
      setSelectedSeats: (seats) => {
        set({ selectedSeats: seats })
      },

      // Set passenger information
      setPassengers: (passengers) => {
        set({ passengers })
      },

      // Set contact information
      setContactInfo: (email, phone) => {
        set({ contactEmail: email, contactPhone: phone })
      },

      // Clear all booking data
      clearBooking: () => {
        set({
          selectedTrip: null,
          selectedSeats: [],
          passengers: [],
          contactEmail: '',
          contactPhone: '',
        })
      },

      // Check if booking is ready for summary
      isReadyForSummary: () => {
        const state = get()
        return !!(
          state.selectedTrip &&
          state.selectedSeats.length > 0 &&
          state.passengers.length === state.selectedSeats.length &&
          state.contactEmail &&
          state.contactPhone
        )
      },
    }),
    {
      name: 'booking-storage', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        selectedTrip: state.selectedTrip,
        selectedSeats: state.selectedSeats,
        passengers: state.passengers,
        contactEmail: state.contactEmail,
        contactPhone: state.contactPhone,
      }),
    }
  )
)
