import Skill from '../models/Skill.js';
import User from '../models/User.js';

// @desc    Get potential matches (users who teach what I want to learn)
// @route   GET /api/matches
// @access  Private
export const getMatches = async (req, res) => {
  try {
    const { minRating, location, proficiency } = req.query;

    // 1. Get current user with communities
    const currentUser = await User.findById(req.user.id).select('joinedCommunities');
    
    // 2. Find current user's skills
    const mySkills = await Skill.find({ user: req.user.id });
    const myLearnSkills = mySkills.filter(s => s.type === 'learn');
    const myTeachSkills = mySkills.filter(s => s.type === 'teach');

    if (myLearnSkills.length === 0) return res.json([]);

    const myLearnNames = myLearnSkills.map(s => s.name.toLowerCase());
    const myTeachNames = myTeachSkills.map(s => s.name.toLowerCase());
    const myLearnCategories = myLearnSkills.map(s => s.category);

    // 3. Find potential mentors (they teach what I want to learn)
    const matchQuery = {
      user: { $ne: req.user.id },
      type: 'teach',
      $or: [
        { category: { $in: myLearnCategories } },
        { name: { $in: myLearnNames.map(n => new RegExp(n, 'i')) } }
      ]
    };

    if (proficiency) matchQuery.proficiencyLevel = proficiency;

    const potentialMatches = await Skill.find(matchQuery)
      .populate('user', 'name rating bio numReviews location avatar totalSessionsAsMentor joinedCommunities lastActiveDate');

    // 4. Get all 'learn' skills of potential mentors for "Swap" bonus
    const potentialMentorIds = [...new Set(potentialMatches.map(m => m.user?._id).filter(Boolean))];
    const mentorsLearnSkills = await Skill.find({ 
      user: { $in: potentialMentorIds }, 
      type: 'learn' 
    });

    // 5. Build Result Map
    const mentorMap = new Map();

    potentialMatches.forEach(skill => {
      if (!skill.user) return;
      const mentorId = skill.user._id.toString();

      // Basic Filters
      if (minRating && skill.user.rating < parseFloat(minRating)) return;
      if (location && skill.user.location && !skill.user.location.toLowerCase().includes(location.toLowerCase())) return;

      if (!mentorMap.has(mentorId)) {
        // Calculate Match Score
        let score = 0;
        
        // A. Skill Relevance (Direct)
        const isDirectNameMatch = myLearnNames.some(n => 
          skill.name.toLowerCase().includes(n) || n.includes(skill.name.toLowerCase())
        );
        score += isDirectNameMatch ? 15 : 5;

        // B. Bidirectional "Swap" Bonus (Do they want what I teach?)
        const theirLearnSkills = mentorsLearnSkills.filter(ls => ls.user.toString() === mentorId);
        const hasSwapPotential = theirLearnSkills.some(tls => 
          myTeachNames.some(mtn => tls.name.toLowerCase().includes(mtn) || mtn.includes(tls.name.toLowerCase()))
        );
        if (hasSwapPotential) score += 25; // Massive boost for mutual benefit

        // C. Social Proof (Common Communities)
        const commonCommunitiesCount = (skill.user.joinedCommunities || [])
          .filter(c => currentUser.joinedCommunities.map(String).includes(String(c))).length;
        score += commonCommunitiesCount * 4;

        // D. Reliability & Reputation
        score += (skill.user.rating || 0) * 3;
        score += Math.min(skill.user.numReviews || 0, 20) * 0.5;
        score += Math.min(skill.user.totalSessionsAsMentor || 0, 50) * 0.2;

        mentorMap.set(mentorId, {
          user: skill.user,
          matchedSkills: [],
          matchScore: score,
          isMutualSwap: hasSwapPotential,
          commonCommunities: commonCommunitiesCount
        });
      }

      const entry = mentorMap.get(mentorId);
      entry.matchedSkills.push({
        _id: skill._id,
        name: skill.name,
        category: skill.category,
        proficiencyLevel: skill.proficiencyLevel,
      });
    });

    const results = Array.from(mentorMap.values())
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
