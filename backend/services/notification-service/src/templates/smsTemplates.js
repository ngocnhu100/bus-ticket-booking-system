/**
 * SMS Templates for Bus Ticket Booking System
 */

/**
 * Build booking confirmation SMS message
 * @param {object} bookingData - Booking details
 * @returns {string} Formatted SMS message
 */
function buildBookingConfirmationMessage(bookingData) {
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

  // Keep message under 160 characters for single SMS
  return `BusTicket: Booking confirmed! Ref: ${bookingReference}. ${tripName} from ${fromLocation} to ${toLocation} on ${departureTime}. Seats: ${seats.join(', ')}. Total: ${totalPrice} ${currency}. Safe travels!`;
}

/**
 * Build trip reminder SMS message
 * @param {object} tripData - Trip details
 * @param {number} hoursUntilDeparture - Hours until departure
 * @returns {string} Formatted SMS message
 */
function buildTripReminderMessage(tripData, hoursUntilDeparture) {
  const { bookingReference, tripName, departureTime, fromLocation, toLocation, seats } = tripData;

  const timeMessage = hoursUntilDeparture === 1 ? '1 hour' : `${hoursUntilDeparture} hours`;

  // Keep message under 160 characters
  return `BusTicket Reminder: Your trip ${tripName} from ${fromLocation} to ${toLocation} departs in ${timeMessage} (${departureTime}). Ref: ${bookingReference}. Seats: ${seats.join(', ')}. Don't be late!`;
}

/**
 * Build booking cancellation SMS message
 * @param {object} bookingData - Booking details
 * @returns {string} Formatted SMS message
 */
function buildBookingCancellationMessage(bookingData) {
  const { bookingReference, totalPrice, currency = 'VND' } = bookingData;

  return `BusTicket: Booking ${bookingReference} cancelled. Refund of ${totalPrice} ${currency} will be processed within 3-5 business days.`;
}

/**
 * Build payment reminder SMS message
 * @param {object} bookingData - Booking details
 * @param {number} minutesLeft - Minutes left to complete payment
 * @returns {string} Formatted SMS message
 */
function buildPaymentReminderMessage(bookingData, minutesLeft) {
  const { bookingReference, totalPrice, currency = 'VND' } = bookingData;

  return `BusTicket: Complete payment for booking ${bookingReference} (${totalPrice} ${currency}) within ${minutesLeft} minutes or seats will be released.`;
}

module.exports = {
  buildBookingConfirmationMessage,
  buildTripReminderMessage,
  buildBookingCancellationMessage,
  buildPaymentReminderMessage,
};
