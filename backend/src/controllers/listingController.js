/**
 * Listing controller – implements CRUD operations for property listings.
 * Uses the shared MySQL connection pool from `app.js`.
 * All protected routes require JWT authentication (owner verification).
 */

import { pool } from '../app.js';

// Helper to validate required fields for create/update
function validateListingPayload(payload) {
    const required = ['title', 'description', 'location', 'price', 'property_type', 'bedrooms', 'bathrooms', 'square_feet'];
    const missing = required.filter((f) => !(f in payload));
    return missing;
}

export async function createListing(req, res, next) {
    try {
        const missing = validateListingPayload(req.body);
        if (missing.length) {
            return res.status(400).json({ success: false, error: { message: `Missing fields: ${missing.join(', ')}` } });
        }
        const { title, description, location, price, property_type, bedrooms, bathrooms, square_feet } = req.body;
        // Amenities can be sent as 'amenities' or 'amenities[]'
        let amenities = req.body.amenities || req.body['amenities[]'] || [];
        if (!Array.isArray(amenities)) {
            amenities = [amenities];
        }

        const landlord_id = req.user?.id;
        if (!landlord_id) {
            return res.status(401).json({ success: false, error: { message: 'Unauthenticated' } });
        }

        const [result] = await pool.query(
            'INSERT INTO listings (title, description, location, price, property_type, bedrooms, bathrooms, square_feet, landlord_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, location, price, property_type, bedrooms || null, bathrooms || null, square_feet || null, landlord_id]
        );

        const listingId = result.insertId;

        // Handle amenities
        if (amenities.length > 0) {
            for (const item of amenities) {
                let amenityId;
                // If it's not a number, it's a new amenity name
                if (isNaN(Number(item))) {
                    const [existing] = await pool.query('SELECT id FROM amenities WHERE name = ?', [item]);
                    if (existing.length > 0) {
                        amenityId = existing[0].id;
                    } else {
                        const [newAmen] = await pool.query('INSERT INTO amenities (name) VALUES (?)', [item]);
                        amenityId = newAmen.insertId;
                    }
                } else {
                    amenityId = Number(item);
                }
                await pool.query('INSERT INTO listing_amenities (listing_id, amenity_id) VALUES (?, ?)', [listingId, amenityId]);
            }
        }

        // Handle photos if any were uploaded
        if (req.files && req.files.length > 0) {
            const { cloudinary } = await import('../config/cloudinary.js');
            for (const file of req.files) {
                const uploadResult = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: `student-housing/listing-${listingId}` },
                        (err, res) => (err ? reject(err) : resolve(res))
                    );
                    stream.end(file.buffer);
                });
                await pool.query(
                    'INSERT INTO listing_photos (listing_id, url, public_id) VALUES (?, ?, ?)',
                    [listingId, uploadResult.secure_url, uploadResult.public_id]
                );
            }
        }

        res.status(201).json({ success: true, data: { id: listingId } });
    } catch (err) {
        next(err);
    }
}


export async function getListing(req, res, next) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT l.*, u.email as landlord_email 
             FROM listings l 
             JOIN users u ON l.landlord_id = u.id 
             WHERE l.id = ? AND l.deleted_at IS NULL AND l.flagged = false`,
            [id]
        );
        if (!rows.length) {
            return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
        }
        const listing = rows[0];
        // Fetch linked amenities
        const [amenRows] = await pool.query(
            `SELECT a.id, a.name FROM amenities a
             JOIN listing_amenities la ON a.id = la.amenity_id
             WHERE la.listing_id = ?`,
            [id]
        );
        listing.amenities = amenRows;

        // Fetch linked photos
        const [photoRows] = await pool.query(
            'SELECT id, url, public_id FROM listing_photos WHERE listing_id = ? ORDER BY created_at ASC',
            [id]
        );
        listing.photos = photoRows;

        res.status(200).json({ success: true, data: listing });
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
        // Allow partial updates for listing fields
        const fields = [];
        const values = [];
        const allowed = ['title', 'description', 'location', 'price', 'property_type'];
        for (const key of allowed) {
            if (key in req.body) {
                fields.push(`${key} = ?`);
                values.push(req.body[key]);
            }
        }
        const amenities = req.body.amenities;
        if (!fields.length && !amenities) {
            return res.status(400).json({ success: false, error: { message: 'No updatable fields provided' } });
        }
        if (fields.length) {
            values.push(id);
            await pool.query(`UPDATE listings SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, values);
        }
        // Update amenities if provided
        if (Array.isArray(amenities)) {
            // Remove existing links
            await pool.query('DELETE FROM listing_amenities WHERE listing_id = ?', [id]);
            if (amenities.length) {
                const [amenitiesId] = await pool.query('SELECT id FROM amenities WHERE name IN (?)', [amenities]);
                const amenitiesIdArray = amenitiesId.map(a => a.id);
                // Build values string for bulk insert
                const valuesPlaceholders = amenitiesIdArray.map(() => '(?, ?)').join(', ');
                const amenValues = [];
                for (const amenId of amenitiesIdArray) {
                    amenValues.push(id, amenId);
                }
                await pool.query(
                    `INSERT INTO listing_amenities (listing_id, amenity_id) VALUES ${valuesPlaceholders}`,
                    amenValues
                );
            }
        }
        res.status(200).json({ success: true, message: `Listing ${id} updated` });
    } catch (err) {
        next(err);
    }
}

export async function deleteListing(req, res, next) {
    // existing code remains unchanged
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

export async function updateStatus(req, res, next) {
    // existing implementation unchanged

    try {
        const { id } = req.params;
        const { status } = req.body;
        const allowedStatuses = ['available', 'rented', 'under_negotiation'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: { message: `Invalid status value. Must be one of: ${allowedStatuses.join(', ')}` },
            });
        }
        // Verify listing exists
        const [listingRows] = await pool.query(
            'SELECT * FROM listings WHERE id = ? AND deleted_at IS NULL',
            [id]
        );
        if (!listingRows.length) {
            return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
        }
        const listing = listingRows[0];
        const landlord_id = req.user?.id;
        if (Number(listing.landlord_id) !== Number(landlord_id)) {
            return res.status(403).json({ success: false, error: { message: 'Forbidden: not the owner' } });
        }
        // Update status
        await pool.query('UPDATE listings SET status = ? WHERE id = ? AND deleted_at IS NULL', [status, id]);
        // Return updated listing
        const [updatedRows] = await pool.query(
            'SELECT * FROM listings WHERE id = ? AND deleted_at IS NULL',
            [id]
        );
        return res.status(200).json({ success: true, data: updatedRows[0] });
    } catch (err) {
        next(err);
    }
}

export async function randomListings(req, res, next) {
    // existing implementation unchanged

    try {
        // Return a random selection of listings for public preview
        // Limit to 12 listings as per BE-08 recommendation
        const [rows] = await pool.query(
            'SELECT id, title, price, location, property_type FROM listings WHERE deleted_at IS NULL AND flagged = false ORDER BY RAND() LIMIT 12'
        );
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
}

export async function searchListings(req, res, next) {
    // Require authentication
    const landlord_id = req.user?.id;
    if (!landlord_id) {
        return res.status(401).json({ success: false, error: { message: 'Unauthenticated' } });
    }
    try {
        // Extract query parameters
        const {
            location,
            minPrice,
            maxPrice,
            property_type,
            amenities,
            status,
            sortBy,
            page = 1,
            limit = 20,
        } = req.query || {};
        const where = ['deleted_at IS NULL', 'flagged = false'];
        const params = [];
        if (location) {
            where.push('location = ?');
            params.push(location);
        }
        if (minPrice) {
            where.push('price >= ?');
            params.push(minPrice);
        }
        if (maxPrice) {
            where.push('price <= ?');
            params.push(maxPrice);
        }
        if (property_type) {
            where.push('property_type = ?');
            params.push(property_type);
        }
        if (status) {
            where.push('status = ?');
            params.push(status);
        }
        if (amenities) {
            const amenList = Array.isArray(amenities) ? amenities : String(amenities).split(',').map(a => a.trim()).filter(Boolean);
            if (amenList.length > 0) {
                where.push(`id IN (
                    SELECT la.listing_id 
                    FROM listing_amenities la 
                    JOIN amenities a ON la.amenity_id = a.id 
                    WHERE a.name IN (${amenList.map(() => '?').join(',')}) 
                    GROUP BY la.listing_id 
                    HAVING COUNT(DISTINCT a.id) = ?
                )`);
                params.push(...amenList, amenList.length);
            }
        }

        // Base query
        let query = `SELECT * FROM listings WHERE ${where.join(' AND ')}`;

        // Sorting
        const allowedSort = ['price', 'created_at', 'location'];
        const order = allowedSort.includes(sortBy) ? sortBy : 'created_at';
        query += ` ORDER BY ${order} DESC`;

        // Pagination
        const offset = (Number(page) - 1) * Number(limit);
        const countQuery = `SELECT COUNT(*) as total FROM listings WHERE ${where.join(' AND ')}`;
        const [countRows] = await pool.query(countQuery, params);
        const total = countRows[0].total;

        query += ' LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);
        const [rows] = await pool.query(query, params);

        // Fetch photos for each listing
        for (const listing of rows) {
            const [photoRows] = await pool.query(
                'SELECT id, url FROM listing_photos WHERE listing_id = ? ORDER BY created_at ASC',
                [listing.id]
            );
            listing.photos = photoRows;
        }

        return res.status(200).json({
            success: true,
            data: {
                listings: rows,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (err) {
        next(err);
    }
}

export async function getLandlordDashboard(req, res, next) {
    try {
        const landlordId = req.user?.id;
        if (!landlordId) return res.status(401).json({ success: false, error: { message: 'Unauthenticated' } });

        // Stats
        const [[{ total_listings }]] = await pool.query('SELECT COUNT(*) AS total_listings FROM listings WHERE landlord_id = ? AND deleted_at IS NULL', [landlordId]);
        const [[{ active_listings }]] = await pool.query("SELECT COUNT(*) AS active_listings FROM listings WHERE landlord_id = ? AND status = 'available' AND deleted_at IS NULL", [landlordId]);
        const [[{ rented_listings }]] = await pool.query("SELECT COUNT(*) AS rented_listings FROM listings WHERE landlord_id = ? AND status = 'rented' AND deleted_at IS NULL", [landlordId]);
        const [[{ total_contacts }]] = await pool.query('SELECT COUNT(*) AS total_contacts FROM conversations WHERE landlord_id = ?', [landlordId]);

        
        // Listings
        const [listings] = await pool.query(
            'SELECT * FROM listings WHERE landlord_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
            [landlordId]
        );

        // Fetch photos for each listing
        for (const listing of listings) {
            const [photoRows] = await pool.query(
                'SELECT id, url FROM listing_photos WHERE listing_id = ? ORDER BY created_at ASC',
                [listing.id]
            );
            listing.photos = photoRows;
        }

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    total_listings,
                    active_listings,
                    rented_listings,
                    total_views: 0, // Stub for now
                    total_contacts
                },

                listings
            }
        });
    } catch (err) {
        next(err);
    }
}

export async function getStudentDashboard(req, res, next) {
    try {
        const studentId = req.user?.id;
        if (!studentId) return res.status(401).json({ success: false, error: { message: 'Unauthenticated' } });

        // Stats
        const [[{ total_reviews }]] = await pool.query('SELECT COUNT(*) AS total_reviews FROM reviews WHERE student_id = ?', [studentId]);
        const [[{ contact_requests }]] = await pool.query('SELECT COUNT(*) AS contact_requests FROM conversations WHERE student_id = ?', [studentId]);

        // Recent reviews
        const [reviews] = await pool.query(
            `SELECT r.*, l.title as listing_title
             FROM reviews r
             JOIN listings l ON r.listing_id = l.id
             WHERE r.student_id = ?
             ORDER BY r.created_at DESC`,
            [studentId]
        );

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    total_reviews,
                    contact_requests
                },
                reviews
            }
        });
    } catch (err) {
        next(err);
    }
}

