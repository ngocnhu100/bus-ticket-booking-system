import type {
  CreateBookingRequest,
  BookingResponse,
} from '@/types/booking.types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Helper to convert snake_case to camelCase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase)
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce(
      (acc, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
          letter.toUpperCase()
        )
        acc[camelKey] = toCamelCase(obj[key])
        return acc
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as any
    )
  }
  return obj
}

export async function createBooking(
  booking: CreateBookingRequest,
  token?: string | null
): Promise<BookingResponse> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Only add authorization header if user is logged in
  if (token && !booking.isGuestCheckout) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers,
    body: JSON.stringify(booking),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create booking')
  }

  const data = await response.json()
  return { ...data, data: toCamelCase(data.data) }
}

export async function getBookingByReference(
  bookingReference: string,
  contactEmail?: string,
  contactPhone?: string
): Promise<BookingResponse> {
  const params = new URLSearchParams()
  if (contactEmail) params.append('contactEmail', contactEmail)
  if (contactPhone) params.append('contactPhone', contactPhone)

  const response = await fetch(
    `${API_BASE_URL}/bookings/${bookingReference}?${params.toString()}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch booking')
  }

  const data = await response.json()
  return { ...data, data: toCamelCase(data.data) }
}

export async function getUserBookings(
  token: string,
  limit = 10,
  offset = 0
): Promise<BookingResponse> {
  const response = await fetch(
    `${API_BASE_URL}/bookings/user?limit=${limit}&offset=${offset}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch bookings')
  }

  return response.json()
}
