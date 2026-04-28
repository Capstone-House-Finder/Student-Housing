/**
 * Amenity controller – stub implementations.
 */

export async function listAmenities(req, res, next) {
    try {
        res.status(200).json({ success: true, data: [] });
    } catch (err) {
        next(err);
    }
}

export async function createAmenity(req, res, next) {
    try {
        res.status(201).json({ success: true, message: 'Amenity created (stub)' });
    } catch (err) {
        next(err);
    }
}

export async function updateAmenity(req, res, next) {
    try {
        const { id } = req.params;
        res.status(200).json({ success: true, message: `Amenity ${id} updated (stub)` });
    } catch (err) {
        next(err);
    }
}

export async function deleteAmenity(req, res, next) {
    try {
        const { id } = req.params;
        res.status(200).json({ success: true, message: `Amenity ${id} deleted (stub)` });
    } catch (err) {
        next(err);
    }
}
