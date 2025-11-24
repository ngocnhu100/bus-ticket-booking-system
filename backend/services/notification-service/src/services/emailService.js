const sgMail = require('@sendgrid/mail');

// Only set API key if it's a valid SendGrid key
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('⚠️  SendGrid API key not set or invalid. Email sending will be disabled.');
}

class EmailService {
  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_API_KEY.startsWith('SG.')) {
      console.log(`📧 [DEV MODE] Verification email would be sent to ${email} with token ${token}`);
      console.log(`📧 [DEV MODE] Verification URL: ${verificationUrl}`);
      return { success: true, mode: 'development' };
    }

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM || 'noreply@busticket.com',
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
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_API_KEY.startsWith('SG.')) {
      console.log(`📧 [DEV MODE] Password reset email would be sent to ${email} with token ${token}`);
      console.log(`📧 [DEV MODE] Reset URL: ${resetUrl}`);
      return { success: true, mode: 'development' };
    }

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM || 'noreply@busticket.com',
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
      throw new Error('Failed to send password reset email');
    }
  }
}

module.exports = new EmailService();