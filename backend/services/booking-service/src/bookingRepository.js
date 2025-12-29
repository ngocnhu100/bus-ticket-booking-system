const pool = require('./database');

class BookingRepository {
  async createBooking(bookingData) {
    const {
      bookingReference,
      tripId,
      userId,
      contactEmail,
      contactPhone,
      subtotal,
      serviceFee,
      totalPrice,
      paymentMethod,
      lockedUntil,
    } = bookingData;

    const query = `
      INSERT INTO bookings (
        booking_reference, trip_id, user_id, contact_email, contact_phone,
        subtotal, service_fee, total_price, payment_method, locked_until,
        status, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', 'unpaid')
      RETURNING *
    `;

    const values = [
      bookingReference,
      tripId,
      userId || null,
      contactEmail,
      contactPhone,
      subtotal,
      serviceFee,
      totalPrice,
      paymentMethod || 'cash',
      lockedUntil,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async addPassengers(bookingId, passengers) {
    const query = `
      INSERT INTO booking_passengers (
        booking_id, full_name, document_id, phone, seat_code, price
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const passengerRecords = [];
    for (const passenger of passengers) {
      const values = [
        bookingId,
        passenger.fullName,
        passenger.idNumber || null,
        passenger.phone || null,
        passenger.seatNumber,
        passenger.price || 0,
      ];
      const result = await pool.query(query, values);
      passengerRecords.push(result.rows[0]);
    }

    return passengerRecords;
  }

  async findByReference(bookingReference) {
    const query = `
      SELECT b.*, 
        json_agg(
          json_build_object(
            'full_name', bp.full_name,
            'document_id', bp.document_id,
            'phone', bp.phone,
            'seat_code', bp.seat_code,
            'price', bp.price
          )
        ) as passengers
      FROM bookings b
      LEFT JOIN booking_passengers bp ON b.booking_id = bp.booking_id
      WHERE b.booking_reference = $1
      GROUP BY b.booking_id
    `;

    const result = await pool.query(query, [bookingReference]);
    return result.rows[0] || null;
  }
  async findByReferenceAndContact(bookingReference, contactEmail, contactPhone) {
    const query = `
      SELECT b.*, 
        json_agg(
          json_build_object(
            'full_name', bp.full_name,
            'document_id', bp.document_id,
            'phone', bp.phone,
            'seat_code', bp.seat_code,
            'price', bp.price
          )
        ) as passengers
      FROM bookings b
      LEFT JOIN booking_passengers bp ON b.booking_id = bp.booking_id
      WHERE b.booking_reference = $1 
        AND (b.contact_email = $2 OR b.contact_phone = $3)
      GROUP BY b.booking_id
    `;

    const result = await pool.query(query, [bookingReference, contactEmail, contactPhone]);
    return result.rows[0] || null;
  }

  async findByUserId(userId, limit = 10, offset = 0) {
    const query = `
      SELECT b.*, 
        json_agg(
          json_build_object(
            'full_name', bp.full_name,
            'document_id', bp.document_id,
            'phone', bp.phone,
            'seat_code', bp.seat_code,
            'price', bp.price
          )
        ) as passengers
      FROM bookings b
      LEFT JOIN booking_passengers bp ON b.booking_id = bp.booking_id
      WHERE b.user_id = $1
      GROUP BY b.booking_id
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async checkSeatAvailability(tripId, seatNumbers) {
    const query = `
      SELECT bp.seat_code
      FROM booking_passengers bp
      JOIN bookings b ON bp.booking_id = b.booking_id
      WHERE b.trip_id = $1 
        AND bp.seat_code = ANY($2)
        AND b.status NOT IN ('cancelled')
        AND (b.locked_until IS NULL OR b.locked_until > NOW())
    `;

    const result = await pool.query(query, [tripId, seatNumbers]);
    return result.rows.map((row) => row.seat_code);
  }

  async checkReferenceExists(bookingReference) {
    const query = 'SELECT EXISTS(SELECT 1 FROM bookings WHERE booking_reference = $1)';
    const result = await pool.query(query, [bookingReference]);
    return result.rows[0].exists;
  }

  async findById(bookingId) {
    const query = `
      SELECT b.*, 
        json_agg(
          json_build_object(
            'ticket_id', bp.ticket_id,
            'booking_id', bp.booking_id,
            'seat_code', bp.seat_code,
            'price', bp.price,
            'full_name', bp.full_name,
            'phone', bp.phone,
            'document_id', bp.document_id,
            'created_at', bp.created_at
          )
        ) as passengers
      FROM bookings b
      LEFT JOIN booking_passengers bp ON b.booking_id = bp.booking_id
      WHERE b.booking_id = $1
      GROUP BY b.booking_id
    `;

    const result = await pool.query(query, [bookingId]);
    return result.rows[0] || null;
  }

  /**
   * Get booking with full trip details for PDF generation
   * Includes: trip, route, operator, bus, schedule info
   */
  async findByReferenceWithTripDetails(bookingReference) {
    const query = `
      SELECT 
        b.*,
        t.trip_id,
        t.departure_time,
        t.arrival_time,
        t.base_price as price_per_seat,
        r.origin as origin_city,
        r.destination as destination_city,
        r.distance_km as distance,
        r.estimated_minutes,
        o.name as operator_name,
        o.logo_url as operator_logo,
        COALESCE(bus.plate_number, bus.license_plate, 'N/A') as bus_number,
        bm.name as bus_type,
        COALESCE(
          json_agg(
            json_build_object(
              'full_name', bp.full_name,
              'document_id', bp.document_id,
              'phone', bp.phone,
              'seat_code', bp.seat_code,
              'price', bp.price,
              'passenger_type', 'adult'
            )
          ) FILTER (WHERE bp.ticket_id IS NOT NULL),
          '[]'::json
        ) as passengers
      FROM bookings b
      LEFT JOIN booking_passengers bp ON b.booking_id = bp.booking_id
      LEFT JOIN trips t ON b.trip_id = t.trip_id
      LEFT JOIN routes r ON t.route_id = r.route_id
      LEFT JOIN buses bus ON t.bus_id = bus.bus_id
      LEFT JOIN operators o ON bus.operator_id = o.operator_id
      LEFT JOIN bus_models bm ON bus.bus_model_id = bm.bus_model_id
      WHERE b.booking_reference = $1
      GROUP BY b.booking_id, t.trip_id, r.route_id, o.operator_id, bus.bus_id, bm.bus_model_id
    `;

    const result = await pool.query(query, [bookingReference]);
    return result.rows[0] || null;
  }

  async updateTicketInfo(bookingId, ticketData) {
    const { ticketUrl, qrCode } = ticketData;

    const query = `
      UPDATE bookings
      SET 
        ticket_url = $1,
        qr_code_url = $2,
        updated_at = NOW()
      WHERE booking_id = $3
      RETURNING *
    `;

    const values = [ticketUrl, qrCode, bookingId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async updateBookingStatus(bookingId, status) {
    const query = `
      UPDATE bookings
      SET 
        status = $1,
        updated_at = NOW()
      WHERE booking_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [status, bookingId]);
    return result.rows[0];
  }

  async confirmBooking(bookingId) {
    const query = `
      UPDATE bookings
      SET 
        status = 'confirmed',
        payment_status = 'paid',
        paid_at = NOW(),
        updated_at = NOW()
      WHERE booking_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [bookingId]);
    return result.rows[0];
  }

  async getBookingsByTripId(tripId, statusFilter = null) {
    let query = `
      SELECT 
        b.booking_id, b.booking_reference, b.trip_id, b.user_id,
        b.contact_email, b.contact_phone, b.status, b.payment_status,
        b.total_price, b.currency, b.created_at, b.updated_at,
        b.refund_amount, b.cancellation_reason,
        COUNT(bp.passenger_id) as passenger_count
      FROM bookings b
      LEFT JOIN booking_passengers bp ON b.booking_id = bp.booking_id
      WHERE b.trip_id = $1
    `;

    const params = [tripId];

    if (statusFilter) {
      query += ` AND b.status = $2`;
      params.push(statusFilter);
    }

    query += `
      GROUP BY b.booking_id
      ORDER BY b.created_at DESC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = new BookingRepository();
