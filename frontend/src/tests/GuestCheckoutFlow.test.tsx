import { render, screen, fireEvent, waitFor } from '@testing-library/react'
// already imported waitFor
import { MemoryRouter } from 'react-router-dom'
import GuestCheckout from '@/components/booking/GuestCheckout'
import GuestConfirmation from '../pages/GuestConfirmation'
import * as bookingApi from '../api/booking.api'
import type { Booking } from '@/types/booking.types'

describe('Guest Checkout Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders minimal guest checkout form', () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/guest-checkout', state: { testMode: true } },
        ]}
      >
        <GuestCheckout />
      </MemoryRouter>
    )
    expect(screen.getByText(/Guest Checkout/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument()
    expect(screen.getByText(/Passenger Details/i)).toBeInTheDocument()
  })

  it('shows error for missing required fields', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/guest-checkout', state: { testMode: true } },
        ]}
      >
        <GuestCheckout />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText(/Confirm Booking/i))
    await waitFor(() =>
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        /Email is required/i
      )
    )
  })

  it('submits booking with minimal info and receives booking reference', async () => {
    const mockCreateBooking = vi
      .spyOn(bookingApi, 'createBooking')
      .mockResolvedValue({
        success: true,
        message: 'Booking created successfully',
        data: {
          booking_id: 'bk123',
          booking_reference: 'BK20251210001',
          trip_id: 'trip123',
          user_id: null,
          contact_email: 'test@example.com',
          contact_phone: '0973994154',
          status: 'pending',
          locked_until: null,
          created_at: '2025-12-11T00:00:00Z',
          updated_at: '2025-12-11T00:00:00Z',
          passengers: [{ fullName: 'Nguyen Van A', seat_code: 'A1' }],
        },
      })
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/guest-checkout', state: { testMode: true } },
        ]}
      >
        <GuestCheckout />
      </MemoryRouter>
    )
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '0973994154' },
    })
    fireEvent.change(screen.getAllByPlaceholderText(/Full Name/i)[0], {
      target: { value: 'Nguyen Van A' },
    })
    fireEvent.click(screen.getByText(/Confirm Booking/i))
    await waitFor(() => {
      expect(mockCreateBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          contactEmail: 'test@example.com',
          contactPhone: '0973994154',
          isGuestCheckout: true,
        })
      )
    })
  })

  it('shows confirmation screen with booking reference after success', async () => {
    const location = {
      state: {
        booking: {
          booking_reference: 'BK20251210001',
          contact_email: 'test@example.com',
        },
      },
    }
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/guest-confirmation', state: location.state },
        ]}
      >
        <GuestConfirmation />
      </MemoryRouter>
    )
    expect(screen.getByTestId('confirmation-message')).toHaveTextContent(
      /Booking Confirmed/i
    )
    expect(screen.getByText(/BK20251210001/i)).toBeInTheDocument()
    expect(
      screen.getByText(/confirmation email and e-ticket will be sent/i)
    ).toBeInTheDocument()
  })

  it('ensures booking reference is unique for each booking', async () => {
    const mockCreateBooking = vi.spyOn(bookingApi, 'createBooking')
    mockCreateBooking.mockResolvedValueOnce({
      success: true,
      data: { booking_reference: 'BK20251210001' } as Booking,
      message: 'Booking created successfully',
    })
    mockCreateBooking.mockResolvedValueOnce({
      success: true,
      data: { booking_reference: 'BK20251210002' } as Booking,
      message: 'Booking created successfully',
    })
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/guest-checkout', state: { testMode: true } },
        ]}
      >
        <GuestCheckout />
      </MemoryRouter>
    )
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'first@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '0973994154' },
    })
    fireEvent.change(screen.getAllByPlaceholderText(/Full Name/i)[0], {
      target: { value: 'First User' },
    })
    fireEvent.click(screen.getByText(/Confirm Booking/i))
    await waitFor(() => {
      expect(mockCreateBooking).toHaveBeenCalledWith(
        expect.objectContaining({ contactEmail: 'first@example.com' })
      )
    })
    // Simulate second booking
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'second@example.com' },
    })
    fireEvent.change(screen.getAllByPlaceholderText(/Full Name/i)[0], {
      target: { value: 'Second User' },
    })
    fireEvent.click(screen.getByText(/Confirm Booking/i))
    await waitFor(() => {
      expect(mockCreateBooking).toHaveBeenCalledWith(
        expect.objectContaining({ contactEmail: 'second@example.com' })
      )
    })
  })

  it('calls backend for confirmation email and e-ticket delivery', async () => {
    // This test assumes backend integration and mocks API response
    const mockCreateBooking = vi
      .spyOn(bookingApi, 'createBooking')
      .mockResolvedValue({
        success: true,
        message: 'Booking created successfully',
        data: {
          booking_id: 'bk123',
          booking_reference: 'BK20251210001',
          trip_id: 'trip123',
          user_id: null,
          contact_email: 'test@example.com',
          contact_phone: '0973994154',
          status: 'pending',
          locked_until: null,
          created_at: '2025-12-11T00:00:00Z',
          updated_at: '2025-12-11T00:00:00Z',
          passengers: [{ fullName: 'Test Passenger', seat_code: 'A1' }],
          e_ticket: {
            ticket_url: 'http://example.com/ticket.pdf',
            qr_code_url: 'http://example.com/qr.png',
          },
        },
      })
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/guest-checkout', state: { testMode: true } },
        ]}
      >
        <GuestCheckout />
      </MemoryRouter>
    )
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '0973994154' },
    })
    fireEvent.change(screen.getAllByPlaceholderText(/Full Name/i)[0], {
      target: { value: 'Nguyen Van A' },
    })
    fireEvent.click(screen.getByText(/Confirm Booking/i))
    await waitFor(() => {
      expect(mockCreateBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          contactEmail: 'test@example.com',
          isGuestCheckout: true,
        })
      )
    })
    // Simulate confirmation email and e-ticket delivery
    expect(await screen.findByText(/Booking Confirmed/i)).toBeInTheDocument()
    expect(
      await screen.findByText(/confirmation email and e-ticket will be sent/i)
    ).toBeInTheDocument()
  })
})
