import React, { useEffect, useState, useCallback } from 'react'
import { X, Users, Mail, Phone, Check } from 'lucide-react'
import { request } from '@/api/auth'

interface Passenger {
  ticket_id: string
  full_name: string
  seat_code: string
  boarding_status: 'not_boarded' | 'boarded' | 'no_show'
  boarded_at?: string
  boarded_by?: string
}

interface Booking {
  booking_id: string
  booking_reference: string
  contact_email: string
  contact_phone: string
  passengers: Passenger[]
  passenger_count: number
}

interface PassengerListModalProps {
  open: boolean
  onClose: () => void
  tripId: string
}

interface ErrorResponse {
  response?: {
    data?: {
      error?: {
        message?: string
      }
    }
  }
}

const PassengerListModal: React.FC<PassengerListModalProps> = ({
  open,
  onClose,
  tripId,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalPassengers, setTotalPassengers] = useState(0)

  const fetchPassengers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await request(`/trips/${tripId}/passengers`, {
        method: 'GET',
      })
      if (response.success) {
        setBookings(response.data.bookings || [])
        setTotalPassengers(response.data.total_passengers || 0)
      } else {
        setError('Failed to fetch passenger list')
      }
    } catch (err: unknown) {
      const errorResponse = err as ErrorResponse
      console.error('Error fetching passengers:', errorResponse)
      setError(
        errorResponse?.response?.data?.error?.message ||
          'Failed to fetch passenger list'
      )
    } finally {
      setIsLoading(false)
    }
  }, [tripId])

  const updateBoardingStatus = async (
    ticketId: string,
    status: 'not_boarded' | 'boarded' | 'no_show'
  ) => {
    try {
      await request(`/bookings/admin/passengers/${ticketId}/boarding-status`, {
        method: 'PATCH',
        body: { boarding_status: status },
      })
      // Refresh the passenger list
      await fetchPassengers()
    } catch (err: unknown) {
      const errorResponse = err as ErrorResponse
      console.error('Error updating boarding status:', errorResponse)
      setError(
        errorResponse?.response?.data?.error?.message ||
          'Failed to update boarding status'
      )
    }
  }

  useEffect(() => {
    if (open && tripId) {
      fetchPassengers()
    }
  }, [open, tripId, fetchPassengers])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between border-b p-6"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--card)',
          }}
        >
          <div className="flex items-center gap-3">
            <Users size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <h2
                className="text-xl font-semibold"
                style={{ color: 'var(--foreground)' }}
              >
                Passenger List
              </h2>
              <p
                className="text-sm"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Trip ID: {tripId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition"
            style={{
              backgroundColor: 'var(--muted)',
              color: 'var(--muted-foreground)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--border)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Summary Cards */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              <p
                className="text-sm"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Total Passengers
              </p>
              <p
                className="mt-2 text-2xl font-bold"
                style={{ color: 'var(--primary)' }}
              >
                {totalPassengers}
              </p>
            </div>
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              <p
                className="text-sm"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Total Bookings
              </p>
              <p
                className="mt-2 text-2xl font-bold"
                style={{ color: 'var(--primary)' }}
              >
                {bookings.length}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-4 rounded-lg p-4"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#dc2626',
              }}
            >
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div
              className="text-center py-12"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <div className="inline-block">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
              </div>
              <p className="mt-4">Loading passenger list...</p>
            </div>
          )}

          {/* Bookings List */}
          {!isLoading && bookings.length === 0 && (
            <div
              className="rounded-lg p-8 text-center"
              style={{
                backgroundColor: 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              <Users
                size={40}
                className="mx-auto mb-4"
                style={{ color: 'var(--muted-foreground)' }}
              />
              <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                No bookings yet
              </p>
              <p
                className="text-sm"
                style={{ color: 'var(--muted-foreground)' }}
              >
                No confirmed bookings for this trip.
              </p>
            </div>
          )}

          {!isLoading && bookings.length > 0 && (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.booking_id}
                  className="rounded-lg border p-4"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--muted)',
                  }}
                >
                  {/* Booking Header */}
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p
                        className="font-semibold"
                        style={{ color: 'var(--foreground)' }}
                      >
                        Booking {booking.booking_reference}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {booking.passenger_count} passenger
                        {booking.passenger_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div
                      className="inline-flex rounded-full px-3 py-1 text-sm font-medium"
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                      }}
                    >
                      Confirmed
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div
                    className="mb-4 space-y-2 border-t border-b"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div
                      className="flex items-center gap-2 py-2 text-sm"
                      style={{ color: 'var(--foreground)' }}
                    >
                      <Mail
                        size={16}
                        style={{ color: 'var(--muted-foreground)' }}
                      />
                      <span>{booking.contact_email}</span>
                    </div>
                    <div
                      className="flex items-center gap-2 py-2 text-sm"
                      style={{ color: 'var(--foreground)' }}
                    >
                      <Phone
                        size={16}
                        style={{ color: 'var(--muted-foreground)' }}
                      />
                      <span>{booking.contact_phone}</span>
                    </div>
                  </div>

                  {/* Passengers */}
                  <div>
                    <p
                      className="mb-3 text-sm font-medium"
                      style={{ color: 'var(--foreground)' }}
                    >
                      Passengers:
                    </p>
                    <div className="space-y-2">
                      {booking.passengers.map((passenger, index) => (
                        <div
                          key={passenger.ticket_id || index}
                          className="flex items-center justify-between rounded px-3 py-2"
                          style={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div className="flex flex-col">
                            <span style={{ color: 'var(--foreground)' }}>
                              {passenger.full_name}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="rounded px-2 py-1 text-xs font-medium"
                                style={{
                                  backgroundColor:
                                    passenger.boarding_status === 'boarded'
                                      ? 'rgba(34, 197, 94, 0.1)'
                                      : passenger.boarding_status === 'no_show'
                                        ? 'rgba(239, 68, 68, 0.1)'
                                        : 'rgba(156, 163, 175, 0.1)',
                                  color:
                                    passenger.boarding_status === 'boarded'
                                      ? '#16a34a'
                                      : passenger.boarding_status === 'no_show'
                                        ? '#dc2626'
                                        : '#6b7280',
                                }}
                              >
                                {passenger.boarding_status === 'not_boarded'
                                  ? 'Not Boarded'
                                  : passenger.boarding_status === 'boarded'
                                    ? 'Boarded'
                                    : 'No Show'}
                              </span>
                              {passenger.boarded_at && (
                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    passenger.boarded_at
                                  ).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="rounded bg-blue-100 px-2 py-1 text-xs font-medium"
                              style={{
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: '#1e40af',
                              }}
                            >
                              Seat {passenger.seat_code}
                            </span>
                            <div className="flex gap-1">
                              {passenger.boarding_status !== 'boarded' && (
                                <button
                                  onClick={() =>
                                    updateBoardingStatus(
                                      passenger.ticket_id,
                                      'boarded'
                                    )
                                  }
                                  className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition"
                                  style={{
                                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                    color: '#16a34a',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      'rgba(34, 197, 94, 0.2)'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      'rgba(34, 197, 94, 0.1)'
                                  }}
                                >
                                  <Check size={16} /> Board
                                </button>
                              )}
                              {passenger.boarding_status === 'boarded' && (
                                <button
                                  onClick={() =>
                                    updateBoardingStatus(
                                      passenger.ticket_id,
                                      'not_boarded'
                                    )
                                  }
                                  className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition"
                                  style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#dc2626',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      'rgba(239, 68, 68, 0.2)'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      'rgba(239, 68, 68, 0.1)'
                                  }}
                                >
                                  <X size={16} /> Unboard
                                </button>
                              )}
                              {passenger.boarding_status !== 'no_show' && (
                                <button
                                  onClick={() =>
                                    updateBoardingStatus(
                                      passenger.ticket_id,
                                      'no_show'
                                    )
                                  }
                                  className="rounded px-2 py-1 text-xs font-medium transition"
                                  style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#dc2626',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      'rgba(239, 68, 68, 0.2)'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      'rgba(239, 68, 68, 0.1)'
                                  }}
                                >
                                  No Show
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PassengerListModal
