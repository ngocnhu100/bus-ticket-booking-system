
const axios = require('axios');
const crypto = require('crypto');

/**
 * ZaloPay yêu cầu app_trans_id = yymmdd_xxxx
 */
function generateAppTransId() {
  const now = new Date();
  const yymmdd =
    String(now.getFullYear()).slice(2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  return `${yymmdd}_${Date.now()}`;
}

function signHmacSHA256(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Tạo payment ZaloPay (SANDBOX)
 */
async function createZaloPayPayment({ amount, description, bookingId }) {
  try {
    const qs = require('qs');
    const appId = process.env.ZALOPAY_APP_ID;
    const key1 = process.env.ZALOPAY_KEY1;
    const endpoint = process.env.ZALOPAY_CREATE_URL;

    // Kiểm tra amount
    const finalAmount = Number(amount);
    if (!Number.isInteger(finalAmount) || finalAmount <= 0) {
      throw new Error('Invalid ZaloPay amount');
    }

    const app_trans_id = generateAppTransId();
    const app_time = Date.now();
    const app_user = 'guest';

    // embed_data: JSON string (dùng để map bookingId và redirecturl)
    const redirectUrl = process.env.ZALOPAY_REDIRECT_URL || 'http://localhost:5173/payment-result';
    const embed_data = JSON.stringify({ 
      bookingId, 
      redirecturl: redirectUrl
    });
    // item: bắt buộc là JSON array string
    const item = JSON.stringify([{ bookingId, amount: finalAmount }]);

    // MAC phải ký sau khi dữ liệu đã final
    const hmacInput = [
      appId,
      app_trans_id,
      app_user,
      finalAmount,
      app_time,
      embed_data,
      item
    ].join('|');
    const mac = signHmacSHA256(key1, hmacInput);

    // callback_url: URL public để ZaloPay gọi webhook (không dùng localhost)
    const callbackUrl = process.env.ZALOPAY_CALLBACK_URL || 'https://4zv68s3d-3005.asse.devtunnels.ms/webhooks/zalopay';
    const payload = {
      app_id: appId,
      app_trans_id,
      app_user,
      amount: finalAmount,
      app_time,
      embed_data,
      item,
      description,
      mac,
      redirect_url: `${redirectUrl}?bookingId=${bookingId}`
    };
    if (callbackUrl) {
      payload.callback_url = callbackUrl;
    }

    // Sử dụng x-www-form-urlencoded
    console.log('[ZaloPay] payload gửi lên:', payload);
    const response = await axios.post(endpoint, qs.stringify(payload), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = response.data;
    console.log('[ZaloPay] response data:', data);
    if (data.return_code !== 1) {
      console.error('[ZaloPay] response error:', data);
      return {
        success: false,
        message: data.return_message || 'ZaloPay create order failed',
        raw: data
      };
    }
    console.log('[ZaloPay] response thành công:', data);
    
    // Chuyển đổi URL từ openinapp sang pay/v2 để test qua web
    let payUrl = data.order_url;
    if (payUrl && payUrl.includes('/openinapp?')) {
      payUrl = payUrl.replace('/openinapp?', '/pay/v2?');
      console.log('[ZaloPay] Đã chuyển URL sang web version:', payUrl);
    }
    
    // Sau khi tạo payment thành công, lưu app_trans_id vào DB booking
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      });
      await pool.query(
        'UPDATE bookings SET app_trans_id = $1 WHERE booking_id = $2',
        [app_trans_id, bookingId]
      );
      console.log('[ZaloPay] Đã lưu app_trans_id vào booking:', app_trans_id, bookingId);
    } catch (err) {
      console.error('[ZaloPay] Lỗi lưu app_trans_id vào DB:', err);
    }
    return {
      success: true,
      payUrl: payUrl,
      zpTransToken: data.zp_trans_token,
      appTransId: app_trans_id,
      raw: data
    };
  } catch (err) {
    console.error('[ZaloPay] create payment error:', err.response?.data || err);
    return {
      success: false,
      message: 'ZaloPay create payment exception',
      error: err.message
    };
  }
}

/**
 * Webhook callback từ ZaloPay
 */
async function handleWebhook(req, res) {
  const key2 = process.env.ZALOPAY_KEY2;
  // Luôn lấy body đã parse từ webhookController, không dùng req.body gốc
  const body = req.parsedBody;
  const rawBody = req.rawBody;
  console.log('[ZaloPay] Webhook received, key2:', key2);
  console.log('[ZaloPay] raw body:', rawBody);
  console.log('[ZaloPay] parsed body:', body);
  if (!body || typeof body !== 'object') {
    console.error('[ZaloPay] Webhook body không hợp lệ:', body);
    return res.status(400).json({ return_code: -1, return_message: 'invalid body' });
  }
  const { data, mac: receivedMac } = body;
  if (!data) {
    console.error('[ZaloPay] Webhook missing data field:', body);
    return res.status(400).json({ return_code: -1, return_message: 'missing data field' });
  }
  console.log('[ZaloPay] Webhook data:', data);
  console.log('[ZaloPay] Webhook receivedMac:', receivedMac);
  let calculatedMac;
  try {
    calculatedMac = signHmacSHA256(key2, data);
  } catch (err) {
    console.error('[ZaloPay] Error calculating MAC:', err);
    return res.status(500).json({ return_code: -1, return_message: 'error calculating mac' });
  }
  console.log('[ZaloPay] Webhook calculatedMac:', calculatedMac);
  if (receivedMac !== calculatedMac) {
    console.error('[ZaloPay] Invalid MAC', { receivedMac, calculatedMac });
    return res.json({ return_code: -1, return_message: 'invalid mac' });
  }
  let parsedData;
  try {
    parsedData = JSON.parse(data);
    console.log('[ZaloPay] Webhook parsedData:', parsedData);
  } catch (err) {
    console.error('[ZaloPay] Error parsing data JSON:', err, data);
    return res.status(400).json({ return_code: -1, return_message: 'invalid data json' });
  }
  // ZaloPay: callback chỉ gửi khi payment SUCCESS, không cần check return_code
  let realData = parsedData;
  if (typeof parsedData.data === 'string') {
    try {
      const inner = JSON.parse(parsedData.data);
      if (inner && typeof inner === 'object') {
        realData = inner;
        console.log('[ZaloPay] Webhook realData (from .data):', realData);
      }
    } catch (err) {
      console.error('[ZaloPay] Error parsing inner data JSON:', err, parsedData.data);
    }
  }
  let embedData = {};
  try {
    embedData = JSON.parse(realData.embed_data || '{}');
    console.log('[ZaloPay] Webhook embedData:', embedData);
  } catch (err) {
    console.error('[ZaloPay] Error parsing embed_data:', err, realData.embed_data);
  }
  const bookingId = embedData.bookingId;
  console.log('[ZaloPay] Webhook bookingId:', bookingId);
  // Luôn update booking khi nhận callback
  try {
    const axios = require('axios');
    const bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://booking-service:3004';
    console.log('[ZaloPay] Calling booking-service:', `${bookingServiceUrl}/internal/${bookingId}/confirm-payment`);
    const payload = {
      paymentMethod: 'zalopay',
      transactionRef: realData.app_trans_id,
      amount: realData.amount,
      paymentStatus: 'paid',
      paidAt: new Date().toISOString()
    };
    console.log('[ZaloPay] Payload gửi sang booking-service:', payload);
    const response = await axios.post(`${bookingServiceUrl}/internal/${bookingId}/confirm-payment`, payload);
    console.log('[ZaloPay Webhook] Booking status updated successfully', response.data);
  } catch (err) {
    console.error('[ZaloPay Webhook] Failed to update booking:', err.message, err.response && err.response.data);
  }
  return res.json({ return_code: 1, return_message: 'success' });
}

// Truy vấn bookingId từ app_trans_id (orderId) trong bảng bookings (hoặc bảng mapping nếu có)
async function getBookingIdByAppTransId(apptransid) {
  // Giả sử bảng bookings có cột app_trans_id lưu orderId ZaloPay
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  console.log('[getBookingIdByAppTransId] apptransid:', apptransid);
  const result = await pool.query('SELECT booking_id FROM bookings WHERE app_trans_id = $1 LIMIT 1', [apptransid]);
  console.log('[getBookingIdByAppTransId] query result:', result.rows);
  if (result.rows.length > 0) {
    console.log('[getBookingIdByAppTransId] found bookingId:', result.rows[0].booking_id);
    return result.rows[0].booking_id;
  }
  console.log('[getBookingIdByAppTransId] bookingId not found for apptransid:', apptransid);
  return null;
}

module.exports = {
  createZaloPayPayment,
  handleWebhook,
  getBookingIdByAppTransId
};
