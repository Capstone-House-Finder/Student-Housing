import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireVerifiedEmail } from '../middleware/verifyEmail.js';
import * as pushController from '../controllers/pushController.js';

const router = express.Router();

router.post('/register', authenticate, requireVerifiedEmail, pushController.registerToken);
router.post('/unregister', authenticate, requireVerifiedEmail, pushController.unregisterToken);

export default router;
