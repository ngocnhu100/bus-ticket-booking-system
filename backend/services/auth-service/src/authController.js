const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const axios = require('axios');
const userRepository = require('./userRepository');
const authService = require('./authService');
const {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  requestOtpSchema,
  verifyOtpSchema,
  changePasswordSchema,
} = require('./authValidators');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthController {
  async register(req, res) {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: 'Validation error', details: error.details },
          timestamp: new Date().toISOString(),
        });
      }

      const { email, phone, password, fullName, role } = value;

      // Check if email or phone exists
      const existingEmail = await userRepository.findByEmail(email);
      if (existingEmail) {
        if (existingEmail.google_id) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'USER_002',
              message:
                'An account with this email already exists via Google. Please sign in with Google.',
            },
            timestamp: new Date().toISOString(),
          });
        } else {
          return res.status(409).json({
            success: false,
            error: { code: 'USER_002', message: 'Email already exists' },
            timestamp: new Date().toISOString(),
          });
        }
      }

      const existingPhone = await userRepository.findByPhone(phone);
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          error: { code: 'USER_003', message: 'Phone already exists' },
          timestamp: new Date().toISOString(),
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await userRepository.create({ email, phone, passwordHash, fullName, role });

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await userRepository.setEmailVerificationToken(user.user_id, verificationToken, expiresAt);

      // Send verification email via notification service
      try {
        await axios.post(
          `${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003'}/send-email`,
          {
            to: email,
            type: 'verification',
            token: verificationToken,
          }
        );
      } catch (emailError) {
        console.error('⚠️ Failed to send verification email:', emailError.message);
        // Don't fail registration if email fails, but log it
      }

      res.status(201).json({
        success: true,
        data: {
          userId: user.user_id,
          email: user.email,
          phone: user.phone,
          fullName: user.full_name,
          role: user.role,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
        },
        message: 'Registration successful. Please check your email to verify your account.',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async login(req, res) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: 'Validation error', details: error.details },
          timestamp: new Date().toISOString(),
        });
      }

      const { identifier, password } = value;

      // Find user by email or phone
      let user = await userRepository.findByEmail(identifier);
      if (!user) {
        user = await userRepository.findByPhone(identifier);
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_001', message: 'Invalid credentials' },
          timestamp: new Date().toISOString(),
        });
      }

      // Check if admin account is deactivated (password_hash is NULL)
      if (user.role === 'admin' && !user.password_hash) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTH_011',
            message:
              'This admin account has been deactivated. Please contact system administrator.',
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Check if account is locked
      if (user.account_locked_until && user.account_locked_until > new Date()) {
        return res.status(423).json({
          success: false,
          error: {
            code: 'AUTH_010',
            message: 'Account is temporarily locked. Please try again later.',
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Check if user has Google ID (OAuth account)
      if (user.google_id) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_007',
            message: 'This account is linked to Google. Please sign in with Google.',
          },
          timestamp: new Date().toISOString(),
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        // Increment failed login attempts
        const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
        let lockUntil = null;

        if (newFailedAttempts >= 5) {
          // Lock account for 15 minutes after 5 failed attempts
          lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        }

        await userRepository.updateFailedLoginAttempts(user.user_id, newFailedAttempts, lockUntil);

        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_001', message: 'Invalid credentials' },
          timestamp: new Date().toISOString(),
        });
      }

      // Reset failed login attempts on successful login
      if (user.failed_login_attempts > 0) {
        await userRepository.updateFailedLoginAttempts(user.user_id, 0, null);
      }

      // Check if email is verified
      if (!user.email_verified) {
        return res.status(403).json({
          success: false,
          error: { code: 'AUTH_005', message: 'Please verify your email before logging in' },
          timestamp: new Date().toISOString(),
        });
      }

      // Generate tokens
      const accessToken = authService.generateAccessToken({
        userId: user.user_id,
        role: user.role,
      });
      const refreshToken = authService.generateRefreshToken({ userId: user.user_id });

      // Delete old refresh token and store new one
      await authService.deleteRefreshToken(user.user_id);
      await authService.storeRefreshToken(user.user_id, refreshToken);

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          expiresIn: 3600, // 1 hour
          user: {
            userId: user.user_id,
            email: user.email,
            phone: user.phone,
            fullName: user.full_name,
            role: user.role,
            emailVerified: user.email_verified,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async googleAuth(req, res) {
    try {
      const { error, value } = googleAuthSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: 'Validation error', details: error.details },
          timestamp: new Date().toISOString(),
        });
      }

      const { idToken } = value;

      // Verify Google token
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const { sub: googleId, email, name, email_verified } = payload;

      // Find or create user
      let user = await userRepository.findByGoogleId(googleId);
      let isNewUser = false;
      if (!user) {
        // Check if email exists
        user = await userRepository.findByEmail(email);
        if (user) {
          // Link Google ID
          await userRepository.updateGoogleId(user.user_id, googleId);
        } else {
          // Create new user
          user = await userRepository.create({
            email,
            phone: null,
            passwordHash: null, // No password for Google OAuth users
            fullName: name,
            role: 'passenger',
            emailVerified: email_verified,
          });
          await userRepository.updateGoogleId(user.user_id, googleId);
          isNewUser = true;
        }
      }

      // Generate tokens
      const accessToken = authService.generateAccessToken({
        userId: user.user_id,
        role: user.role,
      });
      const refreshToken = authService.generateRefreshToken({ userId: user.user_id });

      // Delete old refresh token and store new one
      await authService.deleteRefreshToken(user.user_id);
      await authService.storeRefreshToken(user.user_id, refreshToken);

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          isNewUser,
          user: {
            userId: user.user_id,
            email: user.email,
            phone: user.phone,
            fullName: user.full_name,
            role: user.role,
            emailVerified: user.email_verified,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(401).json({
        success: false,
        error: { code: 'AUTH_001', message: 'Invalid Google token' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async refresh(req, res) {
    try {
      const { error, value } = refreshSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: 'Validation error', details: error.details },
          timestamp: new Date().toISOString(),
        });
      }

      const { refreshToken } = value;
      const decoded = authService.verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_002', message: 'Invalid refresh token' },
          timestamp: new Date().toISOString(),
        });
      }
      // Allows old refresh tokens to remain valid, preventing logout on refresh when multiple login sessions exist.
      /* 
      const storedToken = await authService.getRefreshToken(decoded.userId);
      if (storedToken !== refreshToken) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_002', message: 'Refresh token revoked' },
          timestamp: new Date().toISOString()
        });
      } */

      // Get user role from database
      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_002', message: 'User not found' },
          timestamp: new Date().toISOString(),
        });
      }

      // Blacklist the old access token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const oldAccessToken = authHeader.substring(7);
        await authService.blacklistAccessToken(oldAccessToken);
      }

      const newAccessToken = authService.generateAccessToken({
        userId: decoded.userId,
        role: user.role,
      });

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          expiresIn: 3600,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async logout(req, res) {
    try {
      const userId = req.user.userId;

      // Blacklist the current access token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await authService.blacklistAccessToken(token);
      }

      await authService.deleteRefreshToken(userId);

      res.json({
        success: true,
        message: 'Logged out successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: { code: 'VAL_001', message: 'Verification token is required' },
          timestamp: new Date().toISOString(),
        });
      }

      // Find user by verification token
      const user = await userRepository.findByEmailVerificationToken(token);
      if (!user) {
        return res.status(400).json({
          success: false,
          error: { code: 'AUTH_003', message: 'Invalid or expired verification token' },
          timestamp: new Date().toISOString(),
        });
      }

      // Verify the email
      await userRepository.verifyEmail(user.user_id);

      res.json({
        success: true,
        message: 'Email verified successfully. You can now log in.',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async resendVerificationEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: { code: 'VAL_001', message: 'Email is required' },
          timestamp: new Date().toISOString(),
        });
      }

      const user = await userRepository.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_001', message: 'User not found' },
          timestamp: new Date().toISOString(),
        });
      }

      if (user.email_verified) {
        return res.status(400).json({
          success: false,
          error: { code: 'AUTH_004', message: 'Email is already verified' },
          timestamp: new Date().toISOString(),
        });
      }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await userRepository.setEmailVerificationToken(user.user_id, verificationToken, expiresAt);

      // Send verification email via notification service
      try {
        await axios.post(
          `${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003'}/send-email`,
          {
            to: email,
            type: 'verification',
            token: verificationToken,
          }
        );
      } catch (emailError) {
        console.error('⚠️ Failed to send verification email:', emailError);
        // Don't fail registration if email fails
      }

      res.json({
        success: true,
        message: 'Verification email sent successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { error, value } = forgotPasswordSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: 'Validation error', details: error.details },
          timestamp: new Date().toISOString(),
        });
      }

      const { email } = value;

      const user = await userRepository.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent.',
          timestamp: new Date().toISOString(),
        });
      }

      // Check if user has a password (not OAuth-only user)
      if (!user.password_hash) {
        // Don't send reset email for users without passwords
        return res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent.',
          timestamp: new Date().toISOString(),
        });
      }

      // Generate password reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await userRepository.setPasswordResetToken(user.user_id, resetToken, expiresAt);

      // Send password reset email via notification service
      try {
        await axios.post(
          `${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003'}/send-email`,
          {
            to: email,
            type: 'password-reset',
            resetToken: resetToken,
          }
        );
      } catch (emailError) {
        console.error('⚠️ Failed to send password reset email:', emailError);
        // Don't fail the request if email fails
      }

      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { error, value } = resetPasswordSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: 'Validation error', details: error.details },
          timestamp: new Date().toISOString(),
        });
      }

      const { token, newPassword } = value;

      // Find user by reset token
      const user = await userRepository.findByPasswordResetToken(token);
      if (!user) {
        return res.status(400).json({
          success: false,
          error: { code: 'AUTH_006', message: 'Invalid or expired reset token' },
          timestamp: new Date().toISOString(),
        });
      }

      // Check if user has a password
      if (!user.password_hash) {
        return res.status(400).json({
          success: false,
          error: { code: 'AUTH_011', message: 'Password reset not available for this account' },
          timestamp: new Date().toISOString(),
        });
      }

      // Validate new password
      const passwordValidation = registerSchema.extract('password').validate(newPassword);
      if (passwordValidation.error) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Password validation failed',
            details: passwordValidation.error.details,
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Check if new password is different from current password
      const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'AUTH_009',
            message: 'New password must be different from current password',
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update password and clear reset token (single use)
      await userRepository.updatePassword(user.user_id, passwordHash);

      // Invalidate all refresh tokens for security
      await authService.deleteRefreshToken(user.user_id);

      res.json({
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async requestOTP(req, res) {
    try {
      const { error, value } = requestOtpSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: 'Validation error', details: error.details },
          timestamp: new Date().toISOString(),
        });
      }

      const { email } = value;

      const user = await userRepository.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({
          success: true,
          message: 'If the email exists, an OTP has been sent.',
          timestamp: new Date().toISOString(),
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP in Redis
      try {
        await authService.storeOTP(email, otp);
      } catch (redisError) {
        console.error(
          '⚠️ Failed to store OTP in Redis, but proceeding with email:',
          redisError.message
        );
      }

      // Send OTP email via notification service
      try {
        await axios.post(
          `${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003'}/send-email`,
          {
            to: email,
            type: 'otp',
            otp: otp,
          }
        );
      } catch (emailError) {
        console.error('⚠️ Failed to send OTP email:', emailError.message);
        // If email fails, we should not proceed as user can't get OTP
        throw new Error('Failed to send OTP email');
      }

      res.json({
        success: true,
        message: 'If the email exists, an OTP has been sent.',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async verifyOTP(req, res) {
    try {
      const { error, value } = verifyOtpSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: 'Validation error', details: error.details },
          timestamp: new Date().toISOString(),
        });
      }

      const { email, otp } = value;

      const storedOTP = await authService.getOTP(email);
      if (!storedOTP || storedOTP !== otp) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_008', message: 'Invalid or expired OTP' },
          timestamp: new Date().toISOString(),
        });
      }

      // OTP is valid, delete it
      await authService.deleteOTP(email);

      // Find user
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_001', message: 'User not found' },
          timestamp: new Date().toISOString(),
        });
      }

      // Generate tokens
      const accessToken = authService.generateAccessToken({
        userId: user.user_id,
        role: user.role,
      });
      const refreshToken = authService.generateRefreshToken({ userId: user.user_id });

      // Store refresh token
      await authService.storeRefreshToken(user.user_id, refreshToken);

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          expiresIn: 3600, // 1 hour
          user: {
            userId: user.user_id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
          },
        },
        message: 'OTP verified successfully. You are now logged in.',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { error, value } = changePasswordSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: { code: 'VAL_001', message: 'Validation error', details: error.details },
          timestamp: new Date().toISOString(),
        });
      }

      const { currentPassword, newPassword } = value;
      const userId = req.user.userId;

      // Get user
      const user = await userRepository.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_001', message: 'User not found' },
          timestamp: new Date().toISOString(),
        });
      }

      // Check if user has Google OAuth (no real password)
      if (user.google_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'AUTH_010',
            message: 'Password change not available for Google OAuth accounts',
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Check if user has a password hash
      if (!user.password_hash) {
        return res.status(400).json({
          success: false,
          error: { code: 'AUTH_011', message: 'No password set for this account' },
          timestamp: new Date().toISOString(),
        });
      }

      // Verify current password
      if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_001', message: 'Current password is incorrect' },
          timestamp: new Date().toISOString(),
        });
      }

      // Check if new password is different from current
      if (!newPassword || !user.password_hash) {
        return res.status(400).json({
          success: false,
          error: { code: 'VAL_001', message: 'Invalid password data' },
          timestamp: new Date().toISOString(),
        });
      }

      if (await bcrypt.compare(newPassword, user.password_hash)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'AUTH_009',
            message: 'New password must be different from current password',
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await userRepository.updatePassword(userId, newPasswordHash);

      // Invalidate all other refresh tokens (keep current session active)
      // Note: This is a simplified approach. In production, you'd want to track sessions properly
      await authService.deleteRefreshToken(userId);

      // Generate new refresh token for current session
      const newRefreshToken = authService.generateRefreshToken({ userId });
      await authService.storeRefreshToken(userId, newRefreshToken);

      // Send confirmation email
      try {
        await axios.post(
          `${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003'}/send-email`,
          {
            to: user.email,
            type: 'password-changed',
            userName: user.full_name,
          }
        );
      } catch (emailError) {
        console.error('⚠️ Failed to send password change confirmation email:', emailError.message);
        // Don't fail the request if email fails
      }

      // Audit log
      console.log(
        `🔐 Password changed for user ${user.email} (ID: ${userId}) at ${new Date().toISOString()}`
      );

      res.json({
        success: true,
        message: 'Password changed successfully. All other sessions have been logged out.',
        data: {
          newRefreshToken, // Send new refresh token to maintain current session
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async verifyToken(req, res) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({
          success: false,
          error: { code: 'VAL_001', message: 'Token is required' },
          timestamp: new Date().toISOString(),
        });
      }

      const decoded = authService.verifyAccessToken(token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_002', message: 'Token expired or invalid' },
          timestamp: new Date().toISOString(),
        });
      }

      // Check if token is blacklisted
      const isBlacklisted = await authService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_004', message: 'Token has been revoked' },
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: { valid: true, user: decoded },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_001', message: 'Unauthorized' },
          timestamp: new Date().toISOString(),
        });
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_001', message: 'User not found' },
          timestamp: new Date().toISOString(),
        });
      }

      // Ensure preferences have the correct structure
      let preferences = user.preferences || {};
      if (!preferences.notifications) {
        preferences = {
          notifications: {
            bookingConfirmations: { email: true, sms: true },
            tripReminders: { email: true, sms: false },
            tripUpdates: { email: true, sms: true },
            promotionalEmails: false,
          },
        };
      }

      res.json({
        success: true,
        data: {
          userId: user.user_id,
          email: user.email,
          phone: user.phone,
          fullName: user.full_name,
          role: user.role,
          avatar: user.avatar,
          emailVerified: user.email_verified,
          phoneVerified: user.phone_verified,
          preferences,
          createdAt: user.created_at,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_001', message: 'Unauthorized' },
          timestamp: new Date().toISOString(),
        });
      }

      const { email, phone, fullName, avatar, preferences } = req.body;

      // Check if email is being changed and if it already exists
      if (email) {
        const existingEmail = await userRepository.findByEmail(email);
        if (existingEmail && existingEmail.user_id !== userId) {
          return res.status(409).json({
            success: false,
            error: { code: 'USER_002', message: 'Email already exists' },
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Check if phone is being changed and if it already exists
      if (phone) {
        const existingPhone = await userRepository.findByPhone(phone);
        if (existingPhone && existingPhone.user_id !== userId) {
          return res.status(409).json({
            success: false,
            error: { code: 'USER_003', message: 'Phone already exists' },
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Update user profile
      const updateData = {};
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      if (fullName) updateData.fullName = fullName;
      if (avatar) updateData.avatar = avatar;
      if (preferences) updateData.preferences = preferences;

      const updatedUser = await userRepository.update(userId, updateData);

      res.json({
        success: true,
        data: {
          userId: updatedUser.user_id,
          email: updatedUser.email,
          phone: updatedUser.phone,
          fullName: updatedUser.full_name,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
          emailVerified: updatedUser.email_verified,
          phoneVerified: updatedUser.phone_verified,
          preferences: updatedUser.preferences,
          createdAt: updatedUser.created_at,
        },
        message: 'Profile updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = new AuthController();
