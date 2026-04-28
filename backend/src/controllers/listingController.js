/**
 * Listing controller – stub implementations for CRUD operations.
 * Each function returns a simple JSON response to confirm the route works.
 * Real business logic should be added later.
 */

export async function createListing(req, res, next) {
    try {
        // TODO: Insert listing into DB using `pool`
        res.status(201).json({ success: true, message: 'Listing created (stub)' });
    } catch (err) {
        next(err);
    }
}

export async function getListing(req, res, next) {
    try {
        const { id } = req.params;
        // TODO: Query DB for listing by id
        res.status(200).json({ success: true, data: { id, placeholder: true } });
    } catch (err) {
        next(err);
    }
}

export async function updateListing(req, res, next) {
    try {
        const { id } = req.params;
        // TODO: Update listing in DB
        res.status(200).json({ success: true, message: `Listing ${id} updated (stub)` });
    } catch (err) {
        next(err);
    }
}

export async function deleteListing(req, res, next) {
    try {
        const { id } = req.params;
        // TODO: Delete listing from DB
        res.status(200).json({ success: true, message: `Listing ${id} deleted (stub)` });
    } catch (err) {
        next(err);
    }
}

export async function listAll(req, res, next) {
    try {
        // TODO: Return all listings
        res.status(200).json({ success: true, data: [] });
    } catch (err) {
        next(err);
    }
}
