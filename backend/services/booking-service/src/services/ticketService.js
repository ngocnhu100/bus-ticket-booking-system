const qrGenerator = require('../utils/qrGenerator');
const pdfGenerator = require('../utils/pdfGenerator');
const bookingRepository = require('../bookingRepository');
const axios = require('axios');

class TicketService {
  /**
   * Generate complete ticket (PDF + QR) for a booking
   * @param {object} booking - Complete booking data with passengers
   * @returns {Promise<object>} Ticket URLs (ticketUrl, qrCode)
   */
  async generateTicket(booking) {
    try {
      console.log(`🎫 Generating ticket for booking: ${booking.booking_reference}`);

      // 1. Generate QR code
      const qrCodeDataUrl = await qrGenerator.generateBookingQR(
        booking.booking_reference,
        booking.booking_id
      );

      // 2. Generate PDF ticket
      const pdfBuffer = await pdfGenerator.generateTicketPDF(booking, qrCodeDataUrl);

      // 3. Save PDF to file system (or upload to cloud storage)
      const filepath = await pdfGenerator.savePDFToFile(
        pdfBuffer,
        booking.booking_reference
      );

      // 4. Get public URL
      const ticketUrl = pdfGenerator.getPublicTicketUrl(
        filepath,
        booking.booking_reference
      );

      console.log(`✅ Ticket generated successfully: ${ticketUrl}`);

      return {
        ticketUrl,
        qrCode: qrCodeDataUrl
      };
    } catch (error) {
      console.error(`❌ Error generating ticket for ${booking.booking_reference}:`, error);
      throw new Error('Failed to generate ticket');
    }
  }

  /**
   * Send ticket email to customer
   * @param {string} email - Recipient email
   * @param {object} booking - Booking data
   * @param {object} ticket - Ticket data (ticketUrl, qrCode)
   * @returns {Promise<boolean>} Success status
   */
  async sendTicketEmail(email, booking, ticket) {
    try {
      const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3003';

      const emailPayload = {
        type: 'booking-ticket',
        to: email,
        bookingReference: booking.booking_reference,
        bookingData: {
          reference: booking.booking_reference,
          tripId: booking.trip_id,
          status: booking.status,
          totalPrice: booking.total_price,
          currency: booking.currency || 'VND',
          passengers: booking.passengers,
          contactEmail: booking.contact_email,
          contactPhone: booking.contact_phone
        },
        ticketUrl: ticket.ticketUrl,
        qrCode: ticket.qrCode
      };

      console.log(`📧 Sending ticket email to: ${email}`);

      const response = await axios.post(
        `${notificationServiceUrl}/send-email`,
        emailPayload,
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data.success) {
        console.log(`✅ Ticket email sent successfully to: ${email}`);
        return true;
      } else {
        console.warn(`⚠️ Ticket email response not successful:`, response.data);
        return false;
      }
    } catch (error) {
      // Email failure should not block booking confirmation
      console.error(`❌ Failed to send ticket email to ${email}:`, error.message);
      console.error(`   Error details:`, error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Complete ticket generation and notification process
   * Called when booking is confirmed
   * @param {string} bookingId - Booking UUID
   * @returns {Promise<object>} Updated booking with ticket info
   */
  async processTicketGeneration(bookingId) {
    try {
      console.log(`🎫 Processing ticket generation for booking ID: ${bookingId}`);

      // 1. Get complete booking data
      const booking = await bookingRepository.findById(bookingId);
      
      if (!booking) {
        throw new Error(`Booking not found: ${bookingId}`);
      }

      // 2. Generate ticket (PDF + QR)
      const ticket = await this.generateTicket(booking);

      // 3. Update booking with ticket URLs
      await bookingRepository.updateTicketInfo(bookingId, {
        ticketUrl: ticket.ticketUrl,
        qrCode: ticket.qrCode
      });

      // 4. Send email (non-blocking - failure won't affect booking)
      const recipientEmail = booking.user_id ? booking.user_email : booking.contact_email;
      
      if (recipientEmail) {
        // Fire and forget - don't await
        this.sendTicketEmail(recipientEmail, booking, ticket)
          .then(success => {
            if (success) {
              console.log(`✅ Ticket email delivery confirmed for: ${booking.booking_reference}`);
            } else {
              console.warn(`⚠️ Ticket email may not have been delivered for: ${booking.booking_reference}`);
            }
          })
          .catch(err => {
            console.error(`❌ Ticket email error for ${booking.booking_reference}:`, err.message);
          });
      } else {
        console.warn(`⚠️ No email address found for booking: ${booking.booking_reference}`);
      }

      console.log(`✅ Ticket generation completed for: ${booking.booking_reference}`);

      return {
        ...booking,
        ticket_url: ticket.ticketUrl,
        qr_code: ticket.qrCode
      };
    } catch (error) {
      console.error(`❌ Error processing ticket generation:`, error);
      throw error;
    }
  }
}

module.exports = new TicketService();
