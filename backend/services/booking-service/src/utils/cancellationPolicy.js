/**
 * Cancellation Policy Utility
 * Handles cancellation policy calculations, validations, and refund processing
 */

/**
 * Cancellation policy tiers based on time before departure
 * Time is measured in hours before departure
 */
const CANCELLATION_TIERS = [
  {
    name: 'Full Refund',
    minHours: 48,
    maxHours: null, // No upper limit
    refundPercentage: 100,
    processingFee: 0,
    description: 'Cancel more than 48 hours before departure for full refund',
  },
  {
    name: 'Standard Cancellation',
    minHours: 24,
    maxHours: 48,
    refundPercentage: 80,
    processingFee: 5000, // 5,000 VND processing fee
    description: 'Cancel 24-48 hours before departure (80% refund + processing fee)',
  },
  {
    name: 'Late Cancellation',
    minHours: 6,
    maxHours: 24,
    refundPercentage: 50,
    processingFee: 10000, // 10,000 VND processing fee
    description: 'Cancel 6-24 hours before departure (50% refund + processing fee)',
  },
  {
    name: 'Very Late Cancellation',
    minHours: 2,
    maxHours: 6,
    refundPercentage: 20,
    processingFee: 15000, // 15,000 VND processing fee
    description: 'Cancel 2-6 hours before departure (20% refund + processing fee)',
  },
  {
    name: 'No Refund',
    minHours: 0,
    maxHours: 2,
    refundPercentage: 0,
    processingFee: 0,
    description: 'Cancel less than 2 hours before departure (no refund)',
  },
];

/**
 * Calculate hours between two dates
 * @param {Date} date1 - Earlier date
 * @param {Date} date2 - Later date
 * @returns {number} Hours difference
 */
function calculateHoursDifference(date1, date2) {
  const milliseconds = date2.getTime() - date1.getTime();
  return milliseconds / (1000 * 60 * 60);
}

/**
 * Get applicable cancellation tier based on time until departure
 * @param {Date} departureTime - Trip departure time
 * @param {Date} cancellationTime - When cancellation is happening (default: now)
 * @returns {object} Applicable tier with refund details
 */
function getCancellationTier(departureTime, cancellationTime = new Date()) {
  const hoursUntilDeparture = calculateHoursDifference(cancellationTime, departureTime);

  // If departure has passed, no refund
  if (hoursUntilDeparture < 0) {
    return {
      ...CANCELLATION_TIERS[CANCELLATION_TIERS.length - 1],
      hoursUntilDeparture: 0,
      canCancel: false,
      reason: 'Trip has already departed',
    };
  }

  // Find matching tier
  for (const tier of CANCELLATION_TIERS) {
    const matchesMin = hoursUntilDeparture >= tier.minHours;
    const matchesMax = tier.maxHours === null || hoursUntilDeparture < tier.maxHours;

    if (matchesMin && matchesMax) {
      return {
        ...tier,
        hoursUntilDeparture,
        canCancel: true,
      };
    }
  }

  // Fallback to no refund tier
  return {
    ...CANCELLATION_TIERS[CANCELLATION_TIERS.length - 1],
    hoursUntilDeparture,
    canCancel: true,
  };
}

/**
 * Calculate refund amount based on booking and cancellation policy
 * @param {object} booking - Booking object with pricing info
 * @param {Date} departureTime - Trip departure time
 * @param {Date} cancellationTime - When cancellation is happening
 * @returns {object} Refund calculation details
 */
function calculateRefund(booking, departureTime, cancellationTime = new Date()) {
  // Get applicable tier
  const tier = getCancellationTier(departureTime, cancellationTime);

  // If booking is not paid, no refund
  if (booking.payment_status !== 'paid') {
    return {
      tier,
      refundAmount: 0,
      processingFee: 0,
      totalRefund: 0,
      originalAmount: parseFloat(booking.total_price || 0),
      canRefund: false,
      reason: 'Booking is not paid',
    };
  }

  // If trip has departed, no refund
  if (!tier.canCancel) {
    return {
      tier,
      refundAmount: 0,
      processingFee: 0,
      totalRefund: 0,
      originalAmount: parseFloat(booking.total_price || 0),
      canRefund: false,
      reason: tier.reason,
    };
  }

  // Calculate refund
  const originalAmount = parseFloat(booking.total_price || 0);
  const refundAmount = originalAmount * (tier.refundPercentage / 100);
  const processingFee = tier.processingFee;
  const totalRefund = Math.max(0, refundAmount - processingFee);

  return {
    tier,
    refundAmount,
    processingFee,
    totalRefund,
    originalAmount,
    canRefund: totalRefund > 0,
    refundPercentage: tier.refundPercentage,
  };
}

/**
 * Validate if cancellation is allowed
 * @param {object} booking - Booking object
 * @param {Date} departureTime - Trip departure time
 * @returns {object} Validation result with error message if invalid
 */
function validateCancellation(booking, departureTime) {
  // Check if booking exists
  if (!booking) {
    return {
      valid: false,
      error: 'Booking not found',
    };
  }

  // Check if already cancelled
  if (booking.status === 'cancelled') {
    return {
      valid: false,
      error: 'Booking is already cancelled',
    };
  }

  // Check if completed
  if (booking.status === 'completed') {
    return {
      valid: false,
      error: 'Cannot cancel completed booking',
    };
  }

  // Check if trip has departed
  const now = new Date();
  if (departureTime < now) {
    return {
      valid: false,
      error: 'Cannot cancel booking for a trip that has already departed',
    };
  }

  return {
    valid: true,
  };
}

/**
 * Get all cancellation policy tiers for display
 * @returns {array} Array of policy tiers
 */
function getAllPolicyTiers() {
  return CANCELLATION_TIERS.map((tier) => ({
    name: tier.name,
    description: tier.description,
    refundPercentage: tier.refundPercentage,
    processingFee: tier.processingFee,
    timeRange:
      tier.maxHours === null
        ? `More than ${tier.minHours} hours`
        : tier.minHours === 0
          ? `Less than ${tier.maxHours} hours`
          : `${tier.minHours}-${tier.maxHours} hours`,
  }));
}

/**
 * Format refund information for display
 * @param {object} refundCalculation - Result from calculateRefund
 * @returns {string} Formatted refund details
 */
function formatRefundDetails(refundCalculation) {
  const { tier, originalAmount, refundAmount, processingFee, totalRefund, canRefund } =
    refundCalculation;

  if (!canRefund) {
    return `No refund available. ${refundCalculation.reason || ''}`;
  }

  return (
    `Cancellation Policy: ${tier.name}\n` +
    `Original Amount: ${originalAmount.toLocaleString('vi-VN')} VND\n` +
    `Refund Rate: ${tier.refundPercentage}%\n` +
    `Refund Amount: ${refundAmount.toLocaleString('vi-VN')} VND\n` +
    `Processing Fee: ${processingFee.toLocaleString('vi-VN')} VND\n` +
    `Total Refund: ${totalRefund.toLocaleString('vi-VN')} VND\n` +
    `Processing Time: 3-5 business days`
  );
}

module.exports = {
  CANCELLATION_TIERS,
  getCancellationTier,
  calculateRefund,
  validateCancellation,
  getAllPolicyTiers,
  formatRefundDetails,
  calculateHoursDifference,
};
