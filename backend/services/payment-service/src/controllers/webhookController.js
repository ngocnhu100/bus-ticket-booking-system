const momoService = require('../services/gateways/momoService');
const payosService = require('../services/gateways/payosService');
const zalopayService = require('../services/gateways/zalopayService');
const cardService = require('../services/gateways/cardService');
const paymentStatusService = require('../services/paymentStatusService');

exports.handleWebhook = async (req, res) => {
  const { gateway } = req.params;

  try {
    let parsed;

    switch (gateway) {
      case 'momo':
        parsed = momoService.parseWebhook(req);
        break;
      case 'payos':
        parsed = payosService.parseWebhook(req);
        break;
      case 'zalopay':
        parsed = zalopayService.parseWebhook(req);
        break;
      case 'card':
        parsed = cardService.parseWebhook(req);
        break;
      default:
        return res.status(400).json({ message: 'Unknown gateway' });
    }

    await paymentStatusService.handlePaymentResult(parsed);
    res.json({ received: true });
  } catch (err) {
    console.error('[Webhook]', err);
    res.status(400).json({ message: err.message });
  }
};
