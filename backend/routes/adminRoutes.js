import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import {
  getUsers, updateUserStatus, getStats, getReports, updateReport
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require authentication + admin role
router.use(protect, adminOnly);

router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/stats', getStats);
router.get('/reports', getReports);
router.patch('/reports/:id', updateReport);

export default router;
