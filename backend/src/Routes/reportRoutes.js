import express from 'express';
import * as reportController from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';

const router = express.Router();

// Report submission
router.post('/', authenticate, reportController.submitReport);

// Admin moderation
router.get('/', authenticate, admin, reportController.getAllReports);
router.patch('/:id/status', authenticate, admin, reportController.updateReportStatus);

export default router;

