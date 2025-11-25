const sgMail = require('@sendgrid/mail');

// Only set API key if it's provided
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    throw new Error('SendGrid API key is required in production but not configured.');
  } else {
    console.warn('⚠️  SendGrid API key not set. Email sending will be disabled in development mode.');
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
      console.log(`📧 [DEV MODE] Password reset email would be sent to ${email} with token ${token}`);
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
      console.log(`📧 [DEV MODE] Password changed email would be sent to ${email} for user ${userName}`);
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
}

module.exports = new EmailService();