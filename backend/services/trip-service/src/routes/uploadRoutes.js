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

console.log('[Upload Routes] After config - cloudinary.config():', {
  cloud_name: cloudinary.config().cloud_name,
  api_key: cloudinary.config().api_key ? 'SET' : 'NOT SET',
  api_secret: cloudinary.config().api_secret ? 'SET' : 'NOT SET',
});

console.log('[Upload Routes] Cloudinary config applied');

// Helper function to delete image from Cloudinary
const deleteCloudinaryImage = async (publicId) => {
  console.log('[BE Delete Helper] Starting deletion for:', publicId);
  console.log('[BE Delete Helper] Cloudinary config check:', {
    configured: !!cloudinary.config().cloud_name,
    cloud_name: cloudinary.config().cloud_name,
    api_key: cloudinary.config().api_key ? 'SET' : 'NOT SET',
  });

  try {
    // First, try to check if image exists
    let imageExists = false;
    try {
      console.log('[BE Delete Helper] Checking if image exists...');
      const resourceResult = await cloudinary.api.resource(publicId, {
        resource_type: 'image',
      });
      console.log('[BE Delete Helper] Image exists, resource info:', {
        public_id: resourceResult.public_id,
        format: resourceResult.format,
        bytes: resourceResult.bytes,
      });
      imageExists = true;
    } catch (checkError) {
      console.log('[BE Delete Helper] Image check failed:', checkError.message);
      if (checkError.error && checkError.error.message) {
        console.log('[BE Delete Helper] Check error details:', checkError.error.message);
      }
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });

    console.log('[BE Delete Helper] Cloudinary destroy result:', JSON.stringify(result, null, 2));

    return {
      success: result.result === 'ok' || result.result === 'not found',
      result: result.result,
      existed: imageExists,
      message:
        result.result === 'ok'
          ? 'Image deleted successfully'
          : result.result === 'not found'
            ? 'Image not found (already deleted or never existed)'
            : 'Image deletion skipped (permission denied)',
    };
  } catch (error) {
    console.error('[BE Delete Helper] Error deleting image:', error);
    return {
      success: false,
      result: 'error',
      error: error.message,
    };
  }
};

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

router.delete('/image', async (req, res) => {
  try {
    const publicId = req.query.publicId;
    const fullUrl = req.query.url; // Add URL parameter for debugging

    if (!publicId && !fullUrl) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_IDENTIFIER', message: 'Public ID or URL is required' },
      });
    }

    let actualPublicId = publicId;

    // If URL provided, extract public_id from it
    if (fullUrl) {
      console.log('[BE Delete] Extracting public_id from URL:', fullUrl);
      const urlMatch = fullUrl.match(/\/v\d+\/(.+)\.[a-z]+$/i);
      if (urlMatch) {
        actualPublicId = urlMatch[1];
        console.log('[BE Delete] Extracted public_id:', actualPublicId);
      } else {
        console.log('[BE Delete] Could not extract public_id from URL');
      }
    }

    if (!actualPublicId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PUBLIC_ID', message: 'Could not determine public ID' },
      });
    }

    console.log('[BE Delete] Deleting image with public_id:', actualPublicId);
    console.log('[BE Delete] Full Cloudinary config:', {
      cloud_name: cloudinaryConfig.cloud_name,
      api_key: cloudinaryConfig.api_key ? 'SET' : 'NOT SET',
    });

    // First, try to check if image exists
    try {
      console.log('[BE Delete] Checking if image exists...');
      const resourceResult = await cloudinary.api.resource(actualPublicId, {
        resource_type: 'image',
      });
      console.log('[BE Delete] Image exists, resource info:', {
        public_id: resourceResult.public_id,
        format: resourceResult.format,
        bytes: resourceResult.bytes,
        url: resourceResult.url,
      });
    } catch (checkError) {
      console.log('[BE Delete] Image check failed:', checkError.message);
      if (checkError.error && checkError.error.message) {
        console.log('[BE Delete] Check error details:', checkError.error.message);
      }
    }

    // Delete from Cloudinary
    const deleteResult = await deleteCloudinaryImage(actualPublicId);

    if (deleteResult.success) {
      res.json({
        success: true,
        message: deleteResult.message,
        existed: deleteResult.existed,
      });
    } else {
      console.error('Cloudinary delete error:', deleteResult);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete image from Cloudinary',
        },
      });
    }
  } catch (error) {
    console.error('Delete endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SYS_002',
        message: 'Failed to process image deletion',
      },
    });
  }
});

module.exports = {
  router,
  deleteCloudinaryImage,
};
