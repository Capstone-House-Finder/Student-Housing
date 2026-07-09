import express from 'express';
import * as listingController from '../controllers/listingController.js';
import * as reviewController from '../controllers/reviewController.js';
import * as photoController from '../controllers/photoController.js';
import * as contactController from '../controllers/contactController.js';
import { authenticate } from '../middleware/auth.js';
import { requireVerifiedEmail } from '../middleware/verifyEmail.js';
import { upload } from '../config/uploads.js';

const router = express.Router();

// Public route – list all listings (could add filters later)
router.get('/', listingController.randomListings);
router.get('/search', authenticate, requireVerifiedEmail, listingController.searchListings);
router.get('/student-dashboard', authenticate, requireVerifiedEmail, listingController.getStudentDashboard);
router.get('/landlord-dashboard', authenticate, requireVerifiedEmail, listingController.getLandlordDashboard);

// Protected routes – require JWT and verified email
router.post('/', authenticate, requireVerifiedEmail, listingController.createListing);
// Review endpoint for students to submit a review
router.post('/:id/reviews', authenticate, requireVerifiedEmail, reviewController.createReview);
router.get('/:id', authenticate, requireVerifiedEmail, listingController.getListing);
router.patch('/:id', authenticate, requireVerifiedEmail, listingController.updateListing);
router.patch('/:id/status', authenticate, requireVerifiedEmail, listingController.updateStatus);
router.delete('/:id', authenticate, requireVerifiedEmail, listingController.deleteListing);

// Photo routes9
router.post('/:id/photos', authenticate, requireVerifiedEmail, upload.array('photos', 10), photoController.uploadPhotos);
// Contact endpoint – student initiates contact with landlord
router.post('/:id/contact', authenticate, requireVerifiedEmail, contactController.contactListing);
router.get('/:id/photos', authenticate, requireVerifiedEmail, photoController.getListingPhotos);
router.delete('/photos/:photoId', authenticate, requireVerifiedEmail, photoController.deletePhoto);

export default router;
