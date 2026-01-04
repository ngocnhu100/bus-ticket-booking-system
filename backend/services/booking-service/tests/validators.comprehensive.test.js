/**
 * COMPREHENSIVE VALIDATOR TESTS
 * Testing bookingValidators.js - Joi schemas
 * Target: Boost coverage by testing all validation rules
 */

const {
  createBookingSchema,
  confirmPaymentSchema,
  cancelBookingSchema,
  guestLookupSchema,
} = require('../src/validators/bookingValidators');

describe('Booking Validators - Create Booking', () => {
  const validBookingData = {
    tripId: '123e4567-e89b-12d3-a456-426614174000',
    seats: ['A1', 'A2'],
    passengers: [
      {
        fullName: 'John Doe',
        phone: '+84973994154',
        documentId: '123456789',
        email: 'john@example.com',
        seatCode: 'A1',
      },
      {
        fullName: 'Jane Smith',
        phone: '0912345678',
        documentId: '987654321',
        email: 'jane@example.com',
        seatCode: 'A2',
      },
    ],
    contactEmail: 'contact@example.com',
    contactPhone: '+84973994154',
    pickupPointId: '123e4567-e89b-12d3-a456-426614174001',
    dropoffPointId: '123e4567-e89b-12d3-a456-426614174002',
  };

  test('validates correct booking data', () => {
    const result = createBookingSchema.validate(validBookingData);
    expect(result.error).toBeUndefined();
    expect(result.value).toBeDefined();
  });

  test('requires tripId', () => {
    const data = { ...validBookingData };
    delete data.tripId;
    const result = createBookingSchema.validate(data);
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('Trip ID is required');
  });

  test('validates tripId format (UUID)', () => {
    const data = { ...validBookingData, tripId: 'invalid-uuid' };
    const result = createBookingSchema.validate(data);
    expect(result.error).toBeDefined();
  });

  test('requires at least one seat', () => {
    const data = { ...validBookingData, seats: [] };
    const result = createBookingSchema.validate(data);
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('At least one seat');
  });

  test('limits maximum 10 seats', () => {
    const data = {
      ...validBookingData,
      seats: ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'C1'],
    };
    const result = createBookingSchema.validate(data);
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('Cannot book more than 10 seats');
  });

  test('validates seat code formats', () => {
    const invalidFormats = ['X', '123', 'AAA', 'A99', '99Z'];
    invalidFormats.forEach((invalidSeat) => {
      const data = { ...validBookingData, seats: [invalidSeat] };
      const result = createBookingSchema.validate(data);
      expect(result.error).toBeDefined();
    });
  });

  test('accepts valid seat code formats', () => {
    const validSeats = ['A1', 'B2', '1A', '2B', 'VIP1A', 'VIP2C'];
    validSeats.forEach((seat) => {
      const data = {
        ...validBookingData,
        seats: [seat],
        passengers: [{ ...validBookingData.passengers[0], seatCode: seat }],
      };
      const result = createBookingSchema.validate(data);
      expect(result.error).toBeUndefined();
    });
  });

  test('requires contact email', () => {
    const data = { ...validBookingData };
    delete data.contactEmail;
    const result = createBookingSchema.validate(data);
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('Contact email is required');
  });

  test('validates contact email format', () => {
    const data = { ...validBookingData, contactEmail: 'invalid-email' };
    const result = createBookingSchema.validate(data);
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('email');
  });

  test('requires contact phone', () => {
    const data = { ...validBookingData };
    delete data.contactPhone;
    const result = createBookingSchema.validate(data);
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('Contact phone is required');
  });

  test('validates Vietnamese phone format', () => {
    const validPhones = ['+84973994154', '0973994154', '+84912345678', '0912345678'];
    validPhones.forEach((phone) => {
      const data = { ...validBookingData, contactPhone: phone };
      const result = createBookingSchema.validate(data);
      expect(result.error).toBeUndefined();
    });
  });

  test('rejects invalid phone formats', () => {
    const invalidPhones = ['123', '+1234', '84973994154', '12345678901'];
    invalidPhones.forEach((phone) => {
      const data = { ...validBookingData, contactPhone: phone };
      const result = createBookingSchema.validate(data);
      expect(result.error).toBeDefined();
    });
  });

  test('validates passengers match seats count', () => {
    const data = {
      ...validBookingData,
      seats: ['A1', 'A2', 'A3'],
      passengers: validBookingData.passengers, // Only 2 passengers
    };
    const result = createBookingSchema.validate(data);
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('must match');
  });

  test('validates passenger seat codes exist in seats array', () => {
    const data = {
      ...validBookingData,
      seats: ['A1', 'A2'],
      passengers: [
        { ...validBookingData.passengers[0], seatCode: 'A1' },
        { ...validBookingData.passengers[1], seatCode: 'B1' }, // B1 not in seats
      ],
    };
    const result = createBookingSchema.validate(data);
    expect(result.error).toBeDefined();
  });

  test('rejects duplicate seat assignments', () => {
    const data = {
      ...validBookingData,
      seats: ['A1'],
      passengers: [
        { ...validBookingData.passengers[0], seatCode: 'A1' },
        { ...validBookingData.passengers[1], seatCode: 'A1' }, // Duplicate
      ],
    };
    const result = createBookingSchema.validate(data);
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('unique');
  });

  test('validates passenger name length', () => {
    const data = {
      ...validBookingData,
      passengers: [{ ...validBookingData.passengers[0], fullName: 'X' }],
    };
    const result = createBookingSchema.validate(data);
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('at least 2 characters');
  });

  test('validates document ID format', () => {
    const validIds = ['123456789', '12345678901', '123456789012'];
    validIds.forEach((id) => {
      const data = {
        ...validBookingData,
        seats: ['A1'],
        passengers: [{ ...validBookingData.passengers[0], documentId: id, seatCode: 'A1' }],
      };
      const result = createBookingSchema.validate(data);
      expect(result.error).toBeUndefined();
    });
  });

  test('accepts optional pickup/dropoff points', () => {
    const data = { ...validBookingData };
    delete data.pickupPointId;
    delete data.dropoffPointId;
    const result = createBookingSchema.validate(data);
    expect(result.error).toBeUndefined();
  });
});

describe('Booking Validators - Confirm Payment', () => {
  const validPaymentData = {
    bookingId: '123e4567-e89b-12d3-a456-426614174003',
    paymentMethod: 'momo',
    amount: 250000,
    transactionRef: 'TXN123456789',
  };

  test('validates correct payment data', () => {
    const result = confirmPaymentSchema.validate(validPaymentData);
    expect(result.error).toBeUndefined();
  });

  test('requires payment method', () => {
    const data = { ...validPaymentData };
    delete data.paymentMethod;
    const result = confirmPaymentSchema.validate(data);
    expect(result.error).toBeDefined();
  });

  test('accepts valid payment methods', () => {
    const methods = ['momo', 'zalopay', 'vnpay', 'card', 'cash', 'payos'];
    methods.forEach((method) => {
      const data = { ...validPaymentData, paymentMethod: method };
      const result = confirmPaymentSchema.validate(data);
      expect(result.error).toBeUndefined();
    });
  });

  test('rejects invalid payment methods', () => {
    const data = { ...validPaymentData, paymentMethod: 'INVALID_METHOD' };
    const result = confirmPaymentSchema.validate(data);
    expect(result.error).toBeDefined();
  });
});

describe('Booking Validators - Cancel Booking', () => {
  const validCancelData = {
    reason: 'Change of plans',
  };

  test('validates correct cancel data', () => {
    const result = cancelBookingSchema.validate(validCancelData);
    expect(result.error).toBeUndefined();
  });

  test('accepts optional reason', () => {
    const result = cancelBookingSchema.validate({});
    expect(result.error).toBeUndefined();
  });

  test('validates reason length', () => {
    const data = { reason: 'Too long reason'.repeat(50) };
    const result = cancelBookingSchema.validate(data);
    expect(result.error).toBeDefined();
  });
});

describe('Booking Validators - Guest Lookup', () => {
  test('validates with booking reference and email', () => {
    const data = {
      bookingReference: 'BK20260104001',
      email: 'test@example.com',
    };
    const result = guestLookupSchema.validate(data);
    expect(result.error).toBeUndefined();
  });

  test('validates with booking reference and phone', () => {
    const data = {
      bookingReference: 'BK20260104001',
      phone: '+84973994154',
    };
    const result = guestLookupSchema.validate(data);
    expect(result.error).toBeUndefined();
  });

  test('requires booking reference', () => {
    const data = { email: 'test@example.com' };
    const result = guestLookupSchema.validate(data);
    expect(result.error).toBeDefined();
  });

  test('requires either email or phone', () => {
    const data = { bookingReference: 'BK20260104001' };
    const result = guestLookupSchema.validate(data);
    expect(result.error).toBeDefined();
  });

  test('validates booking reference format', () => {
    const validRefs = ['BK20260104001', 'BK12345678901'];
    validRefs.forEach((ref) => {
      const data = { bookingReference: ref, email: 'test@example.com' };
      const result = guestLookupSchema.validate(data);
      expect(result.error).toBeUndefined();
    });
  });

  test('rejects invalid booking reference format', () => {
    const invalidRefs = ['INVALID', 'BK123', '20260104001'];
    invalidRefs.forEach((ref) => {
      const data = { bookingReference: ref, email: 'test@example.com' };
      const result = guestLookupSchema.validate(data);
      expect(result.error).toBeDefined();
    });
  });
});
