/**
 * Listing controller – implements CRUD operations for property listings.
 * Uses the shared MySQL connection pool from `app.js`.
 * All protected routes require JWT authentication (owner verification).
 */

import { pool } from '../app.js';

// Helper to validate required fields for create/update
function validateListingPayload(payload) {
    const required = ['title', 'description', 'location', 'price', 'property_type'];
    const missing = required.filter((f) => !(f in payload));
    return missing;
}

export async function createListing(req, res, next) {
    try {
        const missing = validateListingPayload(req.body);
        if (missing.length) {
            return res.status(400).json({ success: false, error: { message: `Missing fields: ${missing.join(', ')}` } });
        }
        const { title, description, location, price, property_type, amenities = [] } = req.body;
        const landlord_id = req.user?.id;
        if (!landlord_id) {
            return res.status(401).json({ success: false, error: { message: 'Unauthenticated' } });
        }
        // Insert listing
        const [result] = await pool.query(
            'INSERT INTO listings (title, description, location, price, property_type, landlord_id) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, location, price, property_type, landlord_id]
        );
        const listingId = result.insertId;
        // TODO: Insert amenities linking if needed (omitted for brevity)
        res.status(201).json({ success: true, data: { id: listingId } });
    } catch (err) {
        next(err);
    }
}

export async function getListing(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            'SELECT * FROM listings WHERE id = ? AND deleted_at IS NULL',
            [id]
        );
        if (!rows.length) {
            return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

export async function updateListing(req, res, next) {
    try {
        const { id } = req.params;
        const landlord_id = req.user?.id;
        // Verify ownership
        const [ownerRows] = await pool.query('SELECT landlord_id FROM listings WHERE id = ? AND deleted_at IS NULL', [id]);
        if (!ownerRows.length) {
            return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
        }
        if (Number(ownerRows[0].landlord_id) !== Number(landlord_id)) {
            return res.status(403).json({ success: false, error: { message: 'Forbidden: not the owner' } });
        }
        // Allow partial updates
        const fields = [];
        const values = [];
        const allowed = ['title', 'description', 'location', 'price', 'property_type'];
        for (const key of allowed) {
            if (key in req.body) {
                fields.push(`${key} = ?`);
                values.push(req.body[key]);
            }
        }
        if (!fields.length) {
            return res.status(400).json({ success: false, error: { message: 'No updatable fields provided' } });
        }
        values.push(id);
        await pool.query(`UPDATE listings SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, values);
        res.status(200).json({ success: true, message: `Listing ${id} updated` });
    } catch (err) {
        next(err);
    }
}

export async function deleteListing(req, res, next) {
    try {
        const { id } = req.params;
        const landlord_id = req.user?.id;
        // Verify ownership
        const [ownerRows] = await pool.query('SELECT landlord_id FROM listings WHERE id = ? AND deleted_at IS NULL', [id]);
        if (!ownerRows.length) {
            return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
        }
        if (Number(ownerRows[0].landlord_id) !== Number(landlord_id)) {
            return res.status(403).json({ success: false, error: { message: 'Forbidden: not the owner' } });
        }
        const [result] = await pool.query('UPDATE listings SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL', [id]);
        if (!result.affectedRows) {
            return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
        }
        res.status(200).json({ success: true, message: `Listing ${id} deleted` });
    } catch (err) {
        next(err);
    }
}

export async function listAll(req, res, next) {
    try {
        const [rows] = await pool.query('SELECT * FROM listings WHERE deleted_at IS NULL');
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
}
