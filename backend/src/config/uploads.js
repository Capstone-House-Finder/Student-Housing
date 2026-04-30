import multer from 'multer';
import * as cloudinary from 'cloudinary';

// File filter – accept only images up to 5MB
function fileFilter(req, file, cb) {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only JPEG/PNG/WebP allowed.'));
    }
    cb(null, true);
}

// Configure Cloudinary for file uploads
if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

// Use memory storage – files are in req.files.buffer
// Cloudinary uploads are handled in the controller
export const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit per file
});
