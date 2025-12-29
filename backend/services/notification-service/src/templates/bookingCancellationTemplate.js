/**
 * Generate booking cancellation email template
 * @param {Object} data - Cancellation data
 * @param {string} data.bookingReference - Booking reference
 * @param {number} data.refundAmount - Refund amount
 * @returns {string} HTML email template
 */
function generateBookingCancellationTemplate(data) {
  const { bookingReference, refundAmount, reason } = data;

  // Validate and sanitize input data
  const safeBookingReference = bookingReference || 'N/A';
  const safeRefundAmount =
    typeof refundAmount === 'number'
      ? refundAmount
      : typeof refundAmount === 'string'
        ? parseFloat(refundAmount)
        : 0;
  const safeReason = reason || 'Booking cancelled by admin';

  const hasRefund = safeRefundAmount > 0;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Cancelled - ${safeBookingReference}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          background-color: #f8f9fa;
          padding: 20px;
        }
        .container {
          background-color: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 1px solid #e9ecef;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #dc3545;
        }
        .header h1 {
          color: #dc3545;
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .greeting {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
          border-left: 4px solid #dc3545;
        }
        .cancellation-details {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
        }
        .cancellation-details h3 {
          color: #721c24;
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 8px 0;
          border-bottom: 1px solid #f1aeb5;
        }
        .detail-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .detail-label {
          font-weight: 600;
          color: #495057;
        }
        .detail-value {
          color: #721c24;
          font-weight: 600;
        }
        .refund-section {
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
        }
        .refund-section h3 {
          color: #155724;
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px;
        }
        .refund-amount {
          font-size: 24px;
          color: #28a745;
          font-weight: bold;
        }
        .info-section {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
        }
        .info-section h4 {
          color: #856404;
          margin-top: 0;
          margin-bottom: 10px;
        }
        .contact-section {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
          text-align: center;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
          color: #6c757d;
        }
        .footer p {
          margin: 5px 0;
        }
        .highlight {
          background-color: #fff3cd;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 600;
        }
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          .container {
            padding: 20px;
          }
          .header h1 {
            font-size: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Cancelled</h1>
        </div>

        <div class="greeting">
          <p style="margin: 0; font-size: 16px;">Dear Valued Customer,</p>
        </div>

        <div style="margin-bottom: 25px;">
          <p>Your booking <strong class="highlight">${safeBookingReference}</strong> has been <strong>successfully cancelled</strong>.</p>
        </div>

        <div class="cancellation-details">
          <h3>Cancellation Details</h3>
          <div class="detail-row">
            <span class="detail-label">Booking Reference:</span>
            <span class="detail-value">${safeBookingReference}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Cancellation Date:</span>
            <span class="detail-value">${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Reason:</span>
            <span class="detail-value">${safeReason}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">Cancelled</span>
          </div>
        </div>

        ${
          hasRefund
            ? `
        <div class="refund-section">
          <h3>Refund Information</h3>
          <p>A refund has been processed for your cancelled booking.</p>
          <div style="text-align: center; margin: 20px 0;">
            <div class="refund-amount">${safeRefundAmount.toLocaleString()} VND</div>
          </div>
          <p>The refund will be processed according to your original payment method. Please allow <strong>3-5 business days</strong> for the refund to appear in your account.</p>
        </div>
        `
            : `
        <div class="info-section">
          <h4>No Refund Applicable</h4>
          <p>According to our cancellation policy, no refund is available for this booking based on the timing of the cancellation.</p>
        </div>
        `
        }

        <div class="info-section">
          <h4>What Happens Next?</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Your seat reservations have been released</li>
            <li>You can book a new trip at any time</li>
            <li>${hasRefund ? 'Refund will be processed to your original payment method' : 'No further action required'}</li>
          </ul>
        </div>

        <div class="contact-section">
          <h4>Need Help?</h4>
          <p>If you have any questions or need further assistance, please don't hesitate to contact our customer support team.</p>
          <p><strong>Email:</strong> support@bus-ticket-booking.com<br>
          <strong>Phone:</strong> +84-XXX-XXXX</p>
        </div>

        <div class="footer">
          <p style="margin: 0; color: #666;">Thank you for choosing our service!</p>
          <p style="margin: 5px 0; color: #666;">Bus Ticket Booking System</p>
          <p style="margin: 5px 0; font-size: 12px; color: #999;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = { generateBookingCancellationTemplate };
