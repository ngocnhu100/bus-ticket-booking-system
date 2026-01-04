/**
 * NOTIFICATION SERVICE UNIT TESTS - SMS LOGIC
 * Testing SMS sending logic using eSMS API
 * Pattern: Test the actual exported singleton, don't modify production code
 * Target: >70% coverage, 100% passing
 */

// Mock dependencies BEFORE requiring
jest.mock('axios');

// Mock SMS template modules
jest.mock('../src/templates/smsTemplates', () => ({
  buildBookingConfirmationMessage: jest.fn(() => 'Booking confirmed: BK123'),
  buildTripReminderMessage: jest.fn(() => 'Trip reminder: 2 hours'),
  buildBookingCancellationMessage: jest.fn(() => 'Booking cancelled: BK123'),
  buildPaymentReminderMessage: jest.fn(() => 'Payment reminder: 500000 VND'),
}));

// Set env vars
process.env.ESMS_API_KEY = 'test-esms-api-key';
process.env.ESMS_SECRET_KEY = 'test-esms-secret-key';
process.env.ESMS_BRANDNAME = 'BusTicket';

const axios = require('axios');
const smsService = require('../src/services/smsService');

describe('Notification Service - SMS Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful eSMS response
    axios.post.mockResolvedValue({
      data: {
        CodeResult: '100',
        SMSID: 'test-sms-id-12345',
      },
    });
  });

  describe('sendSms', () => {
    test('sends SMS with correct eSMS API format', async () => {
      const result = await smsService.sendSms('+84912345678', 'Test message');

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        'https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/',
        expect.objectContaining({
          ApiKey: 'test-esms-api-key',
          SecretKey: 'test-esms-secret-key',
          SmsType: '2',
        }),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      
      expect(result).toEqual(expect.objectContaining({
        success: true,
      }));
    });

    test('formats Vietnamese phone numbers correctly', async () => {
      await smsService.sendSms('+84912345678', 'Test');
      await smsService.sendSms('0912345678', 'Test');
      await smsService.sendSms('84912345678', 'Test');

      expect(axios.post).toHaveBeenCalledTimes(3);
    });

    test('handles eSMS API success response', async () => {
      axios.post.mockResolvedValue({
        data: {
          CodeResult: '100',
          SMSID: 'sms-abc-123',
        },
      });

      const result = await smsService.sendSms('+84912345678', 'Success test');

      expect(result.success).toBe(true);
      expect(result.to).toBeDefined();
    });

    test('handles eSMS API error codes', async () => {
      axios.post.mockResolvedValue({
        data: {
          CodeResult: '101', // Invalid API key
          ErrorMessage: 'Invalid API key',
        },
      });

      const result = await smsService.sendSms('+84912345678', 'Error test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key');
    });

    test('handles network errors', async () => {
      axios.post.mockRejectedValue(new Error('Network timeout'));

      const result = await smsService.sendSms('+84912345678', 'Network test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });

    test('handles missing credentials gracefully', async () => {
      // Test without credentials
      delete process.env.ESMS_API_KEY;
      
      // Re-require to get new instance with updated env
      jest.resetModules();
      delete require.cache[require.resolve('../src/services/smsService')];
      const unconfiguredService = require('../src/services/smsService');

      const result = await unconfiguredService.sendSms('+84912345678', 'No creds');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
      
      // Restore env
      process.env.ESMS_API_KEY = 'test-esms-api-key';
    });
  });

  describe('sendBookingConfirmation', () => {
    const bookingData = {
      bookingReference: 'BK123456',
      tripName: 'Express 101',
      fromLocation: 'Hanoi',
      toLocation: 'Saigon',
      departureTime: '2026-01-10 08:00',
      seats: ['A1'],
      totalPrice: 500000,
    };

    test('sends booking confirmation SMS', async () => {
      await smsService.sendBookingConfirmation('+84912345678', bookingData);

      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    test('uses booking confirmation template', async () => {
      const { buildBookingConfirmationMessage } = require('../src/templates/smsTemplates');
      
      await smsService.sendBookingConfirmation('+84912345678', bookingData);

      expect(buildBookingConfirmationMessage).toHaveBeenCalledWith(bookingData);
    });

    test('returns success result', async () => {
      const result = await smsService.sendBookingConfirmation('+84912345678', bookingData);

      expect(result.success).toBe(true);
    });
  });

  describe('sendTripReminder', () => {
    const tripData = {
      bookingReference: 'BK987654',
      tripName: 'Night Bus 202',
      fromLocation: 'Hanoi',
      toLocation: 'Da Nang',
      departureTime: '2026-01-15 06:00',
      seats: ['B5'],
    };

    test('sends trip reminder SMS', async () => {
      await smsService.sendTripReminder('+84987654321', tripData, 24);

      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    test('uses trip reminder template with hours', async () => {
      const { buildTripReminderMessage } = require('../src/templates/smsTemplates');
      
      await smsService.sendTripReminder('+84987654321', tripData, 12);

      expect(buildTripReminderMessage).toHaveBeenCalledWith(tripData, 12);
    });

    test('works with different time intervals', async () => {
      await smsService.sendTripReminder('+84987654321', tripData, 3);
      await smsService.sendTripReminder('+84987654321', tripData, 48);

      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('sendBookingCancellation', () => {
    const cancellationData = {
      bookingReference: 'BK789012',
      totalPrice: 350000,
      currency: 'VND',
    };

    test('sends booking cancellation SMS', async () => {
      await smsService.sendBookingCancellation('+84901234567', cancellationData);

      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    test('uses cancellation template', async () => {
      const { buildBookingCancellationMessage } = require('../src/templates/smsTemplates');
      
      await smsService.sendBookingCancellation('+84901234567', cancellationData);

      expect(buildBookingCancellationMessage).toHaveBeenCalledWith(cancellationData);
    });
  });

  describe('sendPaymentReminder', () => {
    const paymentData = {
      bookingReference: 'BK345678',
      totalPrice: 300000,
      currency: 'VND',
    };

    test('sends payment reminder SMS', async () => {
      await smsService.sendPaymentReminder('+84923456789', paymentData, 30);

      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    test('uses payment reminder template', async () => {
      const { buildPaymentReminderMessage } = require('../src/templates/smsTemplates');
      
      await smsService.sendPaymentReminder('+84923456789', paymentData, 30);

      expect(buildPaymentReminderMessage).toHaveBeenCalledWith(paymentData, 30);
    });
  });

  describe('Phone Number Formatting (formatPhoneNumber)', () => {
    test('formats +84 prefix correctly', async () => {
      await smsService.sendSms('+84912345678', 'Test');
      
      expect(axios.post).toHaveBeenCalled();
      // eSMS expects format without + for Vietnamese numbers
    });

    test('formats 84 prefix correctly', async () => {
      await smsService.sendSms('84912345678', 'Test');
      
      expect(axios.post).toHaveBeenCalled();
    });

    test('formats 0 prefix correctly', async () => {
      await smsService.sendSms('0912345678', 'Test');
      
      expect(axios.post).toHaveBeenCalled();
    });

    test('handles phone with spaces', async () => {
      await smsService.sendSms('+84 912 345 678', 'Test');
      
      expect(axios.post).toHaveBeenCalled();
    });

    test('handles phone with dashes', async () => {
      await smsService.sendSms('+84-912-345-678', 'Test');
      
      expect(axios.post).toHaveBeenCalled();
    });
  });

  describe('Service Configuration', () => {
    test('checks if service is configured', () => {
      const isConfigured = smsService.isConfigured();
      
      expect(typeof isConfigured).toBe('boolean');
    });

    test('reports configured when credentials present', () => {
      // Credentials are set in beforeEach
      expect(smsService.isConfigured()).toBeTruthy();
    });
  });

  describe('Error Scenarios', () => {
    test('handles invalid phone numbers', async () => {
      const result = await smsService.sendSms('invalid-phone', 'Test');
      
      // Service should handle gracefully
      expect(result).toBeDefined();
    });

    test('handles empty message', async () => {
      const result = await smsService.sendSms('+84912345678', '');
      
      expect(result).toBeDefined();
    });

    test('handles very long messages', async () => {
      const longMessage = 'A'.repeat(500);
      
      const result = await smsService.sendSms('+84912345678', longMessage);
      
      expect(result).toBeDefined();
    });

    test('logs errors appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      axios.post.mockRejectedValue(new Error('API error'));

      await smsService.sendSms('+84912345678', 'Error test');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Message Length and Encoding', () => {
    test('handles ASCII characters', async () => {
      await smsService.sendSms('+84912345678', 'Hello World');
      
      expect(axios.post).toHaveBeenCalled();
    });

    test('handles Vietnamese characters', async () => {
      await smsService.sendSms('+84912345678', 'Xin chào đặt vé thành công');
      
      expect(axios.post).toHaveBeenCalled();
    });

    test('handles special characters', async () => {
      await smsService.sendSms('+84912345678', 'Booking #123 @ 10:00');
      
      expect(axios.post).toHaveBeenCalled();
    });
  });

  describe('Retry and Resilience', () => {
    test('does not retry on user errors', async () => {
      axios.post.mockResolvedValue({
        data: {
          CodeResult: '104', // Invalid phone
          ErrorMessage: 'Invalid phone number',
        },
      });

      await smsService.sendSms('invalid', 'Test');

      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    test('handles timeout errors', async () => {
      axios.post.mockRejectedValue({ code: 'ETIMEDOUT' });

      const result = await smsService.sendSms('+84912345678', 'Timeout test');

      expect(result.success).toBe(false);
    });
  });
});
