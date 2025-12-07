// repositories/seatRepository.js
const pool = require('../database');
const seatLockService = require('../services/seatLockService');

class SeatRepository {
  /**
   * Get seat map for a trip
   * @param {string} tripId - Trip ID
   * @returns {Promise<Object>} Seat map data
   */
  async getSeatMapForTrip(tripId) {
    // First get trip and bus info with layout
    const tripQuery = `
      SELECT
        t.trip_id,
        t.bus_id,
        t.base_price,
        b.bus_model_id,
        bm.total_seats,
        sl.layout_json
      FROM trips t
      JOIN buses b ON t.bus_id = b.bus_id
      JOIN bus_models bm ON b.bus_model_id = bm.bus_model_id
      LEFT JOIN seat_layouts sl ON bm.bus_model_id = sl.bus_model_id
      WHERE t.trip_id = $1 AND t.status = 'active'
    `;

    const tripResult = await pool.query(tripQuery, [tripId]);
    if (tripResult.rows.length === 0) {
      throw new Error('Trip not found');
    }

    const trip = tripResult.rows[0];

    // Get all seats for this bus
    const seatsQuery = `
      SELECT
        seat_id,
        bus_id,
        seat_code,
        seat_type,
        position,
        price,
        row_num,
        col_num,
        is_active,
        created_at
      FROM seats
      WHERE bus_id = $1 AND is_active = true
      ORDER BY row_num, col_num
    `;

    const seatsResult = await pool.query(seatsQuery, [trip.bus_id]);
    const seats = seatsResult.rows;

    // Get occupied seats (confirmed bookings)
    const occupiedSeatsQuery = `
      SELECT DISTINCT bp.seat_code
      FROM booking_passengers bp
      JOIN bookings b ON bp.booking_id = b.booking_id
      WHERE b.trip_id = $1 AND b.status = 'confirmed'
    `;

    const occupiedResult = await pool.query(occupiedSeatsQuery, [tripId]);
    const occupiedSeatCodes = new Set(occupiedResult.rows.map(row => row.seat_code));

    // Get locked seats (pending bookings not expired)
    const lockedSeatsQuery = `
      SELECT DISTINCT bp.seat_code, b.locked_until
      FROM booking_passengers bp
      JOIN bookings b ON bp.booking_id = b.booking_id
      WHERE b.trip_id = $1 AND b.status = 'pending'
        AND b.locked_until > CURRENT_TIMESTAMP
    `;

    const lockedResult = await pool.query(lockedSeatsQuery, [tripId]);
    const dbLockedSeats = lockedResult.rows.reduce((acc, row) => {
      acc[row.seat_code] = row.locked_until;
      return acc;
    }, {});

    // Get Redis-based temporary locks
    const redisLockedSeats = await seatLockService.getLockedSeats(tripId);

    // Calculate layout dimensions from database
    if (!trip.layout_json) {
      throw new Error('Bus layout configuration not found in database');
    }

    const layoutData = trip.layout_json;
    if (!layoutData.rows || !Array.isArray(layoutData.rows) || layoutData.rows.length === 0) {
      throw new Error('Invalid bus layout configuration: missing or empty rows');
    }

    const numRows = layoutData.rows.length;
    // Calculate max seats per row
    const seatsPerRow = Math.max(...layoutData.rows.map(row => row.seats ? row.seats.filter(seat => seat !== null).length : 0));
    const layout = `${seatsPerRow}-${numRows}`;

    // Extract driver and door information
    const driver = layoutData.driver || null;
    const doors = layoutData.doors || [];

    // Transform seats data
    const transformedSeats = seats.map(seat => {
      let status = 'available';
      let lockedUntil = null;
      let lockedBy = null;

      if (occupiedSeatCodes.has(seat.seat_code)) {
        status = 'occupied';
      } else if (dbLockedSeats[seat.seat_code]) {
        status = 'locked';
        lockedUntil = dbLockedSeats[seat.seat_code];
        lockedBy = 'booking'; // Database booking lock
      } else if (redisLockedSeats[seat.seat_code]) {
        status = 'locked';
        lockedUntil = new Date(redisLockedSeats[seat.seat_code].expiresAt);
        lockedBy = redisLockedSeats[seat.seat_code].userId;
      }

      // Use row_num and col_num from database
      const row = seat.row_num;
      const column = seat.col_num;

      return {
        seat_id: seat.seat_id,
        bus_id: seat.bus_id,
        seat_code: seat.seat_code,
        row,
        column,
        seat_type: seat.seat_type,
        position: seat.position,
        price: parseFloat(trip.base_price) + parseFloat(seat.price || 0),
        status,
        lockedUntil,
        lockedBy,
        created_at: seat.created_at
      };
    });

    return {
      trip_id: tripId,
      layout,
      rows: numRows,
      columns: seatsPerRow,
      driver,
      doors,
      seats: transformedSeats
    };
  }
}

module.exports = new SeatRepository();