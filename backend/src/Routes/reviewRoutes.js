import express from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';
import { requireVerifiedEmail } from '../middleware/verifyEmail.js';
import { admin } from '../middleware/admin.js';

const router = express.Router();

// Landlord reply to a review (one reply per review)
router.post('/:reviewId/reply', authenticate, requireVerifiedEmail, reviewController.replyReview);

// Admin review moderation
router.get('/admin', authenticate, admin, reviewController.getAllReviews);
router.patch('/admin/:id/status', authenticate, admin, reviewController.updateReviewStatus);

export default router;
