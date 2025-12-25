const axios = require('axios');
const crypto = require('crypto');
const qs = require('qs');

function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

exports.createPayment = async ({ amount, bookingId, description }) => {
  const appTransId = `${Date.now()}`;
  const embedData = JSON.stringify({ bookingId });

  const data = {
    app_id: process.env.ZALOPAY_APP_ID,
    app_trans_id: appTransId,
    app_user: 'guest',
    amount,
    app_time: Date.now(),
    embed_data: embedData,
    item: JSON.stringify([{ bookingId, amount }]),
    description,
    redirect_url: process.env.ZALOPAY_REDIRECT_URL,
  };

  data.mac = hmac(
    process.env.ZALOPAY_KEY1,
    Object.values(data).join('|')
  );

  const res = await axios.post(
    process.env.ZALOPAY_CREATE_URL,
    qs.stringify(data),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  return res.data;
};

exports.parseWebhook = (req) => {
  const { data, mac } = req.body;

  const expected = hmac(process.env.ZALOPAY_KEY2, data);
  if (mac !== expected) {
    throw new Error('Invalid ZaloPay MAC');
  }

  const parsed = JSON.parse(data);
  const embed = JSON.parse(parsed.embed_data || '{}');

  return {
    bookingId: embed.bookingId,
    provider: 'zalopay',
    providerTransactionId: parsed.zp_trans_id,
    status: parsed.return_code === 1 ? 'SUCCESS' : 'FAILED',
    raw: parsed,
  };
};
