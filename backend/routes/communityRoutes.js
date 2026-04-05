import express from 'express';
import {
  getCommunities,
  getCommunityById,
  joinCommunity,
  leaveCommunity,
  createPost,
  replyToPost,
  toggleLikePost,
  createCommunity,
} from '../controllers/communityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getCommunities).post(protect, createCommunity);
router.get('/:id', protect, getCommunityById);
router.post('/:id/join', protect, joinCommunity);
router.post('/:id/leave', protect, leaveCommunity);
router.post('/:id/posts', protect, createPost);
router.post('/:id/posts/:postId/reply', protect, replyToPost);
router.post('/:id/posts/:postId/like', protect, toggleLikePost);

export default router;
