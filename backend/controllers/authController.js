import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmEmail,
} from '../services/emailService.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy-client-id');

// Generate Access Token (15m)
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });

// Generate Refresh Token (7d)
const generateRefreshToken = (id) =>
  jwt.sign(
    { id, jti: crypto.randomBytes(32).toString('hex') },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// Helper to set refresh token cookie
const setTokenCookie = (res, token) => {
  res.cookie('jwt_refresh', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate email verification token
    const plainVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = hashToken(plainVerificationToken);

    // Create user with emailVerified: false
    const user = await User.create({
      name,
      email,
      password,
      emailVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpiry: Date.now() + 24 * 60 * 60 * 1000,
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid user data' });
    }

    // Fire-and-forget emails
    sendVerificationEmail(user, plainVerificationToken).catch(() => {});
    sendWelcomeEmail(user).catch(() => {});

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account before logging in.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }

    if (user.emailVerified === false) {
      const plainToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = hashToken(plainToken);
      user.emailVerificationToken = hashedToken;
      user.emailVerificationExpiry = Date.now() + 24 * 60 * 60 * 1000;
      await user.save();
      sendVerificationEmail(user, plainToken).catch(() => {});

      return res.status(403).json({ message: 'Please verify your email address. A new verification link has been sent to your email.' });
    }

    // Generate refresh token, hash it, store atomically
    const refreshTokenPlain = generateRefreshToken(user._id);
    const refreshTokenHashed = hashToken(refreshTokenPlain);

    await User.findByIdAndUpdate(user._id, { refreshTokenHash: refreshTokenHashed });

    setTokenCookie(res, refreshTokenPlain);

    const hasSeenTour = user.hasSeenTour || user.profileComplete || (user.totalSessionsAsMentor > 0) || (user.totalSessionsAsLearner > 0);

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileComplete: user.profileComplete,
      skillCredits: user.skillCredits,
      hasSeenTour: !!hasSeenTour,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate with Google
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    let payload;

    if (process.env.GOOGLE_CLIENT_ID) {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } else {
      // For local development without client ID, just decode the JWT to get payload
      payload = jwt.decode(credential);
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const { email, name, picture } = payload;
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await User.create({
        name,
        email,
        password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
        avatar: picture || '',
        emailVerified: true, // Google accounts are pre-verified
      });
    } else {
      if (!user.avatar && picture) {
        user.avatar = picture;
        await user.save();
      }
    }

    // Generate refresh token, hash it, store atomically
    const refreshTokenPlain = generateRefreshToken(user._id);
    const refreshTokenHashed = hashToken(refreshTokenPlain);

    await User.findByIdAndUpdate(user._id, { refreshTokenHash: refreshTokenHashed });

    setTokenCookie(res, refreshTokenPlain);

    // Fire-and-forget welcome email for new users
    if (isNewUser) {
      sendWelcomeEmail(user).catch(() => {});
    }

    const hasSeenTour = !isNewUser && (user.hasSeenTour || user.profileComplete || (user.totalSessionsAsMentor > 0) || (user.totalSessionsAsLearner > 0));

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      profileComplete: user.profileComplete,
      skillCredits: user.skillCredits,
      hasSeenTour: !!hasSeenTour,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh access token using refresh token cookie (with rotation)
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.jwt_refresh;

    if (!incomingRefreshToken) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    let decoded;
    try {
      decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }

    // Hash the incoming token and compare to stored hash
    const incomingHash = hashToken(incomingRefreshToken);
    const currentHash = user.refreshTokenHash;

    if (!currentHash || incomingHash !== currentHash) {
      // Possible reuse attack — invalidate all sessions
      await User.findByIdAndUpdate(user._id, { refreshTokenHash: null });
      res.cookie('jwt_refresh', '', { httpOnly: true, maxAge: 0 });
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    // Atomically rotate: generate new tokens only if stored hash still matches
    const newRefreshTokenPlain = generateRefreshToken(user._id);
    const newRefreshTokenHash = hashToken(newRefreshTokenPlain);

    const updated = await User.findOneAndUpdate(
      { _id: user._id, refreshTokenHash: currentHash },
      { refreshTokenHash: newRefreshTokenHash },
      { returnDocument: 'after' }
    );

    if (!updated) {
      // Race condition — another request already rotated the token
      res.cookie('jwt_refresh', '', { httpOnly: true, maxAge: 0 });
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    setTokenCookie(res, newRefreshTokenPlain);

    res.json({ token: generateToken(user._id) });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired session' });
  }
};

// @desc    Logout user / clear cookie and invalidate refresh token
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.jwt_refresh;

    if (incomingRefreshToken) {
      try {
        const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          await User.findByIdAndUpdate(user._id, { refreshTokenHash: null });
        }
      } catch {
        // Token invalid/expired — still clear the cookie
      }
    }

    res.cookie('jwt_refresh', '', {
      httpOnly: true,
      maxAge: 0,
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify email address via token from query string
// @route   GET /api/auth/verify-email?token=...
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Verification token is required' });

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Verification link expired or already used' });

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend email verification link
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return 200 to avoid info leak
    if (!user || user.emailVerified) {
      return res.json({ message: 'Verification email sent if account exists' });
    }

    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(plainToken);
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    sendVerificationEmail(user, plainToken).catch(() => {});

    res.json({ message: 'Verification email sent if account exists' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const GENERIC_MSG = { message: 'If that email exists, a reset link has been sent.' };

    const user = await User.findOne({ email });
    if (!user) return res.status(200).json(GENERIC_MSG);

    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(plainToken);
    user.passwordResetToken = hashedToken;
    user.passwordResetExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    sendPasswordResetEmail(user, plainToken).catch(() => {});

    res.status(200).json(GENERIC_MSG);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Reset link is invalid or has expired' });

    // Update password, clear reset token, invalidate all sessions
    user.password = newPassword; // pre-save hook will hash it
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    user.refreshTokenHash = null;
    await user.save();

    sendPasswordResetConfirmEmail(user).catch(() => {});

    res.clearCookie('jwt_refresh', { httpOnly: true });
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password (authenticated)
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    if (currentPassword === newPassword) {
      return res.status(422).json({ message: 'New password must differ from current password' });
    }

    user.password = newPassword; // pre-save hook hashes it
    user.refreshTokenHash = null; // invalidate all sessions
    await user.save();

    res.clearCookie('jwt_refresh', { httpOnly: true });
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
