/**
 * Trip Delay Email Template
 * Generates HTML email specifically for trip delays
 *
 * Required data fields:
 * - customerEmail: Customer's email for booking lookup functionality
 * - customerPhone: Customer's phone for booking lookup functionality
 * - contactEmail: Support email for contact purposes
 * - contactPhone: Support phone for contact purposes
 */

// Timezone configuration - centralized timezone management
const TIMEZONE_CONFIG = require('../config/timezone');

function generateTripDelayTemplate(data) {
  const {
    bookingReference = 'N/A',
    reason = '',
    originalDepartureTime = 'TBD',
    newDepartureTime = 'TBD',
    originalArrivalTime = 'TBD',
    newArrivalTime = 'TBD',
    fromLocation = 'Origin',
    toLocation = 'Destination',
    seats = [],
    contactEmail = 'support@quad-n.me',
    contactPhone = '+84-1800-TICKET',
    customerEmail = '', // Customer's email for booking lookup
    customerPhone = '', // Customer's phone for booking lookup
    eTicketUrl = null,
    passengers = [],
    operatorName = 'Bus Operator',
    busModel = 'Standard Bus',
    delayMinutes = 0,
    estimatedDelay = '',
    compensation = null,
    nextSteps = [],
  } = data;

  // Build a booking lookup URL that pre-fills the lookup form and triggers auto-search
  const bookingLookupBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(
    /\/$/,
    ''
  );
  const bookingLookupUrl = `${bookingLookupBase}/booking-lookup?bookingReference=${encodeURIComponent(
    bookingReference
  )}&email=${encodeURIComponent(customerEmail || '')}&phone=${encodeURIComponent(
    customerPhone || ''
  )}&autoSearch=1`;

  // Format times to Vietnam timezone (+7) for user-friendly display
  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === 'TBD') return 'TBD';
    try {
      const date = new Date(timeStr);

      // Convert to configured timezone
      const localTime = new Date(
        date.getTime() + TIMEZONE_CONFIG.DEFAULT_TIMEZONE * 60 * 60 * 1000
      );

      return localTime.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return timeStr;
    }
  };

  // Calculate delay duration
  const getDelayText = () => {
    if (estimatedDelay) return estimatedDelay;
    if (delayMinutes > 0) {
      const hours = Math.floor(delayMinutes / 60);
      const minutes = delayMinutes % 60;
      if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
      }
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    // Calculate from times if not provided
    if (
      originalDepartureTime &&
      newDepartureTime &&
      originalDepartureTime !== 'TBD' &&
      newDepartureTime !== 'TBD'
    ) {
      try {
        const delayMs = new Date(newDepartureTime) - new Date(originalDepartureTime);
        const delayMins = Math.floor(delayMs / (1000 * 60));
        if (delayMins > 0) {
          const hours = Math.floor(delayMins / 60);
          const minutes = delayMins % 60;
          if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
          }
          return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
      } catch (error) {
        console.error('Error calculating delay:', error);
      }
    }
    return 'Unknown';
  };

  // Generate HTML
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Trip Delayed - Bus Ticket Booking</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #fd7e14, #fd7e14dd); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .delay-box { border: 2px solid #fd7e14; border-radius: 8px; padding: 20px; margin: 20px 0; background-color: #fff3cd; }
        .delay-alert { background-color: #ffeaa7; border: 2px solid #fd7e14; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; font-size: 18px; font-weight: bold; color: #d63031; }

        /* Time table styling */
        .time-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .time-cell { width: 50%; vertical-align: top; padding: 10px; border: 1px solid #eee; background-color: #fff; }
        .time-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 5px; display: block;}
        .time-value { font-size: 16px; font-weight: bold; color: #333; display: block;}
        .time-value.new { color: #fd7e14; }

        .reason-box { background-color: #f8f9fa; border-left: 4px solid #fd7e14; padding: 15px; margin: 20px 0; }
        .compensation-box { background-color: #d4edda; border: 2px solid #28a745; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .next-steps { background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .step { margin: 8px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; border-top: 1px solid #dee2e6; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #fd7e14; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .btn-secondary { display: inline-block; padding: 12px 24px; background-color: white; color: #333; text-decoration: none; border-radius: 5px; margin: 10px 5px; border: 2px solid #dee2e6; }
        .urgent { color: #dc3545; font-weight: bold; }
        .booking-ref { background-color: #fff3cd; padding: 10px; border-radius: 4px; margin: 15px 0; font-family: monospace; }
        .delay-duration { font-size: 20px; font-weight: bold; color: #fd7e14; text-align: center; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">⏰ Trip Delayed</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Important update for your upcoming trip</p>
        </div>

        <div class="content">
          <div class="booking-ref">
            <strong>Booking Reference:</strong> ${bookingReference}
          </div>

          <div class="delay-alert">
            🚨 Your trip has been delayed by ${getDelayText()}
          </div>

          <div class="delay-box">
            <h2 style="margin-top: 0; color: #fd7e14;">Updated Trip Details</h2>
            <p><strong>Route:</strong> ${fromLocation} → ${toLocation}</p>
            <p><strong>Operator:</strong> ${operatorName}</p>
            <p><strong>Bus:</strong> ${busModel}</p>
            <p><strong>Seats:</strong> ${seats.join(', ') || 'N/A'}</p>
            ${passengers.length > 0 ? `<p><strong>Passengers:</strong> ${passengers.map((p) => p.full_name).join(', ')}</p>` : ''}
          </div>

          ${
            reason
              ? `
          <div class="reason-box">
            <h3 style="margin-top: 0;">Reason for Delay</h3>
            <p>${reason}</p>
          </div>
          `
              : ''
          }

          <table class="time-table" border="0" cellpadding="0" cellspacing="0">
            <tr>
                <td class="time-cell" style="border-right: 4px solid #f8f9fa;">
                    <span class="time-label">Original Departure</span>
                    <span class="time-value">${formatTime(originalDepartureTime)}</span>
                </td>
                <td class="time-cell">
                    <span class="time-label">New Departure</span>
                    <span class="time-value new">${formatTime(newDepartureTime)}</span>
                </td>
            </tr>
          </table>

          ${
            originalArrivalTime !== newArrivalTime
              ? `
          <table class="time-table" border="0" cellpadding="0" cellspacing="0">
            <tr>
                <td class="time-cell" style="border-right: 4px solid #f8f9fa;">
                    <span class="time-label">Original Arrival</span>
                    <span class="time-value">${formatTime(originalArrivalTime)}</span>
                </td>
                <td class="time-cell">
                    <span class="time-label">New Arrival</span>
                    <span class="time-value new">${formatTime(newArrivalTime)}</span>
                </td>
            </tr>
          </table>
          `
              : ''
          }

          ${
            compensation
              ? `
          <div class="compensation-box">
            <h3 style="margin-top: 0; color: #155724;">💰 Compensation Offered</h3>
            <p><strong>${compensation.type}:</strong> ${compensation.description}</p>
            ${compensation.amount ? `<p><strong>Amount:</strong> ${compensation.amount.toLocaleString()} VND</p>` : ''}
            ${compensation.code ? `<p><strong>Compensation Code:</strong> <code>${compensation.code}</code></p>` : ''}
          </div>
          `
              : ''
          }

          <div class="next-steps">
            <h3 style="margin-top: 0;">What to Do Next</h3>
            ${
              nextSteps.length > 0
                ? nextSteps.map((step) => `<div class="step">• ${step}</div>`).join('')
                : `
              <div class="step">• Monitor your updated departure time</div>
              <div class="step">• Contact the bus station if delay exceeds 2 hours</div>
              <div class="step">• Keep your booking reference handy</div>
              <div class="step">• Check for any compensation eligibility</div>
            `
            }
          </div>

          <div style="text-align: center; margin: 30px 0;">
            ${eTicketUrl ? `<a href="${eTicketUrl}" class="btn">View Updated E-Ticket</a>` : ''}
            <a href="${bookingLookupUrl}" class="btn-secondary">View Booking Details</a>
            <a href="mailto:${contactEmail}" class="btn-secondary">Contact Support</a>
          </div>

          <p class="urgent">⚠️ Please arrive at the station with sufficient time before the new departure time.</p>
        </div>

        <div class="footer">
          <p><strong>Contact Us:</strong></p>
          <p>Email: ${contactEmail} | Phone: ${contactPhone}</p>
          <p style="font-size: 12px; margin-top: 20px;">
            This is an automated message. Please do not reply to this email.<br>
            © 2024 Bus Ticket Booking System
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

module.exports = { generateTripDelayTemplate };
