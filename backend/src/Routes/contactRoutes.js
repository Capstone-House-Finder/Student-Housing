import express from 'express';
import * as contactController from '../controllers/contactController.js';
import { authenticate } from '../middleware/auth.js';
import { requireVerifiedEmail } from '../middleware/verifyEmail.js';

const router = express.Router();

// Get all contact requests for the logged-in landlord
router.get('/landlord', authenticate, requireVerifiedEmail, contactController.getLandlordContacts);

export default router;
