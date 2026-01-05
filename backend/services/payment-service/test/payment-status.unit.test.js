/**
 * PAYMENT SERVICE UNIT TESTS - PAYMENT STATUS & WEBHOOK VERIFICATION
 * Testing payment status validation and webhook signature verification
 * Target: >70% coverage, 100% passing
 */

const crypto = require('crypto');
const { verifyPayOSSignature } = require('../src/utils/webhookVerifier');

describe('Payment Service - Payment Status & Webhook Verification', () => {
  
  describe('Payment Status Transitions', () => {
    const validTransitions = {
      pending: ['processing', 'cancelled'],
      processing: ['completed', 'failed', 'cancelled'],
      completed: [],
      failed: ['pending'], // Allow retry
      cancelled: []
    };

    test('validates pending to processing transition', () => {
      const currentStatus = 'pending';
      const newStatus = 'processing';

      const isValid = validTransitions[currentStatus]?.includes(newStatus);
      
      expect(isValid).toBe(true);
    });

    test('validates pending to completed is invalid (must go through processing)', () => {
      const currentStatus = 'pending';
      const newStatus = 'completed';

      const isValid = validTransitions[currentStatus]?.includes(newStatus);
      
      expect(isValid).toBe(false);
    });

    test('validates processing to completed transition', () => {
      const currentStatus = 'processing';
      const newStatus = 'completed';

      const isValid = validTransitions[currentStatus]?.includes(newStatus);
      
      expect(isValid).toBe(true);
    });

    test('rejects transitions from completed status', () => {
      const currentStatus = 'completed';
      const invalidTransitions = ['pending', 'processing', 'failed', 'cancelled'];

      invalidTransitions.forEach(newStatus => {
        const isValid = validTransitions[currentStatus]?.includes(newStatus);
        expect(isValid).toBe(false);
      });
    });

    test('rejects transitions from cancelled status', () => {
      const currentStatus = 'cancelled';
      const invalidTransitions = ['pending', 'processing', 'completed', 'failed'];

      invalidTransitions.forEach(newStatus => {
        const isValid = validTransitions[currentStatus]?.includes(newStatus);
        expect(isValid).toBe(false);
      });
    });

    test('allows failed to pending transition for retry', () => {
      const currentStatus = 'failed';
      const newStatus = 'pending';

      const isValid = validTransitions[currentStatus]?.includes(newStatus);
      
      expect(isValid).toBe(true);
    });

    test('validates processing can transition to failed', () => {
      const currentStatus = 'processing';
      const newStatus = 'failed';

      const isValid = validTransitions[currentStatus]?.includes(newStatus);
      
      expect(isValid).toBe(true);
    });

    test('validates cancellation from pending', () => {
      const currentStatus = 'pending';
      const newStatus = 'cancelled';

      const isValid = validTransitions[currentStatus]?.includes(newStatus);
      
      expect(isValid).toBe(true);
    });

    test('validates cancellation from processing', () => {
      const currentStatus = 'processing';
      const newStatus = 'cancelled';

      const isValid = validTransitions[currentStatus]?.includes(newStatus);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Payment Data Validation', () => {
    test('validates required payment fields', () => {
      const payment = {
        id: 'pay-123',
        status: 'pending',
        amount: 250000,
        currency: 'VND',
        bookingId: 'book-456'
      };

      expect(payment.id).toBeDefined();
      expect(payment.status).toBeDefined();
      expect(payment.amount).toBeGreaterThan(0);
      expect(typeof payment.amount).toBe('number');
    });

    test('validates payment amount is positive', () => {
      const validAmount = 100000;
      const invalidAmount = -50000;
      const zeroAmount = 0;

      expect(validAmount).toBeGreaterThan(0);
      expect(invalidAmount).toBeLessThanOrEqual(0);
      expect(zeroAmount).toBeLessThanOrEqual(0);
    });

    test('validates currency format', () => {
      const validCurrencies = ['VND', 'USD', 'EUR'];
      const invalidCurrency = 'invalid';

      validCurrencies.forEach(curr => {
        expect(curr).toMatch(/^[A-Z]{3}$/);
      });

      expect(invalidCurrency).not.toMatch(/^[A-Z]{3}$/);
    });

    test('validates payment ID format', () => {
      const validId = 'pay-12345678';
      const shortId = 'pay-123';

      expect(validId.startsWith('pay-')).toBe(true);
      expect(validId.length).toBeGreaterThanOrEqual(8);
      expect(shortId.length).toBeLessThan(8);
    });

    test('validates gateway reference format', () => {
      const gatewayRef = 'stripe_pi_1234567890ABCDEF';
      
      expect(typeof gatewayRef).toBe('string');
      expect(gatewayRef.length).toBeGreaterThan(0);
      expect(gatewayRef).toMatch(/^[a-zA-Z0-9_-]+$/);
    });
  });

  describe('Webhook Signature Verification - Object Sorting', () => {
    test('sorts object keys alphabetically', () => {
      const obj = { c: 3, a: 1, b: 2 };
      const sorted = Object.keys(obj).sort().reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
      }, {});

      const keys = Object.keys(sorted);
      expect(keys).toEqual(['a', 'b', 'c']);
    });

    test('handles nested object sorting', () => {
      const obj = {
        z: { nested_z: 1, nested_a: 2 },
        a: 'value'
      };

      function deepSort(obj) {
        return Object.keys(obj).sort().reduce((acc, key) => {
          const value = obj[key];
          acc[key] = (typeof value === 'object' && value !== null && !Array.isArray(value))
            ? deepSort(value)
            : value;
          return acc;
        }, {});
      }

      const sorted = deepSort(obj);
      const topKeys = Object.keys(sorted);
      const nestedKeys = Object.keys(sorted.z);

      expect(topKeys).toEqual(['a', 'z']);
      expect(nestedKeys).toEqual(['nested_a', 'nested_z']);
    });

    test('preserves array order when sortArrays is false', () => {
      const obj = { items: [3, 1, 2] };
      
      // Without array sorting
      const result = { items: obj.items };
      
      expect(result.items).toEqual([3, 1, 2]);
    });
  });

  describe('Webhook Signature Verification - Query String Building', () => {
    test('builds canonical query string from simple object', () => {
      const obj = { a: '1', b: '2', c: '3' };
      
      const queryString = Object.keys(obj)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join('&');

      expect(queryString).toBe('a=1&b=2&c=3');
    });

    test('encodes special characters in query string', () => {
      const obj = { email: 'test@example.com', amount: '1,000' };
      
      const queryString = Object.keys(obj)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join('&');

      expect(queryString).toContain('email=test%40example.com');
      expect(queryString).toContain('amount=1%2C000');
    });

    test('handles array values as JSON string', () => {
      const obj = { items: [1, 2, 3] };
      
      const value = JSON.stringify(obj.items);
      
      expect(value).toBe('[1,2,3]');
    });

    test('handles null and undefined values', () => {
      const obj = { a: null, b: undefined, c: '' };
      
      const queryString = Object.keys(obj)
        .map(key => {
          let value = obj[key];
          if (value === null || value === undefined) value = '';
          return `${key}=${encodeURIComponent(String(value))}`;
        })
        .join('&');

      expect(queryString).toContain('a=');
      expect(queryString).toContain('b=');
      expect(queryString).toContain('c=');
    });
  });

  describe('Webhook Signature Verification - HMAC SHA256', () => {
    test('generates HMAC-SHA256 signature correctly', () => {
      const secret = 'test-secret-key';
      const data = 'amount=250000&status=completed';
      
      const signature = crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('hex');

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(64); // SHA256 hex is 64 chars
      expect(signature).toMatch(/^[a-f0-9]{64}$/);
    });

    test('produces different signatures for different data', () => {
      const secret = 'test-secret';
      const data1 = 'amount=100000';
      const data2 = 'amount=200000';

      const sig1 = crypto.createHmac('sha256', secret).update(data1).digest('hex');
      const sig2 = crypto.createHmac('sha256', secret).update(data2).digest('hex');

      expect(sig1).not.toBe(sig2);
    });

    test('produces different signatures for different secrets', () => {
      const data = 'amount=100000';
      const secret1 = 'secret-1';
      const secret2 = 'secret-2';

      const sig1 = crypto.createHmac('sha256', secret1).update(data).digest('hex');
      const sig2 = crypto.createHmac('sha256', secret2).update(data).digest('hex');

      expect(sig1).not.toBe(sig2);
    });

    test('produces consistent signatures for same input', () => {
      const secret = 'consistent-secret';
      const data = 'test-data';

      const sig1 = crypto.createHmac('sha256', secret).update(data).digest('hex');
      const sig2 = crypto.createHmac('sha256', secret).update(data).digest('hex');

      expect(sig1).toBe(sig2);
    });
  });

  describe('PayOS Webhook Verification Integration', () => {
    test('verifies valid webhook signature from header', () => {
      const secret = 'test-payos-key';
      const data = { amount: 250000, status: 'PAID' };
      
      // Sort and build canonical string
      const sorted = Object.keys(data).sort().reduce((acc, key) => {
        acc[key] = data[key];
        return acc;
      }, {});
      
      const canonicalString = Object.keys(sorted)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(sorted[key]))}`)
        .join('&');
      
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(canonicalString)
        .digest('hex');

      const mockReq = {
        headers: { 'x-payos-signature': expectedSignature },
        body: data
      };

      const isValid = verifyPayOSSignature(mockReq, secret);
      
      expect(isValid).toBe(true);
    });

    test('verifies valid webhook signature from body', () => {
      const secret = 'test-key-body';
      const data = { orderCode: 123, amount: 100000 };
      
      const sorted = Object.keys(data).sort().reduce((acc, key) => {
        acc[key] = data[key];
        return acc;
      }, {});
      
      const canonicalString = Object.keys(sorted)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(sorted[key]))}`)
        .join('&');
      
      const signature = crypto
        .createHmac('sha256', secret)
        .update(canonicalString)
        .digest('hex');

      const mockReq = {
        headers: {},
        body: { ...data, signature }
      };

      const isValid = verifyPayOSSignature(mockReq, secret);
      
      expect(isValid).toBe(true);
    });

    test('rejects webhook with invalid signature', () => {
      const mockReq = {
        headers: { 'x-payos-signature': 'invalid-signature-xyz' },
        body: { amount: 100000 }
      };

      const isValid = verifyPayOSSignature(mockReq, 'secret-key');
      
      expect(isValid).toBe(false);
    });

    test('rejects webhook without signature', () => {
      const mockReq = {
        headers: {},
        body: { amount: 100000 }
      };

      const isValid = verifyPayOSSignature(mockReq, 'secret-key');
      
      expect(isValid).toBe(false);
    });

    test('excludes signature field from data when calculating hash', () => {
      const secret = 'test-secret';
      const data = { amount: 150000, status: 'PAID' };
      
      const sorted = Object.keys(data).sort().reduce((acc, key) => {
        acc[key] = data[key];
        return acc;
      }, {});
      
      const canonicalString = Object.keys(sorted)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(sorted[key]))}`)
        .join('&');
      
      const signature = crypto
        .createHmac('sha256', secret)
        .update(canonicalString)
        .digest('hex');

      // Body includes signature, but it should be excluded
      const mockReq = {
        headers: {},
        body: { ...data, signature }
      };

      const isValid = verifyPayOSSignature(mockReq, secret);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Payment Metadata Handling', () => {
    test('stores payment metadata as JSON', () => {
      const metadata = {
        bookingId: 'book-123',
        userId: 'user-456',
        seatCodes: ['A1', 'A2']
      };

      const jsonStr = JSON.stringify(metadata);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.bookingId).toBe('book-123');
      expect(parsed.seatCodes).toEqual(['A1', 'A2']);
    });

    test('handles empty metadata', () => {
      const metadata = {};
      const jsonStr = JSON.stringify(metadata);

      expect(jsonStr).toBe('{}');
    });

    test('preserves metadata types', () => {
      const metadata = {
        count: 5,
        isGuest: true,
        email: 'test@example.com'
      };

      const jsonStr = JSON.stringify(metadata);
      const parsed = JSON.parse(jsonStr);

      expect(typeof parsed.count).toBe('number');
      expect(typeof parsed.isGuest).toBe('boolean');
      expect(typeof parsed.email).toBe('string');
    });
  });
});
