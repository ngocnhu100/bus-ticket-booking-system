import { render, screen, fireEvent } from '@testing-library/react'
import { waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import GuestCheckout from '@/components/booking/GuestCheckout'

describe('GuestCheckout', () => {
  it('renders guest checkout form', () => {
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

  it('submits booking with minimal info', async () => {
    // Mock createBooking API
    vi.mock('../api/booking.api', () => ({
      createBooking: vi.fn().mockResolvedValue({
        success: true,
        data: {
          booking_reference: 'BK20251210001',
          contact_email: 'test@example.com',
        },
      }),
    }))
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
    expect(await screen.findByTestId('confirmation-message')).toHaveTextContent(
      /Booking Confirmed/i
    )
  })
})
