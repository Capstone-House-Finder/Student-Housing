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
router.put('/:id', authenticate, listingController.updateListing);
router.delete('/:id', authenticate, listingController.deleteListing);

// Photo upload routes – require JWT and multer middleware
router.post('/:id/photos', authenticate, upload.array('photos', 10), photoController.uploadPhotos);
router.delete('/photos/:id', authenticate, photoController.deletePhoto);
router.get('/:id/photos', photoController.getListingPhotos);

export default router;
