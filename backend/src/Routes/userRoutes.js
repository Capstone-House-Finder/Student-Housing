import express from 'express';
import * as userController from '../controllers/userController.js';
import { admin } from '../middleware/admin.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, userController.updateProfile);

// Admin routes
router.get('/admin/users', authenticate, admin, userController.getAllUsers);
router.patch('/admin/users/:id/suspend', authenticate, admin, userController.suspendUser);
router.delete('/admin/users/:id', authenticate, admin, userController.deleteUser);

export default router;
