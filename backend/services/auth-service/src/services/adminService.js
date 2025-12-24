const bcrypt = require('bcrypt');
const adminRepository = require('../repositories/adminRepository');

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

    // Create the admin account
    const newAdmin = await adminRepository.createAdmin({
      email,
      phone: phone || null,
      passwordHash,
      fullName,
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
}

module.exports = new AdminService();
