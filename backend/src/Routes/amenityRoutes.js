import express from 'express';
import * as amenityController from '../controllers/amenityController.js';
import { authenticate } from '../middleware/auth.js';
import { requireVerifiedEmail } from '../middleware/verifyEmail.js';

const router = express.Router();

router.get('/', amenityController.listAmenities);
router.post('/', authenticate, requireVerifiedEmail, amenityController.createAmenity);
router.put('/:id', authenticate, requireVerifiedEmail, amenityController.updateAmenity);
router.delete('/:id', authenticate, requireVerifiedEmail, amenityController.deleteAmenity);

export default router;
