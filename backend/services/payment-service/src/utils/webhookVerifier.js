// utils/webhookVerifier.js
const crypto = require('crypto');

/**
 * Verify PayOS webhook signature
 * @param {Request} req - Express request
 * @param {string} secret - PAYOS_CHECKSUM_KEY
 * @returns {boolean}
 */
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

// Build canonical query string payouts
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

function verifyPayOSSignature(req, secret) {
  // Lấy signature từ header hoặc body
  let signature = req.headers['x-payos-signature'];
  if (!signature && req.body && req.body.signature) {
    signature = req.body.signature;
  }
  if (!signature) return false;

  // Chuẩn payouts: chỉ ký object data (không ký signature)
  let data = req.body;
  if (data && typeof data === 'object' && 'signature' in data) {
    const { signature: _sig, ...rest } = data;
    data = rest;
  }
  // Deep sort object
  const sorted = deepSortObj(data, false);
  // Build canonical query string
  const canonicalString = buildPayoutsQueryString(sorted);
  console.log('--- VERIFY PAYOUTS ---');
  console.log('Canonical string backend:', canonicalString);
    console.log('Secret key backend:', JSON.stringify(secret), Buffer.from(secret).toString('hex'));
  const expected = crypto.createHmac('sha256', secret)
    .update(canonicalString)
    .digest('hex');
  console.log('Expected signature backend:', expected);
  console.log('Received signature:', signature);
  return signature === expected;
}

module.exports = { verifyPayOSSignature };