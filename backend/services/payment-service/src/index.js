// index.js
const express = require('express');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;


// Route webhook: PHẢI dùng express.raw trước express.json
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), webhookHandler);


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
  setImmediate(() => {
    // TODO business logic
  });
}

// Đảm bảo không có block code nào bị thiếu dấu đóng
app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
});