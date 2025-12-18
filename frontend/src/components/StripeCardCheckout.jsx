import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(
  'pk_test_51SfVhVDNIWpSRisZd4LQDXTY4zoDyfdquwxbiM4ammwpm2AYOlYGUtE6O8JnvVQVyFGkSgQuc8xcJwaEBH8YTRkZ00YM0EOroN'
)

function CheckoutForm({ clientSecret }) {
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
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Đang xử lý...' : 'Thanh toán'}
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>Thanh toán thành công!</div>}
    </form>
  )
}

// Nhận clientSecret từ prop, không fetch lại API
export default function StripeCardCheckout({ clientSecret }) {
  if (!clientSecret) return <div>Đang khởi tạo thanh toán...</div>
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm clientSecret={clientSecret} />
    </Elements>
  )
}
