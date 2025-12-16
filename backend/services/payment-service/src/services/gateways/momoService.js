// momoService.js
const crypto = require('crypto');
const https = require('https');

const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO';
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const MOMO_ENDPOINT = process.env.MOMO_ENDPOINT || 'test-payment.momo.vn';
const MOMO_REDIRECT_URL = process.env.MOMO_REDIRECT_URL || 'http://localhost:5173/payment-result';
const MOMO_IPN_URL = process.env.MOMO_IPN_URL || 'http://localhost:3005/api/payment/webhook';

function buildSignature(params, secretKey) {
  const rawSignature =
    'accessKey=' + params.accessKey +
    '&amount=' + params.amount +
    '&extraData=' + params.extraData +
    '&ipnUrl=' + params.ipnUrl +
    '&orderId=' + params.orderId +
    '&orderInfo=' + params.orderInfo +
    '&partnerCode=' + params.partnerCode +
    '&redirectUrl=' + params.redirectUrl +
    '&requestId=' + params.requestId +
    '&requestType=' + params.requestType;
  return crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
}

async function createMomoPayment({ amount, orderInfo, bookingId }) {
  return new Promise((resolve, reject) => {
    const requestId = MOMO_PARTNER_CODE + Date.now();
    const orderId = requestId;
    // extraData: bookingId as base64 JSON
    const extraData = bookingId
      ? Buffer.from(JSON.stringify({ bookingId })).toString('base64')
      : '';
    const params = {
      partnerCode: MOMO_PARTNER_CODE,
      accessKey: MOMO_ACCESS_KEY,
      requestId,
      amount: String(amount),
      orderId,
      orderInfo: orderInfo || 'Thanh toán MoMo',
      redirectUrl: MOMO_REDIRECT_URL,
      ipnUrl: MOMO_IPN_URL,
      extraData,
      requestType: 'captureWallet',
    };
    params.signature = buildSignature(params, MOMO_SECRET_KEY);
    params.lang = 'vi';
    const requestBody = JSON.stringify(params);
    const options = {
      hostname: MOMO_ENDPOINT,
      port: 443,
      path: '/v2/gateway/api/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}


// Xác thực chữ ký IPN MoMo (không phải rawBody)
function verifyMomoIPNSignature(body, secretKey) {
  const rawSignature =
    'accessKey=' + MOMO_ACCESS_KEY +
    '&amount=' + body.amount +
    '&extraData=' + body.extraData +
    '&message=' + body.message +
    '&orderId=' + body.orderId +
    '&orderInfo=' + body.orderInfo +
    '&orderType=' + body.orderType +
    '&partnerCode=' + body.partnerCode +
    '&payType=' + body.payType +
    '&requestId=' + body.requestId +
    '&responseTime=' + body.responseTime +
    '&resultCode=' + body.resultCode +
    '&transId=' + body.transId;
  const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
  return signature === body.signature;
}


// Xử lý webhook MoMo
async function handleWebhook(req, res) {
  try {
    const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
    if (!verifyMomoIPNSignature(body, MOMO_SECRET_KEY)) {
      return res.status(401).json({ message: 'Invalid MoMo signature' });
    }
    // Decode extraData base64
    let bookingId = null;
    if (body.extraData) {
      try {
        const decoded = Buffer.from(body.extraData, 'base64').toString('utf8');
        const extra = JSON.parse(decoded);
        bookingId = extra.bookingId;
      } catch {
        bookingId = null;
      }
    }
    // Xác định trạng thái
    let status = 'FAILED';
    if (body.resultCode === 0) status = 'PAID';
    else if (body.resultCode === 1006) status = 'CANCELLED';
    // TODO: cập nhật trạng thái booking/payment trong DB nếu cần
    res.status(200).json({
      success: true,
      bookingId,
      status,
      momo: body
    });
  } catch (err) {
    console.error('[MoMo handleWebhook] error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
}

module.exports = { createMomoPayment, handleWebhook };

