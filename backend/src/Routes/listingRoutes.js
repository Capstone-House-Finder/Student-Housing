// Listing logic goes here

import { Router } from 'express';
import listingControllers from '../controllers/listingController.js';
import { upload } from '../config/multerLocal.js';
import authMiddleware from '../middleware/auth.js'; 

const router = Router();

router.post('/', authMiddleware, listingControllers.createListing);
router.post('/:id/photos', authMiddleware, upload.array('photos', 10), listingControllers.uploadPhotos);
router.get('/:id', listingControllers.getListing);

export default router;