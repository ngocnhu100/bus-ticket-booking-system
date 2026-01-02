// cardService.js (gateway)

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = {
  async createPaymentIntent({ amount, currency = 'vnd', metadata }) {
    // Stripe expects amount in the smallest currency unit (e.g. cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      payment_method_types: ['card'],
    });
    return paymentIntent;
  },

  async handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody || req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Trả về response ngay để Stripe không retry
    res.status(200).json({ received: true });

    // Xử lý các event Stripe cần thiết trong background
    setImmediate(async () => {
      try {
        switch (event.type) {
          case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object;
            console.log('[Stripe Webhook] PaymentIntent succeeded:', paymentIntent.id);
            
            // Lấy bookingId từ metadata
            const bookingId = paymentIntent.metadata?.bookingId;
            if (!bookingId) {
              console.error('[Stripe Webhook] No bookingId in PaymentIntent metadata');
              return;
            }

            // Gọi booking-service để confirm payment
            const axios = require('axios');
            const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://booking-service:3004';
            const NOTIFICATION_URL = process.env.NOTIFICATION_URL || 'http://notification-service:3003/webhook';

            try {
              await axios.post(
                `${BOOKING_SERVICE_URL}/internal/${bookingId}/confirm-payment`,
                {
                  paymentMethod: 'card',
                  transactionRef: paymentIntent.id,
                  amount: paymentIntent.amount,
                  paymentStatus: 'paid'
                }
              );
              console.log(`[Stripe Webhook] Đã xác nhận thanh toán cho bookingId: ${bookingId}`);

              // Gửi webhook event payment.completed đến notification-service
              const eventTimestamp = new Date().toISOString();
              const payload = {
                event: 'payment.completed',
                timestamp: eventTimestamp,
                data: {
                  bookingId,
                  status: 'PAID',
                  gateway: 'stripe',
                  transactionId: paymentIntent.id
                }
              };

              // Tạo signature cho webhook (nếu cần)
              const crypto = require('crypto');
              const webhookSecret = process.env.WEBHOOK_SECRET || 'default-secret';
              const signature = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(payload))
                .digest('hex');

              await axios.post(NOTIFICATION_URL, payload, {
                headers: {
                  'X-Webhook-Signature': signature
                }
              });
              console.log(`[Stripe Webhook] Đã gửi notification event cho bookingId: ${bookingId}`);
            } catch (err) {
              console.error('[Stripe Webhook] Error confirming booking:', err.message);
            }
            break;
          }
          case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object;
            console.log('[Stripe Webhook] PaymentIntent failed:', paymentIntent.id);
            // Có thể xử lý thêm logic khi thanh toán thất bại
            break;
          }
          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error('[Stripe Webhook] Error processing event:', err.message);
      }
    });
  },
};
