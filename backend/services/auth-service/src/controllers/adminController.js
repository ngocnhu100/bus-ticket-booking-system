const adminService = require('../services/adminService');
const {
  createAdminSchema,
  updateAdminSchema,
  reactivateAdminSchema,
  paginationSchema,
  userPaginationSchema,
  resetUserPasswordSchema,
} = require('../validators/adminValidators');

/**
 * Admin Controller
 * Handles HTTP requests for admin user management
 */
class AdminController {
  /**
   * Create a new admin account
   * POST /admin/accounts
   * @body {email, phone, password, fullName}
   */
  async createAdmin(req, res) {
    try {
      // Validate request body
      const { error, value } = createAdminSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation error',
            details: error.details.map((d) => ({
              field: d.path.join('.'),
              message: d.message,
            })),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { email, phone, password, fullName } = value;

      // Create admin account
      const newAdmin = await adminService.createAdmin({
        email,
        phone,
        password,
        fullName,
      });

      return res.status(201).json({
        success: true,
        data: newAdmin,
        message: 'Admin account created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Create admin error:', error);

      // Handle specific error codes
      if (error.code === 'ADMIN_001' || error.code === 'ADMIN_012') {
        return res.status(error.status || 409).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Generic error response
      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to create admin account',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get all admin accounts with pagination and filtering
   * GET /admin/accounts?page=1&limit=10&status=active&search=john
   */
  async getAllAdmins(req, res) {
    try {
      // Validate query parameters
      const { error, value } = paginationSchema.validate(req.query);
      if (error) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation error',
            details: error.details.map((d) => ({
              field: d.path.join('.'),
              message: d.message,
            })),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { page, limit, status, search } = value;

      // Get admin accounts
      const result = await adminService.getAllAdmins({
        page,
        limit,
        status,
        search,
      });

      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Get all admins error:', error);

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to retrieve admin accounts',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get admin account by ID
   * GET /admin/accounts/:id
   */
  async getAdminById(req, res) {
    try {
      const { id } = req.params;

      // Get admin account
      const admin = await adminService.getAdminById(id);

      return res.status(200).json({
        success: true,
        data: admin,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Get admin by ID error:', error);

      // Handle specific error codes
      if (error.code === 'ADMIN_002') {
        return res.status(error.status || 404).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to retrieve admin account',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Update admin account information
   * PUT /admin/accounts/:id
   * @body {fullName, phone, email}
   */
  async updateAdmin(req, res) {
    try {
      const { id } = req.params;

      // Validate request body
      const { error, value } = updateAdminSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation error',
            details: error.details.map((d) => ({
              field: d.path.join('.'),
              message: d.message,
            })),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { fullName, phone, email } = value;

      // Update admin account
      const updatedAdmin = await adminService.updateAdmin(id, {
        fullName,
        phone,
        email,
      });

      return res.status(200).json({
        success: true,
        data: updatedAdmin,
        message: 'Admin account updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Update admin error:', error);

      // Handle specific error codes
      if (error.code && error.status) {
        return res.status(error.status).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to update admin account',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Deactivate admin account
   * POST /admin/accounts/:id/deactivate
   */
  async deactivateAdmin(req, res) {
    try {
      const { id } = req.params;
      const requestingAdminId = req.user?.userId;

      // Deactivate admin account
      const deactivatedAdmin = await adminService.deactivateAdmin(id, requestingAdminId);

      return res.status(200).json({
        success: true,
        data: deactivatedAdmin,
        message: 'Admin account deactivated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Deactivate admin error:', error);

      // Handle specific error codes
      if (error.code && error.status) {
        return res.status(error.status).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to deactivate admin account',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Reactivate admin account
   * POST /admin/accounts/:id/reactivate
   * @body {password}
   */
  async reactivateAdmin(req, res) {
    try {
      const { id } = req.params;

      // Validate request body
      const { error, value } = reactivateAdminSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation error',
            details: error.details.map((d) => ({
              field: d.path.join('.'),
              message: d.message,
            })),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { password } = value;

      // Reactivate admin account
      const reactivatedAdmin = await adminService.reactivateAdmin(id, password);

      return res.status(200).json({
        success: true,
        data: reactivatedAdmin,
        message: 'Admin account reactivated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Reactivate admin error:', error);

      // Handle specific error codes
      if (error.code && error.status) {
        return res.status(error.status).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to reactivate admin account',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get admin statistics
   * GET /admin/stats
   */
  async getAdminStats(req, res) {
    try {
      const stats = await adminService.getAdminStats();

      return res.status(200).json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Get admin stats error:', error);

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to retrieve admin statistics',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get all users
   * GET /admin/users
   * @query {page, limit, search, status}
   */
  async getAllUsers(req, res) {
    try {
      // Validate query parameters
      const { error, value } = userPaginationSchema.validate(req.query);
      if (error) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation error',
            details: error.details.map((d) => ({
              field: d.path.join('.'),
              message: d.message,
            })),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { page, limit, search, status, role } = value;

      const result = await adminService.getAllUsers({
        page,
        limit,
        search,
        status,
        role,
      });

      console.log('🔍 Get all users result:', JSON.stringify(result, null, 2));

      return res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Get all users error:', error);

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to retrieve users',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Reset user password
   * POST /admin/users/:id/reset-password
   * @body {newPassword}
   */
  async resetUserPassword(req, res) {
    try {
      const { id } = req.params;

      // Validate request body
      const { error, value } = resetUserPasswordSchema.validate(req.body);
      if (error) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation error',
            details: error.details.map((d) => ({
              field: d.path.join('.'),
              message: d.message,
            })),
          },
          timestamp: new Date().toISOString(),
        });
      }

      const { newPassword } = value;

      const result = await adminService.resetUserPassword(id, newPassword);

      return res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Reset user password error:', error);

      if (error.status) {
        return res.status(error.status).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to reset user password',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Deactivate user account
   * POST /admin/users/:id/deactivate
   */
  async deactivateUser(req, res) {
    try {
      const { id } = req.params;

      const result = await adminService.deactivateUser(id);

      return res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Deactivate user error:', error);

      if (error.status) {
        return res.status(error.status).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to deactivate user',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Reactivate user account
   * POST /admin/users/:id/reactivate
   */
  async reactivateUser(req, res) {
    try {
      const { id } = req.params;

      const result = await adminService.reactivateUser(id);

      return res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Reactivate user error:', error);

      if (error.status) {
        return res.status(error.status).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to reactivate user',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = new AdminController();
