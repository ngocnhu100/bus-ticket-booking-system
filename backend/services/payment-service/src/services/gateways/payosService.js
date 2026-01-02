// services/payosService.js
const axios = require('axios');
const crypto = require('crypto');

// PayOS canonical string: sort keys, build query string, handle arrays/objects/null
function sortObjDataByKey(object) {
  if (Array.isArray(object)) {
    return object.map(sortObjDataByKey);
  }
  if (object !== null && typeof object === 'object') {
    return Object.keys(object)
      .sort()
      .reduce((obj, key) => {
        obj[key] = sortObjDataByKey(object[key]);
        return obj;
      }, {});
  }
  return object;
}

function convertObjToQueryStr(object) {
  return Object.keys(object)
    .filter((key) => object[key] !== undefined)
    .map((key) => {
      let value = object[key];
      if (Array.isArray(value)) {
        value = JSON.stringify(value.map(sortObjDataByKey));
      }
      if ([null, undefined, 'undefined', 'null'].includes(value)) {
        value = '';
      }
      return `${key}=${value}`;
    })
    .join('&');
}

/**
 * Generate HMAC signature for PayOS request (canonical string)
 * @param {Object} data - data to sign
 * @param {string} secret - PAYOS_CHECKSUM_KEY
 * @returns {string}
 */
function generateSignature(data, secret) {
  const sortedData = sortObjDataByKey(data);
  const queryStr = convertObjToQueryStr(sortedData);
  return crypto.createHmac('sha256', secret).update(queryStr).digest('hex');
}

/**
 * Create payment request to PayOS
 * @param {Object} body - { orderId, amount, description }
 * @returns {Promise<Object>}
 */

async function createPayment(body) {
  const url = 'https://api-merchant.payos.vn/v2/payment-requests';
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  // PayOS: description max 25 chars, must match in both signature and payload
  const safeDescription = (body.description || '').slice(0, 25);
  // orderCode: PayOS yêu cầu là số duy nhất, không được null
  let orderCode = Number(body.orderId);
  if (!orderCode || isNaN(orderCode)) {
    // Nếu không có orderId, sinh số ngẫu nhiên dựa trên timestamp
    orderCode = Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
  }
  // Thêm bookingId vào returnUrl và cancelUrl để frontend có thể lấy
  const baseUrl = process.env.VITE_BASE_URL || 'http://localhost:5173';
  const bookingId = body.bookingId || body.orderId;
  const returnUrl = `${baseUrl}/payment-result?bookingId=${bookingId}`;
  const cancelUrl = `${baseUrl}/payment-result?bookingId=${bookingId}`;

  const dataForSignature = {
    orderCode,
    amount: body.amount,
    description: safeDescription,
    cancelUrl,
    returnUrl,
  };

  const signature = generateSignature(dataForSignature, checksumKey);
  const payload = { ...dataForSignature, signature };
  const config = {
    headers: {
      'x-client-id': clientId,
      'x-api-key': apiKey,
    },
  };

  // Log chi tiết để debug lỗi signature
  console.log('--- PAYOS DEBUG ---');
  console.log('PAYOS_CLIENT_ID:', clientId);
  console.log('PAYOS_API_KEY:', apiKey);
  console.log('PAYOS_CHECKSUM_KEY:', checksumKey);
  console.log('PayOS dataForSignature:', JSON.stringify(dataForSignature));
  console.log('PayOS signature:', signature);
  console.log('PayOS payload:', JSON.stringify(payload));
  console.log('PayOS config:', JSON.stringify(config));

  const response = await axios.post(url, payload, config);
  // Log response PayOS để debug
  console.log('PayOS response:', JSON.stringify(response.data));
  // Chuẩn hóa trả về cho frontend
  const payosData = response.data?.data || response.data;
  return {
    success: true,
    paymentUrl: payosData?.paymentUrl || payosData?.checkoutUrl || payosData?.payUrl,
    // PayOS doesn't provide QR codes - it's redirect-based
    ...payosData,
  };
}

/**
 * Handle PayOS webhook when payment is completed
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function handleWebhook(req, res) {
  try {
    const { verifyPayOSSignature } = require('../../utils/webhookVerifier');
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

    // Verify webhook signature
    const isValid = verifyPayOSSignature(req, checksumKey);
    if (!isValid) {
      console.error('[PayOS Webhook] Invalid signature');
      return res.status(401).json({ message: 'Invalid PayOS signature' });
    }

    const body = req.body;
    console.log('[PayOS Webhook] Received:', JSON.stringify(body, null, 2));

    // PayOS webhook format: { code, desc, data: { orderCode, amount, description, ... }, signature }
    const webhookData = body.data || body;
    const code = body.code || webhookData.code;
    const orderCode = webhookData.orderCode;
    const description = webhookData.description; // Contains bookingId or booking reference
    const amount = webhookData.amount;

    // Extract bookingId from description (format: "BKXXXXXXX" or contains booking reference)
    let bookingId = description;

    // Determine payment status
    let status = 'FAILED';
    if (code === '00' || code === 0) {
      status = 'PAID';
    } else if (code === '01') {
      status = 'CANCELLED';
    }

    // Call booking service to confirm payment if successful
    if (bookingId && status === 'PAID') {
      try {
        const axios = require('axios');
        const bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://booking-service:3004';

        console.log('[PayOS Webhook] Confirming payment for booking:', bookingId);
        await axios.post(`${bookingServiceUrl}/internal/${bookingId}/confirm-payment`, {
          paymentMethod: 'payos',
          transactionRef: String(orderCode),
          amount: amount,
          paymentStatus: 'paid',
        });

        console.log('[PayOS Webhook] Booking confirmed successfully');
      } catch (err) {
        console.error('[PayOS Webhook] Failed to confirm booking:', err.message);
        // Still return 200 to PayOS to prevent retry
      }
    }

    // Always return 200 to PayOS to acknowledge webhook receipt
    res.status(200).json({
      success: true,
      bookingId,
      status,
      payos: webhookData,
    });
  } catch (err) {
    console.error('[PayOS handleWebhook] error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
}

module.exports = { createPayment, handleWebhook };
