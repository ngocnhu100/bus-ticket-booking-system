// backend/services/auth-service/src/controllers/uploadAvatar.controller.js
const cloudinary = require('../cloudinary.config');
const fs = require('fs');

async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
    }
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'avatars',
      public_id: `user_${req.user.user_id}`,
      overwrite: true,
    });
    fs.unlinkSync(req.file.path);
    // Save URL to DB
    const updated = await req.userRepository.updateUserAvatar(req.user.user_id, result.secure_url);
    res.json({
      success: true,
      data: {
        userId: req.user.user_id,
        fullName: req.user.full_name,
        updatedAt: new Date().toISOString(),
      },
      message: 'profile updated successfully',
      avatar: result.secure_url
    });
  } catch (err) {
    console.error('Upload avatar error:', err);
    res.status(500).json({ success: false, error: { code: 'UPLOAD_FAIL', message: 'Failed to upload avatar' } });
  }
}

module.exports = uploadAvatar;
