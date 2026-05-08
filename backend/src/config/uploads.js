import multer from 'multer';

// Memory storage – files are kept as Buffer in req.file.buffer
const storage = multer.memoryStorage();

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
