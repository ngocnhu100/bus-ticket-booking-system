import { useLocation, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// import { ThemeToggle } from '@/components/ThemeToggle'

export default function GuestConfirmation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { booking } = location.state || {}

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center">
          <h2 className="text-xl font-bold mb-4">No booking found</h2>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md w-full p-8 text-center">
        {booking ? (
          <>
            <h1 data-testid="confirmation-message">Booking Confirmed</h1>
            <div>
              Your booking reference: <span>{booking.booking_reference}</span>
            </div>
            <div>
              A confirmation email and e-ticket will be sent to{' '}
              <span>{booking.contact_email}</span>.
            </div>
          </>
        ) : (
          <h2 className="text-xl font-bold mb-4">No booking found</h2>
        )}
      </Card>
    </div>
  )
}
