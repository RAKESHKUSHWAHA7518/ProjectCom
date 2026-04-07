import User from '../models/User.js';
import Skill from '../models/Skill.js';
import Session from '../models/Session.js';
import Community from '../models/Community.js';

// @desc    Get platform-wide stats for the landing page
// @route   GET /api/stats
// @access  Public
export const getPlatformStats = async (req, res) => {
  try {
    const [totalUsers, totalSkills, totalSessions, totalCommunities] =
      await Promise.all([
        User.countDocuments(),
        Skill.countDocuments(),
        Session.countDocuments({ status: 'completed' }),
        Community.countDocuments(),
      ]);

    res.json({
      totalUsers,
      totalSkills,
      totalSessions,
      totalCommunities,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch platform stats' });
  }
};
