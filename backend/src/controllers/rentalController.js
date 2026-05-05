// Rental controller – implements rental record creation (BE-10)

import { pool } from '../app.js';

export async function createRental(req, res, next) {
  try {
    const { student_id, listing_id, start_date, end_date } = req.body;
    // Validate required fields
    const missing = [];
    if (!student_id) missing.push('student_id');
    if (!listing_id) missing.push('listing_id');
    if (!start_date) missing.push('start_date');
    if (missing.length) {
      return res.status(400).json({ success: false, error: { message: `Missing fields: ${missing.join(', ')}` } });
    }
    // Ensure authenticated user
    const requester = req.user;
    if (!requester) {
      return res.status(401).json({ success: false, error: { message: 'Unauthenticated' } });
    }
    // Verify requester role
    const allowedRoles = ['landlord', 'admin'];
    if (!allowedRoles.includes(requester.role)) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden: insufficient role' } });
    }
    // Fetch listing to verify ownership and existence
    const [listingRows] = await pool.query('SELECT landlord_id FROM listings WHERE id = ? AND deleted_at IS NULL', [listing_id]);
    if (!listingRows.length) {
      return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
    }
    const landlordId = listingRows[0].landlord_id;
    // If requester is landlord, ensure they own the listing
    if (requester.role === 'landlord' && Number(requester.id) !== Number(landlordId)) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden: not the owner of the listing' } });
    }
    // Perform transaction: insert rental and update listing status
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rentalResult] = await conn.query(
        'INSERT INTO rentals (student_id, landlord_id, listing_id, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
        [student_id, landlordId, listing_id, start_date, end_date]
      );
      await conn.query('UPDATE listings SET status = ? WHERE id = ?', ['rented', listing_id]);
      await conn.commit();
      const rentalId = rentalResult.insertId;
      return res.status(201).json({ success: true, data: { id: rentalId } });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
}
