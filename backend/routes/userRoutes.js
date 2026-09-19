import express from 'express';
import {
  updateProfile,
  getPublicProfile,
  getLeaderboard,
  exploreUsers,
  uploadAvatar,
  updateTheme,
  deleteAccount,
  blockUser,
  unblockUser,
  getBlockedUsers,
  exportUserData,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/leaderboard', getLeaderboard);
router.get('/explore', protect, exploreUsers);
router.get('/blocked/all', protect, getBlockedUsers);
router.get('/export', protect, exportUserData);
router.post('/:id/block', protect, blockUser);
router.delete('/:id/block', protect, unblockUser);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.put('/theme', protect, updateTheme);
router.get('/:id', protect, getPublicProfile);
router.delete('/me', protect, deleteAccount);

export default router;
