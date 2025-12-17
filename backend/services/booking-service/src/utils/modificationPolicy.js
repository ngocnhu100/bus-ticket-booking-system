/**
 * Booking Modification Policy Utility
 * Handles modification policy calculations, validations, and fee processing
 */

/**
 * Modification policy tiers based on time before departure
 * Time is measured in hours before departure
 */
const MODIFICATION_TIERS = [
  {
    name: 'Free Modification',
    minHours: 48,
    maxHours: null, // No upper limit
    modificationFee: 0,
    seatChangeFee: 0,
    description: 'Free modifications more than 48 hours before departure',
    allowSeatChange: true,
    allowPassengerUpdate: true,
  },
  {
    name: 'Standard Modification',
    minHours: 24,
    maxHours: 48,
    modificationFee: 10000, // 10,000 VND
    seatChangeFee: 5000, // 5,000 VND per seat change
    description: 'Modifications 24-48 hours before departure (fees apply)',
    allowSeatChange: true,
    allowPassengerUpdate: true,
  },
  {
    name: 'Late Modification',
    minHours: 6,
    maxHours: 24,
    modificationFee: 20000, // 20,000 VND
    seatChangeFee: 10000, // 10,000 VND per seat change
    description: 'Modifications 6-24 hours before departure (higher fees)',
    allowSeatChange: true,
    allowPassengerUpdate: true,
  },
  {
    name: 'Very Late Modification',
    minHours: 2,
    maxHours: 6,
    modificationFee: 30000, // 30,000 VND
    seatChangeFee: 15000, // 15,000 VND per seat change
    description: 'Modifications 2-6 hours before departure (highest fees, passenger info only recommended)',
    allowSeatChange: true, // Risky but allowed
    allowPassengerUpdate: true,
  },
  {
    name: 'No Modifications Allowed',
    minHours: 0,
    maxHours: 2,
    modificationFee: 0,
    seatChangeFee: 0,
    description: 'Modifications not allowed less than 2 hours before departure',
    allowSeatChange: false,
    allowPassengerUpdate: false,
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
 * Get applicable modification tier based on time until departure
 * @param {Date} departureTime - Trip departure time
 * @param {Date} modificationTime - When modification is happening (default: now)
 * @returns {object} Applicable tier with modification details
 */
function getModificationTier(departureTime, modificationTime = new Date()) {
  const hoursUntilDeparture = calculateHoursDifference(modificationTime, departureTime);

  // If departure has passed, no modifications
  if (hoursUntilDeparture < 0) {
    return {
      ...MODIFICATION_TIERS[MODIFICATION_TIERS.length - 1],
      hoursUntilDeparture: 0,
      canModify: false,
      reason: 'Trip has already departed',
    };
  }

  // Find matching tier
  for (const tier of MODIFICATION_TIERS) {
    const matchesMin = hoursUntilDeparture >= tier.minHours;
    const matchesMax = tier.maxHours === null || hoursUntilDeparture < tier.maxHours;

    if (matchesMin && matchesMax) {
      return {
        ...tier,
        hoursUntilDeparture,
        canModify: tier.allowPassengerUpdate || tier.allowSeatChange,
      };
    }
  }

  // Fallback to no modifications tier
  return {
    ...MODIFICATION_TIERS[MODIFICATION_TIERS.length - 1],
    hoursUntilDeparture,
    canModify: false,
  };
}

/**
 * Calculate modification fees
 * @param {object} modifications - Modification details { passengerUpdates, seatChanges }
 * @param {Date} departureTime - Trip departure time
 * @param {Date} modificationTime - When modification is happening
 * @returns {object} Fee calculation details
 */
function calculateModificationFees(modifications, departureTime, modificationTime = new Date()) {
  const tier = getModificationTier(departureTime, modificationTime);

  if (!tier.canModify) {
    return {
      tier,
      baseFee: 0,
      seatChangeFees: 0,
      totalFee: 0,
      canModify: false,
      reason: tier.reason || 'Modifications not allowed',
    };
  }

  // Calculate base modification fee
  const baseFee = tier.modificationFee;

  // Calculate seat change fees (if any seat changes requested)
  const seatChangeCount = modifications.seatChanges?.length || 0;
  const seatChangeFees = seatChangeCount * tier.seatChangeFee;

  const totalFee = baseFee + seatChangeFees;

  return {
    tier,
    baseFee,
    seatChangeFees,
    seatChangeCount,
    totalFee,
    canModify: true,
    breakdown: {
      baseModificationFee: baseFee,
      seatChangeFee: `${tier.seatChangeFee} VND × ${seatChangeCount} seats`,
      total: totalFee,
    },
  };
}

/**
 * Validate if modification is allowed
 * @param {object} booking - Booking object
 * @param {Date} departureTime - Trip departure time
 * @param {object} modifications - Requested modifications
 * @returns {object} Validation result with error message if invalid
 */
function validateModification(booking, departureTime, modifications) {
  // Check if booking exists
  if (!booking) {
    return {
      valid: false,
      error: 'Booking not found',
    };
  }

  // Check if booking is cancelled
  if (booking.status === 'cancelled') {
    return {
      valid: false,
      error: 'Cannot modify cancelled booking',
    };
  }

  // Check if booking is completed
  if (booking.status === 'completed') {
    return {
      valid: false,
      error: 'Cannot modify completed booking',
    };
  }

  // Check if trip has departed
  const now = new Date();
  if (departureTime < now) {
    return {
      valid: false,
      error: 'Cannot modify booking for a trip that has already departed',
    };
  }

  // Get modification tier
  const tier = getModificationTier(departureTime);

  if (!tier.canModify) {
    return {
      valid: false,
      error: 'Modifications not allowed less than 2 hours before departure',
    };
  }

  // Validate specific modification types
  if (modifications.seatChanges && modifications.seatChanges.length > 0) {
    if (!tier.allowSeatChange) {
      return {
        valid: false,
        error: 'Seat changes not allowed at this time',
      };
    }
  }

  if (modifications.passengerUpdates && modifications.passengerUpdates.length > 0) {
    if (!tier.allowPassengerUpdate) {
      return {
        valid: false,
        error: 'Passenger information updates not allowed at this time',
      };
    }
  }

  return {
    valid: true,
  };
}

/**
 * Get all modification policy tiers for display
 * @returns {array} Array of policy tiers
 */
function getAllModificationTiers() {
  return MODIFICATION_TIERS.map((tier) => ({
    name: tier.name,
    description: tier.description,
    modificationFee: tier.modificationFee,
    seatChangeFee: tier.seatChangeFee,
    allowSeatChange: tier.allowSeatChange,
    allowPassengerUpdate: tier.allowPassengerUpdate,
    timeRange:
      tier.maxHours === null
        ? `More than ${tier.minHours} hours`
        : tier.minHours === 0
          ? `Less than ${tier.maxHours} hours`
          : `${tier.minHours}-${tier.maxHours} hours`,
  }));
}

/**
 * Format modification fee information for display
 * @param {object} feeCalculation - Result from calculateModificationFees
 * @returns {string} Formatted fee details
 */
function formatModificationFees(feeCalculation) {
  const { tier, baseFee, seatChangeFees, seatChangeCount, totalFee, canModify } = feeCalculation;

  if (!canModify) {
    return `Modifications not allowed. ${feeCalculation.reason || ''}`;
  }

  return (
    `Modification Policy: ${tier.name}\n` +
    `Base Modification Fee: ${baseFee.toLocaleString('vi-VN')} VND\n` +
    (seatChangeCount > 0
      ? `Seat Change Fees: ${tier.seatChangeFee.toLocaleString('vi-VN')} VND × ${seatChangeCount} = ${seatChangeFees.toLocaleString('vi-VN')} VND\n`
      : '') +
    `Total Fee: ${totalFee.toLocaleString('vi-VN')} VND`
  );
}

module.exports = {
  MODIFICATION_TIERS,
  getModificationTier,
  calculateModificationFees,
  validateModification,
  getAllModificationTiers,
  formatModificationFees,
  calculateHoursDifference,
};
