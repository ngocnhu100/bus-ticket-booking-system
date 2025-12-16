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
  const dataForSignature = {
    orderCode: Number(body.orderId),
    amount: body.amount,
    description: safeDescription,
    // Sử dụng domain frontend thực tế, ưu tiên biến môi trường VITE_BASE_URL nếu có
    cancelUrl: process.env.VITE_BASE_URL
      ? `${process.env.VITE_BASE_URL}/payment-result`
      : 'http://localhost:5173/payment-result',
    returnUrl: process.env.VITE_BASE_URL
      ? `${process.env.VITE_BASE_URL}/payment-result`
      : 'http://localhost:5173/payment-result',
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
    qrCode: payosData?.qrCode || payosData?.qrCodeUrl,
    ...payosData,
  };
}

module.exports = { createPayment };

