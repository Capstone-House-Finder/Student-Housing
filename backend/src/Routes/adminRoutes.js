import express from 'express';
import * as userController from '../controllers/userController.js';
import { admin } from '../middleware/admin.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Admin routes
router.get('/users', authenticate, admin, userController.getAllUsers);
router.patch('/users/:id/suspend', authenticate, admin, userController.suspendUser);
router.delete('/users/:id', authenticate, admin, userController.deleteUser);

export default router;
