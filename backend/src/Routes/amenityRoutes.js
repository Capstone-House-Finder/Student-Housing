import express from 'express';
import * as amenityController from '../controllers/amenityController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', amenityController.listAmenities);
router.post('/', authenticate, amenityController.createAmenity);
router.put('/:id', authenticate, amenityController.updateAmenity);
router.delete('/:id', authenticate, amenityController.deleteAmenity);

export default router;
