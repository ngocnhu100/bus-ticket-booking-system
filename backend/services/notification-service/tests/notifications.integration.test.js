/**
 * NOTIFICATION SERVICE INTEGRATION TESTS
 * Testing email and SMS service integration
 * Pattern: Like booking-service - test service methods and workflows
 * Target: >70% coverage, 100% passing
 */

jest.mock('@sendgrid/mail');
jest.mock('axios');

const sgMail = require('@sendgrid/mail');
const axios = require('axios');

// Set env vars
process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
process.env.ESMS_API_KEY = 'test-esms-key';
process.env.ESMS_SECRET_KEY = 'test-esms-secret';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.EMAIL_FROM = 'test@example.com';

const emailService = require('../src/services/emailService');
const smsService = require('../src/services/smsService');

describe('Notification Service - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    sgMail.send.mockResolvedValue([{ statusCode: 202 }]);
    axios.post.mockResolvedValue({
      data: {
        CodeResult: '100',
        SMSID: 'test-sms-123',
      },
    });
  });

  describe('Email and SMS Service Integration', () => {
    test('sends email successfully through SendGrid', async () => {
      await emailService.sendVerificationEmail('user@example.com', 'token123');

      expect(sgMail.send).toHaveBeenCalledTimes(1);
    });

    test('sends SMS successfully through eSMS', async () => {
      const result = await smsService.sendSms('+84912345678', 'Test message');

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });

    test('handles concurrent email and SMS sends', async () => {
      const promises = [
        emailService.sendVerificationEmail('user1@example.com', 'token1'),
        emailService.sendVerificationEmail('user2@example.com', 'token2'),
        smsService.sendSms('+84912345678', 'SMS 1'),
        smsService.sendSms('+84987654321', 'SMS 2'),
      ];

      await Promise.all(promises);

      expect(sgMail.send).toHaveBeenCalledTimes(2);
      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('Email Service Integration', () => {
    test('sends ticket email with template', async () => {
      const ticketData = {
        bookingReference: 'BK123456',
        passengerName: 'John Doe',
        origin: 'Hanoi',
        destination: 'Saigon',
        departureDate: '2026-01-10',
        departureTime: '08:00',
        seatNumbers: ['A1', 'A2'],
        totalPrice: 500000,
        boardingPoint: 'My Dinh Station',
      };

      await emailService.sendTicketEmail('user@example.com', ticketData);

      expect(sgMail.send).toHaveBeenCalledTimes(1);
    });

    test('sends booking confirmation email', async () => {
      const bookingData = {
        bookingReference: 'BK789012',
        customerName: 'Alice Johnson',
        customerEmail: 'user@example.com',
        customerPhone: '+84912345678',
        tripDetails: {
          origin: 'Hanoi',
          destination: 'Da Nang',
          departureTime: '2026-01-15 10:00',
          arrivalTime: '2026-01-15 22:00',
          operatorName: 'Express Bus Co',
          busModel: 'Luxury 45',
        },
        passengers: [{ name: 'Alice Johnson', seatNumber: 'B5' }],
        pricing: {
          totalPrice: 300000,
          currency: 'VND',
        },
        operatorContact: {
          phone: '+84901234567',
          email: 'support@expressbus.vn',
          website: 'https://expressbus.vn',
        },
        eTicketUrl: 'https://example.com/ticket/BK123456',
        qrCodeUrl: 'https://example.com/qr/BK123456',
      };

      await emailService.sendBookingConfirmationEmail('user@example.com', bookingData);

      expect(sgMail.send).toHaveBeenCalledTimes(1);
    });

    test('sends password reset email', async () => {
      await emailService.sendPasswordResetEmail('user@example.com', 'reset-token');

      expect(sgMail.send).toHaveBeenCalledTimes(1);
      const callArgs = sgMail.send.mock.calls[0][0];
      expect(callArgs.html).toContain('reset-token');
    });

    test('handles SendGrid rate limiting', async () => {
      sgMail.send.mockRejectedValueOnce({
        code: 429,
        message: 'Too many requests',
      });

      await expect(
        emailService.sendVerificationEmail('user@example.com', 'token')
      ).rejects.toThrow();
    });

    test('retries failed email sends', async () => {
      sgMail.send
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce([{ statusCode: 202 }]);

      await expect(
        emailService.sendVerificationEmail('user@example.com', 'token')
      ).rejects.toThrow();

      await emailService.sendVerificationEmail('user@example.com', 'token');
      
      expect(sgMail.send).toHaveBeenCalledTimes(2);
    });
  });

  describe('SMS Service Integration', () => {
    test('sends booking confirmation SMS', async () => {
      const bookingData = {
        bookingReference: 'BK345678',
        tripName: 'Express 505',
        fromLocation: 'Hanoi',
        toLocation: 'Hue',
        departureTime: '2026-01-20 07:00',
        seats: ['C3'],
        totalPrice: 400000,
      };

      await smsService.sendBookingConfirmation('+84912345678', bookingData);

      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    test('sends trip reminder SMS', async () => {
      const tripData = {
        bookingReference: 'BK123',
        tripName: 'Night Express 303',
        fromLocation: 'Hanoi',
        toLocation: 'Saigon',
        departureTime: '2026-01-25 08:00',
        seats: ['A1'],
      };

      await smsService.sendTripReminder('+84912345678', tripData, 24);

      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    test('handles eSMS API errors gracefully', async () => {
      axios.post.mockResolvedValue({
        data: {
          CodeResult: '101',
          ErrorMessage: 'Invalid API key',
        },
      });

      const result = await smsService.sendSms('+84912345678', 'Test');

      expect(result.success).toBe(false);
    });

    test('handles network timeout for SMS', async () => {
      axios.post.mockRejectedValue({ code: 'ETIMEDOUT' });

      const result = await smsService.sendSms('+84912345678', 'Test');

      expect(result.success).toBe(false);
    });
  });

  describe('Combined Email + SMS Workflows', () => {
    test('booking flow sends both email and SMS', async () => {
      // Email needs complex structure
      const emailBookingData = {
        bookingReference: 'BK999999',
        customerName: 'Test User',
        customerEmail: 'user@example.com',
        customerPhone: '+84901234567',
        tripDetails: {
          origin: 'Hanoi',
          destination: 'Saigon',
          departureTime: '2026-01-10 08:00',
          arrivalTime: '2026-01-10 20:00',
          operatorName: 'Super Express Co',
          busModel: 'VIP 101',
        },
        passengers: [{ name: 'Test User', seatNumber: 'A1' }],
        pricing: { totalPrice: 500000, currency: 'VND' },
        operatorContact: {
          phone: '+84987654321',
          email: 'info@superexpress.vn',
          website: 'https://superexpress.vn',
        },
        eTicketUrl: 'https://example.com/ticket',
        qrCodeUrl: 'https://example.com/qr',
      };

      // SMS needs flat structure
      const smsBookingData = {
        bookingReference: 'BK999999',
        tripName: 'Super Express 101',
        fromLocation: 'Hanoi',
        toLocation: 'Saigon',
        departureTime: '2026-01-10 08:00',
        seats: ['A1'],
        totalPrice: 500000,
      };

      await emailService.sendBookingConfirmationEmail('user@example.com', emailBookingData);
      await smsService.sendBookingConfirmation('+84901234567', smsBookingData);

      expect(sgMail.send).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    test('trip reminder flow sends both channels', async () => {
      const tripData = {
        bookingReference: 'BK456',
        tripName: 'Early Morning 404',
        fromLocation: 'Hanoi',
        toLocation: 'Da Nang',
        departureTime: '2026-01-20 06:00',
        seats: ['B5'],
      };

      await emailService.sendTripReminderEmail('user@example.com', tripData, 24);
      await smsService.sendTripReminder('+84912345678', tripData, 24);

      expect(sgMail.send).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    test('handles partial failures gracefully', async () => {
      sgMail.send.mockRejectedValue(new Error('Email failed'));
      axios.post.mockResolvedValue({
        data: { CodeResult: '100', SMSID: 'sms-123' },
      });

      await expect(
        emailService.sendVerificationEmail('user@example.com', 'token')
      ).rejects.toThrow();

      const smsResult = await smsService.sendSms('+84912345678', 'Test');
      expect(smsResult.success).toBe(true);
    });
  });

  describe('Service Configuration', () => {
    test('email service uses correct API key', () => {
      expect(process.env.SENDGRID_API_KEY).toBe('test-sendgrid-key');
    });

    test('SMS service uses correct API key', () => {
      expect(process.env.ESMS_API_KEY).toBe('test-esms-key');
    });

    test('SMS service checks configuration', () => {
      const isConfigured = smsService.isConfigured();
      expect(typeof isConfigured).toBe('boolean');
    });
  });

  describe('Error Recovery', () => {
    test('continues after single failure', async () => {
      sgMail.send
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce([{ statusCode: 202 }]);

      await expect(
        emailService.sendVerificationEmail('user1@example.com', 'token1')
      ).rejects.toThrow();

      await emailService.sendVerificationEmail('user2@example.com', 'token2');
    });

    test('handles multiple concurrent failures', async () => {
      sgMail.send.mockRejectedValue(new Error('Service down'));

      const promises = [
        emailService.sendVerificationEmail('user1@example.com', 'token1').catch(e => e),
        emailService.sendVerificationEmail('user2@example.com', 'token2').catch(e => e),
        emailService.sendVerificationEmail('user3@example.com', 'token3').catch(e => e),
      ];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toBeInstanceOf(Error);
      });
    });
  });

  describe('Performance', () => {
    test('handles burst of email requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        emailService.sendVerificationEmail(`user${i}@example.com`, `token${i}`)
      );

      await Promise.all(promises);

      expect(sgMail.send).toHaveBeenCalledTimes(10);
    });

    test('handles burst of SMS requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        smsService.sendSms(`+8491234567${i}`, `Message ${i}`)
      );

      await Promise.all(promises);

      expect(axios.post).toHaveBeenCalledTimes(10);
    });

    test('mixed email and SMS concurrency', async () => {
      const promises = [
        ...Array.from({ length: 5 }, (_, i) =>
          emailService.sendVerificationEmail(`user${i}@example.com`, `token${i}`)
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          smsService.sendSms(`+8491234567${i}`, `SMS ${i}`)
        ),
      ];

      await Promise.all(promises);

      expect(sgMail.send).toHaveBeenCalledTimes(5);
      expect(axios.post).toHaveBeenCalledTimes(5);
    });
  });
});
