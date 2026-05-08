import express from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Landlord reply to a review (one reply per review)
router.post('/:reviewId/reply', authenticate, reviewController.replyReview);

export default router;
