/**
 * Booking Expiration Notification Email Template
 * Generates HTML email for expired booking notifications
 *
 * Features:
 * - Clear expiration explanation
 * - Booking details summary
 * - Instructions for rebooking
 * - Contact information for support
 */

function generateBookingExpirationTemplate(data) {
  const {
    bookingReference = 'N/A',
    expirationTime = null,
    trip = null,
    customerEmail = '',
    customerPhone = '',
    contactEmail = 'support@quad-n.me',
    contactPhone = '+84-1800-TICKET',
  } = data;

  // Format expiration time
  const formatExpirationTime = (timeStr) => {
    if (!timeStr) return 'recently';
    try {
      const date = new Date(timeStr);
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh',
      });
    } catch (error) {
      return timeStr;
    }
  };

  const formattedExpirationTime = formatExpirationTime(expirationTime);

  // Generate trip details section if available
  const tripDetailsSection = trip
    ? `
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 18px;">Trip Details</h3>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="color: #212529;">${trip.origin || 'Origin'}</strong>
          <span style="color: #6c757d; margin: 0 10px;">→</span>
          <strong style="color: #212529;">${trip.destination || 'Destination'}</strong>
        </div>
        <div style="text-align: right;">
          <div style="color: #6c757d; font-size: 14px;">Departure</div>
          <div style="color: #212529; font-weight: bold;">
            ${
              trip.departureTime
                ? new Date(trip.departureTime).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Ho_Chi_Minh',
                  })
                : 'TBD'
            }
          </div>
        </div>
      </div>
    </div>
  `
    : '';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Expired - ${bookingReference}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Booking Expired</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Reference: ${bookingReference}</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; background: #dc3545; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 36px;">⏰</span>
        </div>
        <h2 style="color: #dc3545; margin: 0 0 15px 0; font-size: 22px;">Your Booking Has Expired</h2>
        <p style="color: #6c757d; font-size: 16px; line-height: 1.6; margin: 0;">
          We're sorry to inform you that your booking <strong>${bookingReference}</strong> has expired due to non-payment within the required time frame.
        </p>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; align-items: flex-start;">
          <span style="color: #856404; font-size: 20px; margin-right: 10px;">⚠️</span>
          <div>
            <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">What Happened?</h4>
            <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;">
              Your booking was held temporarily but expired at <strong>${formattedExpirationTime}</strong> because payment was not completed within 10 minutes of booking creation.
            </p>
          </div>
        </div>
      </div>

      ${tripDetailsSection}

      <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; align-items: flex-start;">
          <span style="color: #0c5460; font-size: 20px; margin-right: 10px;">🔄</span>
          <div>
            <h4 style="color: #0c5460; margin: 0 0 10px 0; font-size: 16px;">Ready to Book Again?</h4>
            <p style="color: #0c5460; margin: 0; font-size: 14px; line-height: 1.5;">
              Don't worry! You can easily book again through our website or mobile app. Seats are subject to availability.
            </p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://bus-ticket-system.com/search"
           style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin: 0 10px;">
          Book Again
        </a>
        <a href="https://bus-ticket-system.com/contact"
           style="background: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin: 0 10px;">
          Contact Support
        </a>
      </div>

      <!-- Contact Information -->
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #495057; margin: 0 0 15px 0; font-size: 16px;">Need Help?</h4>
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px; margin-bottom: 10px;">
            <strong style="color: #212529;">📞 Phone Support</strong><br>
            <span style="color: #6c757d;">${contactPhone}</span>
          </div>
          <div style="flex: 1; min-width: 200px; margin-bottom: 10px;">
            <strong style="color: #212529;">✉️ Email Support</strong><br>
            <span style="color: #6c757d;">${contactEmail}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px; text-align: center; color: #6c757d; font-size: 14px;">
        <p style="margin: 0;">
          This is an automated notification for booking reference ${bookingReference}.<br>
          If you did not create this booking, please contact our support team immediately.
        </p>
        <p style="margin: 10px 0 0 0;">
          <strong>Quad-N Bus Ticket System</strong><br>
          Your trusted bus booking partner
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return {
    subject: `Booking Expired - ${bookingReference}`,
    html: html,
    text: `
Booking Expired - ${bookingReference}

We're sorry to inform you that your booking has expired due to non-payment within the required time frame.

What Happened?
Your booking was held temporarily but expired because payment was not completed within 10 minutes of booking creation.

Ready to Book Again?
Don't worry! You can easily book again through our website or mobile app. Seats are subject to availability.

Need Help?
Phone Support: ${contactPhone}
Email Support: ${contactEmail}

This is an automated notification for booking reference ${bookingReference}.
If you did not create this booking, please contact our support team immediately.

Quad-N Bus Ticket System
Your trusted bus booking partner
    `.trim(),
  };
}

module.exports = {
  generateBookingExpirationTemplate,
};
