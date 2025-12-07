/**
 * Generate HTML email template for booking ticket
 * @param {object} data - Email template data
 * @returns {string} HTML email content
 */
function generateTicketEmailTemplate(data) {
  const {
    bookingReference,
    tripId,
    status,
    totalPrice,
    currency = 'VND',
    passengers = [],
    contactEmail,
    contactPhone,
    ticketUrl,
    qrCode
  } = data;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Bus Ticket - ${bookingReference}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🚌 Your Bus Ticket
              </h1>
              <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 14px;">
                Bus Ticket Booking System
              </p>
            </td>
          </tr>

          <!-- Success Message -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <div style="background-color: #dcfce7; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px;">
                <p style="margin: 0; color: #065f46; font-size: 14px;">
                  ✅ <strong>Booking Confirmed!</strong> Your ticket is ready.
                </p>
              </div>
            </td>
          </tr>

          <!-- Booking Reference -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table role="presentation" style="width: 100%; background-color: #f8fafc; border-radius: 4px; padding: 20px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      BOOKING REFERENCE
                    </p>
                    <p style="margin: 0; color: #2563eb; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
                      ${bookingReference}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Trip Information -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <h2 style="margin: 0 0 15px; color: #1e293b; font-size: 18px; font-weight: bold;">
                Trip Information
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Trip ID:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right; font-weight: 500;">
                    ${tripId}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Status:</td>
                  <td style="padding: 8px 0; text-align: right;">
                    <span style="display: inline-block; padding: 4px 12px; background-color: #dcfce7; color: #065f46; border-radius: 12px; font-size: 12px; font-weight: 500; text-transform: uppercase;">
                      ${status}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Total Price:</td>
                  <td style="padding: 8px 0; color: #2563eb; font-size: 16px; text-align: right; font-weight: bold;">
                    ${parseFloat(totalPrice).toLocaleString()} ${currency}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Passengers -->
          ${passengers && passengers.length > 0 ? `
          <tr>
            <td style="padding: 0 30px 20px;">
              <h2 style="margin: 0 0 15px; color: #1e293b; font-size: 18px; font-weight: bold;">
                Passenger${passengers.length > 1 ? 's' : ''}
              </h2>
              ${passengers.map((passenger, index) => `
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 4px; margin-bottom: 10px; border-left: 3px solid #2563eb;">
                  <p style="margin: 0 0 5px; color: #1e293b; font-size: 15px; font-weight: 600;">
                    ${index + 1}. ${passenger.full_name || 'N/A'}
                  </p>
                  <p style="margin: 0; color: #64748b; font-size: 13px;">
                    Seat: <strong style="color: #2563eb;">${passenger.seat_code || 'N/A'}</strong>
                    ${passenger.document_id ? ` | ID: ${passenger.document_id}` : ''}
                  </p>
                </div>
              `).join('')}
            </td>
          </tr>
          ` : ''}

          <!-- QR Code -->
          ${qrCode ? `
          <tr>
            <td style="padding: 0 30px 20px;">
              <h2 style="margin: 0 0 15px; color: #1e293b; font-size: 18px; font-weight: bold; text-align: center;">
                Verification QR Code
              </h2>
              <div style="text-align: center; background-color: #ffffff; padding: 20px; border: 2px dashed #cbd5e1; border-radius: 4px;">
                <img src="${qrCode}" alt="Booking QR Code" style="width: 200px; height: 200px; display: inline-block;" />
                <p style="margin: 10px 0 0; color: #64748b; font-size: 12px;">
                  Show this QR code at boarding
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Download Button -->
          ${ticketUrl ? `
          <tr>
            <td style="padding: 0 30px 30px; text-align: center;">
              <a href="${ticketUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                📄 Download Full Ticket (PDF)
              </a>
            </td>
          </tr>
          ` : ''}

          <!-- Contact Info -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 4px;">
                <h3 style="margin: 0 0 10px; color: #1e293b; font-size: 14px; font-weight: 600;">
                  Contact Information:
                </h3>
                ${contactEmail ? `
                  <p style="margin: 0 0 5px; color: #64748b; font-size: 13px;">
                    📧 Email: <a href="mailto:${contactEmail}" style="color: #2563eb; text-decoration: none;">${contactEmail}</a>
                  </p>
                ` : ''}
                ${contactPhone ? `
                  <p style="margin: 0; color: #64748b; font-size: 13px;">
                    📱 Phone: <a href="tel:${contactPhone}" style="color: #2563eb; text-decoration: none;">${contactPhone}</a>
                  </p>
                ` : ''}
              </div>
            </td>
          </tr>

          <!-- Important Notes -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                <h3 style="margin: 0 0 10px; color: #92400e; font-size: 14px; font-weight: 600;">
                  ⚠️ Important Notes:
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 13px; line-height: 1.6;">
                  <li>Please arrive at boarding point 15 minutes before departure</li>
                  <li>Present this ticket (PDF or QR code) at boarding</li>
                  <li>Keep your booking reference number safe</li>
                  <li>Contact support if you need to make changes</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8fafc; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 12px;">
                Thank you for choosing our bus service!
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                © 2025 Bus Ticket Booking System. All rights reserved.
              </p>
              <p style="margin: 10px 0 0; color: #94a3b8; font-size: 11px;">
                Questions? Contact us at <a href="mailto:support@busticket.com" style="color: #2563eb; text-decoration: none;">support@busticket.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

module.exports = { generateTicketEmailTemplate };
