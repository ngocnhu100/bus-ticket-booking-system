const crypto = require('crypto');

/* ========= PAYOS ========= */
exports.verifyPayOSSignature = (req, secret) => {
  const signature = req.headers['x-payos-signature'] || req.body.signature;
  if (!signature) return false;

  const { signature: _, ...data } = req.body;
  const canonical = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k] ?? ''}`)
    .join('&');

  const expected = crypto.createHmac('sha256', secret).update(canonical).digest('hex');
  return expected === signature;
};

/* ========= STRIPE ========= */
exports.verifyStripeEvent = (stripe, req) => {
  return stripe.webhooks.constructEvent(
    req.rawBody,
    req.headers['stripe-signature'],
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

/* ========= GENERIC HMAC ========= */
exports.verifyHmac = (payload, secret, received) => {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return expected === received;
};
