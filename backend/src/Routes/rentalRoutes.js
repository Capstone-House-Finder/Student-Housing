// Rental routes – expose rental creation endpoint (BE-10)

import express from 'express';
import * as rentalController from '../controllers/rentalController.js';
import { authenticate } from '../middleware/auth.js';
import { requireVerifiedEmail } from '../middleware/verifyEmail.js';

const router = express.Router();

// Create rental record (landlord or admin only)
router.post('/', authenticate, requireVerifiedEmail, rentalController.createRental);
router.get('/landlord', authenticate, requireVerifiedEmail, rentalController.getLandlordRentals);
router.get('/student', authenticate, requireVerifiedEmail, rentalController.getStudentRentals);


export default router;
