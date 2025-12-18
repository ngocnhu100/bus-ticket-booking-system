// zalopayService.js (gateway)
module.exports = {
  async handleWebhook(req, res) {
    res.status(200).json({ message: 'ZaloPay webhook received (stub)' });
  },
};
