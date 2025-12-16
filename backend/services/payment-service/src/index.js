// index.js
const express = require('express');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;


// Route webhook cho từng gateway
const webhookController = require('./controllers/webhookController');
app.post('/webhooks/:gateway', express.raw({ type: 'application/json' }), webhookController.handleWebhook);


// Các route khác dùng express.json bình thường
app.use(express.json());
app.post('/api/payment', require('./controllers/paymentController').createPayment);

// Route test webhook payouts
const { verifyPayOSSignature } = require('./utils/webhookVerifier');
app.post('/api/payment/webhook-payouts', (req, res) => {
  console.log('--- WEBHOOK PAYOUTS TEST ---');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  const secret = process.env.PAYOS_CHECKSUM_KEY;
  if (!secret) {
    console.error('PAYOS_CHECKSUM_KEY is not set!');
    return res.status(500).json({ success: false, message: 'PAYOS_CHECKSUM_KEY is not set in environment.' });
  }
  const isValid = verifyPayOSSignature(req, secret);
  console.log('Signature valid:', isValid);
  if (isValid) {
    res.json({ success: true, message: 'Webhook payouts signature hợp lệ!' });
  } else {
    res.status(400).json({ success: false, message: 'Webhook payouts signature KHÔNG hợp lệ!' });
  }
});





function webhookHandler(req, res) {
  let parsed;
  const rawBody = req.body.toString('utf8');
  try {
    parsed = JSON.parse(rawBody);
  } catch (e) {
    console.error('Parse error', e);
    res.status(200).json({ message: 'Invalid JSON' });
    return;
  }
  // Trả HTTP 200 ngay, không block, không throw
  res.status(200).json({ message: 'Webhook received' });
  setImmediate(async () => {
    try {
      console.log('[MoMo Webhook] payload:', parsed);
      // Lấy bookingId từ extraData (ưu tiên JSON, fallback string)
      let bookingId = null;
      if (parsed.extraData) {
        try {
          const extra = JSON.parse(parsed.extraData);
          bookingId = extra.bookingId || parsed.extraData;
        } catch {
          bookingId = parsed.extraData;
        }
      }
      const axios = require('axios');
      const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://booking-service:3004';
      const NOTIFICATION_URL = process.env.NOTIFICATION_URL || 'http://notification-service:3003/webhook';
      const eventTimestamp = new Date().toISOString();
      if (parsed.resultCode === 0) {
        if (bookingId) {
          try {
            await axios.post(
              `${BOOKING_SERVICE_URL}/internal/${bookingId}/confirm-payment`
            );
            console.log(`[MoMo Webhook] Đã xác nhận thanh toán cho bookingId: ${bookingId}`);
            // Gửi webhook event payment.completed
            const payload = {
              event: 'payment.completed',
              timestamp: eventTimestamp,
              data: {
                bookingId,
                status: 'PAID',
                gateway: 'momo',
                transactionId: parsed.transId || parsed.orderId || null
              }
            };
            const signature = createWebhookSignature(payload);
            await axios.post(NOTIFICATION_URL, payload, {
              headers: {
                'X-Webhook-Signature': signature,
                'X-Request-ID': parsed.requestId || ''
              }
            });
          } catch (err) {
            console.error('[MoMo Webhook] Lỗi gọi booking-service hoặc gửi webhook:', err.message);
          }
        } else {
          console.error('[MoMo Webhook] Không tìm thấy bookingId!');
        }
      } else {
        // Thất bại hoặc bị hủy: gửi webhook event payment.failed
        if (bookingId) {
          const payload = {
            event: 'payment.failed',
            timestamp: eventTimestamp,
            data: {
              bookingId,
              status: 'CANCELLED',
              gateway: 'momo',
              reason: parsed.message || parsed.localMessage || 'cancelled',
              transactionId: parsed.transId || parsed.orderId || null
            }
          };
          const signature = createWebhookSignature(payload);
          try {
            await axios.post(NOTIFICATION_URL, payload, {
              headers: {
                'X-Webhook-Signature': signature,
                'X-Request-ID': parsed.requestId || ''
              }
            });
            console.warn('[MoMo Webhook] Đã gửi event payment.failed:', payload);
          } catch (err) {
            console.error('[MoMo Webhook] Lỗi gửi webhook payment.failed:', err.message);
          }
        } else {
          console.error('[MoMo Webhook] Không tìm thấy bookingId khi gửi payment.failed!');
        }
      }
    } catch (err) {
      console.error('[MoMo Webhook] Lỗi xử lý:', err);
    }
  });

  // Hàm tạo chữ ký HMAC SHA256 cho webhook
  function createWebhookSignature(payload) {
    const secret = process.env.WEBHOOK_SECRET || 'webhook_secret';
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  }
}

// Đảm bảo không có block code nào bị thiếu dấu đóng
app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
});