// Rental routes – expose rental creation endpoint (BE-10)

import express from 'express';
import * as rentalController from '../controllers/rentalController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create rental record (landlord or admin only)
router.post('/', authenticate, rentalController.createRental);
router.get('/landlord', authenticate, rentalController.getLandlordRentals);


export default router;
