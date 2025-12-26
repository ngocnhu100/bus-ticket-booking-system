const bcrypt = require('bcrypt');
const adminRepository = require('../repositories/adminRepository');
const userRepository = require('../userRepository');
const axios = require('axios');

// Notification service URL
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';

/**
 * Send email notification
 * @param {Object} params - Email parameters
 */
const sendEmailNotification = async (params) => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/send-email`, params, {
      timeout: 5000,
    });
  } catch (error) {
    console.error('⚠️ Failed to send email notification:', error.message);
    // Don't throw - email is non-critical
  }
};

/**
 * Admin Service
 * Business logic for admin user management
 */
class AdminService {
  /**
   * Create a new admin account
   * @param {Object} adminData - Admin data
   * @param {string} adminData.email - Email address
   * @param {string} adminData.phone - Phone number (optional)
   * @param {string} adminData.password - Plain text password
   * @param {string} adminData.fullName - Full name
   * @returns {Promise<Object>} Created admin user
   * @throws {Error} If email already exists or validation fails
   */
  async createAdmin({ email, phone, password, fullName }) {
    // Check if admin with this email already exists
    const existingAdmin = await adminRepository.findAdminByEmail(email);
    if (existingAdmin) {
      const error = new Error('Admin account with this email already exists');
      error.code = 'ADMIN_001';
      error.status = 409;
      throw error;
    }

    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    try {
      // Create the admin account
      const newAdmin = await adminRepository.createAdmin({
        email,
        phone: phone || null,
        passwordHash,
        fullName,
      });

      // Send welcome email with credentials
      await sendEmailNotification({
        to: email,
        subject: 'Admin Account Created - Welcome to Bus Ticket System',
        type: 'account-creation',
        html: `<h2>Welcome, ${fullName}!</h2>
          <p>Your admin account has been created successfully.</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${password}</p>
          <p>Please log in and change your password immediately for security purposes.</p>`,
      });

      return {
        userId: newAdmin.user_id,
        email: newAdmin.email,
        phone: newAdmin.phone,
        fullName: newAdmin.full_name,
        role: newAdmin.role,
        emailVerified: newAdmin.email_verified,
        phoneVerified: newAdmin.phone_verified,
        createdAt: newAdmin.created_at,
        updatedAt: newAdmin.updated_at,
      };
    } catch (error) {
      // Handle database constraint violations
      if (error.code === '23505') {
        // Unique constraint violation
        if (error.constraint === 'users_phone_key') {
          const dbError = new Error('Phone number already exists');
          dbError.code = 'ADMIN_012';
          dbError.status = 409;
          throw dbError;
        }
      }
      // Re-throw the error if it's not a handled constraint violation
      throw error;
    }
  }

  /**
   * Get all admin accounts with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.status - Filter by status (active/inactive)
   * @param {string} options.search - Search term
   * @returns {Promise<Object>} Paginated admin users
   */
  async getAllAdmins({ page = 1, limit = 10, status, search }) {
    const result = await adminRepository.findAllAdmins({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      search,
    });

    // Transform data to camelCase
    const transformedData = result.data.map((admin) => ({
      userId: admin.user_id,
      email: admin.email,
      phone: admin.phone,
      fullName: admin.full_name,
      role: admin.role,
      emailVerified: admin.email_verified,
      phoneVerified: admin.phone_verified,
      isActive: admin.is_active,
      createdAt: admin.created_at,
      updatedAt: admin.updated_at,
    }));

    return {
      data: transformedData,
      pagination: result.pagination,
    };
  }

  /**
   * Get admin account by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Admin user
   * @throws {Error} If admin not found
   */
  async getAdminById(userId) {
    const admin = await adminRepository.findAdminById(userId);

    if (!admin) {
      const error = new Error('Admin account not found');
      error.code = 'ADMIN_002';
      error.status = 404;
      throw error;
    }

    return {
      userId: admin.user_id,
      email: admin.email,
      phone: admin.phone,
      fullName: admin.full_name,
      role: admin.role,
      emailVerified: admin.email_verified,
      phoneVerified: admin.phone_verified,
      isActive: admin.is_active,
      preferences: admin.preferences,
      createdAt: admin.created_at,
      updatedAt: admin.updated_at,
    };
  }

  /**
   * Update admin account information
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @param {string} updateData.fullName - Full name
   * @param {string} updateData.phone - Phone number
   * @param {string} updateData.email - Email address
   * @returns {Promise<Object>} Updated admin user
   * @throws {Error} If admin not found or email already in use
   */
  async updateAdmin(userId, { fullName, phone, email }) {
    // Check if admin exists
    const existingAdmin = await adminRepository.findAdminById(userId);
    if (!existingAdmin) {
      const error = new Error('Admin account not found');
      error.code = 'ADMIN_002';
      error.status = 404;
      throw error;
    }

    // If email is being updated, check if it's already in use by another admin
    if (email && email !== existingAdmin.email) {
      const emailInUse = await adminRepository.findAdminByEmail(email);
      if (emailInUse) {
        const error = new Error('Email address is already in use by another admin');
        error.code = 'ADMIN_003';
        error.status = 409;
        throw error;
      }
    }

    // Update the admin account
    const updatedAdmin = await adminRepository.updateAdmin(userId, {
      fullName,
      phone,
      email,
    });

    if (!updatedAdmin) {
      const error = new Error('Failed to update admin account');
      error.code = 'ADMIN_004';
      error.status = 500;
      throw error;
    }

    return {
      userId: updatedAdmin.user_id,
      email: updatedAdmin.email,
      phone: updatedAdmin.phone,
      fullName: updatedAdmin.full_name,
      role: updatedAdmin.role,
      emailVerified: updatedAdmin.email_verified,
      phoneVerified: updatedAdmin.phone_verified,
      isActive: updatedAdmin.is_active,
      createdAt: updatedAdmin.created_at,
      updatedAt: updatedAdmin.updated_at,
    };
  }

  /**
   * Deactivate admin account
   * @param {string} userId - User ID
   * @param {string} requestingAdminId - ID of admin making the request
   * @returns {Promise<Object>} Deactivated admin user
   * @throws {Error} If admin not found or trying to deactivate self
   */
  async deactivateAdmin(userId, requestingAdminId) {
    // Prevent admin from deactivating themselves
    if (userId === requestingAdminId) {
      const error = new Error('You cannot deactivate your own admin account');
      error.code = 'ADMIN_005';
      error.status = 403;
      throw error;
    }

    // Check if admin exists
    const existingAdmin = await adminRepository.findAdminById(userId);
    if (!existingAdmin) {
      const error = new Error('Admin account not found');
      error.code = 'ADMIN_002';
      error.status = 404;
      throw error;
    }

    // Check if already deactivated
    if (!existingAdmin.is_active) {
      const error = new Error('Admin account is already deactivated');
      error.code = 'ADMIN_006';
      error.status = 400;
      throw error;
    }

    // Check if this is the last active admin
    const activeAdminCount = await adminRepository.countActiveAdmins();
    if (activeAdminCount <= 1) {
      const error = new Error('Cannot deactivate the last active admin account');
      error.code = 'ADMIN_007';
      error.status = 403;
      throw error;
    }

    // Deactivate the admin account
    const deactivatedAdmin = await adminRepository.deactivateAdmin(userId);

    if (!deactivatedAdmin) {
      const error = new Error('Failed to deactivate admin account');
      error.code = 'ADMIN_008';
      error.status = 500;
      throw error;
    }

    // Send deactivation notification email
    await sendEmailNotification({
      to: deactivatedAdmin.email,
      subject: 'Admin Account Deactivated',
      type: 'account-deactivation',
      html: `<h2>Admin Account Deactivated</h2>
        <p>Dear ${deactivatedAdmin.full_name},</p>
        <p>Your admin account has been deactivated.</p>
        <p>If you believe this is a mistake, please contact the system administrator.</p>`,
    });

    return {
      userId: deactivatedAdmin.user_id,
      email: deactivatedAdmin.email,
      phone: deactivatedAdmin.phone,
      fullName: deactivatedAdmin.full_name,
      role: deactivatedAdmin.role,
      emailVerified: deactivatedAdmin.email_verified,
      phoneVerified: deactivatedAdmin.phone_verified,
      isActive: deactivatedAdmin.is_active,
      createdAt: deactivatedAdmin.created_at,
      updatedAt: deactivatedAdmin.updated_at,
    };
  }

  /**
   * Reactivate admin account
   * @param {string} userId - User ID
   * @param {string} newPassword - New password for reactivation
   * @returns {Promise<Object>} Reactivated admin user
   * @throws {Error} If admin not found or already active
   */
  async reactivateAdmin(userId, newPassword) {
    // Check if admin exists
    const existingAdmin = await adminRepository.findAdminById(userId);
    if (!existingAdmin) {
      const error = new Error('Admin account not found');
      error.code = 'ADMIN_002';
      error.status = 404;
      throw error;
    }

    // Check if already active
    if (existingAdmin.is_active) {
      const error = new Error('Admin account is already active');
      error.code = 'ADMIN_009';
      error.status = 400;
      throw error;
    }

    // Hash the new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Reactivate the admin account
    const reactivatedAdmin = await adminRepository.updateAdminPassword(userId, passwordHash);

    if (!reactivatedAdmin) {
      const error = new Error('Failed to reactivate admin account');
      error.code = 'ADMIN_010';
      error.status = 500;
      throw error;
    }

    // Send reactivation notification email
    await sendEmailNotification({
      to: reactivatedAdmin.email,
      subject: 'Admin Account Reactivated',
      type: 'account-reactivation',
      html: `<h2>Admin Account Reactivated</h2>
        <p>Dear ${reactivatedAdmin.full_name},</p>
        <p>Your admin account has been reactivated successfully.</p>
        <p> Your new password is: <strong>${newPassword}</strong></p>
        <p>You can now log in with your new password.</p>`,
    });

    return {
      userId: reactivatedAdmin.user_id,
      email: reactivatedAdmin.email,
      phone: reactivatedAdmin.phone,
      fullName: reactivatedAdmin.full_name,
      role: reactivatedAdmin.role,
      emailVerified: reactivatedAdmin.email_verified,
      phoneVerified: reactivatedAdmin.phone_verified,
      isActive: reactivatedAdmin.is_active,
      createdAt: reactivatedAdmin.created_at,
      updatedAt: reactivatedAdmin.updated_at,
    };
  }

  /**
   * Deactivate a user account (set password_hash to NULL and lock account permanently)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deactivated user
   * @throws {Error} If user not found
   */
  async deactivateUser(userId) {
    // Check if user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.code = 'USER_001';
      error.status = 404;
      throw error;
    }

    // Deactivate the user account
    const deactivatedUser = await adminRepository.deactivateUser(userId);

    if (!deactivatedUser) {
      const error = new Error('Failed to deactivate user account');
      error.code = 'USER_002';
      error.status = 500;
      throw error;
    }

    // Send deactivation notification email
    await sendEmailNotification({
      to: deactivatedUser.email,
      subject: 'Your Account Has Been Deactivated',
      type: 'account-deactivation',
      html: `<h2>Account Deactivated</h2>
        <p>Dear ${deactivatedUser.full_name},</p>
        <p>Your account has been deactivated.</p>
        <p>If you believe this is a mistake, please contact the system administrator.</p>`,
    });

    return {
      userId: deactivatedUser.user_id,
      email: deactivatedUser.email,
      fullName: deactivatedUser.full_name,
      isActive: deactivatedUser.is_active,
      message: 'User deactivated successfully',
    };
  }

  /**
   * Reactivate a user account (clear account_locked_until)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Reactivated user
   * @throws {Error} If user not found
   */
  async reactivateUser(userId) {
    // Check if user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.code = 'USER_001';
      error.status = 404;
      throw error;
    }

    // Reactivate the user account
    const reactivatedUser = await adminRepository.reactivateUser(userId);

    if (!reactivatedUser) {
      const error = new Error('Failed to reactivate user account');
      error.code = 'USER_002';
      error.status = 500;
      throw error;
    }

    // Send reactivation notification email
    await sendEmailNotification({
      to: reactivatedUser.email,
      subject: 'Your Account Has Been Reactivated',
      type: 'account-reactivation',
      html: `<h2>Account Reactivated</h2>
        <p>Dear ${reactivatedUser.full_name},</p>
        <p>Your account has been reactivated successfully.</p>
        <p>You can now log in with your existing credentials.</p>`,
    });

    return {
      userId: reactivatedUser.user_id,
      email: reactivatedUser.email,
      fullName: reactivatedUser.full_name,
      isActive: reactivatedUser.is_active,
      message: 'User reactivated successfully',
    };
  }

  /**
   * Get admin statistics
   * @returns {Promise<Object>} Admin statistics
   */
  async getAdminStats() {
    const totalAdmins = await adminRepository.countAdmins();
    const activeAdmins = await adminRepository.countActiveAdmins();

    return {
      totalAdmins,
      activeAdmins,
      inactiveAdmins: totalAdmins - activeAdmins,
    };
  }

  /**
   * Get all users with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.limit - Number of users per page
   * @param {string} options.status - Filter by status ('active' or 'inactive')
   * @param {string} options.search - Search term for email or full name
   * @param {string} options.role - Filter by role ('admin' or 'passenger')
   * @returns {Promise<Object>} Users with pagination info
   */
  async getAllUsers({ page = 1, limit = 10, status, search, role }) {
    const result = await userRepository.getAllUsers({
      page,
      limit,
      status,
      search,
      role,
    });

    return {
      users: result.data.map((user) => ({
        userId: user.user_id,
        email: user.email,
        phone: user.phone,
        fullName: user.full_name,
        role: user.role,
        emailVerified: user.email_verified,
        phoneVerified: user.phone_verified,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        failedLoginAttempts: user.failed_login_attempts,
        accountLockedUntil: user.account_locked_until,
      })),
      pagination: result.pagination,
    };
  }

  /**
   * Reset a user's password
   * @param {string} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Updated user info
   * @throws {Error} If user not found
   */
  async resetUserPassword(userId, newPassword) {
    // Check if user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.code = 'USER_001';
      error.status = 404;
      throw error;
    }

    // Hash the new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update the password
    const updatedUser = await userRepository.updatePassword(userId, passwordHash);

    // Send password reset notification email
    await sendEmailNotification({
      to: updatedUser.email,
      subject: 'Your Password Has Been Reset',
      type: 'password-reset-notification',
      html: `<h2>Password Reset Confirmation</h2>
        <p>Dear ${updatedUser.full_name},</p>
        <p>Your password has been reset by an administrator.</p>
        <p>Your new temporary password is: <strong>${newPassword}</strong></p>
        <p>Please log in and change your password immediately for security purposes.</p>
        <p>If you did not request this password reset, please contact support immediately.</p>`,
    });

    return {
      userId: updatedUser.user_id,
      email: updatedUser.email,
      fullName: updatedUser.full_name,
      message: 'Password reset successfully',
    };
  }
}

module.exports = new AdminService();
