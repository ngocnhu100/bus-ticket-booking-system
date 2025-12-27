// controllers/zalopayController.js
const { getBookingIdByAppTransId } = require('../services/gateways/zalopayService');

// GET /payments/zalopay/booking-id?apptransid=... hoặc ?app_trans_id=...
async function getBookingIdFromAppTransId(req, res) {
  const apptransid = req.query.apptransid || req.query.app_trans_id;
  console.log('[DEBUG] Lookup bookingId called:', {
    url: req.originalUrl,
    query: req.query,
    apptransid
  });
  if (!apptransid) {
    return res.status(400).json({ success: false, message: 'Missing apptransid' });
  }
  try {
    const bookingId = await getBookingIdByAppTransId(apptransid);
    if (bookingId) {
      return res.json({ success: true, bookingId });
    } else {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getBookingIdFromAppTransId };
