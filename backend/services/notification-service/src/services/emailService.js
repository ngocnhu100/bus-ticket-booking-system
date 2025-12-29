const sgMail = require('@sendgrid/mail');
const fetch = require('node-fetch');
const { generateTicketEmailTemplate } = require('../templates/ticketEmailTemplate');
const { generateBookingConfirmationTemplate } = require('../templates/bookingConfirmationTemplate');
const { generateTripReminderTemplate } = require('../templates/tripReminderEmailTemplate');
const { generateTripUpdateTemplate } = require('../templates/tripUpdateEmailTemplate');
const { generateRefundEmailTemplate } = require('../templates/refundEmailTemplate');
const { generateBookingCancellationTemplate } = require('../templates/bookingCancellationTemplate');

// Only set API key if it's provided
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    throw new Error('SendGrid API key is required in production but not configured.');
  } else {
    console.warn(
      '⚠️  SendGrid API key not set. Email sending will be disabled in development mode.'
    );
  }
}

const DEFAULT_EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@quad-n.me';

class EmailService {
  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.log(`📧 [DEV MODE] Verification email would be sent to ${email} with token ${token}`);
      console.log(`📧 [DEV MODE] Verification URL: ${verificationUrl}`);
      return { success: true, mode: 'development' };
    }

    const msg = {
      to: email,
      from: DEFAULT_EMAIL_FROM,
      subject: 'Verify Your Email - Bus Ticket Booking',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Bus Ticket Booking!</h2>
          <p>Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">Bus Ticket Booking System</p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`📧 Verification email sent to ${email}`);
    } catch (error) {
      console.error('⚠️ Error sending verification email:', error);
      console.error('⚠️ SendGrid response:', error.response?.body || error.message);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.log(
        `📧 [DEV MODE] Password reset email would be sent to ${email} with token ${token}`
      );
      console.log(`📧 [DEV MODE] Reset URL: ${resetUrl}`);
      return { success: true, mode: 'development' };
    }

    const msg = {
      to: email,
      from: DEFAULT_EMAIL_FROM,
      subject: 'Reset Your Password - Bus Ticket Booking',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your Bus Ticket Booking account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">Bus Ticket Booking System</p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`📧 Password reset email sent to ${email}`);
    } catch (error) {
      console.error('⚠️ Error sending password reset email:', error);
      console.error('⚠️ SendGrid response:', error.response?.body || error.message);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendOTPEmail(email, otp) {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.log(`📧 [DEV MODE] OTP email would be sent to ${email} with OTP ${otp}`);
      return { success: true, mode: 'development' };
    }

    const msg = {
      to: email,
      from: DEFAULT_EMAIL_FROM,
      subject: 'Your OTP - Bus Ticket Booking',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>One-Time Password</h2>
          <p>You requested a one-time password for your Bus Ticket Booking account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff; background-color: #f8f9fa; padding: 20px; border-radius: 5px; display: inline-block;">
              ${otp}
            </div>
          </div>
          <p>This OTP will expire in 5 minutes.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">Bus Ticket Booking System</p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`📧 OTP email sent to ${email}`);
    } catch (error) {
      console.error('⚠️ Error sending OTP email:', error);
      console.error('⚠️ SendGrid response:', error.response?.body || error.message);
      throw new Error('Failed to send OTP email');
    }
  }

  async sendPasswordChangedEmail(email, userName) {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.log(
        `📧 [DEV MODE] Password changed email would be sent to ${email} for user ${userName}`
      );
      return { success: true, mode: 'development' };
    }

    const msg = {
      to: email,
      from: DEFAULT_EMAIL_FROM,
      subject: 'Password Changed - Bus Ticket Booking',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Changed Successfully</h2>
          <p>Hi ${userName},</p>
          <p>Your password has been successfully changed.</p>
          <p>If you made this change, no further action is required.</p>
          <p>If you didn't make this change, please contact our support team immediately and consider changing your password again.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login"
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Login
            </a>
          </div>
          <p>For security reasons, all other active sessions have been logged out.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">Bus Ticket Booking System</p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`📧 Password changed email sent to ${email}`);
    } catch (error) {
      console.error('⚠️ Error sending password changed email:', error);
      console.error('⚠️ SendGrid response:', error.response?.body || error.message);
      throw new Error('Failed to send password changed email');
    }
  }

  async sendBookingConfirmationEmail(email, bookingData) {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.log(`📧 [DEV MODE] Booking confirmation email would be sent to ${email}`);
      console.log(`📧 [DEV MODE] Booking Reference: ${bookingData.bookingReference}`);
      return { success: true, mode: 'development' };
    }

    try {
      // Prepare attachments and inline QR handling similar to ticket emails so QR renders reliably
      const attachments = [];
      let qrForTemplate = bookingData.qrCodeUrl;

      if (bookingData.qrCodeUrl) {
        try {
          const dataUrlMatch = String(bookingData.qrCodeUrl).match(
            /^data:(image\/[^;]+);base64,(.+)$/
          );
          if (dataUrlMatch) {
            const mime = dataUrlMatch[1];
            const base64 = dataUrlMatch[2];
            const ext = mime.split('/')[1] || 'png';
            const cid = `qr_${bookingData.bookingReference}`;
            attachments.push({
              content: base64,
              filename: `${bookingData.bookingReference}-qr.${ext}`,
              type: mime,
              disposition: 'inline',
              content_id: cid,
            });
            qrForTemplate = `cid:${cid}`;
          } else if (/^https?:\/\//i.test(bookingData.qrCodeUrl)) {
            const resQr = await fetch(bookingData.qrCodeUrl);
            if (resQr.ok) {
              const bufferQr = await resQr.buffer();
              const base64Qr = bufferQr.toString('base64');
              const contentType = resQr.headers.get('content-type') || 'image/png';
              const ext = (contentType.split('/')[1] || 'png').split(';')[0];
              const cid = `qr_${bookingData.bookingReference}`;
              attachments.push({
                content: base64Qr,
                filename: `${bookingData.bookingReference}-qr.${ext}`,
                type: contentType,
                disposition: 'inline',
                content_id: cid,
              });
              qrForTemplate = `cid:${cid}`;
            } else {
              console.warn(
                `⚠️ Unable to fetch QR image from ${bookingData.qrCodeUrl} - status ${resQr.status}`
              );
            }
          }
        } catch (err) {
          console.error('⚠️ Error processing booking QR code:', err.message || err);
        }
      }

      // If bookingData already contains the e-ticket PDF as base64 (provided by booking-service), attach it directly.
      if (bookingData.eTicketBase64) {
        attachments.push({
          content: bookingData.eTicketBase64,
          filename: bookingData.eTicketFilename || `${bookingData.bookingReference}-e-ticket.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        });
      }

      const htmlContent = generateBookingConfirmationTemplate({
        bookingReference: bookingData.bookingReference,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        tripDetails: bookingData.tripDetails,
        passengers: bookingData.passengers,
        pricing: bookingData.pricing,
        eTicketUrl: bookingData.eTicketUrl,
        qrCodeUrl: qrForTemplate,
        bookingDetailsUrl: bookingData.bookingDetailsUrl,
        cancellationPolicy: bookingData.cancellationPolicy,
        operatorContact: bookingData.operatorContact,
      });

      const msg = {
        to: email,
        from: DEFAULT_EMAIL_FROM,
        subject: `Booking Confirmation - ${bookingData.bookingReference}`,
        html: htmlContent,
      };

      // If an eTicket URL is provided and we did not already attach a base64 PDF, try to fetch the PDF and attach it to the email
      if (bookingData.eTicketUrl && !bookingData.eTicketBase64) {
        try {
          const res = await fetch(bookingData.eTicketUrl);
          if (res.ok) {
            const buffer = await res.buffer();
            const base64 = buffer.toString('base64');
            attachments.push({
              content: base64,
              filename: `${bookingData.bookingReference}-e-ticket.pdf`,
              type: 'application/pdf',
              disposition: 'attachment',
            });
          } else {
            console.warn(
              `⚠️ Unable to fetch eTicket PDF from ${bookingData.eTicketUrl} - status ${res.status}`
            );
          }
        } catch (err) {
          console.error('⚠️ Error fetching eTicket PDF:', err.message || err);
        }
      }

      // Attach any prepared inline QR or PDF attachments
      if (attachments.length > 0) {
        msg.attachments = attachments;
      }

      await sgMail.send(msg);
      console.log(
        `📧 Booking confirmation email sent to ${email} for ${bookingData.bookingReference}`
      );
      return { success: true, sent: true };
    } catch (error) {
      console.error('⚠️ Error sending booking confirmation email:', error);
      console.error('⚠️ SendGrid response:', error.response?.body || error.message);
      throw new Error('Failed to send booking confirmation email');
    }
  }

  async sendTicketEmail(email, bookingData, ticketUrl, qrCode) {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.log(
        `📧 [DEV MODE] Ticket email would be sent to ${email} for booking ${bookingData.reference}`
      );
      console.log(`📧 [DEV MODE] Ticket URL: ${ticketUrl}`);
      return { success: true, mode: 'development' };
    }

    // Prepare attachments array for SendGrid
    const attachments = [];

    // If qrCode is provided as data URL or remote URL, try to attach it inline and replace
    // the template src with a cid reference for better email client support.
    let qrForTemplate = qrCode;

    if (qrCode) {
      try {
        // Data URL (base64) - embed directly
        const dataUrlMatch = String(qrCode).match(/^data:(image\/[^;]+);base64,(.+)$/);
        if (dataUrlMatch) {
          const mime = dataUrlMatch[1];
          const base64 = dataUrlMatch[2];
          const ext = mime.split('/')[1] || 'png';
          const cid = `qr_${bookingData.reference}`;
          attachments.push({
            content: base64,
            filename: `${bookingData.reference}-qr.${ext}`,
            type: mime,
            disposition: 'inline',
            content_id: cid,
          });
          qrForTemplate = `cid:${cid}`;
        } else if (/^https?:\/\//i.test(qrCode)) {
          // Remote URL - try to fetch and attach inline
          const resQr = await fetch(qrCode);
          if (resQr.ok) {
            const bufferQr = await resQr.buffer();
            const base64Qr = bufferQr.toString('base64');
            const contentType = resQr.headers.get('content-type') || 'image/png';
            const ext = (contentType.split('/')[1] || 'png').split(';')[0];
            const cid = `qr_${bookingData.reference}`;
            attachments.push({
              content: base64Qr,
              filename: `${bookingData.reference}-qr.${ext}`,
              type: contentType,
              disposition: 'inline',
              content_id: cid,
            });
            qrForTemplate = `cid:${cid}`;
          } else {
            console.warn(`⚠️ Unable to fetch QR image from ${qrCode} - status ${resQr.status}`);
          }
        }
      } catch (err) {
        console.error('⚠️ Error processing QR code for inline attachment:', err.message || err);
      }
    }

    const htmlContent = generateTicketEmailTemplate({
      bookingReference: bookingData.reference,
      tripId: bookingData.tripId,
      status: bookingData.status,
      totalPrice: bookingData.totalPrice,
      currency: bookingData.currency,
      passengers: bookingData.passengers,
      contactEmail: bookingData.contactEmail,
      contactPhone: bookingData.contactPhone,
      ticketUrl,
      qrCode: qrForTemplate,
    });

    const msg = {
      to: email,
      from: DEFAULT_EMAIL_FROM,
      subject: `Your Bus Ticket - ${bookingData.reference}`,
      html: htmlContent,
    };

    try {
      // Attach the ticket PDF if a ticketUrl was provided
      if (ticketUrl) {
        try {
          const res = await fetch(ticketUrl);
          if (res.ok) {
            const buffer = await res.buffer();
            const base64 = buffer.toString('base64');
            attachments.push({
              content: base64,
              filename: `${bookingData.reference}-e-ticket.pdf`,
              type: 'application/pdf',
              disposition: 'attachment',
            });
          } else {
            console.warn(`⚠️ Unable to fetch ticket PDF from ${ticketUrl} - status ${res.status}`);
          }
        } catch (err) {
          console.error('⚠️ Error fetching ticket PDF:', err.message || err);
        }
      }

      // Attach any attachments we prepared (QR inline, PDF attachment)
      if (attachments.length > 0) {
        msg.attachments = attachments;
      }

      await sgMail.send(msg);
      console.log(`📧 Ticket email sent to ${email} for booking ${bookingData.reference}`);
    } catch (error) {
      console.error('⚠️ Error sending ticket email:', error);
      console.error('⚠️ SendGrid response:', error.response?.body || error.message);
      throw new Error('Failed to send ticket email');
    }
  }

  async sendTripReminderEmail(email, tripData, hoursUntilDeparture) {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.log(
        `📧 [DEV MODE] Trip reminder email would be sent to ${email} for booking ${tripData.bookingReference}`
      );
      return { success: true, mode: 'development' };
    }

    const htmlContent = await generateTripReminderTemplate(tripData, hoursUntilDeparture);

    const msg = {
      to: email,
      from: DEFAULT_EMAIL_FROM,
      subject: `Trip Reminder - ${tripData.tripName} (${hoursUntilDeparture}h)`,
      html: htmlContent,
    };

    try {
      await sgMail.send(msg);
      console.log(
        `📧 Trip reminder email sent to ${email} for booking ${tripData.bookingReference} (${hoursUntilDeparture}h)`
      );
      return { success: true };
    } catch (error) {
      console.error('⚠️ Error sending trip reminder email:', error);
      console.error('⚠️ SendGrid response:', error.response?.body || error.message);
      throw new Error('Failed to send trip reminder email');
    }
  }

  /**
   * Send trip update notification email
   * @param {string} email - Recipient email
   * @param {Object} updateData - Trip update data
   */
  async sendTripUpdateEmail(email, updateData) {
    const { updateType = 'schedule_change', bookingReference = 'N/A' } = updateData;

    const updateTitles = {
      schedule_change: 'Trip Schedule Updated',
      delay: 'Trip Delayed',
      cancellation: 'Trip Cancelled',
    };

    const subject = `${updateTitles[updateType] || 'Trip Update'} - Booking ${bookingReference}`;

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.log(`📧 [DEV MODE] Trip update email would be sent to ${email}`);
      console.log(`📧 [DEV MODE] Subject: ${subject}`);
      console.log(`📧 [DEV MODE] Update Type: ${updateType}`);
      return { success: true, mode: 'development' };
    }

    const htmlContent = generateTripUpdateTemplate(updateData);

    const msg = {
      to: email,
      from: DEFAULT_EMAIL_FROM,
      subject: subject,
      html: htmlContent,
      // Add priority headers for urgent notifications
      headers:
        updateData.updateType === 'cancellation'
          ? {
              'X-Priority': '1', // Highest priority
              'X-MSMail-Priority': 'High',
              Importance: 'High',
            }
          : updateData.updateType === 'delay'
            ? {
                'X-Priority': '3', // Normal priority
                'X-MSMail-Priority': 'Normal',
                Importance: 'Normal',
              }
            : {},
    };

    try {
      await sgMail.send(msg);
      console.log(
        `📧 Trip update email sent to ${email} for booking ${bookingReference} (${updateType})`
      );
      return { success: true };
    } catch (error) {
      console.error('⚠️ Error sending trip update email:', error);
      console.error('⚠️ SendGrid response:', error.response?.body || error.message);
      throw new Error('Failed to send trip update email');
    }
  }

  async sendRefundEmail(email, refundData) {
    if (!refundData || typeof refundData !== 'object') {
      throw new Error('Invalid refund data provided');
    }

    const { bookingReference, refundAmount, reason, currency = 'VND' } = refundData;

    if (!bookingReference) {
      throw new Error('Booking reference is required for refund email');
    }

    // Convert refundAmount to number and validate
    const numericRefundAmount =
      typeof refundAmount === 'string' ? parseFloat(refundAmount) : refundAmount;
    if (isNaN(numericRefundAmount) || numericRefundAmount < 0) {
      throw new Error('Valid refund amount is required for refund email');
    }

    const subject = `Refund Processed for Booking ${bookingReference}`;

    const htmlContent = generateRefundEmailTemplate({
      bookingReference,
      refundAmount: numericRefundAmount,
      reason,
      currency,
    });

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.log(`📧 [DEV MODE] Refund email would be sent to ${email}`);
      console.log(`📧 [DEV MODE] Subject: ${subject}`);
      console.log(`📧 [DEV MODE] Refund Amount: ${refundAmount} ${currency}`);
      return { success: true, mode: 'development' };
    }

    const msg = {
      personalizations: [
        {
          to: [{ email: email }],
        },
      ],
      from: { email: DEFAULT_EMAIL_FROM },
      subject: subject,
      content: [{ type: 'text/html', value: htmlContent }],
    };

    try {
      await sgMail.send(msg);
      console.log(`📧 Refund email sent to ${email} for booking ${bookingReference}`);
      return { success: true };
    } catch (error) {
      console.error('⚠️ Error sending refund email:', error);
      console.error('⚠️ SendGrid response:', error.response?.body || error.message);
      throw new Error('Failed to send refund email');
    }
  }

  async sendBookingCancellationEmail(email, cancellationData) {
    if (!cancellationData || typeof cancellationData !== 'object') {
      throw new Error('Invalid cancellation data provided');
    }

    const { bookingReference, refundAmount } = cancellationData;

    if (!bookingReference) {
      throw new Error('Booking reference is required for cancellation email');
    }

    // Convert refundAmount to number
    const numericRefundAmount =
      typeof refundAmount === 'string' ? parseFloat(refundAmount) : refundAmount;
    if (isNaN(numericRefundAmount)) {
      throw new Error('Valid refund amount is required for cancellation email');
    }

    const subject = `Booking Cancelled - ${bookingReference}`;

    const htmlContent = generateBookingCancellationTemplate({
      bookingReference,
      refundAmount: numericRefundAmount,
    });

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.log(`📧 [DEV MODE] Booking cancellation email would be sent to ${email}`);
      console.log(`📧 [DEV MODE] Subject: ${subject}`);
      console.log(`📧 [DEV MODE] Refund Amount: ${refundAmount} VND`);
      return { success: true, mode: 'development' };
    }

    const msg = {
      personalizations: [
        {
          to: [{ email: email }],
        },
      ],
      from: { email: DEFAULT_EMAIL_FROM },
      subject: subject,
      content: [{ type: 'text/html', value: htmlContent }],
    };

    try {
      await sgMail.send(msg);
      console.log(`📧 Booking cancellation email sent to ${email} for booking ${bookingReference}`);
      return { success: true };
    } catch (error) {
      console.error('⚠️ Error sending booking cancellation email:', error);
      console.error('⚠️ SendGrid response:', error.response?.body || error.message);
      throw new Error('Failed to send booking cancellation email');
    }
  }
}
module.exports = new EmailService();
