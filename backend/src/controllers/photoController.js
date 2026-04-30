/**
 * Photo controller – handles image upload/management for listings.
 * BE-05: Implement photo upload endpoint
 */
import { getDatabasePool } from '../config/database.js';

// Lazy pool – only get it when needed (not at module load time)
let poolInstance = null;
function getPool() {
    if (!poolInstance) {
        poolInstance = getDatabasePool();
    }
    return poolInstance;
}

const MAX_PHOTOS_PER_LISTING = 10;

/**
 * Upload photos for a listing.
 * Expects multer middleware to have processed req.files (array of uploaded files).
 * Only the listing owner (landlord) can upload photos.
 */
export async function uploadPhotos(req, res, next) {
    const pool = getPool();
    try {
        const listingId = parseInt(req.params.id, 10);
        if (isNaN(listingId)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid listing ID' } });
        }

        // 1. Verify listing exists and get landlord_id
        const [listingRows] = await pool.query(
            `SELECT landlord_id, deleted_at
             FROM listings
             WHERE id = ? AND deleted_at IS NULL
             LIMIT 1`,
            [listingId]
        );
        if (!listingRows || listingRows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
        }
        const listing = listingRows[0];

        // 2. Verify ownership (only landlord who owns the listing can upload)
        if (!req.user || req.user.id !== listing.landlord_id) {
            return res.status(403).json({ success: false, error: { message: 'Forbidden: not listing owner' } });
        }

        // 3. Check if any files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, error: { message: 'No photos uploaded' } });
        }

        // 4. Count existing photos for this listing
        const [countRows] = await pool.query(
            'SELECT COUNT(*) as count FROM listing_photos WHERE listing_id = ?',
            [listingId]
        );
        const existingCount = countRows[0].count;
        const newCount = req.files.length;
        if (existingCount + newCount > MAX_PHOTOS_PER_LISTING) {
            return res.status(400).json({
                success: false,
                error: { message: `Max ${MAX_PHOTOS_PER_LISTING} photos per listing. Currently have ${existingCount}.` }
            });
        }

        // 5. Insert each photo record
        const uploadedPhotos = [];
        for (const file of req.files) {
            // Determine URL and public_id based on storage type
            // For local storage (multer disk storage), file.path contains the full path
            // For Cloudinary storage, file.path is the secure_url and file.filename is the public_id
            const url = file.path || `/uploads/${file.filename}`;
            const publicId = file.filename || null; // Cloudinary public_id or local filename

            const [result] = await pool.query(
                'INSERT INTO listing_photos (listing_id, url, public_id) VALUES (?, ?, ?)',
                [listingId, url, publicId]
            );
            uploadedPhotos.push({
                id: result.insertId,
                url,
                public_id: publicId,
            });
        }

        // 6. Return success with uploaded photo details
        res.status(201).json({
            success: true,
            data: {
                listing_id: listingId,
                photos: uploadedPhotos,
            },
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Delete a photo by ID.
 * Only the listing owner can delete.
 */
export async function deletePhoto(req, res, next) {
    const pool = getPool();
    try {
        const photoId = parseInt(req.params.id, 10);
        if (isNaN(photoId)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid photo ID' } });
        }

        // 1. Fetch photo and its listing to verify ownership
        const [photoRows] = await pool.query(
            `SELECT lp.id, lp.listing_id, lp.url, lp.public_id, l.landlord_id
             FROM listing_photos lp
             JOIN listings l ON lp.listing_id = l.id
             WHERE lp.id = ? AND l.deleted_at IS NULL
             LIMIT 1`,
            [photoId]
        );
        if (!photoRows || photoRows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Photo not found' } });
        }
        const photo = photoRows[0];

        // 2. Verify ownership
        if (!req.user || req.user.id !== photo.landlord_id) {
            return res.status(403).json({ success: false, error: { message: 'Forbidden: not listing owner' } });
        }

        // 3. Delete photo record (and optionally delete file from storage)
        await pool.query('DELETE FROM listing_photos WHERE id = ?', [photoId]);

        // TODO: If using Cloudinary, also delete from Cloudinary using public_id
        // For local storage, could delete file from uploads directory

        res.status(200).json({ success: true, message: `Photo ${photoId} deleted` });
    } catch (err) {
        next(err);
    }
}

/**
 * Get all photos for a listing.
 * Public endpoint (no auth required) – used by listing detail page.
 */
export async function getListingPhotos(req, res, next) {
    const pool = getPool();
    try {
        const listingId = parseInt(req.params.listingId || req.params.id, 10);
        if (isNaN(listingId)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid listing ID' } });
        }

        // Verify listing exists and is not deleted
        const [listingRows] = await pool.query(
            'SELECT id FROM listings WHERE id = ? AND deleted_at IS NULL LIMIT 1',
            [listingId]
        );
        if (!listingRows || listingRows.length === 0) {
            return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
        }

        const [photoRows] = await pool.query(
            'SELECT id, url, public_id, created_at FROM listing_photos WHERE listing_id = ? ORDER BY created_at ASC',
            [listingId]
        );

        res.status(200).json({ success: true, data: photoRows });
    } catch (err) {
        next(err);
    }
}
