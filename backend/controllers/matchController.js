import Skill from '../models/Skill.js';
import User from '../models/User.js';

// @desc    Get potential matches (users who teach what I want to learn)
// @route   GET /api/matches
// @access  Private
export const getMatches = async (req, res) => {
  try {
    const { minRating, location, proficiency, sort } = req.query;

    // 1. Find all skills the current user wants to LEARN
    const myLearnSkills = await Skill.find({ user: req.user.id, type: 'learn' });
    const myLearnCategories = myLearnSkills.map(skill => skill.category);
    const myLearnNames = myLearnSkills.map(skill => skill.name.toLowerCase());

    if (myLearnSkills.length === 0) {
      return res.json([]);
    }

    // 2. Build match query
    const matchQuery = {
      user: { $ne: req.user.id },
      type: 'teach',
      $or: [
        { category: { $in: myLearnCategories } },
        { name: { $in: myLearnNames.map(n => new RegExp(n, 'i')) } }
      ]
    };

    if (proficiency) {
      matchQuery.proficiencyLevel = proficiency;
    }

    const matches = await Skill.find(matchQuery)
      .populate('user', 'name rating bio numReviews location avatar totalSessionsAsMentor');

    // Grouping by users
    const mentorMap = new Map();

    matches.forEach(skill => {
      if (skill.user) {
        const mentorId = skill.user._id.toString();

        // Apply user-level filters
        if (minRating && skill.user.rating < parseFloat(minRating)) return;
        if (location && skill.user.location && 
            !skill.user.location.toLowerCase().includes(location.toLowerCase())) return;

        if (!mentorMap.has(mentorId)) {
          mentorMap.set(mentorId, {
            user: skill.user,
            matchedSkills: [],
            matchScore: 0,
          });
        }
        const entry = mentorMap.get(mentorId);
        entry.matchedSkills.push({
          _id: skill._id,
          name: skill.name,
          category: skill.category,
          proficiencyLevel: skill.proficiencyLevel,
        });

        // Calculate match score
        // Exact name match = 3 points, category match = 1 point
        const nameMatch = myLearnNames.some(n => 
          skill.name.toLowerCase().includes(n) || n.includes(skill.name.toLowerCase())
        );
        entry.matchScore += nameMatch ? 3 : 1;
        entry.matchScore += (skill.user.rating || 0) * 0.5;
        entry.matchScore += Math.min(skill.user.numReviews || 0, 10) * 0.2;
      }
    });

    let results = Array.from(mentorMap.values());

    // Sort results
    if (sort === 'rating') {
      results.sort((a, b) => (b.user.rating || 0) - (a.user.rating || 0));
    } else if (sort === 'reviews') {
      results.sort((a, b) => (b.user.numReviews || 0) - (a.user.numReviews || 0));
    } else {
      // Default: sort by match score
      results.sort((a, b) => b.matchScore - a.matchScore);
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
