// repositories/seatRepository.js
const pool = require('../database');

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
        is_active,
        created_at
      FROM seats
      WHERE bus_id = $1 AND is_active = true
      ORDER BY seat_code
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
    const lockedSeats = lockedResult.rows.reduce((acc, row) => {
      acc[row.seat_code] = row.locked_until;
      return acc;
    }, {});

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

      if (occupiedSeatCodes.has(seat.seat_code)) {
        status = 'occupied';
      } else if (lockedSeats[seat.seat_code]) {
        status = 'locked';
        lockedUntil = lockedSeats[seat.seat_code];
      }

      // Parse seat_code to extract row and column
      // Handle different formats: "1A", "H1A", "VIP1", etc.
      let row = 1;
      let column = 1;

      if (seat.seat_code.startsWith('VIP')) {
        // VIP format: "VIP1", "VIP2", etc.
        const vipMatch = seat.seat_code.match(/^VIP(\d+)$/);
        if (vipMatch) {
          row = parseInt(vipMatch[1], 10);
          column = 1; // VIP seats are typically in column 1
        }
      } else if (seat.seat_code.startsWith('H')) {
        // Sleeper format: "H1A", "H2B", etc.
        const sleeperMatch = seat.seat_code.match(/^H(\d+)([A-Z])$/);
        if (sleeperMatch) {
          row = parseInt(sleeperMatch[1], 10);
          column = sleeperMatch[2].charCodeAt(0) - 64;
        }
      } else {
        // Regular format: "1A", "2B", "10C", etc.
        const regularMatch = seat.seat_code.match(/^(\d+)([A-Z])$/);
        if (regularMatch) {
          row = parseInt(regularMatch[1], 10);
          column = regularMatch[2].charCodeAt(0) - 64;
        }
      }

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