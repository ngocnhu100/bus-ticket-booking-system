const db = require('../database');
const { mapToPassenger } = require('../utils/helpers');

class PassengerRepository {
  /**
   * Create passenger records for a booking
   * @param {string} bookingId - Booking UUID
   * @param {Array<object>} passengers - Passenger data with price
   * @returns {Promise<Array>} Created passengers
   */
  async createBatch(bookingId, passengers) {
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      const query = `
        INSERT INTO booking_passengers (
          booking_id,
          seat_code,
          price,
          full_name,
          phone,
          document_id
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const createdPassengers = [];
      
      for (let i = 0; i < passengers.length; i++) {
        const passenger = passengers[i];
        
        // Validate required fields before insert
        if (!passenger.seatCode) {
          throw new Error(`Passenger ${i + 1}: seatCode is required`);
        }
        if (!passenger.fullName) {
          throw new Error(`Passenger ${i + 1}: fullName is required`);
        }
        if (!passenger.price || passenger.price <= 0) {
          throw new Error(`Passenger ${i + 1}: invalid price (${passenger.price})`);
        }
        
        const values = [
          bookingId,
          passenger.seatCode,
          passenger.price,
          passenger.fullName,
          passenger.phone || null,
          passenger.documentId || null
        ];
        
        console.log(`[PassengerRepository] Inserting passenger ${i + 1}:`, {
          bookingId,
          seatCode: passenger.seatCode,
          price: passenger.price,
          fullName: passenger.fullName
        });
        
        const result = await client.query(query, values);
        createdPassengers.push(mapToPassenger(result.rows[0]));
      }
      
      await client.query('COMMIT');
      console.log(`[PassengerRepository] Successfully created ${createdPassengers.length} passengers`);
      return createdPassengers;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[PassengerRepository] Error creating passengers:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find passengers by booking ID
   * @param {string} bookingId - Booking UUID
   * @returns {Promise<Array>} Passengers
   */
  async findByBookingId(bookingId) {
    const query = `
      SELECT * FROM booking_passengers 
      WHERE booking_id = $1
      ORDER BY created_at ASC
    `;
    
    const result = await db.query(query, [bookingId]);
    return result.rows.map(mapToPassenger);
  }

  /**
   * Find a passenger by ticket ID
   * @param {string} ticketId - Ticket UUID
   * @returns {Promise<object|null>} Passenger or null if not found
   */
  async findByTicketId(ticketId) {
    const query = `
      SELECT * FROM booking_passengers 
      WHERE ticket_id = $1
    `;
    
    const result = await db.query(query, [ticketId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return mapToPassenger(result.rows[0]);
  }

  /**
   * Delete passengers by booking ID
   * @param {string} bookingId - Booking UUID
   * @returns {Promise<boolean>} Success
   */
  async deleteByBookingId(bookingId) {
    const query = 'DELETE FROM booking_passengers WHERE booking_id = $1';
    await db.query(query, [bookingId]);
    return true;
  }

  /**
   * Update passenger information
   * @param {string} ticketId - Ticket UUID
   * @param {object} passengerData - Passenger data
   * @returns {Promise<object|null>} Updated passenger
   */
  async update(ticketId, passengerData) {
    const query = `
      UPDATE booking_passengers 
      SET 
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        document_id = COALESCE($3, document_id)
      WHERE ticket_id = $4
      RETURNING *
    `;
    
    const values = [
      passengerData.full_name || passengerData.fullName,
      passengerData.phone,
      passengerData.document_id || passengerData.documentId,
      ticketId
    ];
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return mapToPassenger(result.rows[0]);
  }

  /**
   * Update passenger seat (for seat changes)
   * @param {string} ticketId - Ticket UUID
   * @param {string} newSeatCode - New seat code
   * @returns {Promise<object|null>} Updated passenger
   */
  async updateSeat(ticketId, newSeatCode) {
    const query = `
      UPDATE booking_passengers
      SET seat_code = $1
      WHERE ticket_id = $2
      RETURNING *
    `;

    const result = await db.query(query, [newSeatCode, ticketId]);

    if (result.rows.length === 0) {
      return null;
    }

    return mapToPassenger(result.rows[0]);
  }
}

module.exports = new PassengerRepository();
