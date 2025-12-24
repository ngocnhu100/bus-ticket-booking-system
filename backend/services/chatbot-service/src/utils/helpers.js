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
 * Supports: "tomorrow", "today", "ngày mai", "hôm nay", "năm sau", ISO dates
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

  // Handle "năm sau" (next year) with date
  const namSauMatch = normalized.match(/(\d{1,2}[/-]\d{1,2})\s*năm sau/i);
  if (namSauMatch) {
    try {
      const datePart = namSauMatch[1];
      const nextYear = today.getFullYear() + 1;
      const dateStrWithYear = `${nextYear}-${datePart.replace('/', '-')}`;
      const date = parse(dateStrWithYear, 'yyyy-M-d', new Date());
      if (isValid(date)) {
        return format(date, 'yyyy-MM-dd');
      }
    } catch (err) {
      console.error('Error parsing năm sau date:', err);
    }
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
  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return 'N/A';
    }
  };

  return {
    tripId: trip.trip_id,
    departureTime: formatTime(trip.schedule?.departure_time || trip.departure_time),
    arrivalTime: formatTime(trip.schedule?.arrival_time || trip.arrival_time),
    price: trip.pricing?.base_price || trip.base_price,
    availableSeats: trip.availability?.available_seats || trip.available_seats,
    busType: trip.bus?.bus_type || trip.bus_type,
    operator: trip.operator?.name || trip.operator_name,
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
 * Normalize city name from English/any format to Vietnamese database format
 */
const normalizeCityName = (cityName) => {
  if (!cityName) return null;

  const lowerCity = cityName.toLowerCase().trim();

  // Map all variations to Vietnamese database names
  const cityNormalizationMap = {
    'ho chi minh city': 'Hồ Chí Minh',
    'ho chi minh': 'Hồ Chí Minh',
    'sai gon': 'Hồ Chí Minh',
    saigon: 'Hồ Chí Minh',
    hcm: 'Hồ Chí Minh',
    tphcm: 'Hồ Chí Minh',
    'hồ chí minh': 'Hồ Chí Minh',
    'da lat': 'Đà Lạt',
    dalat: 'Đà Lạt',
    'đà lạt': 'Đà Lạt',
    'da nang': 'Đà Nẵng',
    danang: 'Đà Nẵng',
    'đà nẵng': 'Đà Nẵng',
    hanoi: 'Hanoi',
    'ha noi': 'Hanoi',
    'hà nội': 'Hanoi',
    'nha trang': 'Nha Trang',
    hue: 'Huế',
    huế: 'Huế',
    'can tho': 'Can Tho',
    'cần thơ': 'Can Tho',
    sapa: 'Sapa',
    'sa pa': 'Sapa',
  };

  return cityNormalizationMap[lowerCity] || cityName;
};

/**
 * Build conversation context from history
 */
const buildConversationContext = (messages, maxMessages = 10) => {
  if (!messages || messages.length === 0) return [];

  // Get last N messages
  const recentMessages = messages.slice(-maxMessages);

  return recentMessages.map((msg) => ({
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
