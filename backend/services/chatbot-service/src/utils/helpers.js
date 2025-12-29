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

  const extractDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      // Extract YYYY-MM-DD from ISO string like "2026-01-15T08:00:00.000Z"
      return isoString.split('T')[0];
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
    date:
      trip.date ||
      trip.departure_date ||
      extractDate(trip.schedule?.departure_time || trip.departure_time),
  };
};

/**
 * Format multiple trips for chatbot response
 */
const formatTripsForChat = (trips, limit = 5, searchDate = null) => {
  if (!trips || !Array.isArray(trips) || trips.length === 0) {
    console.warn('[formatTripsForChat] Invalid trips data:', typeof trips);
    return [];
  }

  const limitedTrips = trips.slice(0, limit);
  return limitedTrips.map((trip) => {
    const formatted = formatTripForChat(trip);
    // Add search date if available and not already in trip
    if (searchDate && !formatted.date) {
      formatted.date = searchDate;
    }
    return formatted;
  });
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

  // Map all variations to standardized English city names (matching database)
  const cityNormalizationMap = {
    'ho chi minh city': 'Ho Chi Minh City',
    'ho chi minh': 'Ho Chi Minh City',
    'sai gon': 'Ho Chi Minh City',
    saigon: 'Ho Chi Minh City',
    hcm: 'Ho Chi Minh City',
    tphcm: 'Ho Chi Minh City',
    'hồ chí minh': 'Ho Chi Minh City',
    'da lat': 'Da Lat',
    dalat: 'Da Lat',
    'đà lạt': 'Da Lat',
    'da nang': 'Da Nang',
    danang: 'Da Nang',
    'đà nẵng': 'Da Nang',
    hanoi: 'Hanoi',
    'ha noi': 'Hanoi',
    'hà nội': 'Hanoi',
    'nha trang': 'Nha Trang',
    'nha trang city': 'Nha Trang',
    hue: 'Hue',
    huế: 'Hue',
    'can tho': 'Can Tho',
    'cần thơ': 'Can Tho',
    sapa: 'Sapa',
    'sa pa': 'Sapa',
    'hai phong': 'Hai Phong',
    'hải phòng': 'Hai Phong',
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

/**
 * Extract user contact info from JWT token by calling auth service
 * @param {string} authToken - JWT token
 * @returns {object} Contact info {userId, email, phone} or null if extraction fails
 */
const extractUserContactInfoFromJWT = async (authToken) => {
  if (!authToken) {
    return null;
  }

  try {
    const jwt = require('jsonwebtoken');
    const axios = require('axios');

    // Decode JWT to get userId (no verification needed - just extract payload)
    const decoded = jwt.decode(authToken);
    if (!decoded || !decoded.userId) {
      console.warn('[extractUserContactInfoFromJWT] Could not decode JWT or userId not found');
      return null;
    }

    const userId = decoded.userId;
    console.log('[extractUserContactInfoFromJWT] Extracted userId from JWT:', userId);

    // Call auth service to get user profile with email and phone
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
    const response = await axios.get(`${authServiceUrl}/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      timeout: 3000,
    });

    if (response && response.data && response.data.data) {
      const userData = response.data.data;
      console.log('[extractUserContactInfoFromJWT] Got user profile from auth service');

      return {
        userId: userData.userId,
        email: userData.email || null,
        phone: userData.phone || null,
        fullName: userData.fullName || null,
      };
    }

    return null;
  } catch (err) {
    console.warn(
      '[extractUserContactInfoFromJWT] Error extracting user contact info:',
      err.message
    );
    return null;
  }
};

module.exports = {
  generateSessionId,
  normalizeDate,
  normalizeCityName,
  extractUserInfo,
  extractUserContactInfoFromJWT,
  formatTripForChat,
  formatTripsForChat,
  sanitizeInput,
  isValidPhoneNumber,
  isValidEmail,
  truncateText,
  buildConversationContext,
};
