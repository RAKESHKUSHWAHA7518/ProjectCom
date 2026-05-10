import Session from '../models/Session.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// @desc    Create a new session request
// @route   POST /api/sessions
// @access  Private
export const createSession = async (req, res) => {
  try {
    const { mentorId, skillId, scheduledAt, notes } = req.body;

    // Check if mentor exists
    const mentor = await User.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Don't allow self-booking
    if (mentorId === req.user.id) {
      return res.status(400).json({ message: 'You cannot book a session with yourself' });
    }

    const session = await Session.create({
      mentor: mentorId,
      learner: req.user.id,
      skill: skillId,
      scheduledAt,
      notes,
    });

    // Create notification for mentor
    await Notification.create({
      user: mentorId,
      relatedUser: req.user.id,
      type: 'session_request',
      title: 'New Session Request',
      message: `${req.user.name} requested a session with you.`,
      link: `/sessions`,
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user sessions (as mentor or learner)
// @route   GET /api/sessions
// @access  Private
export const getMySessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [{ mentor: req.user.id }, { learner: req.user.id }],
    })
      .populate('mentor', 'name avatar')
      .populate('learner', 'name avatar')
      .populate('skill', 'name category')
      .sort('-scheduledAt');

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update session status (accept/cancel/complete)
// @route   PUT /api/sessions/:id
// @access  Private
export const updateSessionStatus = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const { status } = req.body;

    // Authorization: Only mentor can accept, either can cancel
    if (status === 'accepted' && session.mentor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only mentors can accept sessions' });
    }

    session.status = status;
    await session.save();

    // Notify other party
    const recipient = session.mentor.toString() === req.user.id ? session.learner : session.mentor;
    let notifType = 'system';
    if (status === 'accepted') notifType = 'session_accepted';
    if (status === 'cancelled') notifType = 'session_cancelled';
    if (status === 'completed') notifType = 'session_completed';

    await Notification.create({
      user: recipient,
      relatedUser: req.user.id,
      type: notifType,
      title: 'Session Update',
      message: `Your session status was updated to ${status}.`,
      link: `/sessions`,
    });

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
