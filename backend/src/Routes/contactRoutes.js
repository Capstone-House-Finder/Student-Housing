import express from 'express';
import * as contactController from '../controllers/contactController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all contact requests for the logged-in landlord
router.get('/landlord', authenticate, contactController.getLandlordContacts);

export default router;
