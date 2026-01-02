import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import axios from 'axios'

const stripePromise = loadStripe(
  'pk_test_51SfVhVDNIWpSRisZd4LQDXTY4zoDyfdquwxbiM4ammwpm2AYOlYGUtE6O8JnvVQVyFGkSgQuc8xcJwaEBH8YTRkZ00YM0EOroN'
)

function CheckoutForm({ clientSecret, bookingId, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    if (!stripe || !elements) return
    const cardElement = elements.getElement(CardElement)
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
        },
      }
    )
    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setSuccess(true)
      console.log(
        '[StripeCardCheckout] Payment succeeded, confirming booking...'
      )

      // Gọi API để confirm booking sau khi thanh toán thành công
      try {
        const bookingServiceUrl =
          import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3004'
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const response = await axios.post(
          `${bookingServiceUrl}/internal/${bookingId}/confirm-payment`,
          {
            paymentMethod: 'card',
            transactionRef: paymentIntent.id,
            amount: paymentIntent.amount,
            paymentStatus: 'paid',
          },
          { headers }
        )

        console.log('[StripeCardCheckout] Booking confirmed:', response.data)

        if (onSuccess) {
          onSuccess(response.data)
        }
      } catch (err) {
        console.error('[StripeCardCheckout] Error confirming booking:', err)
        setError(
          'Payment succeeded but failed to confirm booking. Please contact support.'
        )
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Pay'}
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>Payment successful!</div>}
    </form>
  )
}

// Nhận clientSecret từ prop, không fetch lại API
export default function StripeCardCheckout({
  clientSecret,
  bookingId,
  onSuccess,
}) {
  if (!clientSecret) return <div>Initializing payment...</div>
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm
        clientSecret={clientSecret}
        bookingId={bookingId}
        onSuccess={onSuccess}
      />
    </Elements>
  )
}
