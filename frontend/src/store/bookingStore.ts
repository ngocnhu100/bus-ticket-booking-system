import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Trip } from '../api/trips'
import type { PassengerInfo } from '../api/bookings'
import type { PickupPoint, DropoffPoint } from '@/types/trip.types'

export interface BookingState {
  // Selected trip and seats
  selectedTrip: Trip | null
  selectedSeats: string[]

  // Pickup and dropoff points
  selectedPickupPoint: PickupPoint | null
  selectedDropoffPoint: DropoffPoint | null

  // Passenger information
  passengers: PassengerInfo[]

  // Contact information
  contactEmail: string
  contactPhone: string

  // Actions
  setSelectedTrip: (trip: Trip) => void
  setSelectedSeats: (seats: string[]) => void
  setSelectedPickupPoint: (point: PickupPoint | null) => void
  setSelectedDropoffPoint: (point: DropoffPoint | null) => void
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
    (
      set: (
        partial:
          | BookingState
          | Partial<BookingState>
          | ((state: BookingState) => BookingState | Partial<BookingState>)
      ) => void,
      get: () => BookingState
    ) => ({
      // Initial state
      selectedTrip: null,
      selectedSeats: [],
      selectedPickupPoint: null,
      selectedDropoffPoint: null,
      passengers: [],
      contactEmail: '',
      contactPhone: '',

      // Set selected trip
      setSelectedTrip: (trip: Trip | null) => {
        set({ selectedTrip: trip })
      },

      // Set selected seats
      setSelectedSeats: (seats: string[]) => {
        set({ selectedSeats: seats })
      },

      // Set selected pickup point
      setSelectedPickupPoint: (point: PickupPoint | null) => {
        set({ selectedPickupPoint: point })
      },

      // Set selected dropoff point
      setSelectedDropoffPoint: (point: DropoffPoint | null) => {
        set({ selectedDropoffPoint: point })
      },

      // Set passenger information
      setPassengers: (passengers: PassengerInfo[]) => {
        set({ passengers })
      },

      // Set contact information
      setContactInfo: (email: string, phone: string) => {
        set({ contactEmail: email, contactPhone: phone })
      },

      // Clear all booking data
      clearBooking: () => {
        set({
          selectedTrip: null,
          selectedSeats: [],
          selectedPickupPoint: null,
          selectedDropoffPoint: null,
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
      partialize: (state: BookingState) => ({
        // Only persist these fields
        selectedTrip: state.selectedTrip,
        selectedSeats: state.selectedSeats,
        selectedPickupPoint: state.selectedPickupPoint,
        selectedDropoffPoint: state.selectedDropoffPoint,
        passengers: state.passengers,
        contactEmail: state.contactEmail,
        contactPhone: state.contactPhone,
      }),
    }
  )
)
