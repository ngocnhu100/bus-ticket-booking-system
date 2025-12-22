const { v4: uuidv4 } = require('uuid');
const { format, addDays, parse, isValid } = require('date-fns');
const { vi } = require('date-fns/locale');

/**
 * Generate a unique session ID
 */
const generateSessionId = () => {
  return `session_${uuidv4()}`;
};

/**
 * Normalize date strings from natural language
 * Supports: "tomorrow", "today", "ngày mai", "hôm nay", ISO dates
 */
const normalizeDate = (dateStr) => {
  if (!dateStr) return null;

  const today = new Date();
  const normalized = dateStr.toLowerCase().trim();

  // Handle relative dates
  if (normalized === 'today' || normalized === 'hôm nay') {
    return format(today, 'yyyy-MM-dd');
  }

  if (normalized === 'tomorrow' || normalized === 'ngày mai') {
    return format(addDays(today, 1), 'yyyy-MM-dd');
  }

  // Try parsing ISO date
  try {
    const date = new Date(dateStr);
    if (isValid(date)) {
      return format(date, 'yyyy-MM-dd');
    }
  } catch (err) {
    console.error('Error parsing date:', err);
  }

  return dateStr;
};

/**
 * Normalize city names (Vietnamese to English)
 */
const normalizeCityName = (cityName) => {
  if (!cityName) return null;

  const cityMap = {
    'sài gòn': 'Ho Chi Minh City',
    'hcm': 'Ho Chi Minh City',
    'tp.hcm': 'Ho Chi Minh City',
    'tphcm': 'Ho Chi Minh City',
    'ho chi minh': 'Ho Chi Minh City',
    'hồ chí minh': 'Ho Chi Minh City',
    
    'hà nội': 'Hanoi',
    'ha noi': 'Hanoi',
    
    'đà nẵng': 'Da Nang',
    'da nang': 'Da Nang',
    
    'nha trang': 'Nha Trang',
    
    'đà lạt': 'Da Lat',
    'da lat': 'Da Lat',
    'dalat': 'Da Lat',
    
    'vũng tàu': 'Vung Tau',
    'vung tau': 'Vung Tau',
    
    'cần thơ': 'Can Tho',
    'can tho': 'Can Tho',
    
    'huế': 'Hue',
    'hue': 'Hue',
    
    'quy nhơn': 'Quy Nhon',
    'quy nhon': 'Quy Nhon',
  };

  const normalized = cityName.toLowerCase().trim();
  return cityMap[normalized] || cityName;
};

/**
 * Extract user info from JWT payload or request
 */
const extractUserInfo = (req) => {
  if (!req.user) {
    return {
      userId: null,
      isGuest: true,
      email: null,
    };
  }

  return {
    userId: req.user.userId || req.user.user_id || null,
    isGuest: false,
    email: req.user.email || null,
    role: req.user.role || 'user',
  };
};

/**
 * Format trip data for chatbot response
 */
const formatTripForChat = (trip) => {
  return {
    tripId: trip.trip_id,
    departureTime: trip.departure_time,
    arrivalTime: trip.arrival_time,
    price: trip.base_price,
    availableSeats: trip.available_seats,
    busType: trip.bus_type,
    operator: trip.operator_name,
  };
};

/**
 * Format multiple trips for chatbot response
 */
const formatTripsForChat = (trips, limit = 5) => {
  if (!trips || trips.length === 0) {
    return 'No trips found matching your criteria.';
  }

  const limitedTrips = trips.slice(0, limit);
  return limitedTrips.map(formatTripForChat);
};

/**
 * Sanitize user input to prevent injection
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove any potential SQL injection attempts
  return input
    .replace(/['"`;\\]/g, '')
    .trim()
    .substring(0, 1000); // Limit length
};

/**
 * Validate phone number format (Vietnamese)
 */
const isValidPhoneNumber = (phone) => {
  if (!phone) return false;
  const phoneRegex = /^(\+84|84|0)[0-9]{9,10}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Truncate text to max length
 */
const truncateText = (text, maxLength = 500) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Build conversation context from history
 */
const buildConversationContext = (messages, maxMessages = 10) => {
  if (!messages || messages.length === 0) return [];
  
  // Get last N messages
  const recentMessages = messages.slice(-maxMessages);
  
  return recentMessages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
};

module.exports = {
  generateSessionId,
  normalizeDate,
  normalizeCityName,
  extractUserInfo,
  formatTripForChat,
  formatTripsForChat,
  sanitizeInput,
  isValidPhoneNumber,
  isValidEmail,
  truncateText,
  buildConversationContext,
};
