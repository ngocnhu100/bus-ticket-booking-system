const axios = require('axios');
const crypto = require('crypto');
const { verifyPayOSSignature } = require('../../utils/webhookVerifier');

function sortObject(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((r, k) => {
      r[k] = obj[k];
      return r;
    }, {});
}

function sign(data, secret) {
  const query = Object.entries(sortObject(data))
    .map(([k, v]) => `${k}=${v ?? ''}`)
    .join('&');

  return crypto.createHmac('sha256', secret).update(query).digest('hex');
}

exports.createPayment = async ({ amount, bookingId, description }) => {
  const payload = {
    orderCode: Number(bookingId),
    amount,
    description: (description || 'PayOS Payment').slice(0, 25),
    returnUrl: process.env.PAYOS_RETURN_URL,
    cancelUrl: process.env.PAYOS_CANCEL_URL,
  };

  payload.signature = sign(payload, process.env.PAYOS_CHECKSUM_KEY);

  const res = await axios.post(
    'https://api-merchant.payos.vn/v2/payment-requests',
    payload,
    {
      headers: {
        'x-client-id': process.env.PAYOS_CLIENT_ID,
        'x-api-key': process.env.PAYOS_API_KEY,
      },
    }
  );

  return res.data;
};

exports.parseWebhook = (req) => {
  if (!verifyPayOSSignature(req, process.env.PAYOS_CHECKSUM_KEY)) {
    throw new Error('Invalid PayOS signature');
  }

  const body = req.body;

  return {
    bookingId: body.orderCode,
    provider: 'payos',
    providerTransactionId: body.transactionId,
    status: body.status === 'PAID' ? 'SUCCESS' : 'FAILED',
    raw: body,
  };
};
