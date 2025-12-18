import React from 'react'
import StripeCardCheckout from './StripeCardCheckout'

export default function PaymentPage({ bookingId, amount }) {
  // bookingId và amount nên lấy từ props, context hoặc router tuỳ luồng app
  return (
    <div>
      <h2>Thanh toán bằng thẻ</h2>
      <StripeCardCheckout bookingId={bookingId} amount={amount} />
    </div>
  )
}
