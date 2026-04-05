import Review from '../models/Review.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import Badge from '../models/Badge.js';
import Notification from '../models/Notification.js';

// @desc    Create a review after session completion
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res) => {
  try {
    const { sessionId, rating, comment } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed sessions' });
    }

    // Determine who is being reviewed
    const isMentor = session.mentor.toString() === req.user.id;
    const isLearner = session.learner.toString() === req.user.id;

    if (!isMentor && !isLearner) {
      return res.status(401).json({ message: 'Not authorized to review this session' });
    }

    const reviewee = isMentor ? session.learner : session.mentor;

    // Check if already reviewed
    const existingReview = await Review.findOne({ session: sessionId, reviewer: req.user.id });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this session' });
    }

    const review = await Review.create({
      session: sessionId,
      reviewer: req.user.id,
      reviewee,
      rating,
      comment,
    });

    // Update reviewee's average rating
    const allReviews = await Review.find({ reviewee });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    const reviewedUser = await User.findById(reviewee);
    reviewedUser.rating = Math.round(avgRating * 10) / 10;
    reviewedUser.numReviews = allReviews.length;
    await reviewedUser.save();

    // Check for badge awards
    await checkAndAwardBadges(reviewedUser);

    // Create notification
    await Notification.create({
      user: reviewee,
      type: 'new_review',
      title: 'New Review Received',
      message: `${req.user.name || 'Someone'} left you a ${rating}-star review!`,
      link: '/profile',
      relatedUser: req.user.id,
    });

    const populated = await review.populate('reviewer', 'name avatar');
    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this session' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/:userId
// @access  Private
export const getReviewsForUser = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name avatar')
      .populate('session', 'scheduledAt')
      .sort('-createdAt');

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: Check and award badges
async function checkAndAwardBadges(user) {
  const badgesToCheck = [];

  if (user.numReviews >= 1 && user.rating >= 4.5) {
    badgesToCheck.push({ type: 'highly_rated', label: 'Highly Rated', icon: '⭐' });
  }
  if (user.totalSessionsAsMentor >= 1) {
    badgesToCheck.push({ type: 'first_session', label: 'First Session', icon: '🎯' });
  }
  if (user.totalSessionsAsMentor >= 5) {
    badgesToCheck.push({ type: 'five_sessions', label: '5 Sessions Done', icon: '🔥' });
  }
  if (user.totalSessionsAsMentor >= 10) {
    badgesToCheck.push({ type: 'ten_sessions', label: '10 Sessions Done', icon: '💎' });
  }
  if (user.totalSessionsAsMentor >= 10 && user.rating >= 4.8) {
    badgesToCheck.push({ type: 'top_mentor', label: 'Top Mentor', icon: '👑' });
  }
  if (user.totalSessionsAsLearner >= 5) {
    badgesToCheck.push({ type: 'quick_learner', label: 'Quick Learner', icon: '🚀' });
  }

  for (const badge of badgesToCheck) {
    try {
      const existing = await Badge.findOne({ user: user._id, type: badge.type });
      if (!existing) {
        const newBadge = await Badge.create({ user: user._id, ...badge });
        user.badges.push(newBadge._id);
        await user.save();

        await Notification.create({
          user: user._id,
          type: 'badge_earned',
          title: 'New Badge Earned!',
          message: `You earned the "${badge.label}" badge! ${badge.icon}`,
          link: '/profile',
        });
      }
    } catch (e) {
      // Ignore duplicate badge errors
    }
  }
}
