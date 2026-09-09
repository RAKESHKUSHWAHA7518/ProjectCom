import express from 'express';
import {
  createSession,
  getMySessions,
  updateSessionStatus,
  addSessionNote,
} from '../controllers/sessionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { sessionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.route('/')
  .get(protect, getMySessions)
  .post(protect, sessionLimiter, createSession);

router.route('/:id')
  .put(protect, updateSessionStatus);

router.route('/:id/notes')
  .post(protect, addSessionNote);

export default router;
