import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import {
  getUsers, updateUserStatus, getStats, getReports, updateReport
} from '../controllers/adminController.js';
import {
  getAllDisputes, resolveDispute
} from '../controllers/disputeController.js';

const router = express.Router();

// All routes require authentication + admin role
router.use(protect, adminOnly);

router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/stats', getStats);
router.get('/reports', getReports);
router.patch('/reports/:id', updateReport);
router.get('/disputes', getAllDisputes);
router.patch('/disputes/:id', resolveDispute);

export default router;
