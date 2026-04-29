import express from 'express';
import * as listingController from '../controllers/listingController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public route – list all listings (could add filters later)
router.get('/', listingController.listAll);

// Protected routes – require JWT
router.post('/', authenticate, listingController.createListing);
router.get('/:id', listingController.getListing);
router.patch('/:id', authenticate, listingController.updateListing);
router.delete('/:id', authenticate, listingController.deleteListing);

export default router;
