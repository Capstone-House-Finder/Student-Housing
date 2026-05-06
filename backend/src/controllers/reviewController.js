/**
 * Review controller – implements review and rating endpoints (BE-11).
 * Provides two main operations:
 *   1. createReview – for a student to submit a review for a listing they have a confirmed rental for.
 *   2. replyReview – for a landlord to reply once to a specific review.
 */

import { pool } from '../app.js';

/**
 * POST /api/listings/:id/reviews
 * Allows a student with a confirmed rental to submit a rating (1‑5) and optional comment.
 */
export async function createReview(req, res, next) {
  try {
    const { id: listingId } = req.params;
    const { rating, comment = '' } = req.body;
    const student = req.user; // Authenticated user assumed to be a student

    if (!student) {
      return res.status(401).json({ success: false, error: { message: 'Unauthenticated' } });
    }

    // Verify rating is present and within 1‑5 range
    const ratingNum = Number(rating);
    if (!rating || Number.isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        error: { message: 'Rating is required and must be an integer between 1 and 5' },
      });
    }

    // Verify the student has a confirmed rental for this listing
    const [rentalRows] = await pool.query(
      'SELECT id FROM rentals WHERE student_id = ? AND listing_id = ? LIMIT 1',
      [student.id, listingId]
    );
    if (!rentalRows.length) {
      return res.status(403).json({
        success: false,
        error: { message: 'Student does not have a confirmed rental for this listing' },
      });
    }

    // Insert the review
    const [result] = await pool.query(
      'INSERT INTO reviews (listing_id, student_id, rating, comment) VALUES (?, ?, ?, ?)',
      [listingId, student.id, ratingNum, comment]
    );
    const reviewId = result.insertId;
    return res.status(201).json({ success: true, data: { id: reviewId } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/reviews/:reviewId/reply
 * Allows a landlord to reply once to a review.
 */
export async function replyReview(req, res, next) {
  try {
    const { reviewId } = req.params;
    const { reply } = req.body;
    const landlord = req.user; // Authenticated user assumed to be a landlord

    if (!landlord) {
      return res.status(401).json({ success: false, error: { message: 'Unauthenticated' } });
    }

    if (!reply) {
      return res.status(400).json({
        success: false,
        error: { message: 'Reply content is required' },
      });
    }

    // Fetch the review to determine the associated listing and its landlord
    const [reviewRows] = await pool.query(
      'SELECT listing_id FROM reviews WHERE id = ? LIMIT 1',
      [reviewId]
    );
    if (!reviewRows.length) {
      return res.status(404).json({ success: false, error: { message: 'Review not found' } });
    }
    const listingId = reviewRows[0].listing_id;

    // Verify the requester is the landlord of the listing
    const [listingRows] = await pool.query(
      'SELECT landlord_id FROM listings WHERE id = ? AND deleted_at IS NULL',
      [listingId]
    );
    if (!listingRows.length) {
      return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
    }
    if (Number(listingRows[0].landlord_id) !== Number(landlord.id)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Forbidden: only the owning landlord can reply' },
      });
    }

    // Ensure a reply does not already exist for this review
    const [existingReply] = await pool.query(
      'SELECT id FROM review_replies WHERE review_id = ? LIMIT 1',
      [reviewId]
    );
    if (existingReply.length) {
      return res.status(403).json({
        success: false,
        error: { message: 'A reply has already been posted for this review' },
      });
    }

    // Insert the reply
    const [result] = await pool.query(
      'INSERT INTO review_replies (review_id, landlord_id, reply) VALUES (?, ?, ?)',
      [reviewId, landlord.id, reply]
    );
    const replyId = result.insertId;
    return res.status(201).json({ success: true, data: { id: replyId } });
  } catch (err) {
    next(err);
  }
}
