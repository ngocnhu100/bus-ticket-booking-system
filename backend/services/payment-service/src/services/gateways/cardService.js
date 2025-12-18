// cardService.js (gateway)
module.exports = {
  async handleWebhook(req, res) {
    res.status(200).json({ message: 'Card webhook received (stub)' });
  },
};
