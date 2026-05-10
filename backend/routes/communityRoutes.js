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
  editPost,
  deletePost,
  editReply,
  deleteReply,
  pinPost,
  unpinPost,
} from '../controllers/communityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getCommunities).post(protect, createCommunity);
router.get('/:id', protect, getCommunityById);
router.post('/:id/join', protect, joinCommunity);
router.post('/:id/leave', protect, leaveCommunity);
router.post('/:id/posts', protect, createPost);
router.route('/:id/posts/:postId').put(protect, editPost).delete(protect, deletePost);
router.post('/:id/posts/:postId/reply', protect, replyToPost);
router.post('/:id/posts/:postId/like', protect, toggleLikePost);
router.post('/:id/posts/:postId/pin', protect, pinPost);
router.post('/:id/posts/:postId/unpin', protect, unpinPost);
router.route('/:id/posts/:postId/replies/:replyId').put(protect, editReply).delete(protect, deleteReply);

export default router;
