import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const userId = req.user?._id || 'unknown';
    return {
      folder: 'skillswap/avatars',
      public_id: `${userId}-${Date.now()}`,
      allowed_formats: ['jpeg', 'png', 'webp', 'gif'],
      transformation: [
        { width: 400, height: 400, crop: 'limit', quality: 'auto:good' },
        { fetch_format: 'webp' },
      ],
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('Unsupported file type. Allowed: JPEG, PNG, WebP, GIF');
      err.statusCode = 415;
      cb(err);
    }
  },
});

export default upload;