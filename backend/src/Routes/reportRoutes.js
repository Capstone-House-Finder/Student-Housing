import express from 'express';
import { submitReport } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All report submissions require authentication (students only, but role check can be done inside controller if needed)
router.post('/', authenticate, submitReport);

export default router;
