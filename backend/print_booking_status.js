// Script: print_booking_status.js
// In trạng thái thanh toán của booking
const http = require('http');

const bookingId = process.argv[2];
if (!bookingId) {
  console.error('Vui lòng truyền bookingId');
  process.exit(1);
}

http.get(`http://localhost:3004/${bookingId}/guest`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json && json.data) {
        console.log('payment_status:', json.data.payment_status);
        console.log('status:', json.data.status);
        console.log('full:', JSON.stringify(json.data, null, 2));
      } else {
        console.log('No data:', data);
      }
    } catch (e) {
      console.error('Parse error:', e);
      console.log('Raw:', data);
    }
  });
}).on('error', err => {
  console.error('Request error:', err);
});
