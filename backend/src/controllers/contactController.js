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
    // Verify listing exists and fetch landlord_id and listing info
    const [listingRows] = await pool.query(
      'SELECT landlord_id, title, location FROM listings WHERE id = ? AND deleted_at IS NULL',
      [listingId]
    );
    if (!listingRows.length) {
      return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
    }
    const { landlord_id: landlordId, title: listingTitle, location: listingLocation } = listingRows[0];

    // Build WhatsApp URL to send to frontend
    let whatsappUrl = null;

    const [studentRows] = await pool.query(
      'SELECT u.email, up.full_name FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.id = ?',
      [studentId]
    );

    const [landlordDataRows] = await pool.query(
      'SELECT u.email, up.phone FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.id = ?',
      [landlordId]
    );

    const studentEmail = studentRows[0]?.email || '';
    const studentFullName = studentRows[0]?.full_name || 'Student';
    const landlordEmail = landlordDataRows[0]?.email;
    const landlordPhone = landlordDataRows[0]?.phone;

    // New Inquiry Template
    const message = `Title: Listing Inquiry\nFrom: ${studentEmail}\n\nGreetings.\n\tI am ${studentFullName}, and I am interested by your property ${listingTitle} located at ${listingLocation}. I would really appreciate if we could discuss about it via this channel.`;

    if (landlordPhone) {
      const base = `https://wa.me/${landlordPhone}`;
      const url = new URL(base);
      url.search = new URLSearchParams({ text: message }).toString();
      whatsappUrl = url.toString();
    }

    // Send email notification to landlord
    const { sendEmail } = await import('../config/email.js');
    await sendEmail({
      to: landlordEmail,
      subject: `New Inquiry for ${listingTitle}`,
      text: message,
      html: `<div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #0d6efd;">Listing Inquiry</h2>
        <p>Greetings.</p>
        <p>I am <strong>${studentFullName}</strong>, and I am interested in your property <strong>${listingTitle}</strong> located at <strong>${listingLocation}</strong>.</p>
        <p>I would really appreciate if we could discuss about it via WhatsApp: <a href="${whatsappUrl}">${whatsappUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated notification from Student Housing Platform.</p>
      </div>`
    }).catch(err => console.error('Failed to send contact email:', err));


    // Check if conversation already exists (unique per student/listing)
    const [existing] = await pool.query(
      'SELECT id FROM conversations WHERE student_id = ? AND listing_id = ?',
      [studentId, listingId]
    );

    if (existing.length) {
      // Conversation already exists – return existing id and the generated whatsappUrl
      return res.status(200).json({ success: true, data: { conversationId: existing[0].id, whatsappUrl } });
    }

    // Create new conversation
    const insertResult = await pool.query(
      'INSERT INTO conversations (student_id, landlord_id, listing_id) VALUES (?, ?, ?)',
      [studentId, landlordId, listingId]
    );
    let conversationId;
    if (Array.isArray(insertResult) && insertResult[0] && typeof insertResult[0] === 'object' && 'insertId' in insertResult[0]) {
      conversationId = insertResult[0].insertId;
    } else if (Array.isArray(insertResult) && Array.isArray(insertResult[0]) && insertResult[0][0] && typeof insertResult[0][0] === 'object' && 'insertId' in insertResult[0][0]) {
      conversationId = insertResult[0][0].insertId;
    }

    // Respond with conversation ID and WhatsApp URL
    return res.status(201).json({ success: true, data: { conversationId, whatsappUrl } });
  } catch (err) {
    next(err);
  }
}

export async function getLandlordContacts(req, res, next) {
  try {
    const landlordId = req.user?.id;
    if (!landlordId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthenticated' } });
    }

    const [rows] = await pool.query(
      `SELECT 
        c.id, 
        c.created_at, 
        u.email as student_email, 
        up.full_name as student_name, 
        l.title as listing_title,
        l.id as listing_id
      FROM conversations c
      JOIN users u ON c.student_id = u.id
      LEFT JOIN user_profiles up ON c.student_id = up.user_id
      JOIN listings l ON c.listing_id = l.id
      WHERE c.landlord_id = ?
      ORDER BY c.created_at DESC`,
      [landlordId]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

