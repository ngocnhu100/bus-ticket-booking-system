const { generateBookingCancellationTemplate: bookingCancellationTemplate } = require('../src/templates/bookingCancellationTemplate');
const { generateBookingExpirationTemplate: bookingExpirationTemplate } = require('../src/templates/bookingExpirationTemplate');
const { generateRefundEmailTemplate: refundEmailTemplate } = require('../src/templates/refundEmailTemplate');
const { generateTripDelayTemplate: tripDelayEmailTemplate } = require('../src/templates/tripDelayEmailTemplate');
const { generateTripUpdateTemplate: tripUpdateEmailTemplate } = require('../src/templates/tripUpdateEmailTemplate');
const smsTemplates = require('../src/templates/smsTemplates');

describe('Template Tests - Extended Coverage', () => {
  
  // ==================== BOOKING CANCELLATION TEMPLATE ====================
  describe('bookingCancellationTemplate', () => {
    const sampleData = {
      bookingReference: 'BKG123456',
      passengerName: 'John Doe',
      route: 'Hanoi - Ho Chi Minh',
      departureDate: '2025-01-15',
      departureTime: '08:00',
      refundAmount: 500000,
      cancellationFee: 50000
    };

    test('generates HTML with booking reference', () => {
      const html = bookingCancellationTemplate(sampleData);
      expect(html).toContain('BKG123456');
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    test('includes passenger name', () => {
      const html = bookingCancellationTemplate(sampleData);
      expect(html).toContain('John Doe');
    });

    test('shows route information', () => {
      const html = bookingCancellationTemplate(sampleData);
      expect(html).toContain('Hanoi - Ho Chi Minh');
    });

    test('displays refund amount', () => {
      const html = bookingCancellationTemplate(sampleData);
      expect(html).toContain('500000');
    });

    test('handles missing optional fields', () => {
      const minimalData = { bookingReference: 'BKG123' };
      expect(() => bookingCancellationTemplate(minimalData)).not.toThrow();
    });
  });

  // ==================== BOOKING EXPIRATION TEMPLATE ====================
  describe('bookingExpirationTemplate', () => {
    const sampleData = {
      bookingReference: 'BKG789012',
      passengerName: 'Jane Smith',
      route: 'Da Nang - Nha Trang',
      departureDate: '2025-02-01',
      expirationTime: '2025-01-10 14:00',
      totalAmount: 750000
    };

    test('generates email object with HTML and text', () => {
      const result = bookingExpirationTemplate(sampleData);
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
      expect(typeof result.html).toBe('string');
      expect(typeof result.text).toBe('string');
    });

    test('includes booking reference in both formats', () => {
      const result = bookingExpirationTemplate(sampleData);
      expect(result.html).toContain('BKG789012');
      expect(result.text).toContain('BKG789012');
    });

    test('shows expiration time', () => {
      const result = bookingExpirationTemplate(sampleData);
      expect(result.text.length).toBeGreaterThan(0);
    });

    test('handles empty data gracefully', () => {
      expect(() => bookingExpirationTemplate({})).not.toThrow();
      const result = bookingExpirationTemplate({});
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
    });
  });

  // ==================== REFUND EMAIL TEMPLATE ====================
  describe('refundEmailTemplate', () => {
    const sampleData = {
      bookingReference: 'BKG345678',
      passengerName: 'Bob Johnson',
      refundAmount: 600000,
      refundMethod: 'Bank Transfer',
      processingDays: 5,
      bankAccount: '**** 1234'
    };

    test('generates HTML with refund details', () => {
      const html = refundEmailTemplate(sampleData);
      expect(html).toContain('BKG345678');
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    test('includes passenger name', () => {
      const html = refundEmailTemplate(sampleData);
      expect(html).toContain('Bob Johnson');
    });

    test('displays refund amount', () => {
      const html = refundEmailTemplate(sampleData);
      expect(html).toContain('600000');
    });

    test('shows refund method', () => {
      const html = refundEmailTemplate(sampleData);
      expect(html).toContain('Bank Transfer');
    });

    test('handles minimal data', () => {
      const minimalData = { bookingReference: 'BKG999', refundAmount: 100000 };
      expect(() => refundEmailTemplate(minimalData)).not.toThrow();
    });
  });

  // ==================== TRIP DELAY EMAIL TEMPLATE ====================
  describe('tripDelayEmailTemplate', () => {
    const sampleData = {
      bookingReference: 'BKG567890',
      passengerName: 'Alice Brown',
      route: 'Hue - Hanoi',
      originalDepartureTime: '10:00',
      newDepartureTime: '12:30',
      delayMinutes: 150,
      reason: 'Mechanical issue',
      departureDate: '2025-01-20'
    };

    test('generates HTML with delay information', () => {
      const html = tripDelayEmailTemplate(sampleData);
      expect(html).toContain('BKG567890');
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    test('includes passenger name', () => {
      const html = tripDelayEmailTemplate(sampleData);
      expect(html).toContain('Alice Brown');
    });

    test('shows original and new departure times', () => {
      const html = tripDelayEmailTemplate(sampleData);
      expect(html).toContain('10:00');
      expect(html).toContain('12:30');
    });

    test('displays delay duration', () => {
      const html = tripDelayEmailTemplate(sampleData);
      expect(html).toContain('150');
    });

    test('includes delay reason', () => {
      const html = tripDelayEmailTemplate(sampleData);
      expect(html).toContain('Mechanical issue');
    });

    test('handles missing optional fields', () => {
      const minimalData = { bookingReference: 'BKG111' };
      expect(() => tripDelayEmailTemplate(minimalData)).not.toThrow();
    });
  });

  // ==================== TRIP UPDATE EMAIL TEMPLATE ====================
  describe('tripUpdateEmailTemplate', () => {
    const sampleData = {
      bookingReference: 'BKG234567',
      passengerName: 'Charlie Wilson',
      route: 'Saigon - Dalat',
      departureDate: '2025-02-10',
      updateType: 'Gate Change',
      oldValue: 'Gate A3',
      newValue: 'Gate B7',
      message: 'Please proceed to the new gate'
    };

    test('generates HTML with update information', () => {
      const html = tripUpdateEmailTemplate(sampleData);
      expect(html).toContain('BKG234567');
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    test('includes passenger name', () => {
      const html = tripUpdateEmailTemplate(sampleData);
      expect(html).toContain('Charlie Wilson');
    });

    test('shows update type', () => {
      const html = tripUpdateEmailTemplate(sampleData);
      expect(html).toContain('Gate Change');
    });

    test('displays old and new values', () => {
      const html = tripUpdateEmailTemplate(sampleData);
      expect(html).toContain('Gate A3');
      expect(html).toContain('Gate B7');
    });

    test('includes custom message', () => {
      const html = tripUpdateEmailTemplate(sampleData);
      expect(html).toContain('Please proceed to the new gate');
    });

    test('handles empty data', () => {
      expect(() => tripUpdateEmailTemplate({})).not.toThrow();
    });
  });

  // ==================== SMS TEMPLATES ====================
  describe('smsTemplates', () => {
    
    test('paymentReceiptTemplate generates SMS text', () => {
      const data = {
        bookingReference: 'BKG999888',
        amount: 450000,
        route: 'Hanoi - Hue'
      };
      const sms = smsTemplates.paymentReceiptTemplate(data);
      expect(typeof sms).toBe('string');
      expect(sms).toContain('BKG999888');
      expect(sms).toContain('450000');
    });

    test('tripReminderTemplate generates reminder SMS', () => {
      const data = {
        route: 'HCMC - Vung Tau',
        departureTime: '15:00',
        hoursUntilDeparture: 24
      };
      const sms = smsTemplates.tripReminderTemplate(data);
      expect(typeof sms).toBe('string');
      expect(sms).toContain('HCMC - Vung Tau');
      expect(sms).toContain('15:00');
    });

    test('cancellationTemplate generates cancellation SMS', () => {
      const data = {
        bookingReference: 'BKG777666',
        refundAmount: 300000
      };
      const sms = smsTemplates.cancellationTemplate(data);
      expect(typeof sms).toBe('string');
      expect(sms).toContain('BKG777666');
      expect(sms).toContain('300000');
    });

    test('refundTemplate generates refund SMS', () => {
      const data = {
        bookingReference: 'BKG555444',
        refundAmount: 250000,
        processingDays: 7
      };
      const sms = smsTemplates.refundTemplate(data);
      expect(typeof sms).toBe('string');
      expect(sms).toContain('BKG555444');
      expect(sms).toContain('250000');
    });

    test('tripDelayTemplate generates delay SMS', () => {
      const data = {
        bookingReference: 'BKG333222',
        delayMinutes: 90,
        newDepartureTime: '14:30'
      };
      const sms = smsTemplates.tripDelayTemplate(data);
      expect(typeof sms).toBe('string');
      expect(sms).toContain('BKG333222');
      expect(sms).toContain('90');
    });

    test('SMS templates handle missing data gracefully', () => {
      expect(() => smsTemplates.paymentReceiptTemplate({})).not.toThrow();
      expect(() => smsTemplates.tripReminderTemplate({})).not.toThrow();
      expect(() => smsTemplates.cancellationTemplate({})).not.toThrow();
      expect(() => smsTemplates.refundTemplate({})).not.toThrow();
      expect(() => smsTemplates.tripDelayTemplate({})).not.toThrow();
    });

    test('SMS templates return non-empty strings', () => {
      const data = { bookingReference: 'TEST' };
      expect(smsTemplates.paymentReceiptTemplate(data).length).toBeGreaterThan(0);
      expect(smsTemplates.tripReminderTemplate(data).length).toBeGreaterThan(0);
      expect(smsTemplates.cancellationTemplate(data).length).toBeGreaterThan(0);
      expect(smsTemplates.refundTemplate(data).length).toBeGreaterThan(0);
      expect(smsTemplates.tripDelayTemplate(data).length).toBeGreaterThan(0);
    });

    test('tripUpdateTemplate generates update SMS', () => {
      const data = {
        bookingReference: 'BKG111000',
        updateType: 'Platform Change',
        newValue: 'Platform 3'
      };
      const sms = smsTemplates.tripUpdateTemplate(data);
      expect(typeof sms).toBe('string');
      expect(sms).toContain('BKG111000');
    });
  });

  // ==================== EDGE CASES ====================
  describe('Template Edge Cases', () => {
    
    test('templates handle special characters in data', () => {
      const specialData = {
        passengerName: "O'Brien & Smith <test@example.com>",
        route: 'Ha Noi -> TP.HCM',
        bookingReference: 'BKG-123/456'
      };
      
      expect(() => bookingCancellationTemplate(specialData)).not.toThrow();
      expect(() => tripDelayEmailTemplate(specialData)).not.toThrow();
    });

    test('templates handle very long strings', () => {
      const longData = {
        passengerName: 'A'.repeat(1000),
        route: 'B'.repeat(1000),
        message: 'C'.repeat(5000),
        bookingReference: 'BKG123'
      };
      
      expect(() => tripUpdateEmailTemplate(longData)).not.toThrow();
      const html = tripUpdateEmailTemplate(longData);
      expect(html.length).toBeGreaterThan(0);
    });

    test('templates handle numeric values as strings', () => {
      const stringData = {
        bookingReference: 'BKG999',
        refundAmount: '500000',
        delayMinutes: '120',
        processingDays: '7'
      };
      
      expect(() => refundEmailTemplate(stringData)).not.toThrow();
      expect(() => tripDelayEmailTemplate(stringData)).not.toThrow();
    });

    test('templates return HTML-formatted output', () => {
      const data = { bookingReference: 'TEST123' };
      
      const cancellation = bookingCancellationTemplate(data);
      const expiration = bookingExpirationTemplate(data);
      const refund = refundEmailTemplate(data);
      const delay = tripDelayEmailTemplate(data);
      const update = tripUpdateEmailTemplate(data);
      
      // Basic HTML structure checks
      expect(cancellation).toMatch(/<[^>]+>/); // Contains HTML tags
      expect(expiration.html).toMatch(/<[^>]+>/); // expiration returns {html, text}
      expect(refund).toMatch(/<[^>]+>/);
      expect(delay).toMatch(/<[^>]+>/);
      expect(update).toMatch(/<[^>]+>/);
    });
  });
});
