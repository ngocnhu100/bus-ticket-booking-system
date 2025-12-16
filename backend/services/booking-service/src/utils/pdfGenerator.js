const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
  /**
   * Generate ticket PDF matching frontend ETicket.tsx design
   * @param {object} bookingData - Complete booking data with trip and passenger info
   * @param {string} qrCodeDataUrl - QR code as base64 data URL
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateTicketPDF(bookingData, qrCodeDataUrl) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 30, bottom: 30, left: 35, right: 35 },
        });

        // Try to register a Unicode-capable font (Noto Sans) to ensure proper rendering
        // of names with accents / other non-latin characters. Place font files under
        // `backend/services/booking-service/src/utils/fonts/` (e.g. NotoSans-Regular.ttf,
        // NotoSans-Bold.ttf). If not present, PDFKit will fall back to built-in fonts
        // which may not support full Unicode and cause rendering issues.
        try {
          const fontsDir = path.join(__dirname, 'fonts');
          const regularFontPath = path.join(fontsDir, 'NotoSans-Regular.ttf');
          const boldFontPath = path.join(fontsDir, 'NotoSans-Bold.ttf');

          let registeredUnicodeFont = false;
          if (fs.existsSync(regularFontPath)) {
            doc.registerFont('NotoSans', regularFontPath);
            registeredUnicodeFont = true;
          }
          if (fs.existsSync(boldFontPath)) {
            doc.registerFont('NotoSans-Bold', boldFontPath);
            registeredUnicodeFont = true;
          }

          // Set preferred font names (fall back to built-in Helvetica family)
          const regularFont = registeredUnicodeFont ? 'NotoSans' : 'Helvetica';
          const boldFont = registeredUnicodeFont ? 'NotoSans-Bold' : 'Helvetica-Bold';

          // Attach to doc for later reference in the generator
          doc._preferredFonts = { regularFont, boldFont };

          // Monkey-patch doc.font to transparently map Helvetica references
          // to the registered Unicode font if available. This avoids changing
          // all existing .font('Helvetica') calls in the code.
          const originalFontFn = doc.font.bind(doc);
          doc.font = function (name, size) {
            try {
              if (name === 'Helvetica' || name === 'Helvetica-Bold') {
                const mapped =
                  name === 'Helvetica-Bold'
                    ? doc._preferredFonts.boldFont
                    : doc._preferredFonts.regularFont;
                return originalFontFn(mapped, size);
              }
            } catch (e) {
              // If anything goes wrong, fall back to original behavior
            }
            return originalFontFn(name, size);
          };

          if (!registeredUnicodeFont) {
            console.warn('[PDFGenerator] Unicode fonts not found under', fontsDir);
            console.warn(
              '[PDFGenerator] To fix Unicode rendering, add NotoSans ttf files to that folder.'
            );
          }
        } catch (err) {
          console.warn('[PDFGenerator] Error registering unicode fonts:', err.message || err);
          // Ensure doc._preferredFonts exists so downstream code can safely read it
          doc._preferredFonts = { regularFont: 'Helvetica', boldFont: 'Helvetica-Bold' };
        }

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          console.log(`✅ PDF generated for booking: ${bookingData.booking_reference}`);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        const pageWidth = 595.28; // A4 width in points
        const pageHeight = 841.89; // A4 height in points
        const leftMargin = 35;
        const rightMargin = 35;
        const contentWidth = pageWidth - leftMargin - rightMargin;

        // Draw outer border (2pt black) - height 770 to fit in one page
        doc.roundedRect(leftMargin, 30, contentWidth, 770, 10).lineWidth(2).stroke('#000000');

        // ===== BLACK HEADER =====
        const headerHeight = 60;
        doc.save();

        // Draw black header background with rounded top corners
        doc
          .roundedRect(leftMargin + 2, 32, contentWidth - 4, headerHeight, 8)
          .fillAndStroke('#000000', '#000000');

        // Header text in white
        doc
          .fillColor('#FFFFFF')
          .fontSize(20)
          .font(doc._preferredFonts ? doc._preferredFonts.boldFont : 'Helvetica-Bold')
          .text('BUS E-TICKET', leftMargin + 70, 58);

        // Removed operator name from header

        doc.restore();

        // ===== BOOKING REFERENCE BOX =====
        let currentY = 32 + headerHeight + 20;

        // Black border box
        doc
          .roundedRect(leftMargin + 25, currentY, contentWidth - 50, 70, 8)
          .lineWidth(2)
          .stroke('#000000');

        // Booking Reference label
        doc
          .fillColor('#000000')
          .fontSize(8)
          .font(doc._preferredFonts ? doc._preferredFonts.boldFont : 'Helvetica-Bold')
          .text('BOOKING REFERENCE', leftMargin + 38, currentY + 15);

        // Booking Reference number (large)
        doc
          .fontSize(22)
          .font(doc._preferredFonts ? doc._preferredFonts.boldFont : 'Helvetica-Bold')
          .text(bookingData.booking_reference, leftMargin + 38, currentY + 32);

        // Status badges (right side) - aligned and same width
        const badgeWidth = 70;
        const statusX = pageWidth - rightMargin - 40 - badgeWidth;
        this.drawBadge(doc, bookingData.status, statusX, currentY + 22, badgeWidth);
        this.drawBadge(doc, bookingData.payment_status, statusX, currentY + 45, badgeWidth);

        currentY += 100;

        // ===== TRIP INFORMATION SECTION =====
        doc
          .fontSize(12)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text('TRIP INFORMATION', leftMargin + 30, currentY);
        currentY += 25;

        // Trip info box (Route + Schedule combined)
        const tripBoxHeight = 110;
        doc
          .roundedRect(leftMargin + 25, currentY, contentWidth - 50, tripBoxHeight, 8)
          .lineWidth(2)
          .stroke('#000000');

        const tripBoxTop = currentY;
        const tripBoxInnerMargin = 15;
        const routeBoxWidth = contentWidth - 50 - tripBoxInnerMargin * 2;
        const colWidth = routeBoxWidth / 3;

        // FROM city (left column)
        doc
          .fillColor('#000000')
          .fontSize(7)
          .font('Helvetica-Bold')
          .text('FROM', leftMargin + 25 + tripBoxInnerMargin, tripBoxTop + 12);

        doc
          .fontSize(13)
          .font('Helvetica-Bold')
          .text(
            bookingData.origin_city || 'N/A',
            leftMargin + 25 + tripBoxInnerMargin,
            tripBoxTop + 25,
            {
              width: colWidth - 10,
              ellipsis: true,
            }
          );

        // DISTANCE (center column)
        const distanceX = leftMargin + 25 + tripBoxInnerMargin + colWidth;
        doc
          .fontSize(7)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text('DISTANCE', distanceX, tripBoxTop + 12);

        doc
          .fontSize(13)
          .font('Helvetica-Bold')
          .text(`${bookingData.distance || 0} km`, distanceX, tripBoxTop + 25, {
            width: colWidth - 10,
            ellipsis: true,
          });

        // TO city (right column - left aligned)
        const toX = leftMargin + 25 + tripBoxInnerMargin + colWidth * 2;
        doc
          .fontSize(7)
          .font('Helvetica-Bold')
          .text('TO', toX, tripBoxTop + 12);

        doc
          .fontSize(13)
          .font('Helvetica-Bold')
          .text(bookingData.destination_city || 'N/A', toX, tripBoxTop + 25, {
            width: colWidth - 10,
            ellipsis: true,
          });

        // Separator line
        const separatorY = tripBoxTop + 58;
        doc
          .moveTo(leftMargin + 25 + tripBoxInnerMargin, separatorY)
          .lineTo(pageWidth - rightMargin - 25 - tripBoxInnerMargin, separatorY)
          .lineWidth(1)
          .stroke('#E5E7EB');

        // Schedule details (4 columns) - inside the same box
        const scheduleY = separatorY + 10;
        const scheduleWidth = contentWidth - 50 - tripBoxInnerMargin * 2;
        const scheduleColWidth = scheduleWidth / 4;
        const scheduleStartX = leftMargin + 25 + tripBoxInnerMargin;

        // Departure Date
        doc
          .fontSize(7)
          .fillColor('#666666')
          .font('Helvetica')
          .text('Departure Date', scheduleStartX, scheduleY);
        doc
          .fontSize(9)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text(this.formatDate(bookingData.departure_time), scheduleStartX, scheduleY + 12, {
            width: scheduleColWidth - 5,
            ellipsis: true,
          });

        // Departure Time
        doc
          .fontSize(7)
          .fillColor('#666666')
          .font('Helvetica')
          .text('Departure Time', scheduleStartX + scheduleColWidth, scheduleY);
        doc
          .fontSize(9)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text(
            this.formatTime(bookingData.departure_time),
            scheduleStartX + scheduleColWidth,
            scheduleY + 12
          );

        // Arrival Time
        doc
          .fontSize(7)
          .fillColor('#666666')
          .font('Helvetica')
          .text('Estimated Arrival', scheduleStartX + scheduleColWidth * 2, scheduleY);
        doc
          .fontSize(9)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text(
            this.formatTime(bookingData.arrival_time),
            scheduleStartX + scheduleColWidth * 2,
            scheduleY + 12
          );

        // Bus Type
        doc
          .fontSize(7)
          .fillColor('#666666')
          .font('Helvetica')
          .text('Bus Type', scheduleStartX + scheduleColWidth * 3, scheduleY);
        doc
          .fontSize(9)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text(
            bookingData.bus_type || 'Standard',
            scheduleStartX + scheduleColWidth * 3,
            scheduleY + 12,
            {
              width: scheduleColWidth - 5,
              ellipsis: true,
            }
          );

        currentY += tripBoxHeight + 15;

        // ===== PASSENGERS SECTION =====
        doc
          .fontSize(12)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text('PASSENGERS', leftMargin + 25, currentY);
        currentY += 20;

        // Parse passengers if it's a string
        let passengers = bookingData.passengers;
        if (typeof passengers === 'string') {
          try {
            passengers = JSON.parse(passengers);
          } catch (e) {
            passengers = [];
          }
        }

        // Passengers container box
        const passengersBoxHeight =
          passengers &&
          Array.isArray(passengers) &&
          passengers.length > 0 &&
          passengers[0].full_name
            ? Math.ceil(passengers.length / 2) * 60 + 20
            : 50;

        doc
          .roundedRect(leftMargin + 25, currentY, contentWidth - 50, passengersBoxHeight, 8)
          .lineWidth(2)
          .stroke('#000000');

        if (
          passengers &&
          Array.isArray(passengers) &&
          passengers.length > 0 &&
          passengers[0].full_name
        ) {
          const passengerBoxWidth = (contentWidth - 70) / 2;
          let passengerX = leftMargin + 35;
          let passengerY = currentY + 10;

          passengers.forEach((passenger, index) => {
            // Passenger name
            doc
              .fontSize(10)
              .fillColor('#000000')
              .font('Helvetica-Bold')
              .text(passenger.full_name || `Passenger ${index + 1}`, passengerX, passengerY, {
                width: passengerBoxWidth - 65,
                ellipsis: true,
              });

            // Passenger type
            doc
              .fontSize(7)
              .fillColor('#666666')
              .font('Helvetica')
              .text(
                (passenger.passenger_type || 'ADULT').toUpperCase(),
                passengerX,
                passengerY + 18
              );

            // Seat badge (right side) - inline
            const seatX = passengerX + passengerBoxWidth - 60;
            doc.roundedRect(seatX, passengerY, 50, 18, 4).lineWidth(1).stroke('#000000');

            doc
              .fontSize(8)
              .fillColor('#000000')
              .font('Helvetica-Bold')
              .text(`Seat ${passenger.seat_code || 'N/A'}`, seatX, passengerY + 4, {
                width: 50,
                align: 'center',
              });

            // Move to next position (2 per row)
            if (index % 2 === 0) {
              passengerX += passengerBoxWidth + 10;
            } else {
              passengerX = leftMargin + 35;
              passengerY += 45;
            }
          });

          currentY += passengersBoxHeight + 15;
        } else {
          // No passengers - compact message in center of box
          doc
            .fontSize(9)
            .fillColor('#666666')
            .font('Helvetica')
            .text('No passenger information available', leftMargin + 25, currentY + 18, {
              width: contentWidth - 50,
              align: 'center',
            });
          currentY += passengersBoxHeight + 15;
        }

        // ===== CONTACT INFORMATION SECTION (if available) =====        // Skip contact section to save space - info already in booking

        // ===== PRICE DETAILS SECTION =====
        this.drawSectionHeader(doc, 'PRICE DETAILS', leftMargin + 25, currentY, contentWidth - 50);
        currentY += 25;

        // Handle both snake_case and camelCase
        const subtotal = bookingData.subtotal || bookingData.pricing?.subtotal || 0;
        const serviceFee = bookingData.service_fee || bookingData.pricing?.serviceFee || 0;
        const totalPrice = bookingData.total_price || bookingData.pricing?.total || 0;

        // Ticket Price
        doc
          .fontSize(8)
          .fillColor('#666666')
          .font('Helvetica')
          .text('Ticket Price', leftMargin + 25, currentY);
        doc
          .fontSize(9)
          .fillColor('#000000')
          .text(this.formatCurrency(subtotal), pageWidth - rightMargin - 90, currentY, {
            width: 70,
            align: 'right',
          });

        currentY += 16;

        // Service Fee
        doc
          .fontSize(8)
          .fillColor('#666666')
          .font('Helvetica')
          .text('Service Fee', leftMargin + 25, currentY);
        doc
          .fontSize(9)
          .fillColor('#000000')
          .text(this.formatCurrency(serviceFee), pageWidth - rightMargin - 90, currentY, {
            width: 70,
            align: 'right',
          });

        currentY += 20;

        // Separator line
        doc
          .moveTo(leftMargin + 25, currentY)
          .lineTo(pageWidth - rightMargin - 25, currentY)
          .lineWidth(1)
          .stroke('#E5E7EB');

        currentY += 12;

        // Total
        doc
          .fontSize(11)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text('Total', leftMargin + 25, currentY);
        doc
          .fontSize(12)
          .fillColor('#6366F1')
          .font('Helvetica-Bold')
          .text(this.formatCurrency(totalPrice), pageWidth - rightMargin - 110, currentY, {
            width: 90,
            align: 'right',
          });

        currentY += 30;

        currentY += 25;

        // ===== QR CODE SECTION =====
        if (qrCodeDataUrl) {
          // Dashed border box
          doc
            .roundedRect(leftMargin + 25, currentY, contentWidth - 50, 155, 8)
            .lineWidth(2)
            .dash(5, { space: 5 })
            .stroke('#000000')
            .undash();

          // Convert data URL to buffer
          const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
          const qrBuffer = Buffer.from(base64Data, 'base64');

          // Center QR code
          const qrSize = 105;
          const qrX = (pageWidth - qrSize) / 2;

          // QR code with border
          doc.save();
          doc
            .roundedRect(qrX - 2, currentY + 18, qrSize + 4, qrSize + 4, 8)
            .lineWidth(2)
            .stroke('#000000');
          doc.restore();

          doc.image(qrBuffer, qrX, currentY + 20, {
            width: qrSize,
            height: qrSize,
          });

          // QR Code labels - positioned below QR image
          const labelY = currentY + 20 + qrSize + 8;
          doc
            .fontSize(9)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('BOARDING QR CODE', leftMargin + 25, labelY, {
              width: contentWidth - 50,
              align: 'center',
            });

          doc
            .fontSize(7)
            .fillColor('#666666')
            .font('Helvetica')
            .text('Please present this code when boarding', leftMargin + 25, labelY + 13, {
              width: contentWidth - 50,
              align: 'center',
            });

          currentY += qrSize + 50;
        }

        // ===== FOOTER =====
        // Top border
        doc
          .moveTo(leftMargin + 25, currentY)
          .lineTo(pageWidth - rightMargin - 25, currentY)
          .lineWidth(1)
          .stroke('#E5E7EB');

        currentY += 8;

        // Footer text - single block to prevent page breaks
        const footerText = `E-ticket issued on ${this.formatDate(bookingData.created_at)}  |  Please arrive 15 minutes before departure time`;

        doc
          .fontSize(7)
          .fillColor('#666666')
          .font('Helvetica')
          .text(footerText, leftMargin + 25, currentY, {
            width: contentWidth - 50,
            align: 'center',
            lineBreak: false,
          });

        doc.end();
      } catch (error) {
        console.error('❌ Error generating PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Draw section header with icon and underline
   */
  drawSectionHeader(doc, title, x, y, width) {
    doc.fontSize(12).fillColor('#000000').font('Helvetica-Bold').text(title, x, y);

    doc
      .moveTo(x, y + 20)
      .lineTo(x + width, y + 20)
      .lineWidth(2)
      .stroke('#000000');
  }

  /**
   * Draw status or payment badge with fixed width
   */
  drawBadge(doc, status, x, y, width) {
    const statusConfig = {
      // Booking status
      confirmed: { label: 'Confirmed', color: '#6366F1', bg: '#E0E7FF' },
      pending: { label: 'Pending', color: '#64748B', bg: '#F1F5F9' },
      cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#FEE2E2' },
      completed: { label: 'Completed', color: '#10B981', bg: '#D1FAE5' },

      // Payment status
      paid: { label: 'Paid', color: '#6366F1', bg: '#E0E7FF' },
      unpaid: { label: 'Unpaid', color: '#F59E0B', bg: '#FEF3C7' },
      payment_pending: { label: 'Pending', color: '#64748B', bg: '#F1F5F9' },
      failed: { label: 'Failed', color: '#EF4444', bg: '#FEE2E2' },
    };

    const config = statusConfig[status] || { label: status, color: '#64748B', bg: '#F1F5F9' };
    const label = config.label.toUpperCase();

    // Badge background with fixed width
    doc.roundedRect(x, y, width, 18, 9).fill(config.bg);

    // Badge text - centered
    doc
      .fontSize(7)
      .fillColor(config.color)
      .font('Helvetica-Bold')
      .text(label, x, y + 5.5, {
        width: width,
        align: 'center',
      });
  }

  /**
   * Format date to readable string
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Format time to HH:MM
   */
  formatTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  /**
   * Format currency to VND without symbol (to avoid encoding issues)
   */
  formatCurrency(amount) {
    const formatted = new Intl.NumberFormat('vi-VN').format(amount);
    return `${formatted} VND`;
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
   * Returns API Gateway URL (port 3000) instead of direct service URL
   * @param {string} filepath - Local file path
   * @param {string} bookingReference - Booking reference
   * @returns {string} Public URL via API Gateway
   */
  getPublicTicketUrl(filepath, bookingReference) {
    const filename = path.basename(filepath);
    // Always use API Gateway URL for client access (not direct service port 3004)
    const baseUrl = process.env.TICKET_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/bookings/tickets/${filename}`;
  }
}

module.exports = new PDFGenerator();
