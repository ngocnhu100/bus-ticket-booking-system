// userController.js - user-service
// REST API cho user profile

const userService = require('../services/userService');

module.exports = {
  async getProfile(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_001', message: 'Unauthorized' },
        });
      }
      const user = await userService.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_001', message: 'User not found' },
        });
      }
      res.json({
        success: true,
        data: {
          userId: user.user_id,
          email: user.email,
          phone: user.phone,
          fullName: user.full_name,
          role: user.role,
          avatar: user.avatar || null,
          emailVerified: user.email_verified,
          phoneVerified: user.phone_verified,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      console.error('⚠️', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYS_001', message: 'Internal server error' },
      });
    }
  },
  async changePassword(req, res) {
    try {
      const bcrypt = require('bcrypt');
      const userId = req.user?.userId;
      const { currentPassword, newPassword } = req.body;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_001', message: 'Unauthorized' },
          timestamp: new Date().toISOString(),
        });
      }
      const user = await userService.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_001', message: 'User not found' },
          timestamp: new Date().toISOString(),
        });
      }
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
      if (!user.password_hash) {
        return res.status(400).json({
          success: false,
          error: { code: 'AUTH_011', message: 'No password set for this account' },
          timestamp: new Date().toISOString(),
        });
      }
      if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_001', message: 'Current password is incorrect' },
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
      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      await userService.updatePassword(userId, newPasswordHash);
      res.json({
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️ changePassword error:', error && error.stack ? error.stack : error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Internal server error',
          details: error && error.message ? error.message : error,
        },
        timestamp: new Date().toISOString(),
      });
    }
  },
  async updateProfile(req, res) {
    try {
      const userId = req.user?.userId;
      console.log('[updateProfile] req.user:', req.user);
      console.log('[updateProfile] req.body:', req.body);
      if (!userId) {
        console.error('[updateProfile] No userId in req.user');
        return res.status(401).json({
          success: false,
          error: { code: 'AUTH_001', message: 'Unauthorized' },
        });
      }
      const { fullName, phone, avatar } = req.body;
      // Validate tên không rỗng
      if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
        return res.status(400).json({
          success: false,
          error: { code: 'USER_004', message: 'Tên không được để trống.' },
        });
      }
      // Validate số điện thoại Việt Nam (+84xxxxxxxxx hoặc 0xxxxxxxxx)
      const phoneRegex = /^(\+84|0)\d{9}$/;
      if (!phone || typeof phone !== 'string' || !phoneRegex.test(phone.trim())) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'USER_005',
            message: 'Số điện thoại phải đúng định dạng +84xxxxxxxxx hoặc 0xxxxxxxxx.',
          },
        });
      }
      // Validate phone unique
      if (phone) {
        const existingPhone = await userService.findByPhone(phone);
        if (existingPhone && existingPhone.user_id !== userId) {
          console.warn('[updateProfile] Phone already exists:', phone);
          return res.status(409).json({
            success: false,
            error: { code: 'USER_003', message: 'Phone already exists' },
          });
        }
      }

      // Xử lý avatar: nếu là base64 thì upload lên Cloudinary, nếu là url thì giữ nguyên
      let avatarUrl;
      if (typeof avatar === 'string' && avatar.startsWith('data:image/')) {
        // Kiểm tra kích thước file base64 (giới hạn 10MB thực tế ~ 13.33MB base64)
        // 10MB = 10 * 1024 * 1024 = 10485760 bytes
        // base64 tăng kích thước ~ 4/3, nên giới hạn base64 string ~ 13.9MB
        const BASE64_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
        // Tách phần header (data:image/png;base64,)
        const base64Data = avatar.split(',')[1];
        if (!base64Data) {
          return res.status(400).json({
            success: false,
            error: { code: 'USER_006', message: 'Dữ liệu avatar không hợp lệ.' },
          });
        }
        // Tính kích thước thực tế của file (bytes)
        const fileSizeBytes = Math.floor((base64Data.length * 3) / 4);
        if (fileSizeBytes > BASE64_SIZE_LIMIT) {
          return res.status(400).json({
            success: false,
            error: { code: 'USER_007', message: 'Kích thước file avatar vượt quá 10MB.' },
          });
        }
        // decode base64 và upload lên Cloudinary
        const uploadToCloudinary = require('./updateAvatar.controller').uploadBase64ToCloudinary;
        avatarUrl = await uploadToCloudinary(avatar, userId);
        console.log('[updateProfile] avatar uploaded to Cloudinary:', avatarUrl);
      } else if (typeof avatar === 'string' && avatar.trim() !== '') {
        avatarUrl = avatar;
      } // Nếu không gửi avatar, giữ nguyên avatar cũ
      // Nếu avatar là rỗng/null/undefined thì KHÔNG cập nhật avatar (giữ nguyên DB)
      // (Không set avatar mặc định vào DB)

      // ⚠️ LƯU Ý: KHÔNG cập nhật preferences trong updateProfile
      const updateData = { fullName, phone };
      if (typeof avatarUrl === 'string' && avatarUrl.trim() !== '') {
        updateData.avatar = avatarUrl;
      }
      console.log('[updateProfile] updateData:', updateData);
      const updatedUser = await userService.update(userId, updateData);
      console.log('[updateProfile] updatedUser:', updatedUser);
      res.json({
        success: true,
        data: {
          userId: updatedUser.user_id,
          fullName: updatedUser.full_name,
          updatedAt: updatedUser.updated_at,
        },
        message: 'profile updated successfully',
      });
    } catch (error) {
      console.error('⚠️ updateProfile error:', error && error.stack ? error.stack : error);
      if (error && error.code) {
        console.error('⚠️ updateProfile error.code:', error.code);
      }
      if (error && error.detail) {
        console.error('⚠️ updateProfile error.detail:', error.detail);
      }
      if (error && error.message) {
        console.error('⚠️ updateProfile error.message:', error.message);
      }
      res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Internal server error',
          details: error && error.message ? error.message : error,
        },
      });
    }
  },
  async updateAvatar(req, res) {
    const updateAvatar = require('./updateAvatar.controller');
    await updateAvatar(req, res);
  },
};
