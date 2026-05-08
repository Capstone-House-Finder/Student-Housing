import express from 'express';
import * as userController from '../controllers/userController.js';
import * as metricsController from '../controllers/metricsController.js';
import { admin } from '../middleware/admin.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Admin routes
router.get('/users', authenticate, admin, userController.getAllUsers);
router.get('/metrics', authenticate, admin, metricsController.getMetrics);
router.get('/stats', authenticate, admin, metricsController.getMetrics); // Compatibility alias
router.get('/activity', authenticate, admin, metricsController.getRecentActivity);
router.patch('/users/:id/suspend', authenticate, admin, userController.suspendUser);
router.delete('/users/:id', authenticate, admin, userController.deleteUser);
// Admin listing moderation endpoints
router.get('/listings', authenticate, admin, userController.getAdminListings);
router.patch('/listings/:id/verify', authenticate, admin, userController.verifyListing);
router.delete('/listings/:id', authenticate, admin, userController.deleteListingAdmin);

export default router;
