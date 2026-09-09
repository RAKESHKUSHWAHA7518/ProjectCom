import express from 'express';
import {
  getVerificationStatus,
  requestPhoneVerification,
  verifyPhone,
  requestLinkedInVerification,
  requestIdentityVerification,
  requestVideoIntroVerification,
  reviewVerificationRequest,
  getPendingVerifications,
} from '../controllers/verificationController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// User routes
router.get('/status', protect, getVerificationStatus);

router.post('/phone/request', protect, requestPhoneVerification);
router.post('/phone/verify', protect, verifyPhone);

router.post('/linkedin', protect, requestLinkedInVerification);
router.post('/identity', protect, requestIdentityVerification);
router.post('/video-intro', protect, requestVideoIntroVerification);

// Admin routes
router.get('/pending', protect, adminOnly, getPendingVerifications);
router.post('/review', protect, adminOnly, reviewVerificationRequest);

export default router;