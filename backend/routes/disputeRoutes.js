import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import {
  createDispute,
  getMyDisputes,
  getDisputeById,
  getAllDisputes,
  resolveDispute,
} from '../controllers/disputeController.js';

const router = express.Router();

router.post('/', protect, createDispute);
router.get('/', protect, getMyDisputes);
router.get('/:id', protect, getDisputeById);

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllDisputes);
router.patch('/admin/:id', protect, adminOnly, resolveDispute);

export default router;