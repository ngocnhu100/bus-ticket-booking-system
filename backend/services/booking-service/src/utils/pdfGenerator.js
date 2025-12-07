const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
  /**
   * Generate ticket PDF
   * @param {object} bookingData - Complete booking data with trip and passenger info
   * @param {string} qrCodeDataUrl - QR code as base64 data URL
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateTicketPDF(bookingData, qrCodeDataUrl) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          console.log(`✅ PDF generated for booking: ${bookingData.booking_reference}`);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header
        doc
          .fontSize(24)
          .fillColor('#2563eb')
          .text('🚌 BUS TICKET', { align: 'center' })
          .moveDown(0.5);

        doc
          .fontSize(12)
          .fillColor('#666666')
          .text('Bus Ticket Booking System', { align: 'center' })
          .moveDown(1);

        // Booking Reference - Highlight
        doc
          .fontSize(10)
          .fillColor('#000000')
          .text('BOOKING REFERENCE', { align: 'center' })
          .moveDown(0.3);

        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .fillColor('#2563eb')
          .text(bookingData.booking_reference, { align: 'center' })
          .font('Helvetica')
          .moveDown(1);

        // Divider line
        doc
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke('#cccccc')
          .moveDown(1);

        // Trip Information Section
        doc
          .fontSize(14)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text('TRIP INFORMATION')
          .font('Helvetica')
          .moveDown(0.5);

        const tripInfoY = doc.y;
        
        // Left column
        doc
          .fontSize(10)
          .fillColor('#666666')
          .text('Trip ID:', 50, tripInfoY);
        
        doc
          .fillColor('#000000')
          .text(bookingData.trip_id, 150, tripInfoY);

        doc
          .fillColor('#666666')
          .text('Status:', 50, tripInfoY + 20);
        
        doc
          .fillColor(this.getStatusColor(bookingData.status))
          .text(bookingData.status.toUpperCase(), 150, tripInfoY + 20);

        // Passenger Information
        doc.y = tripInfoY + 60;
        doc
          .fontSize(14)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text('PASSENGER INFORMATION')
          .font('Helvetica')
          .moveDown(0.5);

        if (bookingData.passengers && bookingData.passengers.length > 0) {
          bookingData.passengers.forEach((passenger, index) => {
            const passengerY = doc.y;
            
            doc
              .fontSize(11)
              .fillColor('#000000')
              .font('Helvetica-Bold')
              .text(`Passenger ${index + 1}`, 50, passengerY);
            
            doc
              .font('Helvetica')
              .fontSize(10)
              .text(`Name: ${passenger.full_name || 'N/A'}`, 50, passengerY + 20);
            
            doc
              .text(`Seat: ${passenger.seat_code || 'N/A'}`, 50, passengerY + 35);

            if (passenger.document_id) {
              doc.text(`ID: ${passenger.document_id}`, 50, passengerY + 50);
            }

            doc.moveDown(1.5);
          });
        }

        // Payment Information
        doc
          .fontSize(14)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text('PAYMENT INFORMATION')
          .font('Helvetica')
          .moveDown(0.5);

        const paymentY = doc.y;

        doc
          .fontSize(10)
          .fillColor('#666666')
          .text('Subtotal:', 50, paymentY);
        
        doc
          .fillColor('#000000')
          .text(`${parseFloat(bookingData.subtotal || 0).toLocaleString()} ${bookingData.currency || 'VND'}`, 150, paymentY);

        doc
          .fillColor('#666666')
          .text('Service Fee:', 50, paymentY + 20);
        
        doc
          .fillColor('#000000')
          .text(`${parseFloat(bookingData.service_fee || 0).toLocaleString()} ${bookingData.currency || 'VND'}`, 150, paymentY + 20);

        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#666666')
          .text('Total:', 50, paymentY + 45);
        
        doc
          .fillColor('#2563eb')
          .text(`${parseFloat(bookingData.total_price || 0).toLocaleString()} ${bookingData.currency || 'VND'}`, 150, paymentY + 45);

        doc.font('Helvetica').moveDown(2);

        // QR Code Section
        if (qrCodeDataUrl) {
          doc
            .fontSize(12)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('VERIFICATION QR CODE', { align: 'center' })
            .font('Helvetica')
            .moveDown(0.5);

          // Convert data URL to buffer
          const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
          const qrBuffer = Buffer.from(base64Data, 'base64');

          // Center QR code
          const qrSize = 150;
          const pageWidth = 595; // A4 width in points
          const qrX = (pageWidth - qrSize) / 2;

          doc.image(qrBuffer, qrX, doc.y, {
            width: qrSize,
            height: qrSize
          });

          doc.y += qrSize + 20;
        }

        // Contact Information
        doc
          .fontSize(10)
          .fillColor('#666666')
          .text('Contact Information:', 50, doc.y)
          .moveDown(0.3);

        if (bookingData.contact_email) {
          doc.text(`Email: ${bookingData.contact_email}`, 50, doc.y);
        }

        if (bookingData.contact_phone) {
          doc.text(`Phone: ${bookingData.contact_phone}`, 50, doc.y + 15);
        }

        // Footer
        doc
          .moveDown(2)
          .fontSize(8)
          .fillColor('#999999')
          .text(
            `Booking created: ${new Date(bookingData.created_at).toLocaleString()}`,
            { align: 'center' }
          )
          .text(
            'Please present this ticket at the boarding point',
            { align: 'center' }
          )
          .text(
            '© 2025 Bus Ticket Booking System. All rights reserved.',
            { align: 'center' }
          );

        doc.end();
      } catch (error) {
        console.error('❌ Error generating PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Get color based on booking status
   */
  getStatusColor(status) {
    const colors = {
      'confirmed': '#10b981',
      'pending': '#f59e0b',
      'cancelled': '#ef4444',
      'completed': '#6366f1'
    };
    return colors[status] || '#666666';
  }

  /**
   * Save PDF to file system
   * @param {Buffer} pdfBuffer - PDF buffer
   * @param {string} bookingReference - Booking reference for filename
   * @returns {Promise<string>} File path
   */
  async savePDFToFile(pdfBuffer, bookingReference) {
    try {
      const ticketsDir = path.join(__dirname, '../../tickets');
      
      // Create tickets directory if it doesn't exist
      if (!fs.existsSync(ticketsDir)) {
        fs.mkdirSync(ticketsDir, { recursive: true });
      }

      const filename = `ticket-${bookingReference}-${Date.now()}.pdf`;
      const filepath = path.join(ticketsDir, filename);

      await fs.promises.writeFile(filepath, pdfBuffer);
      
      console.log(`✅ PDF saved to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('❌ Error saving PDF to file:', error);
      throw new Error('Failed to save PDF to file system');
    }
  }

  /**
   * Get public URL for ticket
   * In production, this would return a CDN URL or cloud storage URL
   * @param {string} filepath - Local file path
   * @param {string} bookingReference - Booking reference
   * @returns {string} Public URL
   */
  getPublicTicketUrl(filepath, bookingReference) {
    // For development: local file path
    // For production: this should return CDN/S3 URL
    const filename = path.basename(filepath);
    const baseUrl = process.env.TICKET_BASE_URL || 'http://localhost:3004';
    return `${baseUrl}/tickets/${filename}`;
  }
}

module.exports = new PDFGenerator();
