/**
 * Test Helpers for Booking Service
 * Provides utilities for mocking, data generation, and common test scenarios
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Mock authenticated user context
 */
const mockAuthUser = (overrides = {}) => ({
  userId: uuidv4(),
  user_id: uuidv4(),
  email: 'test@example.com',
  role: 'user',
  ...overrides
});

/**
 * Mock admin user context
 */
const mockAdminUser = (overrides = {}) => ({
  userId: uuidv4(),
  user_id: uuidv4(),
  email: 'admin@example.com',
  role: 'admin',
  ...overrides
});

/**
 * Generate mock booking data
 */
const mockBooking = (overrides = {}) => {
  const bookingId = uuidv4();
  const tripId = uuidv4();
  
  return {
    booking_id: bookingId,
    booking_reference: generateBookingReference(),
    trip_id: tripId,
    user_id: overrides.user_id || uuidv4(),
    contact_email: 'user@example.com',
    contact_phone: '+84973994154',
    status: 'pending',
    payment_status: 'pending',
    payment_method: null,
    transaction_ref: null,
    locked_until: new Date(Date.now() + 600000).toISOString(),
    subtotal: 500000,
    service_fee: 25000,
    total_price: 525000,
    currency: 'VND',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    pickup_point_id: null,
    dropoff_point_id: null,
    cancellation_reason: null,
    cancelled_at: null,
    refund_amount: null,
    refund_status: null,
    ticket_url: null,
    qr_code_url: null,
    is_guest_checkout: false,
    ...overrides
  };
};

/**
 * Generate mock passenger data
 */
const mockPassenger = (bookingId, overrides = {}) => ({
  passenger_id: Math.floor(Math.random() * 10000),
  ticket_id: `TKT${Date.now()}${Math.floor(Math.random() * 1000)}`,
  booking_id: bookingId,
  full_name: 'Nguyen Van A',
  phone: '+84973994154',
  email: 'passenger@example.com',
  document_id: '123456789',
  seat_code: 'A1',
  price: 250000,
  boarding_status: 'not_boarded',
  boarded_at: null,
  boarded_by: null,
  created_at: new Date().toISOString(),
  ...overrides
});

/**
 * Generate multiple passengers
 */
const mockPassengers = (bookingId, count = 2) => {
  const seats = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  return Array.from({ length: count }, (_, i) => 
    mockPassenger(bookingId, {
      seat_code: seats[i] || `S${i + 1}`,
      full_name: `Passenger ${i + 1}`
    })
  );
};

/**
 * Generate mock trip data
 */
const mockTrip = (overrides = {}) => {
  const tripId = overrides.trip_id || uuidv4();
  
  return {
    trip_id: tripId,
    route: {
      route_id: uuidv4(),
      origin: 'Ho Chi Minh City',
      destination: 'Da Lat',
      distance: 300
    },
    operator: {
      operator_id: uuidv4(),
      name: 'Phuong Trang',
      phone: '+84123456789',
      email: 'contact@phuongtrang.com'
    },
    bus: {
      bus_id: uuidv4(),
      model: 'Mercedes Luxury',
      plate_number: '51B-12345',
      total_seats: 40
    },
    schedule: {
      departure_time: new Date(Date.now() + 86400000 * 2).toISOString(),
      arrival_time: new Date(Date.now() + 86400000 * 2 + 21600000).toISOString(),
      estimated_duration: 360
    },
    pricing: {
      base_price: 250000,
      basePrice: 250000
    },
    ...overrides
  };
};

/**
 * Generate booking reference in format BKYYYYMMDDXXX
 */
const generateBookingReference = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `BK${year}${month}${day}${sequence}`;
};

/**
 * Mock successful axios response
 */
const mockAxiosResponse = (data) => ({
  data: {
    success: true,
    data
  }
});

/**
 * Mock axios error
 */
const mockAxiosError = (message, status = 500) => {
  const error = new Error(message);
  error.response = {
    status,
    data: {
      success: false,
      error: { message }
    }
  };
  return error;
};

/**
 * Create mock request object
 */
const mockRequest = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  headers: {},
  user: null,
  ...overrides
});

/**
 * Create mock response object
 */
const mockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendFile: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis()
  };
  return res;
};

/**
 * Create mock next function
 */
const mockNext = () => jest.fn();

/**
 * Wait for async operations
 */
const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate valid booking data for creation
 */
const validBookingData = (overrides = {}) => ({
  tripId: uuidv4(),
  seats: ['A1', 'A2'],
  passengers: [
    {
      fullName: 'Nguyen Van A',
      phone: '+84973994154',
      email: 'passenger1@example.com',
      seatCode: 'A1'
    },
    {
      fullName: 'Tran Thi B',
      phone: '+84973994155',
      email: 'passenger2@example.com',
      seatCode: 'A2'
    }
  ],
  contactEmail: 'contact@example.com',
  contactPhone: '+84973994154',
  pickupPointId: null,
  dropoffPointId: null,
  ...overrides
});

/**
 * Mock Redis client
 */
const mockRedisClient = () => ({
  setEx: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(600)
});

/**
 * Setup common mocks for tests
 */
const setupCommonMocks = (axios, redisClient) => {
  // Mock trip service
  axios.get.mockResolvedValue(mockAxiosResponse(mockTrip()));
  axios.post.mockResolvedValue(mockAxiosResponse({ success: true }));
  
  // Mock redis
  redisClient.setEx.mockResolvedValue('OK');
  redisClient.del.mockResolvedValue(1);
  redisClient.get.mockResolvedValue(null);
};

/**
 * Clear all mocks
 */
const clearAllMocks = () => {
  jest.clearAllMocks();
};

module.exports = {
  // User mocks
  mockAuthUser,
  mockAdminUser,
  
  // Data generators
  mockBooking,
  mockPassenger,
  mockPassengers,
  mockTrip,
  generateBookingReference,
  validBookingData,
  
  // Axios helpers
  mockAxiosResponse,
  mockAxiosError,
  
  // Express helpers
  mockRequest,
  mockResponse,
  mockNext,
  
  // Redis
  mockRedisClient,
  
  // Setup helpers
  setupCommonMocks,
  clearAllMocks,
  
  // Utilities
  waitFor
};
