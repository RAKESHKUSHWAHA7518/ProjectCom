import express from 'express';
import { createReview, getReviewsForUser, getReviewsByMe } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/given', protect, getReviewsByMe);
router.get('/:userId', protect, getReviewsForUser);

export default router;
