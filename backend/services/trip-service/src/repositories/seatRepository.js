// repositories/seatRepository.js
const pool = require('../database');

class SeatRepository {
  /**
   * Get seat map for a trip
   * @param {string} tripId - Trip ID
   * @returns {Promise<Object>} Seat map data
   */
  async getSeatMapForTrip(tripId) {
    // First get trip and bus info
    const tripQuery = `
      SELECT
        t.trip_id,
        t.bus_id,
        t.base_price,
        b.bus_model_id,
        bm.total_seats
      FROM trips t
      JOIN buses b ON t.bus_id = b.bus_id
      JOIN bus_models bm ON b.bus_model_id = bm.bus_model_id
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
        seat_code,
        seat_type,
        position,
        price,
        is_active
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

    // Calculate layout dimensions
    // For simplicity, assume 2-2 layout (2 seats per row, 2 rows)
    // In a real implementation, you'd have a layout configuration
    const layout = '2-2';
    const [seatsPerRow, numRows] = layout.split('-').map(Number);

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

      // Calculate row and column from seat_code
      // Assuming seat codes like A1, A2, B1, B2, etc.
      const rowLetter = seat.seat_code.charAt(0);
      const colNumber = parseInt(seat.seat_code.substring(1));
      const row = rowLetter.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
      const column = colNumber;

      return {
        seatId: seat.seat_id,
        seatCode: seat.seat_code,
        row,
        column,
        seatType: seat.seat_type,
        position: seat.position,
        price: parseFloat(trip.base_price) + parseFloat(seat.price || 0),
        status,
        ...(lockedUntil && { lockedUntil })
      };
    });

    return {
      tripId,
      seatMap: {
        layout,
        rows: numRows,
        columns: seatsPerRow,
        seats: transformedSeats
      },
      legend: {
        available: 'seat can be selected',
        occupied: 'seat already booked',
        locked: 'seat temporarily reserved by another user'
      }
    };
  }
}

module.exports = new SeatRepository();