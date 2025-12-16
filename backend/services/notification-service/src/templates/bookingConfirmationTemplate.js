/**
 * Booking Confirmation Email Template
 * Comprehensive email sent immediately after successful payment
 */

const generateBookingConfirmationTemplate = (bookingData) => {
  const {
    bookingReference,
    customerName,
    customerEmail,
    customerPhone,
    tripDetails,
    passengers,
    pricing,
    eTicketUrl,
    qrCodeUrl,
    bookingDetailsUrl,
    cancellationPolicy,
    operatorContact,
  } = bookingData;

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '0 VND';
    return Math.round(amount).toLocaleString() + ' VND';
  };

  // Format date/time
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Safe get passenger name
  const getPassengerName = (passenger) => {
    return passenger?.fullName || 'Passenger';
  };

  const passengersHtml = passengers
    .map(
      (p, idx) => `
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 12px; text-align: center; color: #666;">${idx + 1}</td>
      <td style="padding: 12px; color: #333;">${getPassengerName(p)}</td>
      <td style="padding: 12px; color: #333;">${p.documentId || 'N/A'}</td>
      <td style="padding: 12px; color: #333;">${p.seatCode}</td>
      <td style="padding: 12px; text-align: right; color: #333;">${formatCurrency(p.seatPrice)}</td>
    </tr>
  `
    )
    .join('');

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

  const viewDetailsUrl = bookingDetailsUrl || bookingLookupUrl;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${bookingReference}</title>
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
        .booking-ref {
            background-color: rgba(255,255,255,0.2);
            padding: 12px 20px;
            border-radius: 4px;
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 10px 0 0 0;
        }
        .content {
            padding: 30px 20px;
        }
        .greeting {
            font-size: 16px;
            color: #333;
            margin-bottom: 20px;
        }
        .success-badge {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 25px;
            color: #155724;
            text-align: center;
            font-weight: bold;
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
        .passenger-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
        }
        .passenger-table thead {
            background-color: #667eea;
            color: white;
        }
        .passenger-table th {
            padding: 12px;
            text-align: left;
            font-weight: bold;
            font-size: 13px;
        }
        .passenger-table td {
            padding: 12px;
        }
        .pricing-box {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .price-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .price-row:last-child {
            margin-bottom: 0;
        }
        .price-label {
            color: #666;
        }
        .price-value {
            color: #333;
            font-weight: 500;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding-top: 10px;
            margin-top: 10px;
            border-top: 2px solid #ddd;
            font-size: 16px;
            font-weight: bold;
            color: #333;
        }
        .total-value {
            color: #667eea;
            font-size: 18px;
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
        .policy-box {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 20px;
            font-size: 13px;
            color: #856404;
        }
        .policy-box strong {
            color: #333;
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
        .qr-section {
            text-align: center;
            margin: 20px 0;
        }
        .qr-image {
            max-width: 150px;
            height: auto;
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
            .price-row {
                padding: 8px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Booking Confirmed</h1>
            <div class="booking-ref">${bookingReference}</div>
        </div>

        <!-- Content -->
        <div class="content">
            <!-- Greeting -->
            <div class="greeting">
                Hello <strong>${customerName || 'Valued Customer'}</strong>,<br>
                Thank you for booking with us! Your booking has been successfully confirmed.
            </div>

            <!-- Success Badge -->
            <div class="success-badge">
                Payment Confirmed - Your ticket is reserved
            </div>

            <!-- Trip Details Section -->
            <div class="section-title">Trip Details</div>
            <div class="trip-header">
                <div class="trip-route">
                    ${tripDetails.origin || 'Origin'} → ${tripDetails.destination || 'Destination'}
                </div>
                <div class="trip-time">
                    <strong>Departure:</strong> ${formatDateTime(tripDetails.departureTime)}<br>
                    <strong>Arrival:</strong> ${formatDateTime(tripDetails.arrivalTime)}<br>
                    <strong>Bus Operator:</strong> ${tripDetails.operatorName} (${tripDetails.busModel})
                </div>
            </div>

            <!-- Customer Contact Information -->
            <div class="section-title">Contact Information</div>
            <div class="info-row">
                <div class="info-label">Email:</div>
                <div class="info-value">${customerEmail || 'N/A'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Phone:</div>
                <div class="info-value">${customerPhone || 'N/A'}</div>
            </div>

            <!-- Pickup & Dropoff Points -->
            <div class="section-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 8px;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#667eea"/></svg> Pickup & Drop-off Information</div>
            <div class="info-row">
                <div class="info-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 6px;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#666"/></svg> Pickup Point:</div>
                <div class="info-value">${tripDetails.pickupPoint || 'TBD'}</div>
            </div>
            <div class="info-row">
                <div class="info-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 6px;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#666"/></svg> Drop-off Point:</div>
                <div class="info-value">${tripDetails.dropoffPoint || 'TBD'}</div>
            </div>

            <!-- Passengers Section -->
            <div class="section-title">Passenger List</div>
            <table class="passenger-table">
                <thead>
                    <tr>
                        <th style="width: 8%;">No.</th>
                        <th style="width: 30%;">Full Name</th>
                        <th style="width: 28%;">ID/Passport</th>
                        <th style="width: 15%;">Seat</th>
                        <th style="width: 19%;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${passengersHtml}
                </tbody>
            </table>

            <!-- Pricing Section -->
            <div class="section-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 8px;"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="#667eea"/></svg> Pricing Details</div>
            <div class="pricing-box">
                <div class="price-row">
                    <span class="price-label">Ticket Price (${passengers.length} seat${passengers.length !== 1 ? 's' : ''} × ${formatCurrency(pricing.basePrice)}):</span>
                    <span class="price-value">${formatCurrency(pricing.subtotal)}</span>
                </div>
                <div class="price-row">
                    <span class="price-label">Service Fee:</span>
                    <span class="price-value">${formatCurrency(pricing.serviceFee)}</span>
                </div>
                <div class="price-row">
                    <span class="price-label">Payment Method:</span>
                    <span class="price-value">${pricing.paymentMethod || 'Unknown'}</span>
                </div>
                <div class="total-row">
                    <span>Total Amount:</span>
                    <span class="total-value">${formatCurrency(pricing.total)}</span>
                </div>
            </div>

            <!-- Payment Information -->
            <div class="section-title">Payment Information</div>
            <div class="info-row">
                <div class="info-label">Status:</div>
                <div class="info-value" style="color: #28a745; font-weight: bold;">Payment Confirmed</div>
            </div>
            <div class="info-row">
                <div class="info-label">Transaction ID:</div>
                <div class="info-value">${bookingReference}</div>
            </div>

            <!-- CTA Buttons (table layout for consistent spacing in email clients) -->
            <div class="cta-buttons">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
                    <tr>
                        <td style="padding-right:16px; vertical-align: middle;">
                            <a href="${eTicketUrl}" class="btn btn-primary" style="display:inline-block; text-decoration: none; padding: 14px 24px; border-radius: 4px; font-weight: bold; font-size: 14px;">
                                <span style="color: #ffffff;">Download E-Ticket</span>
                            </a>
                        </td>
                        <td style="vertical-align: middle;">
                            <a href="${viewDetailsUrl}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer" style="display:inline-block;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 8px;"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#333"/></svg>View Booking</a>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- QR Code -->
            <div class="qr-section">
                <p style="color: #666; margin-bottom: 10px;">Your QR Code:</p>
                <img src="${qrCodeUrl}" alt="QR Code" class="qr-image">
            </div>

            <!-- Cancellation Policy -->
            <div class="section-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 8px;"><path d="M16 4h-2l-1-1h-4L8 4H6c-.55 0-1 .45-1 1s.45 1 1 1v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6c.55 0 1-.45 1-1s-.45-1-1-1zM9 3h6l1 1H8l1-1zM6 6h12v12c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1V6z" fill="#667eea"/></svg> Cancellation Policy</div>
            <div class="policy-box">
                <strong>Cancellation Terms:</strong> ${cancellationPolicy}
                <br><br>
                <strong>Important:</strong> Please arrive at the station at least 30 minutes before departure. 
                You can check trip status and contact the bus operator using the information below.
            </div>

            <!-- Contact Information -->
            <div class="section-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 8px;"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#667eea"/></svg> Contact Information</div>
            <div class="contact-info">
                <div class="contact-info-title">Bus Operator: ${tripDetails.operatorName}</div>
                <div class="contact-info-text">
                    <strong>Phone:</strong> ${operatorContact.phone || 'N/A'}<br>
                    <strong>Email:</strong> ${operatorContact.email || 'N/A'}<br>
                    <strong>Website:</strong> ${operatorContact.website || 'N/A'}
                </div>
            </div>

            <!-- Instructions -->
            <div class="section-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 8px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#667eea"/></svg> Instructions</div>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; color: #666; font-size: 13px; line-height: 1.8;">
                <strong>1. Download Your Ticket:</strong> Click the "Download E-Ticket" button or check your email for PDF<br>
                <strong>2. Verify Information:</strong> Ensure all passenger details are correct<br>
                <strong>3. Arrive Early:</strong> Please arrive 30 minutes before departure<br>
                <strong>4. Present Your Ticket:</strong> Print or show it on your phone when boarding<br>
                <strong>5. Monitor Your Trip:</strong> Check regularly for trip status updates
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>
                If you have any questions, please contact us:
                <a href="mailto:support@busticket.com" class="footer-link">support@busticket.com</a> 
                or call <strong>1800-XXXX</strong>
            </p>
            <p style="margin-top: 15px;">
                <a href="https://busticket.com/terms" class="footer-link">Terms & Conditions</a> | 
                <a href="https://busticket.com/privacy" class="footer-link">Privacy Policy</a>
            </p>
            <p style="margin-top: 15px; color: #ccc;">
                © 2025 Bus Ticket Booking System. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
`;
};

module.exports = {
  generateBookingConfirmationTemplate,
};
