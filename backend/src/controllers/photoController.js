// Photo controller – handles image upload/management for listings (BE-05)
import { getDatabasePool } from '../config/database.js';
import { cloudinary } from '../config/cloudinary.js';

// Lazy‑load the pool – keeps tests simple via mocks on getDatabasePool().
let _pool = null;
function pool() {
  if (!_pool) _pool = getDatabasePool();
  return _pool;
}

const MAX_PHOTOS = 10;

/**
 * POST /api/listings/:id/photos
 * Upload one or more photos for a listing (multer provides req.files array).
 * Requires listing owner auth (JWT).
 * Streams each file to Cloudinary then stores URL + public_id in DB.
 */
export async function uploadPhotos(req, res, next) {
  try {
    const listingId = Number(req.params.id);
    if (!Number.isInteger(listingId)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid listing ID' } });
    }

    // Verify listing exists and get owner.
    const [[listing]] = await pool().query(
      'SELECT landlord_id FROM listings WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [listingId]
    );
    if (!listing) {
      return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
    }
    if (!req.user || req.user.id !== listing.landlord_id) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden: not listing owner' } });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'No photos uploaded' } });
    }

    // Enforce max photos per listing.
    const [[{ count: existing }]] = await pool().query(
      'SELECT COUNT(*) as count FROM listing_photos WHERE listing_id = ?',
      [listingId]
    );
    if (existing + req.files.length > MAX_PHOTOS) {
      return res.status(400).json({
        success: false,
        error: { message: `Max ${MAX_PHOTOS} photos per listing. Currently have ${existing}.` },
      });
    }

    // Upload files to Cloudinary and save records.
    const uploaded = [];
    for (const file of req.files) {
      if (!file.buffer || file.buffer.length === 0) continue;
      try {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'auto',
              folder: `student-housing/listing-${listingId}`,
              quality: 'auto',
              fetch_format: 'auto',
            },
            (err, res) => (err ? reject(err) : resolve(res))
          );
          stream.end(file.buffer);
        });

        const { secure_url, public_id } = result;
        const [{ insertId }] = await pool().query(
          'INSERT INTO listing_photos (listing_id, url, public_id) VALUES (?, ?, ?)',
          [listingId, secure_url, public_id]
        );
        uploaded.push({ id: insertId, url: secure_url, public_id });
      } catch (err) {
        console.error('Cloudinary upload failed:', err);
        // Continue with next file instead of failing entire request.
      }
    }

    if (uploaded.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'Failed to upload any photos. Please try again.' } });
    }

    return res.status(201).json({
      success: true,
      data: { listing_id: listingId, photos: uploaded },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/listings/:id/photos/:photoId
 * Delete a photo. Only listing owner may delete.
 * Deletes from Cloudinary (if public_id exists) then from DB.
 */
export async function deletePhoto(req, res, next) {
  try {
    const photoId = Number(req.params.photoId);
    if (!Number.isInteger(photoId)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid photo ID' } });
    }

    // Fetch photo and listing owner.
    const [[photo]] = await pool().query(
      `SELECT lp.id, lp.listing_id, lp.public_id, l.landlord_id
       FROM listing_photos lp
       JOIN listings l ON lp.listing_id = l.id
       WHERE lp.id = ? AND l.deleted_at IS NULL LIMIT 1`,
      [photoId]
    );
    if (!photo) {
      return res.status(404).json({ success: false, error: { message: 'Photo not found' } });
    }
    if (!req.user || req.user.id !== photo.landlord_id) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden: not listing owner' } });
    }

    if (photo.public_id) {
      try {
        await cloudinary.uploader.destroy(photo.public_id);
      } catch (err) {
        console.error('Cloudinary destroy failed:', err);
      }
    }

    await pool().query('DELETE FROM listing_photos WHERE id = ?', [photoId]);
    return res.status(200).json({ success: true, message: `Photo ${photoId} deleted` });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/listings/:id/photos
 * Public endpoint – returns photos for a listing.
 */
export async function getListingPhotos(req, res, next) {
  try {
    const listingId = Number(req.params.listingId || req.params.id);
    if (!Number.isInteger(listingId)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid listing ID' } });
    }

    const [[listing]] = await pool().query(
      'SELECT id FROM listings WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [listingId]
    );
    if (!listing) {
      return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
    }

    const [photos] = await pool().query(
      'SELECT id, url, public_id, created_at FROM listing_photos WHERE listing_id = ? ORDER BY created_at ASC',
      [listingId]
    );

    return res.status(200).json({ success: true, data: photos });
  } catch (err) {
    next(err);
  }
}
