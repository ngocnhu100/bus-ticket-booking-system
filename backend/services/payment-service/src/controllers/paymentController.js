// controllers/paymentController.js
const payosService = require('../services/gateways/payosService');
const momoService = require('../services/gateways/momoService');
const { verifyPayOSSignature } = require('../utils/webhookVerifier');

async function createPayment(req, res) {
  try {
    const body = req.body;
    // DEBUG LOG: print all relevant info
    console.log('[PaymentService] createPayment called');
    console.log('req.body:', body);
    console.log('paymentMethod:', body.paymentMethod);
    console.log('headers:', req.headers);
    if (body.paymentMethod === 'momo') {
      // Tích hợp MoMo
      const momoResult = await momoService.createMomoPayment({
        amount: body.amount,
        orderInfo: body.description || 'Thanh toán MoMo',
        bookingId: body.bookingId,
      });
      if (momoResult && momoResult.payUrl) {
        return res.json({
          success: true,
          paymentUrl: momoResult.payUrl,
          qrCode: momoResult.qrCodeUrl || undefined,
          ...momoResult,
        });
      } else {
        return res.status(400).json({ success: false, message: momoResult.message || 'MoMo payment failed', ...momoResult });
      }
    }
    // Mặc định PayOS
    const result = await payosService.createPayment(body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Create payment failed', error: err.message });
  }
}

function paymentWebhook(req, res) {
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
  if (!checksumKey) {
    console.error('PAYOS_CHECKSUM_KEY is not set in environment variables');
    return res.status(500).json({ message: 'Server misconfiguration: missing PAYOS_CHECKSUM_KEY' });
  }
  // Log chi tiết request để debug signature
  let signature = req.headers['x-payos-signature'];
  if (!signature && req.body && req.body.signature) {
    signature = req.body.signature;
  }
  // Hash raw body đúng chuẩn PayOS
  const payload = req.rawBody || JSON.stringify(req.body);
  const crypto = require('crypto');
  const expected = crypto.createHmac('sha256', checksumKey).update(payload).digest('hex');
  console.log('--- PAYOS WEBHOOK DEBUG ---');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('ChecksumKey:', checksumKey);
  console.log('Signature from PayOS:', signature);
  console.log('Expected signature:', expected);
  console.log('Payload for hash (raw body):', payload);
  if (!signature || signature !== expected) {
    console.error('Invalid signature!');
    return res.status(401).json({ message: 'Invalid payload' });
  }
  // TODO: xử lý dữ liệu hợp lệ, ví dụ cập nhật trạng thái payment
  console.log('Webhook valid:', req.body);
  res.status(200).json({ message: 'Webhook received' });
}

module.exports = {
  createPayment,
  paymentWebhook,
};
