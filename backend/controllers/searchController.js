import User from '../models/User.js';
import Community from '../models/Community.js';
import Skill from '../models/Skill.js';

// @desc    Global search across users, communities, and skills
// @route   GET /api/search
// @access  Private
export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json({ users: [], communities: [], skills: [] });
    }

    const searchRegex = new RegExp(q, 'i');

    // Search Users
    const users = await User.find({
      $or: [{ name: searchRegex }, { bio: searchRegex }],
    })
      .select('name avatar bio')
      .limit(5);

    // Search Communities
    const communities = await Community.find({
      $or: [{ name: searchRegex }, { description: searchRegex }, { category: searchRegex }],
    })
      .select('name icon category description')
      .limit(5);

    // Search Skills (Return unique skill names that match)
    const skills = await Skill.find({
      $or: [{ name: searchRegex }, { category: searchRegex }],
    })
      .select('name category type')
      .limit(5);

    res.json({
      users,
      communities,
      skills,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
