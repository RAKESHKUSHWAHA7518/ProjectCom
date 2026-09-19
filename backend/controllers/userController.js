import User from '../models/User.js';
import Skill from '../models/Skill.js';
import Review from '../models/Review.js';
import Badge from '../models/Badge.js';
import Session from '../models/Session.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Community from '../models/Community.js';
import Dispute from '../models/Dispute.js';

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, bio, location, timezone, availability, socialLinks, avatar, instantBook, hourlyRate, sessionLength, languages } = req.body;

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (timezone) user.timezone = timezone;
    if (availability) user.availability = availability;
    if (socialLinks) user.socialLinks = { ...user.socialLinks, ...socialLinks };
    if (avatar !== undefined) user.avatar = avatar;
    if (req.body.hasSeenTour !== undefined) user.hasSeenTour = req.body.hasSeenTour;

    // Mentor settings
    if (instantBook !== undefined) user.settings.instantBook = instantBook;
    if (hourlyRate !== undefined) user.settings.hourlyRate = hourlyRate;
    if (sessionLength !== undefined) user.settings.sessionLength = sessionLength;
    if (languages) user.settings.languages = languages;

    // Recalculate profile completeness concurrently
    const [teachSkills, learnSkills] = await Promise.all([
      Skill.countDocuments({ user: req.user.id, type: 'teach' }),
      Skill.countDocuments({ user: req.user.id, type: 'learn' })
    ]);
    
    user.profileComplete = !!(user.bio && user.location && teachSkills > 0 && learnSkills > 0);

    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      bio: updatedUser.bio,
      location: updatedUser.location,
      timezone: updatedUser.timezone,
      availability: updatedUser.availability,
      socialLinks: updatedUser.socialLinks,
      avatar: updatedUser.avatar,
      profileComplete: updatedUser.profileComplete,
      skillCredits: updatedUser.skillCredits,
      rating: updatedUser.rating,
      numReviews: updatedUser.numReviews,
      totalSessionsAsMentor: updatedUser.totalSessionsAsMentor,
      totalSessionsAsLearner: updatedUser.totalSessionsAsLearner,
      streak: updatedUser.streak,
      badges: updatedUser.badges,
      hasSeenTour: updatedUser.hasSeenTour,
      settings: updatedUser.settings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get public profile of any user
// @route   GET /api/users/:id
// @access  Private
export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('badges');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch skills and reviews concurrently
    const [skills, reviews] = await Promise.all([
      Skill.find({ user: req.params.id }),
      Review.find({ reviewee: req.params.id })
        .populate('reviewer', 'name avatar')
        .sort('-createdAt')
        .limit(10)
    ]);

    res.json({ user, skills, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get leaderboard (top rated users)
// @route   GET /api/users/leaderboard
// @access  Public
export const getLeaderboard = async (req, res) => {
  try {
    const { category, type } = req.query;

    let pipeline = [];

    if (category) {
       const skillTypeFilter = type === 'learners' ? 'learn' : 'teach';
       const skillUsers = await Skill.find({ type: skillTypeFilter, category: new RegExp(category, 'i') }).distinct('user');
       pipeline.push({ $match: { _id: { $in: skillUsers } } });
    }

    if (type === 'learners') {
      pipeline.push(
        { $match: { totalSessionsAsLearner: { $gte: 0 } } },
        { $sort: { totalSessionsAsLearner: -1 } },
        { $limit: 50 },
        { $project: { password: 0 } }
      );
    } else {
      pipeline.push(
        { $match: { numReviews: { $gte: 0 } } },
        { $sort: { rating: -1, numReviews: -1 } },
        { $limit: 50 },
        { $project: { password: 0 } }
      );
    }

    const topUsers = await User.aggregate(pipeline);

    // Populate badges for each user
    const populated = await User.populate(topUsers, { path: 'badges' });

    // Extract all user IDs to fetch skills in a single query (fixes N+1 problem)
    const userIds = populated.map(u => u._id);
    
    // Fetch all skills for these users
    const allSkills = await Skill.find({ 
      user: { $in: userIds }, 
      type: type === 'learners' ? 'learn' : 'teach' 
    });

    // Group skills by user ID
    const skillsByUser = allSkills.reduce((acc, skill) => {
      const userIdStr = skill.user.toString();
      if (!acc[userIdStr]) acc[userIdStr] = [];
      acc[userIdStr].push(skill);
      return acc;
    }, {});

    // Attach relevant skills to each user
    const results = populated.map((u) => {
      const userIdStr = u._id.toString();
      return { ...u, teachSkills: skillsByUser[userIdStr] || [] };
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search/explore users
// @route   GET /api/users/explore
// @access  Private
export const exploreUsers = async (req, res) => {
  try {
    const { search, category, minRating, sortBy, instantBook, verifiedOnly, minPrice, maxPrice, sessionLength, language } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    let userIds = null;

    // Filter by skill category/name if provided
    if (search || category) {
      const skillQuery = { type: 'teach' };
      if (search) {
        skillQuery.$or = [
          { name: new RegExp(search, 'i') },
          { category: new RegExp(search, 'i') },
        ];
      }
      if (category) {
        skillQuery.category = new RegExp(category, 'i');
      }
      const matchingSkills = await Skill.find(skillQuery).distinct('user');
      userIds = matchingSkills;
    }

    const userQuery = { _id: { $ne: req.user.id } };
    if (userIds) {
      userQuery._id = { $ne: req.user.id, $in: userIds };
    }
    if (minRating) {
      userQuery.rating = { $gte: parseFloat(minRating) };
    }
    if (instantBook === 'true') {
      userQuery['settings.instantBook'] = true;
    }
    if (verifiedOnly === 'true') {
      userQuery['verification.email'] = true;
    }
    if (minPrice || maxPrice) {
      userQuery['settings.hourlyRate'] = {};
      if (minPrice) userQuery['settings.hourlyRate'].$gte = parseFloat(minPrice);
      if (maxPrice) userQuery['settings.hourlyRate'].$lte = parseFloat(maxPrice);
    }
    if (sessionLength) {
      userQuery['settings.sessionLength'] = parseInt(sessionLength);
    }
    if (language) {
      userQuery['settings.languages'] = { $regex: language, $options: 'i' };
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === 'rating') sortOption = { rating: -1 };
    if (sortBy === 'reviews') sortOption = { numReviews: -1 };
    if (sortBy === 'sessions') sortOption = { totalSessionsAsMentor: -1 };
    if (sortBy === 'price_asc') sortOption = { 'settings.hourlyRate': 1 };
    if (sortBy === 'price_desc') sortOption = { 'settings.hourlyRate': -1 };

    // Run count and find queries concurrently
    const [totalCount, users] = await Promise.all([
      User.countDocuments(userQuery),
      User.find(userQuery)
        .select('-password')
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('badges')
    ]);

    // Extract all user IDs
    const foundUserIds = users.map(u => u._id);

    // Fetch all teach skills for these users in a single query (fixes N+1 problem)
    const allSkills = await Skill.find({ 
      user: { $in: foundUserIds }, 
      type: 'teach' 
    });

    // Group skills by user ID
    const skillsByUser = allSkills.reduce((acc, skill) => {
      const userIdStr = skill.user.toString();
      if (!acc[userIdStr]) acc[userIdStr] = [];
      acc[userIdStr].push(skill);
      return acc;
    }, {});

    // Attach teach skills
    const results = users.map((u) => {
      const userIdStr = u._id.toString();
      return { user: u, teachSkills: skillsByUser[userIdStr] || [] };
    });

    res.json({
      users: results,
      page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload user avatar
// @route   POST /api/users/avatar
// @access  Private
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cloudinary URL is available in req.file.path with multer-storage-cloudinary
    const avatarUrl = req.file.path;

    user.avatar = avatarUrl;
    await user.save();

    res.json({ avatar: avatarUrl });
  } catch (error) {
    // Pass HTTP 415 / 413 / 422 errors to global error handler
    next(error);
  }
};

// @desc    Update user theme preference
// @route   PUT /api/users/theme
// @access  Private
export const updateTheme = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.settings = user.settings || {};
    user.settings.theme = req.body.theme;
    await user.save();

    res.json({ theme: user.settings.theme });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user account and all associated data
// @route   DELETE /api/users/me
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete associated data
    await Skill.deleteMany({ user: userId });
    await Session.deleteMany({ $or: [{ mentor: userId }, { learner: userId }] });
    await Review.deleteMany({ $or: [{ reviewer: userId }, { reviewee: userId }] });
    await Message.deleteMany({ sender: userId });
    await Conversation.deleteMany({ participants: userId });
    await Notification.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User account and associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Block a user
// @route   POST /api/users/:id/block
// @access  Private
export const blockUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    if (targetUserId === req.user.id) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { blockedUsers: targetUserId },
    });

    res.json({ message: 'User blocked successfully', blockedUserId: targetUserId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unblock a user
// @route   DELETE /api/users/:id/block
// @access  Private
export const unblockUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { blockedUsers: targetUserId },
    });

    res.json({ message: 'User unblocked successfully', unblockedUserId: targetUserId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get blocked users list
// @route   GET /api/users/blocked/all
// @access  Private
export const getBlockedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id)
      .populate('blockedUsers', 'name avatar email');
    res.json(currentUser?.blockedUsers || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export user data (GDPR/CCPA right to portability)
// @route   GET /api/users/export
// @access  Private
export const exportUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshTokenHash -emailVerificationToken -emailVerificationExpiry -passwordResetToken -passwordResetExpiry');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [skills, reviewsGiven, reviewsReceived, sessions, conversations, messages, notifications, communities, disputes] = await Promise.all([
      Skill.find({ user: req.user.id }).lean(),
      Review.find({ reviewer: req.user.id }).populate('reviewee', 'name').lean(),
      Review.find({ reviewee: req.user.id }).populate('reviewer', 'name').lean(),
      Session.find({ $or: [{ mentor: req.user.id }, { learner: req.user.id }] })
        .populate('mentor', 'name')
        .populate('learner', 'name')
        .populate('skill', 'name')
        .lean(),
      Conversation.find({ participants: req.user.id }).populate('participants', 'name avatar').lean(),
      Message.find({ sender: req.user.id }).populate('conversation').lean(),
      Notification.find({ user: req.user.id }).lean(),
      Community.find({ members: req.user.id }).lean(),
      Dispute.find({ $or: [{ raisedBy: req.user.id }, { againstUser: req.user.id }] })
        .populate('session')
        .populate('raisedBy', 'name')
        .populate('againstUser', 'name')
        .lean(),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: user.toObject(),
      skills,
      reviewsGiven,
      reviewsReceived,
      sessions,
      conversations,
      messages,
      notifications,
      communities,
      disputes,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="skillswap-data-export-${Date.now()}.json"`);
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
