const db = require('../database');
const { mapToBooking } = require('../utils/helpers');

/**
 * Validate and sanitize UUID - return null if invalid
 * BACKWARD COMPATIBLE: If receives INTEGER, lookup UUID from users table
 */
async function sanitizeUserId(value) {
  if (!value || value === 'null' || value === 'undefined') {
    return null;
  }

  // UUID regex pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const strValue = String(value).trim();

  // Check if already valid UUID
  if (uuidRegex.test(strValue)) {
    return strValue;
  }

  // BACKWARD COMPATIBILITY: Check if it's an INTEGER from old JWT
  const intValue = parseInt(strValue, 10);
  if (!isNaN(intValue) && intValue > 0) {
    console.warn(
      `[BookingRepository] Received INTEGER userId (${intValue}), likely from old JWT token. Please re-login to get UUID token.`
    );

    // Try to lookup UUID by old integer ID (if you have a mapping table)
    // For now, return null and suggest re-login
    console.warn(
      '[BookingRepository] Solution: User must logout and login again to get fresh JWT with UUID.'
    );
    return null;
  }

  // Invalid format
  console.error('[BookingRepository] Invalid userId format:', value);
  return null;
}

/**
 * Synchronous UUID validator (for non-async contexts)
 */
function sanitizeUUID(value) {
  if (!value || value === 'null' || value === 'undefined') {
    return null;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const strValue = String(value).trim();

  return uuidRegex.test(strValue) ? strValue : null;
}

class BookingRepository {
  /**
   * Create a new booking
   * @param {object} bookingData - Booking data
   * @returns {Promise<object>} Created booking
   */
  async create(bookingData) {
    console.log('[BookingRepository] Creating booking with data:', {
      bookingReference: bookingData.bookingReference,
      tripId: bookingData.tripId,
      userId: bookingData.userId,
      sanitizedUserId: sanitizeUUID(bookingData.userId),
      contactEmail: bookingData.contactEmail,
      isGuestCheckout: bookingData.isGuestCheckout,
    });

    const query = `
      INSERT INTO bookings (
        booking_reference,
        trip_id,
        user_id,
        contact_email,
        contact_phone,
        status,
        locked_until,
        subtotal,
        service_fee,
        total_price,
        currency,
        payment_status,
        is_guest_checkout
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const sanitizedUserId = sanitizeUUID(bookingData.userId);

    const isGuestFlag =
      bookingData.isGuestCheckout === true || bookingData.is_guest_checkout === true ? true : false;
    const values = [
      bookingData.bookingReference,
      bookingData.tripId,
      sanitizedUserId,
      bookingData.contactEmail,
      bookingData.contactPhone,
      bookingData.status || 'pending',
      bookingData.lockedUntil,
      bookingData.subtotal,
      bookingData.serviceFee,
      bookingData.totalPrice,
      bookingData.currency || 'VND',
      'unpaid',
      isGuestFlag,
    ];
    console.log('[BookingRepository] SQL values:', values);
    console.log('[BookingRepository] user_id will be:', sanitizedUserId);
    console.log('[BookingRepository] is_guest_checkout DB value:', isGuestFlag);

    const result = await db.query(query, values);
    const createdBooking = mapToBooking(result.rows[0]);

    console.log('[BookingRepository] Booking created:', {
      booking_id: createdBooking.booking_id,
      user_id: createdBooking.user_id,
      booking_reference: createdBooking.booking_reference,
    });

    return createdBooking;
  }

  /**
   * Find booking by ID
   * @param {string} bookingId - Booking UUID
   * @returns {Promise<object|null>} Booking or null
   */
  async findById(bookingId) {
    const query = 'SELECT * FROM bookings WHERE booking_id = $1';
    const result = await db.query(query, [bookingId]);

    if (result.rows.length === 0) {
      return null;
    }

    return mapToBooking(result.rows[0]);
  }

  /**
   * Find booking by reference
   * @param {string} bookingReference - Booking reference
   * @returns {Promise<object|null>} Booking or null
   */
  async findByReference(bookingReference) {
    const query = 'SELECT * FROM bookings WHERE booking_reference = $1';
    const result = await db.query(query, [bookingReference]);

    if (result.rows.length === 0) {
      return null;
    }

    return mapToBooking(result.rows[0]);
  }

  /**
   * Find bookings by user ID with pagination and filters
   * @param {string} userId - User UUID
   * @param {object} filters - Query filters
   * @returns {Promise<object>} Paginated bookings
   */
  async findByUserId(userId, filters = {}) {
    // Sanitize and validate userId
    const sanitizedUserId = sanitizeUUID(userId);

    if (!sanitizedUserId) {
      // Check if it's an INTEGER from old JWT
      const intValue = parseInt(String(userId), 10);
      if (!isNaN(intValue) && intValue > 0) {
        console.error('═══════════════════════════════════════════════════════════');
        console.error('❌ AUTHENTICATION ERROR: Old JWT Token Detected');
        console.error('═══════════════════════════════════════════════════════════');
        console.error(`Received userId: ${userId} (INTEGER)`);
        console.error('Expected: UUID format (e.g., 550e8400-e29b-41d4-a716-446655440000)');
        console.error('');
        console.error('🔍 Root Cause:');
        console.error('   JWT token was created BEFORE database migration (SERIAL → UUID)');
        console.error('   Old tokens contain integer userId, new schema requires UUID');
        console.error('');
        console.error('✅ Solution:');
        console.error('   1. User must LOGOUT from frontend');
        console.error('   2. User must LOGIN again to get fresh JWT token');
        console.error('   3. New JWT will contain UUID userId');
        console.error('');
        console.error('📝 For developers:');
        console.error('   - Check JWT payload: decode token at jwt.io');
        console.error('   - Verify users.user_id is UUID in database');
        console.error('   - Ensure auth-service generates UUID tokens');
        console.error('═══════════════════════════════════════════════════════════');

        // Throw clear error instead of returning empty result
        throw new Error(
          'OLD_JWT_TOKEN_DETECTED: Please logout and login again to get a fresh token with UUID userId'
        );
      } else {
        console.warn('[BookingRepository] Invalid userId provided:', userId);
        throw new Error('INVALID_USER_ID: userId must be a valid UUID');
      }
    }

    console.log(
      '[BookingRepository] Searching bookings for userId:',
      sanitizedUserId,
      'with filters:',
      filters
    );

    const {
      status = 'all',
      fromDate,
      toDate,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = filters;

    let query = `SELECT bookings.*, (ratings.rating_id IS NOT NULL) as has_rating,
                         trips.departure_time, trips.arrival_time,
                         routes.origin, routes.destination,
                         operators.name as operator_name
                  FROM bookings
                  LEFT JOIN ratings ON ratings.booking_id = bookings.booking_id
                  LEFT JOIN trips ON trips.trip_id = bookings.trip_id
                  LEFT JOIN routes ON routes.route_id = trips.route_id
                  LEFT JOIN operators ON operators.operator_id = routes.operator_id
                  WHERE bookings.user_id = $1`;
    const values = [sanitizedUserId];
    let paramIndex = 2;

    // Add status filter
    if (status !== 'all') {
      query += ` AND bookings.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
      console.log(`[BookingRepository] Filtering by status: ${status}`);
    }

    // Add date filters
    if (fromDate) {
      query += ` AND created_at >= $${paramIndex}`;
      values.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND created_at <= $${paramIndex}`;
      values.push(toDate);
      paramIndex++;
    }

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM bookings 
                      LEFT JOIN ratings ON ratings.booking_id = bookings.booking_id 
                      LEFT JOIN trips ON trips.trip_id = bookings.trip_id
                      LEFT JOIN routes ON routes.route_id = trips.route_id
                      LEFT JOIN operators ON operators.operator_id = routes.operator_id
                      WHERE bookings.user_id = $1`;

    const countValues = [sanitizedUserId];
    let countParamIndex = 2;

    // Add status filter to count query
    if (status !== 'all') {
      countQuery += ` AND bookings.status = $${countParamIndex}`;
      countValues.push(status);
    }

    const countResult = await db.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count, 10);

    // Map camelCase to snake_case for sorting
    const sortColumnMap = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      totalPrice: 'total_price',
      created_at: 'created_at', // Support both formats
      updated_at: 'updated_at',
      total_price: 'total_price',
    };

    const sortColumn = sortColumnMap[sortBy] || 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortColumn} ${sortDirection}`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, (page - 1) * limit);

    console.log('[BookingRepository] Executing query:', query);
    console.log('[BookingRepository] Query values:', values);

    const result = await db.query(query, values);

    console.log(`[BookingRepository] Found ${result.rows.length} bookings (total: ${total})`);

    return {
      bookings: result.rows.map(mapToBooking),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update booking status
   * @param {string} bookingId - Booking UUID
   * @param {string} status - New status
   * @returns {Promise<object|null>} Updated booking
   */
  async updateStatus(bookingId, status) {
    const query = `
      UPDATE bookings 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $2
      RETURNING *
    `;

    const result = await db.query(query, [status, bookingId]);

    if (result.rows.length === 0) {
      return null;
    }

    return mapToBooking(result.rows[0]);
  }

  /**
   * Update booking payment status
   * @param {string} bookingId - Booking UUID
   * @param {object} paymentData - Payment data
   * @returns {Promise<object|null>} Updated booking
   */
  async updatePayment(bookingId, paymentData) {
    const query = `
      UPDATE bookings 
      SET 
        payment_status = $1::VARCHAR,
        payment_method = $2,
        paid_at = $3,
        status = CASE WHEN $1::VARCHAR = 'paid' THEN 'confirmed' ELSE status END,
        updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $4
      RETURNING *
    `;

    const values = [
      paymentData.paymentStatus,
      paymentData.paymentMethod,
      paymentData.paidAt || null,
      bookingId,
    ];

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return mapToBooking(result.rows[0]);
  }

  /**
   * Assign a user_id to a booking if currently null
   * @param {string} bookingId
   * @param {string} userId
   * @returns {Promise<object|null>} Updated booking
   */
  async updateUserId(bookingId, userId) {
    const sanitizedUserId = sanitizeUUID(userId);
    if (!sanitizedUserId) {
      console.warn('[BookingRepository] updateUserId called with invalid userId:', userId);
      return null;
    }

    const query = `
      UPDATE bookings
      SET user_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $2 AND (user_id IS NULL OR user_id = '')
      RETURNING *
    `;

    const result = await db.query(query, [sanitizedUserId, bookingId]);
    if (result.rows.length === 0) return null;
    return mapToBooking(result.rows[0]);
  }

  /**
   * Cancel booking
   * @param {string} bookingId - Booking UUID
   * @param {object} cancellationData - Cancellation data
   * @returns {Promise<object|null>} Updated booking
   */
  async cancel(bookingId, cancellationData) {
    const query = `
      UPDATE bookings 
      SET 
        status = 'cancelled',
        cancellation_reason = $1,
        refund_amount = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $3
      RETURNING *
    `;

    const values = [
      cancellationData.reason || null,
      cancellationData.refundAmount || null,
      bookingId,
    ];

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return mapToBooking(result.rows[0]);
  }

  /**
   * Update e-ticket URLs
   * @param {string} bookingId - Booking UUID
   * @param {object} eTicketData - E-ticket data
   * @returns {Promise<object|null>} Updated booking
   */
  async updateETicket(bookingId, eTicketData) {
    const query = `
      UPDATE bookings 
      SET 
        ticket_url = $1,
        qr_code_url = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $3
      RETURNING *
    `;

    const values = [eTicketData.ticketUrl, eTicketData.qrCodeUrl, bookingId];

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return mapToBooking(result.rows[0]);
  }

  /**
   * Find expired bookings that need to be cancelled
   * @returns {Promise<Array>} Expired bookings
   */
  async findExpiredBookings() {
    const query = `
      SELECT * FROM bookings 
      WHERE status = 'pending' 
      AND payment_status = 'unpaid'
      AND locked_until < CURRENT_TIMESTAMP
    `;

    const result = await db.query(query);
    return result.rows.map(mapToBooking);
  }

  /**
   * Check if seats are already booked for a trip
   * @param {string} tripId - Trip UUID
   * @param {Array<string>} seatCodes - Seat codes to check
   * @returns {Promise<Array>} Already booked seats
   */
  async checkSeatsAvailability(tripId, seatCodes) {
    const query = `
      SELECT DISTINCT bp.seat_code
      FROM booking_passengers bp
      INNER JOIN bookings b ON bp.booking_id = b.booking_id
      WHERE b.trip_id = $1
      AND b.status IN ('pending', 'confirmed')
      AND bp.seat_code = ANY($2)
    `;

    const result = await db.query(query, [tripId, seatCodes]);
    return result.rows.map((row) => row.seat_code);
  }

  /**
   * Find upcoming confirmed bookings within a time window
   * @param {Date} startTime - Start of time window
   * @param {Date} endTime - End of time window
   * @returns {Promise<Array>} Upcoming bookings
   */
  async findUpcomingTrips(startTime, endTime) {
    const query = `
      SELECT
        b.booking_id,
        b.booking_reference,
        b.trip_id,
        b.user_id,
        b.contact_email,
        b.contact_phone,
        b.status,
        b.payment_status,
        b.total_price,
        b.currency,
        t.departure_time
      FROM bookings b
      INNER JOIN trips t ON b.trip_id = t.trip_id
      LEFT JOIN users u ON b.user_id = u.user_id
      WHERE b.status = 'confirmed'
      AND b.payment_status = 'paid'
      AND t.departure_time BETWEEN $1 AND $2
      AND b.contact_phone IS NOT NULL
      AND b.contact_phone != ''
    `;

    const result = await db.query(query, [startTime, endTime]);
    return result.rows.map((row) => ({
      booking_id: row.booking_id,
      booking_reference: row.booking_reference,
      trip_id: row.trip_id,
      user_id: row.user_id,
      contact_email: row.contact_email,
      contact_phone: row.contact_phone,
      status: row.status,
      payment_status: row.payment_status,
      total_price: row.total_price,
      currency: row.currency,
      departure_time: row.departure_time,
      preferences: row.preferences || {},
    }));
  }

  /**
   * Update booking with modification fee
   * @param {string} bookingId - Booking UUID
   * @param {object} data - Modification fee data
   * @returns {Promise<object>} Updated booking
   */
  async updateModificationFee(bookingId, data) {
    const query = `
      UPDATE bookings
      SET 
        total_price = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $2
      RETURNING *
    `;

    const result = await db.query(query, [data.newTotalPrice, bookingId]);
    return result.rows[0] ? mapToBooking(result.rows[0]) : null;
  }

  /**
   * Update ticket URL after regeneration
   * @param {string} bookingId - Booking UUID
   * @param {string} ticketUrl - New ticket URL
   * @returns {Promise<object>} Updated booking
   */
  async updateTicketUrl(bookingId, ticketUrl) {
    const query = `
      UPDATE bookings
      SET 
        ticket_url = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $2
      RETURNING *
    `;

    const result = await db.query(query, [ticketUrl, bookingId]);
    return result.rows[0] ? mapToBooking(result.rows[0]) : null;
  }

  // ==================== ADMIN METHODS ====================

  /**
   * Find all bookings with filters and pagination (Admin only)
   * @param {object} filters - Query filters
   * @returns {Promise<object>} Paginated bookings
   */
  async findAllWithFilters(filters) {
    const { page = 1, limit = 20, status, fromDate, toDate, sortBy = 'created_at', sortOrder = 'DESC' } = filters;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (status) {
      conditions.push(`b.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (fromDate) {
      conditions.push(`b.created_at >= $${paramIndex}`);
      values.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      conditions.push(`b.created_at <= $${paramIndex}`);
      values.push(toDate);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['created_at', 'updated_at', 'total_price', 'status', 'payment_status'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      ${whereClause}
    `;

    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get bookings with pagination
    const query = `
      SELECT 
        b.*,
        u.email as user_email,
        u.full_name as user_name,
        (SELECT COUNT(*) FROM booking_passengers WHERE booking_id = b.booking_id) as passenger_count
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.user_id
      ${whereClause}
      ORDER BY b.${safeSortBy} ${safeSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

    const result = await db.query(query, values);

    return {
      bookings: result.rows.map((row) => ({
        ...mapToBooking(row),
        user: row.user_email ? {
          email: row.user_email,
          name: row.user_name,
        } : null,
        passengerCount: parseInt(row.passenger_count),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update booking with refund information (Admin only)
   * @param {string} bookingId - Booking UUID
   * @param {object} refundData - Refund data
   * @returns {Promise<object>} Updated booking
   */
  async updateRefund(bookingId, refundData) {
    const query = `
      UPDATE bookings
      SET 
        refund_amount = $1,
        cancellation_reason = $2,
        status = 'cancelled',
        updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = $3
      RETURNING *
    `;

    const result = await db.query(query, [
      refundData.refundAmount,
      refundData.reason,
      bookingId,
    ]);

    return result.rows[0] ? mapToBooking(result.rows[0]) : null;
  }
}

module.exports = new BookingRepository();
