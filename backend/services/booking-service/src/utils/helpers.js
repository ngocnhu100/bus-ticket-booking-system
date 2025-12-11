/**
 * Generate a unique, user-friendly booking reference
 *
 * Format: BKYYYYMMDDXXX
 * - BK: Prefix (configurable via env)
 * - YYYYMMDD: Full date (year, month, day)
 * - XXX: 3-digit numeric sequence (000-999)
 *
 * Examples: BK20251209001, BK20251209042, BK20251209999
 *
 * Features:
 * - Compact 15-character format
 * - Date-based for easy sorting and identification
 * - Numeric suffix for clear sequencing
 * - Easy to read and communicate (no ambiguous characters)
 * - 1,000 unique references per day (000-999)
 *
 * @returns {string} Booking reference (format: BKYYYYMMDDXXX)
 */
function generateBookingReference() {
  const date = new Date();
  const year = String(date.getFullYear()); // Full 4 digits
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Generate 3-digit random number (000-999)
  // Use crypto-quality randomness if available, else fallback to Math.random
  let randomNum;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomValues = new Uint32Array(1);
    crypto.getRandomValues(randomValues);
    randomNum = randomValues[0] % 1000; // 0-999
  } else {
    randomNum = Math.floor(Math.random() * 1000); // 0-999
  }

  const code = String(randomNum).padStart(3, '0'); // Pad to 3 digits

  const prefix = process.env.BOOKING_REFERENCE_PREFIX || 'BK';
  const dateStr = `${year}${month}${day}`;

  return `${prefix}${dateStr}${code}`;
}

/**
 * Calculate service fee based on subtotal
 * @param {number} subtotal - Booking subtotal
 * @returns {number} Service fee
 */
function calculateServiceFee(subtotal) {
  const percentageFee = subtotal * (parseFloat(process.env.SERVICE_FEE_PERCENTAGE || 3) / 100);
  const fixedFee = parseFloat(process.env.SERVICE_FEE_FIXED || 10000);
  return Math.round(percentageFee + fixedFee);
}

/**
 * Calculate booking expiration time
 * @returns {Date} Expiration timestamp
 */
function calculateLockExpiration() {
  const minutes = parseInt(process.env.BOOKING_LOCK_DURATION_MINUTES || 10, 10);
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Check if booking is still locked (not expired)
 * @param {Date} lockedUntil - Lock expiration timestamp
 * @returns {boolean}
 */
function isBookingLocked(lockedUntil) {
  if (!lockedUntil) return false;
  return new Date(lockedUntil) > new Date();
}

/**
 * Format price to 2 decimal places
 * @param {number} price
 * @returns {number}
 */
function formatPrice(price) {
  return Math.round(price * 100) / 100;
}

/**
 * Validate seat codes format
 * @param {Array<string>} seatCodes
 * @returns {boolean}
 */
function validateSeatCodes(seatCodes) {
  if (!Array.isArray(seatCodes) || seatCodes.length === 0) {
    return false;
  }
  // Seat code format: A1, B2, etc.
  const seatPattern = /^[A-Z]\d{1,2}$/;
  return seatCodes.every((code) => seatPattern.test(code));
}

/**
 * Map database row to booking object
 * @param {object} row - Database row
 * @returns {object} Formatted booking
 */
function mapToBooking(row) {
  return {
    booking_id: row.booking_id,
    booking_reference: row.booking_reference,
    trip_id: row.trip_id,
    user_id: row.user_id,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    status: row.status,
    locked_until: row.locked_until,
    pricing: {
      subtotal: parseFloat(row.subtotal),
      service_fee: parseFloat(row.service_fee),
      total: parseFloat(row.total_price),
      currency: row.currency,
    },
    payment: {
      method: row.payment_method,
      status: row.payment_status,
      paid_at: row.paid_at,
    },
    cancellation: row.cancellation_reason
      ? {
          reason: row.cancellation_reason,
          refund_amount: parseFloat(row.refund_amount),
        }
      : null,
    e_ticket: {
      ticket_url: row.ticket_url,
      qr_code_url: row.qr_code_url,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Normalize booking reference to uppercase for case-insensitive comparison
 * @param {string} reference - Booking reference
 * @returns {string} Normalized reference
 */
function normalizeBookingReference(reference) {
  if (!reference) return '';
  // Convert to uppercase and remove extra spaces
  return reference.trim().toUpperCase();
}

/**
 * Validate booking reference format
 * @param {string} reference - Booking reference
 * @returns {boolean} True if valid format
 */
function isValidBookingReferenceFormat(reference) {
  // Format: BKYYYYMMDDXXX (2 letters + 11 digits)
  const pattern = /^[A-Z]{2}\d{11}$/i;
  return pattern.test(reference);
}

/**
 * Map database row to passenger object
 * @param {object} row - Database row
 * @returns {object} Formatted passenger
 */
function mapToPassenger(row) {
  return {
    ticket_id: row.ticket_id,
    booking_id: row.booking_id,
    seat_code: row.seat_code,
    price: parseFloat(row.price),
    full_name: row.full_name,
    phone: row.phone,
    document_id: row.document_id,
    created_at: row.created_at,
  };
}

module.exports = {
  generateBookingReference,
  calculateServiceFee,
  calculateLockExpiration,
  isBookingLocked,
  formatPrice,
  validateSeatCodes,
  normalizeBookingReference,
  isValidBookingReferenceFormat,
  mapToBooking,
  mapToPassenger,
};
