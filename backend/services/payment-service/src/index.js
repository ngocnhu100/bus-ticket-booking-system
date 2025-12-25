const express = require('express');
require('dotenv').config();

const app = express();
const webhookController = require('./controllers/webhookController');
const paymentController = require('./controllers/paymentController');

app.use(express.json());


// MoMo: ký trên field, cần object, dùng express.json()
app.post(
  '/webhooks/momo',
  express.json(),
  webhookController.handleWebhook
);

// Các gateway khác: ký trên raw body, dùng express.raw()
app.post(
  '/webhooks/:gateway',
  express.raw({ type: 'application/json' }),
  webhookController.handleWebhook
);

app.post('/api/payment', paymentController.createPayment);

app.listen(process.env.PORT || 3005, () => {
  console.log('Payment service running');
});
