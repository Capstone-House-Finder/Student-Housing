// Contact controller – implements student contacting landlord for a listing (BE-09)

import { pool } from '../app.js';
import { URL, URLSearchParams } from 'url';

export async function contactListing(req, res, next) {
  // Note: WhatsApp integration (sending a message) is not performed here. The endpoint only creates the conversation and returns a Click‑to‑Chat URL.

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
    // Insert new conversation and extract insertId handling different mock shapes
    const insertResult = await pool.query(
      'INSERT INTO conversations (student_id, landlord_id, listing_id) VALUES (?, ?, ?)',
      [studentId, landlordId, listingId]
    );
    let conversationId;
    if (Array.isArray(insertResult) && insertResult[0] && typeof insertResult[0] === 'object' && 'insertId' in insertResult[0]) {
      // Shape: [{ insertId: 99 }]
      conversationId = insertResult[0].insertId;
    } else if (Array.isArray(insertResult) && Array.isArray(insertResult[0]) && insertResult[0][0] && typeof insertResult[0][0] === 'object' && 'insertId' in insertResult[0][0]) {
      // Shape: [[{ insertId: 99 }]]
      conversationId = insertResult[0][0].insertId;
    }
    // Build WhatsApp URL to send to frontend
    let whatsappUrl = null;

    const [studentProfileRows] = await pool.query(
        'SELECT full_name, phone FROM user_profiles WHERE user_id = ?',
        [studentId]
      );
      const [landlordProfileRows] = await pool.query(
        'SELECT phone FROM user_profiles WHERE user_id = ?',
        [landlordId]
      );
      const studentFullName = studentProfileRows[0]?.full_name || 'Student';
      const studentPhone = studentProfileRows[0]?.phone || '';
      const landlordPhone = landlordProfileRows[0]?.phone;
      
      // Build the same message used for notification
      const message = `New inquiry for listing ${listingId}: ${studentFullName}${studentPhone ? ' (Phone: ' + studentPhone + ')' : ''} wants to contact you.`;
      if (landlordPhone) {
        const base = `https://wa.me/${landlordPhone}`;
        const url = new URL(base);
        url.search = new URLSearchParams({ text: message }).toString();
        whatsappUrl = url.toString();
      }
    
    // Respond with conversation ID and WhatsApp URL (if generated)
    return res.status(201).json({ success: true, data: { conversationId, whatsappUrl } });
  } catch (err) {
    next(err);
  }
}
