/**
 * NOTIFICATION SERVICE UNIT TESTS - EMAIL LOGIC
 * Fixed syntax errors - removed duplicate test blocks
 * Target: >70% coverage, 100% passing
 */

jest.mock('@sendgrid/mail');
jest.mock('../src/templates/ticketEmailTemplate', () => ({
  generateTicketEmailTemplate: jest.fn(() => '<html>Ticket</html>'),
}));
jest.mock('../src/templates/bookingConfirmationTemplate', () => ({
  generateBookingConfirmationTemplate: jest.fn(() => '<html>Booking</html>'),
}));
jest.mock('../src/templates/tripReminderEmailTemplate', () => ({
  generateTripReminderTemplate: jest.fn(() => '<html>Reminder</html>'),
}));
jest.mock('../src/templates/tripUpdateEmailTemplate', () => ({
  generateTripUpdateTemplate: jest.fn(() => '<html>Update</html>'),
}));
jest.mock('../src/templates/refundEmailTemplate', () => ({
  generateRefundEmailTemplate: jest.fn(() => '<html>Refund</html>'),
}));
jest.mock('../src/templates/bookingExpirationTemplate', () => ({
  generateBookingExpirationTemplate: jest.fn(() => '<html>Expiration</html>'),
}));
jest.mock('../src/templates/bookingCancellationTemplate', () => ({
  generateBookingCancellationTemplate: jest.fn(() => '<html>Cancellation</html>'),
}));

process.env.SENDGRID_API_KEY = 'test-key-123';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.EMAIL_FROM = 'test@example.com';

const sgMail = require('@sendgrid/mail');
const emailService = require('../src/services/emailService');

describe('Notification Service - Email Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sgMail.send.mockResolvedValue([{ statusCode: 202 }]);
  });

  describe('sendVerificationEmail', () => {
    test('sends verification email successfully', async () => {
      await emailService.sendVerificationEmail('user@example.com', 'token123');
      
      expect(sgMail.send).toHaveBeenCalledTimes(1);
      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Verify'),
        })
      );
    });

    test('handles errors', async () => {
      sgMail.send.mockRejectedValue(new Error('API error'));
      await expect(emailService.sendVerificationEmail('user@example.com', 'token')).rejects.toThrow();
    });
  });

  describe('sendPasswordResetEmail', () => {
    test('sends password reset email', async () => {
      await emailService.sendPasswordResetEmail('user@example.com', 'reset-token');
      
      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Reset'),
        })
      );
    });
  });

  describe('sendTicketEmail', () => {
    const ticketData = {
      bookingReference: 'BK123',
      passengerName: 'John Doe',
      seatNumbers: ['A1'],
      origin: 'Hanoi',
      destination: 'HCMC',
    };

    test('sends ticket email with template', async () => {
      await emailService.sendTicketEmail('user@example.com', ticketData);
      
      const { generateTicketEmailTemplate } = require('../src/templates/ticketEmailTemplate');
      expect(generateTicketEmailTemplate).toHaveBeenCalledWith(ticketData);
      expect(sgMail.send).toHaveBeenCalled();
    });
  });

  describe('sendBookingConfirmationEmail', () => {
    const bookingData = {
      bookingReference: 'BK789',
      passengerName: 'Jane Smith',
      origin: 'Hanoi',
      destination: 'Da Nang',
    };

    test('sends booking confirmation', async () => {
      await emailService.sendBookingConfirmationEmail('user@example.com', bookingData);
      
      const { generateBookingConfirmationTemplate } = require('../src/templates/bookingConfirmationTemplate');
      expect(generateBookingConfirmationTemplate).toHaveBeenCalledWith(bookingData);
    });
  });

  describe('sendTripReminderEmail', () => {
    const tripData = {
      passengerName: 'Bob Wilson',
      origin: 'Hanoi',
      destination: 'Hue',
      departureTime: '2026-01-20 06:00',
    };

    test('sends trip reminder', async () => {
      await emailService.sendTripReminderEmail('user@example.com', tripData, 24);
      
      const { generateTripReminderTemplate } = require('../src/templates/tripReminderEmailTemplate');
      expect(generateTripReminderTemplate).toHaveBeenCalled();
    });
  });

  describe('sendTripUpdateEmail', () => {
    const updateData = {
      bookingReference: 'BK345',
      updateType: 'GATE_CHANGE',
    };

    test('sends trip update', async () => {
      await emailService.sendTripUpdateEmail('user@example.com', updateData);
      
      const { generateTripUpdateTemplate } = require('../src/templates/tripUpdateEmailTemplate');
      expect(generateTripUpdateTemplate).toHaveBeenCalled();
    });
  });

  describe('sendRefundEmail', () => {
    const refundData = {
      bookingReference: 'BK567',
      refundAmount: 450000,
    };

    test('sends refund confirmation', async () => {
      await emailService.sendRefundEmail('user@example.com', refundData);
      
      const { generateRefundEmailTemplate } = require('../src/templates/refundEmailTemplate');
      expect(generateRefundEmailTemplate).toHaveBeenCalled();
    });
  });

  describe('sendBookingExpirationEmail', () => {
    test('sends expiration warning', async () => {
      await emailService.sendBookingExpirationEmail('user@example.com', { bookingReference: 'BK135' });
      
      const { generateBookingExpirationTemplate } = require('../src/templates/bookingExpirationTemplate');
      expect(generateBookingExpirationTemplate).toHaveBeenCalled();
    });
  });

  describe('sendBookingCancellationEmail', () => {
    test('sends cancellation confirmation', async () => {
      await emailService.sendBookingCancellationEmail('user@example.com', { 
        bookingReference: 'BK246',
        refundAmount: 0
      });
      
      const { generateBookingCancellationTemplate } = require('../src/templates/bookingCancellationTemplate');
      expect(generateBookingCancellationTemplate).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('handles SendGrid errors', async () => {
      sgMail.send.mockRejectedValue(new Error('API error'));
      
      await expect(
        emailService.sendVerificationEmail('user@example.com', 'token')
      ).rejects.toThrow();
    });

    test('handles validation errors', async () => {
      sgMail.send.mockRejectedValue({
        code: 400,
        message: 'Invalid email',
      });

      await expect(
        emailService.sendVerificationEmail('invalid@', 'token')
      ).rejects.toThrow();
    });
  });
});
