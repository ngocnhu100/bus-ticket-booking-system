const axios = require('axios');

const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL;

exports.handlePaymentResult = async ({
  bookingId,
  provider,
  providerTransactionId,
  status,
  raw
}) => {
  if (!bookingId) {
    throw new Error('Missing bookingId');
  }

  const url = `${BOOKING_SERVICE_URL}/internal/${bookingId}/confirm-payment`;
  try {
    console.log(`[PaymentStatusService] Gọi xác nhận thanh toán booking: ${bookingId} qua ${url}`);
    const response = await axios.post(url, {
      provider,
      providerTransactionId,
      status,
      raw
    });
    console.log(`[PaymentStatusService] Đã xác nhận thanh toán booking: ${bookingId}. Kết quả:`, response.data);
    return response.data;
  } catch (err) {
    console.error(`[PaymentStatusService] Lỗi khi xác nhận thanh toán booking: ${bookingId} qua ${url}`);
    if (err.response) {
      console.error('Response:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
    throw err;
  }
};
