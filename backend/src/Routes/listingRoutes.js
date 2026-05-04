import express from 'express';
import * as listingController from '../controllers/listingController.js';
import * as photoController from '../controllers/photoController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../config/uploads.js';

const router = express.Router();

// Public route – list all listings (could add filters later)
router.get('/', listingController.listAll);

// Protected routes – require JWT
router.post('/', authenticate, listingController.createListing);
router.get('/:id', listingController.getListing);
router.patch('/:id', authenticate, listingController.updateListing);
router.patch('/:id/status', authenticate, listingController.updateStatus);
router.delete('/:id', authenticate, listingController.deleteListing);

// Photo routes
router.post('/:id/photos', authenticate, upload.array('photos', 10), photoController.uploadPhotos);
router.get('/:id/photos', photoController.getListingPhotos);
router.delete('/photos/:photoId', authenticate, photoController.deletePhoto);

export default router;
