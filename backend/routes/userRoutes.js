import express from 'express';
import { updateProfile, getPublicProfile, getLeaderboard, exploreUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/leaderboard', getLeaderboard);
router.get('/explore', protect, exploreUsers);
router.put('/profile', protect, updateProfile);
router.get('/:id', protect, getPublicProfile);

export default router;
