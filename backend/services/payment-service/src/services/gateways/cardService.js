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

    // Xử lý các event Stripe cần thiết
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        // TODO: cập nhật trạng thái booking/payment trong DB theo paymentIntent.id hoặc metadata
        console.log('[Stripe Webhook] PaymentIntent succeeded:', paymentIntent.id);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('[Stripe Webhook] PaymentIntent failed:', paymentIntent.id);
        break;
      }
      // Thêm các event khác nếu cần
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
    res.status(200).json({ received: true });
  },
};
