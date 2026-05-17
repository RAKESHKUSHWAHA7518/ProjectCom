import express from 'express';
import { getWeeklyChallenges, claimChallengeReward } from '../controllers/challengeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getWeeklyChallenges);
router.post('/claim', protect, claimChallengeReward);

export default router;
