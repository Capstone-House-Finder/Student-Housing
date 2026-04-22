// controllers/listingController.js
import { getConnection, query, execute } from '../config/db.js'; 
import multer, { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';


// POST /api/listings
const createListing = async (req, res) => {
  const landlord_id = req.user.id; // from JWT middleware
  const { title, description, location, price, property_type, amenity_ids } = req.body;

  // Basic validation
  if (!title || !description || !location || !price || !property_type) {
    return res.status(400).json({ message: 'All required fields must be provided.' });
  }

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // Insert listing
    const [result] = await conn.execute(
      `INSERT INTO listings (landlord_id, title, description, location, price, property_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [landlord_id, title, description, location, price, property_type]
    );
    const listingId = result.insertId;

    // Insert amenities if provided
    if (amenity_ids && amenity_ids.length > 0) {
      const amenityValues = amenity_ids.map((aid) => [listingId, aid]);
      await conn.query(
        `INSERT INTO listing_amenities (listing_id, amenity_id) VALUES ?`,
        [amenityValues]
      );
    }

    await conn.commit();
    return res.status(201).json({ message: 'Listing created successfully.', listingId });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    return res.status(500).json({ message: 'Failed to create listing.' });
  } finally {
    conn.release();
  }
};

// POST /api/listings/:id/photos
// POST /api/listings/:id/photos
const uploadPhotos = async (req, res) => {
  const { id } = req.params;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No photos uploaded.' });
  }

  try {
    // Map the local file info to your database schema
    // url: will now be the path used to access the file via your API
    // public_id: we can store the filename here for easy deletion later
    const photoValues = req.files.map((file) => [
      id, 
      `/uploads/${file.filename}`, // The path the frontend will use
      file.filename                // Keeping filename as the unique identifier
    ]);

    await query(
      `INSERT INTO listing_photos (listing_id, url, public_id) VALUES ?`,
      [photoValues]
    );

    return res.status(201).json({ message: 'Photos uploaded to local folder successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to save photo records to database.' });
  }
};

// GET /api/listings/:id
const getListing = async (req, res) => {
  const { id } = req.params;

  try {
    const [listings] = await execute(`SELECT * FROM listings WHERE id = ?`, [id]);
    if (listings.length === 0) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    const listing = listings[0];

    const [amenities] = await execute(
      `SELECT a.id, a.name FROM amenities a
       JOIN listing_amenities la ON a.id = la.amenity_id
       WHERE la.listing_id = ?`,
      [id]
    );

    const [photos] = await execute(
      `SELECT id, url FROM listing_photos WHERE listing_id = ?`,
      [id]
    );

    return res.status(200).json({ ...listing, amenities, photos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch listing.' });
  }
};

export default { createListing, uploadPhotos, getListing };