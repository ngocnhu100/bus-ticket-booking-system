// routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Configure Cloudinary
console.log('[Upload Routes] Configuring Cloudinary');
console.log('[Upload Routes] CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log(
  '[Upload Routes] CLOUDINARY_API_KEY:',
  process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET'
);
console.log(
  '[Upload Routes] CLOUDINARY_API_SECRET:',
  process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'
);

// Use environment variables or fallback to hardcoded values
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dleqkiaj0',
  api_key: process.env.CLOUDINARY_API_KEY || '957383667687537',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'FzIR1-p0xgW6-uw78AeAaebuIlw',
};

console.log('[Upload Routes] Using cloud_name:', cloudinaryConfig.cloud_name);
console.log('[Upload Routes] Using api_key:', cloudinaryConfig.api_key ? 'SET' : 'NOT SET');
console.log('[Upload Routes] Using api_secret:', cloudinaryConfig.api_secret ? 'SET' : 'NOT SET');

cloudinary.config(cloudinaryConfig);

console.log('[Upload Routes] Cloudinary config applied');

console.log('[Upload Routes] Cloudinary config applied');

// Configure multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * POST /trips/upload/image
 * Upload image to Cloudinary
 */
router.post(
  '/image',
  (req, res, next) => {
    console.log('[BE Upload] Starting multer middleware');
    console.log('[BE Upload] Content-Type:', req.get('content-type'));
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('[BE Upload] Multer error:', err);
        return res.status(400).json({
          success: false,
          error: { code: 'UPLOAD_ERROR', message: err.message },
        });
      }
      console.log(
        '[BE Upload] Multer done, req.file:',
        !!req.file,
        req.file ? req.file.originalname : 'none'
      );
      next();
    });
  },
  async (req, res) => {
    try {
      console.log(
        '[BE Upload] Handler called, file:',
        !!req.file,
        req.file ? req.file.originalname : 'no file'
      );
      console.log('Request body keys:', Object.keys(req.body || {}));
      console.log('Request files:', req.files);
      if (!req.file) {
        console.log('No file provided in upload request');
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No file provided' },
        });
      }

      // Upload to Cloudinary using stream
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'bus-tickets/buses',
          resource_type: 'auto',
          max_bytes: 5242880, // 5MB
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return res.status(500).json({
              success: false,
              error: {
                code: 'UPLOAD_FAILED',
                message: 'Failed to upload image to Cloudinary',
              },
            });
          }

          res.json({
            success: true,
            data: {
              url: result.secure_url,
              public_id: result.public_id,
            },
            message: 'Image uploaded successfully',
          });
        }
      );

      // Pipe the file buffer to the upload stream
      uploadStream.end(req.file.buffer);
    } catch (error) {
      console.error('Upload endpoint error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: 'Failed to process image upload',
        },
      });
    }
  }
);

module.exports = router;
