import express from 'express';
import {
  createSession,
  getMySessions,
  updateSessionStatus,
} from '../controllers/sessionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getMySessions)
  .post(protect, createSession);

router.route('/:id')
  .put(protect, updateSessionStatus);

export default router;
