import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import {
  createSearchAlert,
  getSearchAlerts,
  updateSearchAlert,
  deleteSearchAlert,
  checkSearchAlert,
  cronCheckAlerts,
} from '../controllers/searchAlertController.js';

const router = express.Router();

router.post('/', protect, createSearchAlert);
router.get('/', protect, getSearchAlerts);
router.get('/:id/check', protect, checkSearchAlert);
router.patch('/:id', protect, updateSearchAlert);
router.delete('/:id', protect, deleteSearchAlert);

// Admin/internal cron endpoint
router.get('/cron/check', protect, adminOnly, cronCheckAlerts);

export default router;