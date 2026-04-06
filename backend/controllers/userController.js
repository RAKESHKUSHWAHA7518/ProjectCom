import User from '../models/User.js';
import Skill from '../models/Skill.js';
import Review from '../models/Review.js';
import Badge from '../models/Badge.js';

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, bio, location, timezone, availability, socialLinks, avatar } = req.body;

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (timezone) user.timezone = timezone;
    if (availability) user.availability = availability;
    if (socialLinks) user.socialLinks = { ...user.socialLinks, ...socialLinks };
    if (avatar !== undefined) user.avatar = avatar;

    // Recalculate profile completeness
    const teachSkills = await Skill.countDocuments({ user: req.user.id, type: 'teach' });
    const learnSkills = await Skill.countDocuments({ user: req.user.id, type: 'learn' });
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

    const skills = await Skill.find({ user: req.params.id });
    const reviews = await Review.find({ reviewee: req.params.id })
      .populate('reviewer', 'name avatar')
      .sort('-createdAt')
      .limit(10);

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
       // Filter category depending on type if you really want, but let's just 
       // apply category to both, or simply keep original behavior
       const skillTypeFilter = type === 'learners' ? 'learn' : 'teach';
       const skillUsers = await Skill.find({ type: skillTypeFilter, category: new RegExp(category, 'i') }).distinct('user');
       pipeline.push({ $match: { _id: { $in: skillUsers } } });
    }

    if (type === 'learners') {
      pipeline.push(
        { $match: { totalSessionsAsLearner: { $gt: 0 } } },
        { $sort: { totalSessionsAsLearner: -1 } },
        { $limit: 50 },
        { $project: { password: 0 } }
      );
    } else {
      pipeline.push(
        { $match: { numReviews: { $gt: 0 } } },
        { $sort: { rating: -1, numReviews: -1 } },
        { $limit: 50 },
        { $project: { password: 0 } }
      );
    }

    const topUsers = await User.aggregate(pipeline);

    // Populate badges for each user
    const populated = await User.populate(topUsers, { path: 'badges' });

    // Attach relevant skills to each user
    const results = await Promise.all(
      populated.map(async (u) => {
        const skills = await Skill.find({ user: u._id, type: type === 'learners' ? 'learn' : 'teach' });
        // Use teachSkills for the field name so frontend still works without changing the property name, or name it accordingly
        return { ...u, teachSkills: skills };
      })
    );

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
    const { search, category, minRating, sortBy } = req.query;
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

    let sortOption = { createdAt: -1 };
    if (sortBy === 'rating') sortOption = { rating: -1 };
    if (sortBy === 'reviews') sortOption = { numReviews: -1 };
    if (sortBy === 'sessions') sortOption = { totalSessionsAsMentor: -1 };

    const totalCount = await User.countDocuments(userQuery);
    const users = await User.find(userQuery)
      .select('-password')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('badges');

    // Attach teach skills
    const results = await Promise.all(
      users.map(async (u) => {
        const skills = await Skill.find({ user: u._id, type: 'teach' });
        return { user: u, teachSkills: skills };
      })
    );

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
