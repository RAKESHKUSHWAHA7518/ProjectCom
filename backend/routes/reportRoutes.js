import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { protect } from '../middleware/authMiddleware.js';
import { validateReport, handleValidationErrors } from '../validators/reportValidators.js';
import { createReport } from '../controllers/reportController.js';

const router = express.Router();

const reportRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  limit: 5,
  keyGenerator: (req, res) => req.user?._id?.toString() || ipKeyGenerator(req, res),
  message: { message: 'Report limit reached. Try again in 24 hours.' },
});

router.post('/', protect, reportRateLimiter, validateReport, handleValidationErrors, createReport);

export default router;
