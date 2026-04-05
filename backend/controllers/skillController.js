import Skill from '../models/Skill.js';
import User from '../models/User.js';

// @desc    Get all skills for logged in user
// @route   GET /api/skills
// @access  Private
export const getMySkills = async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.user.id });
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new skill (teach or learn)
// @route   POST /api/skills
// @access  Private
export const addSkill = async (req, res) => {
  try {
    const { name, category, type, proficiencyLevel } = req.body;

    const skill = new Skill({
      user: req.user.id,
      name,
      category,
      type, // 'teach' or 'learn'
      proficiencyLevel,
    });

    const createdSkill = await skill.save();

    // Mark user profile as complete if they have at least one teach and one learn skill
    // (A more thorough check might count how many of each they have)
    const user = await User.findById(req.user.id);
    if (!user.profileComplete) {
      const teachSkills = await Skill.countDocuments({ user: req.user.id, type: 'teach' });
      const learnSkills = await Skill.countDocuments({ user: req.user.id, type: 'learn' });
      
      if (teachSkills > 0 && learnSkills > 0) {
        user.profileComplete = true;
        await user.save();
      }
    }

    res.status(201).json(createdSkill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a skill
// @route   DELETE /api/skills/:id
// @access  Private
export const deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (skill) {
      if (skill.user.toString() !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      
      await skill.deleteOne();
      res.json({ message: 'Skill removed' });
    } else {
      res.status(404).json({ message: 'Skill not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
