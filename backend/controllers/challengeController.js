import User from '../models/User.js';
import Session from '../models/Session.js';
import Community from '../models/Community.js';

// Helper to get start and end dates of the current week (Monday to Sunday)
const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday

  const startOfWeek = new Date(now.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
};

// Helper to get unique week key (e.g. "2026-W20")
const getWeekKey = () => {
  const now = new Date();
  const startYear = now.getFullYear();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${startYear}-W${weekNo}`;
};

const CHALLENGE_DEFS = [
  {
    id: 'mentor_session',
    titleKey: 'The Skill Sharer',
    descriptionKey: 'Complete 1 session as a Mentor this week',
    reward: 5,
    target: 1,
    type: 'mentor',
  },
  {
    id: 'learner_session',
    titleKey: 'The Avid Learner',
    descriptionKey: 'Complete 1 session as a Learner this week',
    reward: 3,
    target: 1,
    type: 'learner',
  },
  {
    id: 'community_post',
    titleKey: 'Community Voice',
    descriptionKey: 'Write 1 post in any community this week',
    reward: 2,
    target: 1,
    type: 'community',
  }
];

// @desc    Get current weekly challenges and user progress
// @route   GET /api/challenges
// @access  Private
export const getWeeklyChallenges = async (req, res) => {
  try {
    const { startOfWeek, endOfWeek } = getWeekRange();
    const weekKey = getWeekKey();
    const userId = req.user.id;

    // Fetch user to check claimed challenges
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Calculate Mentoring Sessions Progress
    const mentorCount = await Session.countDocuments({
      mentor: userId,
      status: 'completed',
      updatedAt: { $gte: startOfWeek, $lte: endOfWeek }
    });

    // 2. Calculate Learning Sessions Progress
    const learnerCount = await Session.countDocuments({
      learner: userId,
      status: 'completed',
      updatedAt: { $gte: startOfWeek, $lte: endOfWeek }
    });

    // 3. Calculate Community Posts Progress
    const communities = await Community.find({ 'posts.author': userId });
    let postCount = 0;
    communities.forEach(c => {
      c.posts.forEach(p => {
        if (p.author.toString() === userId && p.createdAt >= startOfWeek && p.createdAt <= endOfWeek) {
          postCount++;
        }
      });
    });

    // Map challenges with progress and claim status
    const challenges = CHALLENGE_DEFS.map(ch => {
      let progress = 0;
      if (ch.id === 'mentor_session') progress = mentorCount;
      if (ch.id === 'learner_session') progress = learnerCount;
      if (ch.id === 'community_post') progress = postCount;

      const claimKey = `${weekKey}-${ch.id}`;
      const isClaimed = user.claimedChallenges.includes(claimKey);
      const isCompleted = progress >= ch.target;

      return {
        ...ch,
        progress: Math.min(progress, ch.target),
        isCompleted,
        isClaimed,
        claimKey
      };
    });

    res.json({
      weekKey,
      startOfWeek,
      endOfWeek,
      challenges
    });
  } catch (error) {
    console.error('Failed to fetch weekly challenges:', error);
    res.status(500).json({ message: 'Failed to fetch weekly challenges' });
  }
};

// @desc    Claim reward for completed challenge
// @route   POST /api/challenges/claim
// @access  Private
export const claimChallengeReward = async (req, res) => {
  try {
    const { challengeId } = req.body;
    const challenge = CHALLENGE_DEFS.find(ch => ch.id === challengeId);
    if (!challenge) {
      return res.status(400).json({ message: 'Invalid challenge ID' });
    }

    const { startOfWeek, endOfWeek } = getWeekRange();
    const weekKey = getWeekKey();
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const claimKey = `${weekKey}-${challengeId}`;
    if (user.claimedChallenges.includes(claimKey)) {
      return res.status(400).json({ message: 'Reward already claimed for this week' });
    }

    // Recalculate progress to verify completion
    let progress = 0;
    if (challengeId === 'mentor_session') {
      progress = await Session.countDocuments({
        mentor: userId,
        status: 'completed',
        updatedAt: { $gte: startOfWeek, $lte: endOfWeek }
      });
    } else if (challengeId === 'learner_session') {
      progress = await Session.countDocuments({
        learner: userId,
        status: 'completed',
        updatedAt: { $gte: startOfWeek, $lte: endOfWeek }
      });
    } else if (challengeId === 'community_post') {
      const communities = await Community.find({ 'posts.author': userId });
      communities.forEach(c => {
        c.posts.forEach(p => {
          if (p.author.toString() === userId && p.createdAt >= startOfWeek && p.createdAt <= endOfWeek) {
            progress++;
          }
        });
      });
    }

    if (progress < challenge.target) {
      return res.status(400).json({ message: 'Challenge has not been completed yet' });
    }

    // Award credits and mark as claimed
    user.skillCredits += challenge.reward;
    user.claimedChallenges.push(claimKey);
    await user.save();

    res.json({
      message: `Successfully claimed reward! +${challenge.reward} Skill Credits`,
      skillCredits: user.skillCredits,
      claimedChallenges: user.claimedChallenges
    });
  } catch (error) {
    console.error('Failed to claim reward:', error);
    res.status(500).json({ message: 'Failed to claim reward' });
  }
};
