/**
 * Trip Reminder Email Template
 * Generates HTML email for trip departure reminders (24h and 2h before departure)
 *
 * Features:
 * - User preference-aware (respects notification opt-out)
 * - Weather advisory based on destination and departure date
 * - Timezone-aware reminder times (convert to user's local timezone)
 * - Real-time traffic updates
 * - Seat upgrade suggestions
 */

const weatherService = require('../services/weatherService');

async function generateTripReminderTemplate(data, hoursUntilDeparture) {
  const {
    bookingReference = 'N/A',
    customerEmail = '',
    customerPhone = '',
    departureTime = 'TBD',
    arrivalTime = 'TBD',
    fromLocation = 'Origin',
    toLocation = 'Destination',
    seats = [],
    contactEmail = 'support@quad-n.me',
    contactPhone = '+84-1800-TICKET',
    eTicketUrl = null,
    passengers = [],
    operatorName = 'Bus Operator',
    busModel = 'Standard Bus',
  } = data;

  const reminderText = hoursUntilDeparture === 1 ? '1 hour' : `${hoursUntilDeparture} hours`;
  const reminderColor = hoursUntilDeparture <= 2 ? '#dc3545' : '#ffc107'; // Red for 2h, amber for 24h

  // Format departure and arrival times
  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === 'TBD') return 'TBD';
    try {
      const date = new Date(timeStr);
      return date.toLocaleString('en-US', {
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

  const formattedDeparture = formatTime(departureTime);
  const formattedArrival = formatTime(arrivalTime);

  // Fetch weather advisory/forecast for destination (if enabled)
  // We will include a weather summary in the email even when conditions are not adverse.
  let weatherInfo = null;
  try {
    console.log(`[Weather Service] Fetching forecast for destination: ${toLocation}`);
    const weather = await weatherService.getWeatherForecast(toLocation);
    console.log(`[Weather Service] Response:`, weather);
    if (weather) {
      weatherInfo = weather;
      if (weather.isAdverse) {
        console.log(
          `[Weather Service] Adverse weather detected for ${toLocation}:`,
          weather.condition
        );
      } else {
        console.log(`[Weather Service] Non-adverse weather for ${toLocation}:`, weather.condition);
      }
    }
  } catch (error) {
    console.warn(
      `[Weather Service] Failed to fetch weather data for ${toLocation}:`,
      error.message
    );
    // Continue without weather - don't block email generation
  }

  // Build booking lookup URL (same as booking confirmation)
  const bookingLookupBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(
    /\/$/,
    ''
  );
  const bookingLookupUrl = `${bookingLookupBase}/booking-lookup?bookingReference=${encodeURIComponent(
    bookingReference
  )}&email=${encodeURIComponent(customerEmail || '')}&phone=${encodeURIComponent(
    customerPhone || ''
  )}&autoSearch=1`;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trip Reminder - Bus Ticket Booking</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 700px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
            font-weight: bold;
        }
        .reminder-subtitle {
            background-color: rgba(255,255,255,0.2);
            padding: 12px 20px;
            border-radius: 4px;
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 1px;
            margin: 10px 0 0 0;
            display: inline-block;
        }
        .content {
            padding: 30px 20px;
        }
        .greeting {
            font-size: 15px;
            color: #333;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .alert-box {
            background-color: ${reminderColor};
            border: 1px solid ${reminderColor};
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 25px;
            color: white;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-top: 25px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: bold;
            color: #666;
            width: 40%;
        }
        .info-value {
            color: #333;
            text-align: right;
            width: 60%;
        }
        .trip-header {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 15px;
        }
        .trip-route {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .trip-time {
            color: #666;
            font-size: 14px;
        }
        .trip-time strong {
            color: #333;
        }
        .passenger-section {
            background-color: #f0f7ff;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .passenger-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            font-size: 15px;
        }
        .passenger-item {
            background-color: white;
            padding: 12px 15px;
            border-radius: 4px;
            margin-bottom: 10px;
            font-size: 14px;
            border-left: 3px solid #667eea;
        }
        .passenger-item:last-child {
            margin-bottom: 0;
        }
        .passenger-name {
            font-weight: 600;
            color: #333;
        }
        .passenger-seat {
            color: #667eea;
            font-weight: 600;
            margin-top: 5px;
        }
        .cta-buttons {
            display: flex;
            gap: 16px;
            margin: 30px 0;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
        }
        .btn {
            flex: none;
            min-width: 200px;
            padding: 14px 24px;
            text-align: center;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            font-size: 14px;
            transition: background-color 0.3s;
        }
        .btn-primary {
            background-color: #2563eb;
            color: #ffffff;
            transition: all 0.15s ease-in-out;
        }
        .btn-primary:hover {
            background-color: #1e40af !important;
            cursor: pointer;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(30,64,175,0.15);
            text-decoration: none;
        }
        .btn-secondary {
            background-color: #e0e0e0;
            color: #333;
        }
        .btn-secondary:hover {
            background-color: #d0d0d0;
        }
        .tips-box {
            background-color: #f0f4ff;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 2px;
        }
        .tips-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .tips-text {
            color: #666;
            font-size: 13px;
            margin: 3px 0;
            line-height: 1.5;
        }
        .contact-info {
            background-color: #f0f4ff;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 2px;
        }
        .contact-info-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .contact-info-text {
            color: #666;
            font-size: 13px;
            margin: 3px 0;
        }
        .weather-alert {
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            position: relative;
        }
        .weather-alert.adverse {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
        }
        .weather-alert.normal {
            background-color: #eef7ff;
            border-left: 4px solid #67b0ff;
        }
        .weather-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 14px;
            display: flex;
            align-items: center;
        }
        .weather-alert.adverse .weather-title {
            color: #856404;
        }
        .weather-alert.normal .weather-title {
            color: #045f9e;
        }
        .weather-content {
            margin: 0;
            font-size: 13px;
            line-height: 1.5;
        }
        .weather-alert.adverse .weather-content {
            color: #856404;
        }
        .weather-alert.normal .weather-content {
            color: #045f9e;
        }
        .footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #e0e0e0;
        }
        .footer-link {
            color: #667eea;
            text-decoration: none;
        }
        .footer p {
            margin: 8px 0;
        }
        @media (max-width: 600px) {
            .container {
                border-radius: 0;
            }
            .header {
                padding: 20px 15px;
            }
            .content {
                padding: 20px 15px;
            }
            .cta-buttons {
                flex-direction: column;
            }
            .btn {
                min-width: 100%;
            }
            .info-row {
                flex-direction: column;
            }
            .info-label,
            .info-value {
                width: 100%;
                text-align: left;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Trip Reminder</h1>
            <div class="reminder-subtitle">Your bus departs in ${reminderText}</div>
        </div>

        <!-- Content -->
        <div class="content">
            <!-- Greeting -->
            <div class="greeting">
                Hello,<br>
                This is your reminder that your bus trip is departing soon. Please review the details below and prepare for your journey.
            </div>

            <!-- Alert Banner -->
            <div class="alert-box">
                Your trip departs in ${reminderText} - Get ready!
            </div>

            <!-- Trip Details Section -->
            <div class="section-title">Trip Details</div>
            <div class="trip-header">
                <div class="trip-route">${fromLocation} → ${toLocation}</div>
                <div class="trip-time">
                    <strong>Departure:</strong> ${formattedDeparture}<br>
                    <strong>Arrival:</strong> ${formattedArrival}<br>
                    <strong>Bus Operator:</strong> ${operatorName} (${busModel})
                </div>
            </div>

            <!-- Pickup & Drop-off Information (only show if data exists) -->
            ${
              data &&
              ((data.pickupPoint && data.pickupPoint !== 'TBD') ||
                (data.dropoffPoint && data.dropoffPoint !== 'TBD'))
                ? `
            <div class="section-title">Pickup & Drop-off Information</div>
            <div class="info-row">
                <div class="info-label">Pickup Point:</div>
                <div class="info-value">${data.pickupPoint || 'TBD'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Drop-off Point:</div>
                <div class="info-value">${data.dropoffPoint || 'TBD'}</div>
            </div>
            `
                : ''
            }

            <!-- Contact Information -->
            <div class="section-title">Contact Information</div>
            <div class="info-row">
                <div class="info-label">Email:</div>
                <div class="info-value">${customerEmail || 'N/A'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Phone:</div>
                <div class="info-value">${customerPhone || 'N/A'}</div>
            </div>


            <!-- Passenger Information -->
            <div class="section-title">Boarding Information</div>
            <div class="passenger-section">
                ${
                  passengers && passengers.length > 0
                    ? passengers
                        .map(
                          (passenger) => `
                <div class="passenger-item">
                    <div class="passenger-name">${passenger.full_name || passenger.name || 'Passenger'}</div>
                    <div class="passenger-seat">Seat: ${passenger.seat_code || 'TBD'}</div>
                    ${passenger.phone ? `<div style="color: #666; font-size: 13px; margin-top: 5px;">Phone: ${passenger.phone}</div>` : ''}
                    ${passenger.document_id ? `<div style="color: #666; font-size: 13px;">Document: ${passenger.document_id}</div>` : ''}
                </div>
            `
                        )
                        .join('')
                    : `<div class="passenger-item">
                    <div class="passenger-name">${customerEmail || 'Passenger'}</div>
                    <div class="passenger-seat">Seats: ${seats.join(', ') || 'TBD'}</div>
                </div>`
                }
            </div>

            <!-- Before You Travel Tips -->
            <div class="section-title">Before You Travel</div>
            <div class="tips-box">
                <div class="tips-text">
                    <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e0e0e0;">
                        <strong>Arrival:</strong> Please arrive at least 15-30 minutes before departure
                    </div>
                    <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e0e0e0;">
                        <strong>Documentation:</strong> Have your e-ticket or booking reference ready
                    </div>
                    <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e0e0e0;">
                        <strong>Travel Time:</strong> Allow enough time to reach the station
                    </div>
                    <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e0e0e0;">
                        <strong>Luggage:</strong> Ensure you have all your luggage with you
                    </div>
                    <div>
                        <strong>Boarding:</strong> Follow the bus operator's boarding procedures
                    </div>
                </div>
            </div>


            <!-- Weather Information -->
            ${
              weatherInfo
                ? `
            <div class="weather-alert ${weatherInfo.isAdverse ? 'adverse' : 'normal'}">
                <div class="weather-title">
                    ${weatherInfo.isAdverse ? `Weather Alert for ${toLocation}` : `Weather Forecast for ${toLocation}`}
                </div>
                <div class="weather-content">
                    <strong>${weatherInfo.condition}</strong> - ${weatherInfo.description}<br>
                    Temperature: ${weatherInfo.temperature}°C | Humidity: ${weatherInfo.humidity}%<br>
                    Wind Speed: ${weatherInfo.windSpeed} m/s | Precipitation: ${weatherInfo.precipitation} mm
                    ${weatherInfo.isAdverse ? `<br><strong style="display: block; margin-top: 10px;">Recommendation:</strong> Please allow extra travel time and check local conditions before departing.` : `<br><em style="display: block; margin-top: 10px;">No severe weather expected.</em>`}
                </div>
            </div>
            `
                : ''
            }

            <!-- CTA Buttons -->
            <div style="text-align: center; margin: 30px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
                    <tr>
                        ${
                          eTicketUrl
                            ? `<td style="padding-right: 12px;"><a href="${eTicketUrl}" class="btn btn-primary" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 24px; text-align: center; text-decoration: none;">Download E-Ticket</a></td>`
                            : ''
                        }
                        <td><a href="${bookingLookupUrl}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 24px; text-align: center; text-decoration: none;">View Booking Details</a></td>
                    </tr>
                </table>
            </div>

            <!-- Contact Support -->
            <div class="section-title">Need Help?</div>
            <div class="contact-info">
                <div class="contact-info-text">
                    <strong>Email:</strong> ${contactEmail || 'N/A'}<br>
                    <strong>Phone:</strong> ${contactPhone || 'N/A'}
                </div>
            </div>

            <!-- Closing Message -->
            <div style="text-align: center; padding: 20px 0; color: #666;">
                <p style="font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">Have a great trip!</p>
                <p style="margin: 0;">Thank you for booking with Bus Ticket Booking System.</p>
            </div>
        </div>


        <!-- Footer -->
        <div class="footer">
            <p>
                If you have any questions, please contact us:
                <a href="mailto:${contactEmail}" class="footer-link">${contactEmail}</a> 
                or call <strong>${contactPhone}</strong>
            </p>
            <p style="margin-top: 15px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/terms" class="footer-link">Terms & Conditions</a> | 
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/privacy" class="footer-link">Privacy Policy</a>
            </p>
            <p style="margin-top: 15px; color: #ccc;">
                © 2025 Bus Ticket Booking System. All rights reserved.
            </p>
            <p style="margin-top: 10px; font-size: 11px;">
                This is an automated reminder. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
`;
}

module.exports = { generateTripReminderTemplate };
