// test-payos-signature.js
// Script tạo payload và signature đúng chuẩn PayOS để test webhook
const crypto = require('crypto');

// Đọc key từ .env ngay tại thư mục payment-service
require('dotenv').config({ path: './.env' });
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY;

// Data mẫu, có thể sửa lại cho giống thực tế
const data = {
  orderCode: 123,
  amount: 3000,
  description: 'VQRIO123',
  // Thêm các field khác nếu cần
};

// Build canonical string: sort key alphabet, key=value&key=value
const sortedKeys = Object.keys(data).sort();
const canonicalString = sortedKeys.map(key => `${key}=${data[key]}`).join('&');

const signature = crypto.createHmac('sha256', PAYOS_CHECKSUM_KEY).update(canonicalString).digest('hex');

const payload = {
  code: '00',
  desc: 'success',
  data,
  signature
};

console.log('Canonical string:', canonicalString);
console.log('Signature:', signature);
console.log('Payload JSON:', JSON.stringify(payload, null, 2));

// Gửi thử webhook (nếu muốn):
// const axios = require('axios');
// axios.post('http://localhost:3005/api/payment/webhook', payload)
//   .then(res => console.log(res.data))
//   .catch(err => console.error(err.response?.data || err));
