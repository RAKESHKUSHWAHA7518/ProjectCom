import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import {
  registerUser,
  loginUser,
  getUserProfile,
  googleLogin,
  refreshToken,
  logoutUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateResendVerification,
  handleValidationErrors,
} from '../validators/authValidators.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  message: { message: 'Too many password reset requests, please try again after an hour' },
});

const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
  keyGenerator: (req, res) => req.body?.email || ipKeyGenerator(req, res),
  message: { message: 'Too many verification email requests, please try again after an hour' },
});

router.post('/register', authLimiter, validateRegister, handleValidationErrors, registerUser);
router.post('/login', authLimiter, validateLogin, handleValidationErrors, loginUser);
router.post('/google', authLimiter, googleLogin);
router.post('/refresh', refreshToken);
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);

// Email verification
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationLimiter, validateResendVerification, handleValidationErrors, resendVerification);

// Password management
router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, handleValidationErrors, forgotPassword);
router.post('/reset-password', validateResetPassword, handleValidationErrors, resetPassword);
router.put('/change-password', protect, validateChangePassword, handleValidationErrors, changePassword);

export default router;
export { forgotPasswordLimiter, resendVerificationLimiter };
