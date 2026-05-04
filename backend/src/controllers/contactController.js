// Contact controller – implements student contacting landlord for a listing (BE-09)

import { pool } from '../app.js';

export async function contactListing(req, res, next) {
  try {
    // Ensure authenticated student
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthenticated' } });
    }
    // Only students can initiate contact (optional: enforce role)
    // const userRole = req.user?.role;
    // if (userRole !== 'student') {
    //   return res.status(403).json({ success: false, error: { message: 'Only students may contact landlords' } });
    // }

    const listingId = req.params.id;
    // Verify listing exists and fetch landlord_id
    const [listingRows] = await pool.query(
      'SELECT landlord_id FROM listings WHERE id = ? AND deleted_at IS NULL',
      [listingId]
    );
    if (!listingRows.length) {
      return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
    }
    const landlordId = listingRows[0].landlord_id;

    // Check if conversation already exists (unique per student/listing)
    const [existing] = await pool.query(
      'SELECT id FROM conversations WHERE student_id = ? AND listing_id = ?',
      [studentId, listingId]
    );
    if (existing.length) {
      // Conversation already exists – return existing id
      return res.status(200).json({ success: true, data: { conversationId: existing[0].id } });
    }

    // Create new conversation
    const [{ insertId }] = await pool.query(
      'INSERT INTO conversations (student_id, landlord_id, listing_id) VALUES (?, ?, ?)',
      [studentId, landlordId, listingId]
    );

    // Optionally trigger notification to landlord (out of scope)
    return res.status(201).json({ success: true, data: { conversationId: insertId } });
  } catch (err) {
    next(err);
  }
}
