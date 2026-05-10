import express from 'express';
import { updateProfile, getPublicProfile, getLeaderboard, exploreUsers, uploadAvatar } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/leaderboard', getLeaderboard);
router.get('/explore', protect, exploreUsers);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.get('/:id', protect, getPublicProfile);

export default router;
