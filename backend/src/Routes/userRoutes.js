import express from 'express';
import * as userController from '../controllers/userController.js';
import * as passwordResetController from '../controllers/passwordResetController.js';
import * as emailVerificationController from '../controllers/emailVerificationController.js';
import { authenticate } from '../middleware/auth.js';
import { requireVerifiedEmail } from '../middleware/verifyEmail.js';

const router = express.Router();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh', userController.refresh);
router.get('/verify-email', emailVerificationController.verifyEmail);
router.post('/verify-email', emailVerificationController.verifyEmail);
router.post('/resend-verification', emailVerificationController.resendVerification);

// Protected routes
router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, requireVerifiedEmail, userController.updateProfile);
router.post('/change-password', authenticate, passwordResetController.changePassword);

// Password reset routes
router.post('/forgot-password', passwordResetController.forgotPassword);
router.post('/reset-password', passwordResetController.resetPassword);

export default router;
