const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.createPayment = async ({ amount, currency = 'vnd', bookingId }) => {
  return stripe.paymentIntents.create({
    amount,
    currency,
    metadata: { bookingId },
    payment_method_types: ['card']
  });
};

exports.parseWebhook = (req) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.rawBody,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  const intent = event.data.object;

  return {
    bookingId: intent.metadata.bookingId,
    provider: 'card',
    providerTransactionId: intent.id,
    status: event.type === 'payment_intent.succeeded' ? 'SUCCESS' : 'FAILED',
    raw: event
  };
};
