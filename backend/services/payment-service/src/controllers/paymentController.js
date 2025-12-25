const momoService = require('../services/gateways/momoService');
const payosService = require('../services/gateways/payosService');
const zalopayService = require('../services/gateways/zalopayService');
const cardService = require('../services/gateways/cardService');

exports.createPayment = async (req, res) => {
  try {
    const { paymentMethod, ...payload } = req.body;

    let result;
    switch (paymentMethod) {
      case 'momo':
        result = await momoService.createPayment(payload);
        break;
      case 'payos':
        result = await payosService.createPayment(payload);
        break;
      case 'zalopay':
        result = await zalopayService.createPayment(payload);
        break;
      case 'card':
        result = await cardService.createPayment(payload);
        break;
      default:
        return res.status(400).json({ message: 'Invalid payment method' });
    }

    res.json(result);
  } catch (err) {
    console.error('[createPayment]', err);
    res.status(500).json({ message: err.message });
  }
};
