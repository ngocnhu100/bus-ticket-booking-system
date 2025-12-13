const axios = require('axios');
const {
  buildBookingConfirmationMessage,
  buildTripReminderMessage,
  buildBookingCancellationMessage,
  buildPaymentReminderMessage,
} = require('../templates/smsTemplates');

class SmsService {
  constructor() {
    this.apiKey = process.env.ESMS_API_KEY;
    this.secretKey = process.env.ESMS_SECRET_KEY;
    this.brandname = process.env.ESMS_BRANDNAME || 'BusTicket';
    this.apiUrl = 'https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/';

    if (!this.apiKey || !this.secretKey) {
      console.warn(
        '[SmsService] eSMS credentials not configured. SMS functionality will be disabled.'
      );
      this.client = null;
    } else {
      this.client = true;
    }
  }

  /**
   * Send SMS message
   * @param {string} to - Recipient phone number (E.164 format)
   * @param {string} message - SMS message content
   * @returns {Promise<object>} Twilio message response
   */
  // eslint-disable-next-line no-unused-vars
  async sendSms(to, message) {
    if (!this.client) {
      console.warn('[SmsService] SMS service not configured. Skipping SMS send.');
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      const formattedTo = this.formatPhoneNumber(to);

      const data = {
        ApiKey: this.apiKey,
        SecretKey: this.secretKey,
        Phone: this.to, // eSMS expects without +
        Content: 'CODE la ma xac minh dang ky Baotrixemay cua ban', // Test content as per eSMS docs
        // Content: message,
        Brandname: 'Baotrixemay', // Test brandname
        // Brandname: this.brandname,
        SmsType: '2', // 2 for CSKH
        Sandbox: '1', // 1 for test mode, no actual send
      };

      const response = await axios.post(this.apiUrl, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('eSMS API response:', response.data);

      if (response.data && response.data.CodeResult == 100) {
        console.log(`[SmsService] SMS sent successfully to ${formattedTo}.`);
        return {
          success: true,
          to: formattedTo,
        };
      } else {
        return {
          success: false,
          error: response.data ? response.data.ErrorMessage || 'Unknown error' : 'Unknown error',
        };
      }
    } catch (error) {
      console.error('[SmsService] Failed to send SMS:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send booking confirmation SMS
   * @param {string} phoneNumber - Customer phone number
   * @param {object} bookingData - Booking details
   * @returns {Promise<object>} SMS send result
   */
  async sendBookingConfirmation(phoneNumber, bookingData) {
    const message = buildBookingConfirmationMessage(bookingData);
    return await this.sendSms(phoneNumber, message);
  }

  /**
   * Send trip reminder SMS
   * @param {string} phoneNumber - Customer phone number
   * @param {object} tripData - Trip details
   * @param {number} hoursUntilDeparture - Hours until departure
   * @returns {Promise<object>} SMS send result
   */
  async sendTripReminder(phoneNumber, tripData, hoursUntilDeparture) {
    const message = buildTripReminderMessage(tripData, hoursUntilDeparture);
    return await this.sendSms(phoneNumber, message);
  }

  /**
   * Send booking cancellation SMS
   * @param {string} phoneNumber - Customer phone number
   * @param {object} bookingData - Booking details
   * @returns {Promise<object>} SMS send result
   */
  async sendBookingCancellation(phoneNumber, bookingData) {
    const message = buildBookingCancellationMessage(bookingData);
    return await this.sendSms(phoneNumber, message);
  }

  /**
   * Send payment reminder SMS
   * @param {string} phoneNumber - Customer phone number
   * @param {object} bookingData - Booking details
   * @param {number} minutesLeft - Minutes left to complete payment
   * @returns {Promise<object>} SMS send result
   */
  async sendPaymentReminder(phoneNumber, bookingData, minutesLeft) {
    const message = buildPaymentReminderMessage(bookingData, minutesLeft);
    return await this.sendSms(phoneNumber, message);
  }

  /**
   * Format phone number to E.164 format
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // If already in E.164 format (+countrycode...), return as is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }

    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Handle Vietnamese phone numbers
    if (cleaned.startsWith('0')) {
      // Convert local format (0xxxxxxxxx) to international (+84xxxxxxxxx)
      cleaned = '84' + cleaned.substring(1);
    } else if (cleaned.length === 9 && cleaned.startsWith('9')) {
      // Vietnamese mobile numbers without leading 0 (9xxxxxxxx)
      cleaned = '84' + cleaned;
    } else if (
      cleaned.length === 10 &&
      (cleaned.startsWith('9') ||
        cleaned.startsWith('8') ||
        cleaned.startsWith('7') ||
        cleaned.startsWith('5') ||
        cleaned.startsWith('3'))
    ) {
      // Vietnamese mobile numbers (9xxxxxxxxx, 8xxxxxxxxx, etc.)
      cleaned = '84' + cleaned;
    }
    // For other international numbers, assume they already have country code or are international

    // Add + prefix if not present
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }

  /**
   * Build booking confirmation message
   * @param {object} bookingData - Booking details
   * @returns {string} Formatted SMS message
   */
  buildBookingConfirmationMessage(bookingData) {
    const {
      bookingReference,
      tripName,
      departureTime,
      fromLocation,
      toLocation,
      seats,
      totalPrice,
      currency = 'VND',
    } = bookingData;

    return `BusTicket: Booking confirmed! Ref: ${bookingReference}. ${tripName} from ${fromLocation} to ${toLocation} on ${departureTime}. Seats: ${seats.join(', ')}. Total: ${totalPrice} ${currency}. Safe travels!`;
  }

  /**
   * Build trip reminder message
   * @param {object} tripData - Trip details
   * @param {number} hoursUntilDeparture - Hours until departure
   * @returns {string} Formatted SMS message
   */
  buildTripReminderMessage(tripData, hoursUntilDeparture) {
    const { bookingReference, tripName, departureTime, fromLocation, toLocation, seats } = tripData;

    const timeMessage = hoursUntilDeparture === 1 ? '1 hour' : `${hoursUntilDeparture} hours`;

    return `BusTicket Reminder: Your trip ${tripName} from ${fromLocation} to ${toLocation} departs in ${timeMessage} (${departureTime}). Ref: ${bookingReference}. Seats: ${seats.join(', ')}. Don't be late!`;
  }

  /**
   * Check if SMS service is configured
   * @returns {boolean} True if configured
   */
  isConfigured() {
    return this.client !== null;
  }
}

module.exports = new SmsService();
