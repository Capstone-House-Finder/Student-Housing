import express from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';
import { requireVerifiedEmail } from '../middleware/verifyEmail.js';

const router = express.Router();

// Landlord reply to a review (one reply per review)
router.post('/:reviewId/reply', authenticate, requireVerifiedEmail, reviewController.replyReview);

export default router;
