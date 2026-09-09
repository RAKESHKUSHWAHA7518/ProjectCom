import User from '../models/User.js';
import { sendVerificationEmail } from '../services/emailService.js';

export const getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('verification verificationRequests');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFullyVerified = user.verification.email &&
      user.verification.phone &&
      user.verification.linkedin;

    res.json({
      verification: user.verification,
      verificationRequests: user.verificationRequests,
      isFullyVerified,
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ message: 'Failed to get verification status' });
  }
};

export const requestPhoneVerification = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verification.phone) {
      return res.status(400).json({ message: 'Phone already verified' });
    }

    const existingRequest = user.verificationRequests.find(
      r => r.type === 'phone' && r.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({ message: 'Phone verification already pending' });
    }

    // Generate verification code (in production, use Twilio or similar)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.verificationRequests.push({
      type: 'phone',
      status: 'pending',
      data: { phoneNumber, verificationCode },
    });

    await user.save();

    // TODO: Send SMS with verification code
    // await sendSMS(phoneNumber, `Your SkillSwap verification code: ${verificationCode}`);

    res.json({
      message: 'Verification code sent',
      // In development, return the code for testing
      ...(process.env.NODE_ENV === 'development' && { code: verificationCode }),
    });
  } catch (error) {
    console.error('Request phone verification error:', error);
    res.status(500).json({ message: 'Failed to request phone verification' });
  }
};

export const verifyPhone = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Verification code is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const request = user.verificationRequests.find(
      r => r.type === 'phone' && r.status === 'pending'
    );

    if (!request) {
      return res.status(400).json({ message: 'No pending phone verification' });
    }

    if (request.data.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.verification.phone = true;
    request.status = 'approved';
    request.reviewedAt = new Date();

    await user.save();

    res.json({ message: 'Phone verified successfully', verification: user.verification });
  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({ message: 'Failed to verify phone' });
  }
};

export const requestLinkedInVerification = async (req, res) => {
  try {
    const { linkedinUrl } = req.body;
    if (!linkedinUrl) {
      return res.status(400).json({ message: 'LinkedIn URL is required' });
    }

    // Basic validation
    if (!linkedinUrl.includes('linkedin.com/in/')) {
      return res.status(400).json({ message: 'Invalid LinkedIn profile URL' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verification.linkedin) {
      return res.status(400).json({ message: 'LinkedIn already verified' });
    }

    const existingRequest = user.verificationRequests.find(
      r => r.type === 'linkedin' && r.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({ message: 'LinkedIn verification already pending' });
    }

    user.verificationRequests.push({
      type: 'linkedin',
      status: 'pending',
      data: { linkedinUrl },
    });

    // Also update the socialLinks.linkedin field
    user.socialLinks.linkedin = linkedinUrl;

    await user.save();

    res.json({ message: 'LinkedIn verification request submitted for review' });
  } catch (error) {
    console.error('Request LinkedIn verification error:', error);
    res.status(500).json({ message: 'Failed to request LinkedIn verification' });
  }
};

export const requestIdentityVerification = async (req, res) => {
  try {
    const { documentType, documentNumber, documentFront, documentBack, selfie } = req.body;

    if (!documentType || !documentNumber || !documentFront || !selfie) {
      return res.status(400).json({ message: 'All required documents must be provided' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verification.identity) {
      return res.status(400).json({ message: 'Identity already verified' });
    }

    const existingRequest = user.verificationRequests.find(
      r => r.type === 'identity' && r.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({ message: 'Identity verification already pending' });
    }

    user.verificationRequests.push({
      type: 'identity',
      status: 'pending',
      data: { documentType, documentNumber, documentFront, documentBack, selfie },
    });

    await user.save();

    res.json({ message: 'Identity verification request submitted for review' });
  } catch (error) {
    console.error('Request identity verification error:', error);
    res.status(500).json({ message: 'Failed to request identity verification' });
  }
};

export const requestVideoIntroVerification = async (req, res) => {
  try {
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ message: 'Video URL is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verification.videoIntro) {
      return res.status(400).json({ message: 'Video intro already verified' });
    }

    const existingRequest = user.verificationRequests.find(
      r => r.type === 'videoIntro' && r.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({ message: 'Video intro verification already pending' });
    }

    user.verificationRequests.push({
      type: 'videoIntro',
      status: 'pending',
      data: { videoUrl },
    });

    await user.save();

    res.json({ message: 'Video intro verification request submitted for review' });
  } catch (error) {
    console.error('Request video intro verification error:', error);
    res.status(500).json({ message: 'Failed to request video intro verification' });
  }
};

// Admin: Review verification request
export const reviewVerificationRequest = async (req, res) => {
  try {
    const { userId, requestType, action, notes } = req.body;

    if (!userId || !requestType || !action) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const request = user.verificationRequests.find(
      r => r.type === requestType && r.status === 'pending'
    );

    if (!request) {
      return res.status(404).json({ message: 'No pending verification request found' });
    }

    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    request.notes = notes;

    if (action === 'approve') {
      user.verification[requestType] = true;
    }

    await user.save();

    res.json({
      message: `Verification ${action}d successfully`,
      verification: user.verification,
    });
  } catch (error) {
    console.error('Review verification error:', error);
    res.status(500).json({ message: 'Failed to review verification' });
  }
};

// Admin: Get all pending verifications
export const getPendingVerifications = async (req, res) => {
  try {
    const users = await User.find({
      'verificationRequests.status': 'pending'
    }).select('name email avatar verification verificationRequests').lean();

    const pendingRequests = [];
    users.forEach(user => {
      user.verificationRequests.forEach(req => {
        if (req.status === 'pending') {
          pendingRequests.push({
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            userAvatar: user.avatar,
            type: req.type,
            submittedAt: req.submittedAt,
            data: req.data,
          });
        }
      });
    });

    res.json({ requests: pendingRequests });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ message: 'Failed to get pending verifications' });
  }
};