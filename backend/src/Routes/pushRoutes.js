import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as pushController from '../controllers/pushController.js';

const router = express.Router();

router.post('/register', authenticate, pushController.registerToken);
router.post('/unregister', authenticate, pushController.unregisterToken);

export default router;
