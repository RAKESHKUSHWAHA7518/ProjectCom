import mongoose from 'mongoose';
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

// @desc    Get personal analytics stats
// @route   GET /api/stats/me
// @access  Private
export const getPersonalStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    const [completedSessionsAsMentor, completedSessionsAsLearner, user] = await Promise.all([
      Session.countDocuments({ mentor: userId, status: 'completed' }),
      Session.countDocuments({ learner: userId, status: 'completed' }),
      User.findById(userId).select('skillCredits rating numReviews')
    ]);
    
    // Skill Popularity (how many requests you got for your skills)
    const skillPopularity = await Session.aggregate([
      { $match: { mentor: userId } },
      { $group: { _id: '$skill', count: { $sum: 1 } } },
      { $lookup: { from: 'skills', localField: '_id', foreignField: '_id', as: 'skillInfo' } },
      { $unwind: '$skillInfo' },
      { $project: { _id: 1, name: '$skillInfo.name', count: 1 } },
      { $sort: { count: -1 } }
    ]);
    
    // Sessions over time (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sessionsOverTime = await Session.aggregate([
      { $match: { 
          $or: [{ mentor: userId }, { learner: userId }],
          status: 'completed',
          updatedAt: { $gte: sixMonthsAgo }
      }},
      { $group: {
          _id: { month: { $month: '$updatedAt' }, year: { $year: '$updatedAt' } },
          count: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      sessionsCompleted: completedSessionsAsMentor + completedSessionsAsLearner,
      sessionsAsMentor: completedSessionsAsMentor,
      sessionsAsLearner: completedSessionsAsLearner,
      credits: user.skillCredits,
      rating: user.rating,
      numReviews: user.numReviews,
      skillPopularity,
      sessionsOverTime,
    });
  } catch (error) {
    console.error('Personal Stats fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch personal stats' });
  }
};
