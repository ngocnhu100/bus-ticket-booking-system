// webhookController.js
// Nhận webhook từ các gateway, route về service tương ứng

const momoService = require('../services/gateways/momoService');
const zalopayService = require('../services/gateways/zalopayService');
const payosService = require('../services/gateways/payosService');
const cardService = require('../services/gateways/cardService');

exports.handleWebhook = async function (req, res) {
  const { gateway } = req.params;
  try {
    switch (gateway) {
      case 'momo':
        await momoService.handleWebhook(req, res);
        break;
      case 'zalopay':
        await zalopayService.handleWebhook(req, res);
        break;
      case 'payos':
        await payosService.handleWebhook(req, res);
        break;
      case 'card':
        await cardService.handleWebhook(req, res);
        break;
      default:
        res.status(400).json({ message: 'Unknown gateway' });
    }
  } catch (err) {
    console.error(`[WebhookController] Error:`, err);
    res.status(500).json({ message: 'Webhook processing error', error: err.message });
  }
};
