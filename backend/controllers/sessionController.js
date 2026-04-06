import Session from '../models/Session.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { v4 as uuidv4 } from 'uuid';

// @desc    Book a new session (requesting from a mentor)
// @route   POST /api/sessions
// @access  Private
export const bookSession = async (req, res) => {
  try {
    const { mentorId, skillId, scheduledAt, notes } = req.body;

    // Check if user has enough credits
    const learner = await User.findById(req.user.id);
    if (learner.skillCredits < 1) {
      return res.status(400).json({ message: 'Not enough skill credits to book a session.' });
    }

    // Prevent self-booking
    if (mentorId === req.user.id) {
      return res.status(400).json({ message: 'Cannot book a session with yourself.' });
    }

    const session = new Session({
      mentor: mentorId,
      learner: req.user.id,
      skill: skillId,
      scheduledAt,
      notes,
      meetingLink: uuidv4(), // Generate unique room ID for WebRTC
      creditsExchanged: 1,
    });

    const createdSession = await session.save();

    // Deduct credit from learner
    learner.skillCredits -= 1;
    await learner.save();

    // Notify mentor
    await Notification.create({
      user: mentorId,
      type: 'session_request',
      title: 'New Session Request',
      message: `${learner.name} wants to book a session with you!`,
      link: '/sessions',
      relatedUser: req.user.id,
    });

    const populated = await createdSession.populate([
      { path: 'mentor', select: 'name avatar' },
      { path: 'learner', select: 'name avatar' },
      { path: 'skill', select: 'name category' },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user sessions (both learning and mentoring)
// @route   GET /api/sessions
// @access  Private
export const getSessions = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {
      $or: [{ learner: req.user.id }, { mentor: req.user.id }],
    };
    if (status) query.status = status;

    const sessions = await Session.find(query)
      .populate('mentor', 'name avatar rating')
      .populate('learner', 'name avatar')
      .populate('skill', 'name category')
      .sort('-scheduledAt');

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update session status (accept, cancel, complete)
// @route   PUT /api/sessions/:id/status
// @access  Private
export const updateSessionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Authorization checks
    const isMentor = session.mentor.toString() === req.user.id;
    const isLearner = session.learner.toString() === req.user.id;

    if (!isMentor && !isLearner) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const wasAlreadyCompleted = session.status === 'completed';
    session.status = status;

    // Logic for completion: Reward mentor based on exchanged credits
    if (status === 'completed' && !wasAlreadyCompleted) {
      const mentor = await User.findById(session.mentor);
      mentor.skillCredits += session.creditsExchanged;
      mentor.totalSessionsAsMentor += 1;
      await mentor.save();

      // Update learner stats too
      const learner = await User.findById(session.learner);
      learner.totalSessionsAsLearner += 1;
      await learner.save();

      // Notify the other party depending on who completed it
      const otherUser = isMentor ? session.learner : session.mentor;
      await Notification.create({
        user: otherUser,
        type: 'session_completed',
        title: 'Session Completed',
        message: `Your session has been marked as completed. Don't forget to leave a review!`,
        link: '/sessions',
        relatedUser: req.user.id,
      });
    }

    // Logic for acceptance
    if (status === 'accepted' && isMentor) {
      await Notification.create({
        user: session.learner,
        type: 'session_accepted',
        title: 'Session Accepted!',
        message: `Your session request has been accepted!`,
        link: '/sessions',
        relatedUser: session.mentor,
      });
    }

    // Logic for cancellation: Refund learner
    if (status === 'cancelled') {
      const learner = await User.findById(session.learner);
      learner.skillCredits += session.creditsExchanged;
      await learner.save();

      const otherUser = isMentor ? session.learner : session.mentor;
      await Notification.create({
        user: otherUser,
        type: 'session_cancelled',
        title: 'Session Cancelled',
        message: `A session has been cancelled. Credits have been refunded.`,
        link: '/sessions',
        relatedUser: req.user.id,
      });
    }

    const updatedSession = await session.save();
    const populated = await updatedSession.populate([
      { path: 'mentor', select: 'name avatar' },
      { path: 'learner', select: 'name avatar' },
      { path: 'skill', select: 'name category' },
    ]);

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
