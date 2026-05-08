// Rental controller – implements rental record creation (BE-10)

import { pool } from '../app.js';

export async function createRental(req, res, next) {
  try {
    const { student_id, student_email, listing_id, start_date, end_date } = req.body;
    // Validate required fields
    const missing = [];
    if (!student_id && !student_email) missing.push('student_id or student_email');
    if (!listing_id) missing.push('listing_id');
    if (!start_date) missing.push('start_date');
    if (missing.length) {
      return res.status(400).json({ success: false, error: { message: `Missing fields: ${missing.join(', ')}` } });
    }

    let targetStudentId = student_id;

    // If email provided, find the student ID
    if (!targetStudentId && student_email) {
      const [userRows] = await pool.query('SELECT id, role FROM users WHERE email = ?', [student_email]);
      if (!userRows.length) {
        return res.status(404).json({ success: false, error: { message: 'Student with this email not found' } });
      }
      if (userRows[0].role !== 'student') {
        return res.status(400).json({ success: false, error: { message: 'The provided email belongs to a non-student account' } });
      }
      targetStudentId = userRows[0].id;
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
        [targetStudentId, landlordId, listing_id, start_date, end_date]
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

export async function getLandlordRentals(req, res, next) {
  try {
    const landlordId = req.user?.id;
    if (!landlordId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthenticated' } });
    }

    const [rows] = await pool.query(
      `SELECT 
        r.id, 
        r.start_date, 
        r.end_date, 
        r.created_at, 
        u.email as student_email, 
        up.full_name as student_name, 
        l.title as listing_title,
        l.id as listing_id
      FROM rentals r
      JOIN users u ON r.student_id = u.id
      LEFT JOIN user_profiles up ON r.student_id = up.user_id
      JOIN listings l ON r.listing_id = l.id
      WHERE r.landlord_id = ?
      ORDER BY r.created_at DESC`,
      [landlordId]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

