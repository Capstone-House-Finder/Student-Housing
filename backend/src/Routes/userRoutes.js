import express from 'express';
import * as userController from '../controllers/userController.js';
import * as passwordResetController from '../controllers/passwordResetController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh', userController.refresh);

// Protected routes
router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, userController.updateProfile);
router.post('/change-password', authenticate, passwordResetController.changePassword);

// Password reset routes
router.post('/forgot-password', passwordResetController.forgotPassword);
router.post('/reset-password', passwordResetController.resetPassword);

export default router;
