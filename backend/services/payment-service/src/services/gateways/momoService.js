const crypto = require('crypto');
const https = require('https');

const {
  MOMO_PARTNER_CODE,
  MOMO_ACCESS_KEY,
  MOMO_SECRET_KEY,
  MOMO_ENDPOINT,
  MOMO_REDIRECT_URL,
  MOMO_IPN_URL,
} = process.env;

/* ================= CREATE PAYMENT ================= */

function buildSignature(params) {
  const raw =
    `accessKey=${params.accessKey}` +
    `&amount=${params.amount}` +
    `&extraData=${params.extraData}` +
    `&ipnUrl=${params.ipnUrl}` +
    `&orderId=${params.orderId}` +
    `&orderInfo=${params.orderInfo}` +
    `&partnerCode=${params.partnerCode}` +
    `&redirectUrl=${params.redirectUrl}` +
    `&requestId=${params.requestId}` +
    `&requestType=${params.requestType}`;

  return crypto.createHmac('sha256', MOMO_SECRET_KEY).update(raw).digest('hex');
}

exports.createPayment = ({ amount, bookingId, description }) => {
  return new Promise((resolve, reject) => {
    const requestId = `${MOMO_PARTNER_CODE}_${Date.now()}`;
    const orderId = requestId;

    const extraData = Buffer.from(
      JSON.stringify({ bookingId })
    ).toString('base64');

    const params = {
      partnerCode: MOMO_PARTNER_CODE,
      accessKey: MOMO_ACCESS_KEY,
      requestId,
      amount: String(amount),
      orderId,
      orderInfo: description || 'MoMo Payment',
      redirectUrl: MOMO_REDIRECT_URL,
      ipnUrl: MOMO_IPN_URL,
      extraData,
      requestType: 'captureWallet',
    };

    params.signature = buildSignature(params);

    const body = JSON.stringify({ ...params, lang: 'vi' });

    const req = https.request(
      {
        hostname: MOMO_ENDPOINT,
        path: '/v2/gateway/api/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result && result.payUrl) {
              resolve({
                success: true,
                paymentUrl: result.payUrl,
                qrCode: result.qrCodeUrl || undefined,
                ...result,
              });
            } else {
              resolve({
                success: false,
                message: result.message || 'MoMo payment failed',
                ...result,
              });
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

/* ================= WEBHOOK ================= */


// Đúng logic code cũ, dùng biến môi trường trực tiếp
function verifyMomoIPNSignature(body) {
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
  const signature = crypto.createHmac('sha256', MOMO_SECRET_KEY).update(rawSignature).digest('hex');
  console.log('[MoMo verify] body:', body);
  console.log('[MoMo verify] rawSignature:', rawSignature);
  console.log('[MoMo verify] signature tính được:', signature);
  console.log('[MoMo verify] signature nhận từ MoMo:', body.signature);
  return signature === body.signature;
}

exports.parseWebhook = (req) => {
  // req.body luôn là object (đã sửa middleware express.json cho route này)
  const body = req.body;
  console.log('[MoMo parseWebhook] body:', body);
  if (!verifyMomoIPNSignature(body)) {
    console.error('[MoMo parseWebhook] Invalid MoMo signature!');
    throw new Error('Invalid MoMo signature');
  }
  const extra = body.extraData
    ? JSON.parse(Buffer.from(body.extraData, 'base64').toString())
    : {};
  console.log('[MoMo parseWebhook] extraData:', extra);
  return {
    bookingId: extra.bookingId,
    provider: 'momo',
    providerTransactionId: body.transId,
    status:
      body.resultCode === 0
        ? 'SUCCESS'
        : body.resultCode === 1006
        ? 'CANCELLED'
        : 'FAILED',
    raw: body,
  };
};
