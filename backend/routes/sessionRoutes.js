import express from 'express';
import { bookSession, getSessions, updateSessionStatus } from '../controllers/sessionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, bookSession)
  .get(protect, getSessions);

router.route('/:id/status')
  .put(protect, updateSessionStatus);

export default router;
