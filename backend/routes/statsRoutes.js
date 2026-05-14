import express from 'express';
import { getPlatformStats, getPersonalStats } from '../controllers/statsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getPlatformStats);
router.get('/me', protect, getPersonalStats);

export default router;
