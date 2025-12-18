// test/payoutsWebhookTest.js
// Script test webhook payouts PayOS local
const axios = require('axios');
const crypto = require('crypto');

// Deep sort object, giữ nguyên thứ tự array
function deepSortObj(obj, sortArrays = false) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      const value = obj[key];
      if (Array.isArray(value)) {
        acc[key] = sortArrays
          ? value
              .map((item) =>
                typeof item === 'object' && item !== null ? deepSortObj(item, sortArrays) : item,
              )
              .sort((a, b) =>
                typeof a !== 'object' && typeof b !== 'object'
                  ? String(a).localeCompare(String(b))
                  : JSON.stringify(a).localeCompare(JSON.stringify(b))
              )
          : value.map((item) =>
              typeof item === 'object' && item !== null ? deepSortObj(item, sortArrays) : item
            );
      } else if (typeof value === 'object' && value !== null) {
        acc[key] = deepSortObj(value, sortArrays);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});
}

function buildPayoutsQueryString(obj) {
  return Object.keys(obj)
    .map((key) => {
      let value = obj[key];
      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        value = JSON.stringify(value);
      }
      if (value === null || value === undefined) value = '';
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .join('&');
}

// === Dữ liệu mẫu ===
const payoutChecksumKey = '3bc6465ad5c11e8440eff8d1fc832104383c7f0d55c952a8a7926b019c8baa59';
const payoutData = {
  code: '00',
  desc: 'success',
  data: {
    payouts: [
      {
        id: 'batch_8f9520b9341144f38b9f5fbfa317db8e',
        referenceId: 'payout_1753061728877',
        transactions: [
          {
            id: 'batch_txn_fdb348c0570a4cb99009da22f9504898',
            referenceId: 'payout_1753061728877_0',
            amount: 2000,
            description: 'batch payout',
            toBin: '970422',
            toAccountNumber: '0123456789',
            toAccountName: 'NGUYEN VAN A',
            reference: '103269845',
            transactionDatetime: '2025-07-21T08:35:40+07:00',
            errorMessage: null,
            errorCode: null,
            state: 'SUCCEEDED',
          }
        ],
        category: ['salary'],
        approvalState: 'COMPLETED',
        createdAt: '2025-07-21T08:35:34+07:00',
      },
    ],
    pagination: {
      limit: 10,
      offset: 0,
      total: 1,
      count: 1,
      hasMore: false,
    },
  },
};

// Tạo signature đúng chuẩn payouts
function createSignatureNode(secretKey, jsonData) {
  const sortedData = deepSortObj(jsonData, false);
  const queryString = buildPayoutsQueryString(sortedData);
  console.log('Canonical string script:', queryString);
  console.log('Secret key script:', JSON.stringify(secretKey), Buffer.from(secretKey).toString('hex'));
  const sig = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');
  console.log('Signature script:', sig);
  return sig;
}

async function testWebhook() {
  // Tạo signature cho object data (không ký trường signature)
  const dataToSign = { ...payoutData };
  delete dataToSign.signature;
  const signature = createSignatureNode(payoutChecksumKey, dataToSign);
  // Gửi request tới endpoint webhook payouts
  try {
    const res = await axios.post(
      'http://localhost:3005/api/payment/webhook-payouts',
      { ...payoutData, signature },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-payos-signature': signature,
        },
      }
    );
    console.log('Webhook payouts response:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('Webhook payouts error:', err.response.data);
    } else {
      console.error('Webhook payouts error:', err.message);
    }
  }
}

testWebhook();
