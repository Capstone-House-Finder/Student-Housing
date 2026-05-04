/**
 * Photo controller – stub implementations for image upload/management.
 */

export async function uploadPhotos(req, res, next) {
    try {
        // TODO: Use multer middleware, then store photo URLs in DB
        res.status(201).json({ success: true, message: 'Photos uploaded (stub)' });
    } catch (err) {
        next(err);
    }
}

export async function deletePhoto(req, res, next) {
    try {
        const { id } = req.params;
        // TODO: Remove photo record and file
        res.status(200).json({ success: true, message: `Photo ${id} deleted (stub)` });
    } catch (err) {
        next(err);
    }
}

export async function getListingPhotos(req, res, next) {
    try {
        // TODO: Implement - req.params.listingId available
        // TODO: Query photos for a listing
        res.status(200).json({ success: true, data: [] });
    } catch (err) {
        next(err);
    }
}
