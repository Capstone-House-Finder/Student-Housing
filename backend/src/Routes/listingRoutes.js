import express from 'express';
import * as listingController from '../controllers/listingController.js';
import * as reviewController from '../controllers/reviewController.js';
import * as photoController from '../controllers/photoController.js';
import * as contactController from '../controllers/contactController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../config/uploads.js';

const router = express.Router();

// Public route – list all listings (could add filters later)
router.get('/', listingController.randomListings);
router.get('/search', authenticate, listingController.searchListings);

// Protected routes – require JWT
router.post('/', authenticate, listingController.createListing);
// Review endpoint for students to submit a review
router.post('/:id/reviews', authenticate, reviewController.createReview);
router.get('/:id', authenticate, listingController.getListing);
router.patch('/:id', authenticate, listingController.updateListing);
router.patch('/:id/status', authenticate, listingController.updateStatus);
router.delete('/:id', authenticate, listingController.deleteListing);

// Photo routes
router.post('/:id/photos', authenticate, upload.array('photos', 10), photoController.uploadPhotos);
// Contact endpoint – student initiates contact with landlord
router.post('/:id/contact', authenticate, contactController.contactListing);
router.get('/:id/photos', authenticate, photoController.getListingPhotos);
router.delete('/photos/:photoId', authenticate, photoController.deletePhoto);

export default router;
