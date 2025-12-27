// webhookController.js
// Nhận webhook từ các gateway, route về service tương ứng

const momoService = require('../services/gateways/momoService');
const zalopayService = require('../services/gateways/zalopayService');
const payosService = require('../services/gateways/payosService');
const cardService = require('../services/gateways/cardService');

exports.handleWebhook = async function (req, res, gateway) {
  try {
    // Chỉ parse thủ công nếu là zalopay hoặc card (dùng raw body)
    let parsedBody = req.body;
    if (Buffer.isBuffer(req.body)) {
      const rawBody = req.body.toString('utf8');
      parsedBody = JSON.parse(rawBody);
      req.rawBody = rawBody;
    }
    req.parsedBody = parsedBody;
    switch (gateway) {
      case 'momo':
        // MoMo chỉ cần req.body (đã là object do express.json)
        await momoService.handleWebhook(req, res);
        break;
      case 'zalopay':
        // ZaloPay cần req.parsedBody và req.rawBody
        await zalopayService.handleWebhook(req, res);
        break;
      case 'payos':
        // PayOS chỉ cần req.body (đã là object do express.json)
        await payosService.handleWebhook(req, res);
        break;
      case 'card':
        // Stripe cần rawBody để verify signature
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
