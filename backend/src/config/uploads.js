import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

// Destination folder for uploads – ensure the folder exists in the repo
const uploadDir = path.resolve('uploads');

// Multer storage configuration – unique filenames
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const unique = crypto.randomBytes(6).toString('hex');
        const timestamp = Date.now();
        cb(null, `${timestamp}-${unique}${ext}`);
    }
});

// File filter – accept only images up to 5MB
function fileFilter(req, file, cb) {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only JPEG/PNG/WebP allowed.'));
    }
    cb(null, true);
}

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit per file
});
