import Session from '../models/Session.js';
import User from '../models/User.js';
import Skill from '../models/Skill.js';
import Notification from '../models/Notification.js';
import {
  sendSessionRequestEmail,
  sendSessionConfirmedEmail,
} from '../services/emailService.js';

// Helper: save a notification and instantly push it via socket if user is online
async function createAndEmit(req, payload) {
  const notif = await Notification.create(payload);
  try {
    const io = req.app?.get('io');
    const onlineUsers = req.app?.get('onlineUsers');
    const targetId = String(payload.user);
    if (io && onlineUsers && onlineUsers.has(targetId)) {
      io.to(onlineUsers.get(targetId)).emit('new-notification', notif);
    }
  } catch {
    // Socket emit failure shouldn't throw
  }
  return notif;
}

// @desc    Create a new session request
// @route   POST /api/sessions
// @access  Private
export const createSession = async (req, res) => {
  let creditDeducted = false;
  const creditsCost = 1;

  try {
    const { mentorId, skillId, scheduledAt, notes, duration, template, isRecurring, recurrenceRule } = req.body;

    // Check if mentor exists
    const mentor = await User.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Don't allow self-booking
    if (mentorId === req.user.id) {
      return res.status(400).json({ message: 'You cannot book a session with yourself' });
    }

    // Validate scheduled date
    const sessionTime = new Date(scheduledAt);
    if (isNaN(sessionTime.getTime()) || sessionTime < new Date()) {
      return res.status(400).json({ message: 'Session time must be a valid future date and time' });
    }

    // Guard against timeslot conflicts / double-booking (within duration buffer)
    const sessionDuration = Number(duration) || 45;
    const bufferMs = sessionDuration * 60 * 1000;
    const conflict = await Session.findOne({
      mentor: mentorId,
      status: { $in: ['pending', 'accepted'] },
      scheduledAt: {
        $gte: new Date(sessionTime.getTime() - bufferMs),
        $lte: new Date(sessionTime.getTime() + bufferMs),
      },
    });
    if (conflict) {
      return res.status(409).json({ message: 'The mentor already has a scheduled session during this time window' });
    }

    // Atomic credit check & deduction (prevents race condition / double-spending)
    const updatedLearner = await User.findOneAndUpdate(
      { _id: req.user.id, skillCredits: { $gte: creditsCost } },
      { $inc: { skillCredits: -creditsCost } },
      { returnDocument: 'after' }
    );
    if (!updatedLearner) {
      return res.status(400).json({ message: 'Insufficient skill credits to book this session' });
    }
    creditDeducted = true;

    const skill = skillId ? await Skill.findById(skillId) : null;
    const skillName = skill?.name || 'Skill Exchange';

    const session = await Session.create({
      mentor: mentorId,
      learner: req.user.id,
      skill: skillId,
      scheduledAt: sessionTime,
      duration: sessionDuration,
      template: template || 'standard',
      isRecurring: Boolean(isRecurring),
      recurrenceRule: recurrenceRule || '',
      creditsExchanged: creditsCost,
      notes,
    });

    // Create real-time in-app notification for mentor
    await createAndEmit(req, {
      user: mentorId,
      relatedUser: req.user.id,
      type: 'session_request',
      title: 'New Session Request 📅',
      message: `${req.user.name} requested a session with you for ${skillName}.`,
      link: `/sessions`,
    });

    // Send email notification to mentor and confirmation receipt to learner
    sendSessionRequestEmail({
      mentor,
      learner: req.user,
      skillName,
      scheduledAt: session.scheduledAt,
      notes: session.notes,
      sessionId: session._id,
    }).catch(() => {});

    res.status(201).json(session);
  } catch (error) {
    // Rollback atomic credit deduction on failure
    if (creditDeducted) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { skillCredits: creditsCost } }).catch(() => {});
    }
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

    const isMentor = session.mentor.toString() === req.user.id;
    const isLearner = session.learner.toString() === req.user.id;

    if (!isMentor && !isLearner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this session' });
    }

    // Authorization: Only mentor can accept, either can cancel
    if (status === 'accepted' && !isMentor) {
      return res.status(403).json({ message: 'Only mentors can accept sessions' });
    }

    const oldStatus = session.status;
    session.status = status;
    await session.save();

    // If cancelling before completion, refund learner's deducted credits
    if (status === 'cancelled' && oldStatus !== 'cancelled' && oldStatus !== 'completed') {
      await User.findByIdAndUpdate(session.learner, {
        $inc: { skillCredits: session.creditsExchanged || 1 },
      }).catch(() => {});
    }

    // If marking as completed for the first time, update user stats & transfer credits to mentor
    if (status === 'completed' && oldStatus !== 'completed') {
      const mentor = await User.findById(session.mentor);
      const learner = await User.findById(session.learner);

      if (mentor) {
        mentor.totalSessionsAsMentor = (mentor.totalSessionsAsMentor || 0) + 1;
        mentor.skillCredits = (mentor.skillCredits || 0) + (session.creditsExchanged || 1);
        await mentor.save();
      }

      if (learner) {
        learner.totalSessionsAsLearner = (learner.totalSessionsAsLearner || 0) + 1;
        await learner.save();
      }
    }

    // Notify other party
    const recipient = session.mentor.toString() === req.user.id ? session.learner : session.mentor;
    const isAccepted = status === 'accepted';
    const isCancelled = status === 'cancelled';
    const isCompleted = status === 'completed';

    const populatedSkill = session.skill ? await Skill.findById(session.skill) : null;
    const skillName = populatedSkill?.name || 'Skill Exchange';

    let notifType = 'system';
    let notifTitle = 'Session Update';
    let notifMessage = `Your session status was updated to ${status}.`;

    if (isAccepted) {
      notifType = 'session_accepted';
      notifTitle = 'Session Confirmed! 🎉';
      notifMessage = `${req.user.name} accepted your session for ${skillName}!`;
    } else if (isCancelled) {
      notifType = 'session_cancelled';
      notifTitle = 'Session Cancelled';
      notifMessage = `${req.user.name} cancelled the session for ${skillName}.`;
    } else if (isCompleted) {
      notifType = 'session_completed';
      notifTitle = 'Session Completed 🌟';
      notifMessage = `Your session with ${req.user.name} was marked as completed. Please leave a review!`;
    }

    await createAndEmit(req, {
      user: recipient,
      relatedUser: req.user.id,
      type: notifType,
      title: notifTitle,
      message: notifMessage,
      link: `/sessions`,
    });

    // If session is confirmed (accepted), send confirmation email with meeting link
    if (isAccepted) {
      const mentor = await User.findById(session.mentor);
      const learner = await User.findById(session.learner);

      if (mentor && learner) {
        sendSessionConfirmedEmail({
          mentor,
          learner,
          skillName,
          scheduledAt: session.scheduledAt,
          sessionId: session._id,
        }).catch(() => {});
      }
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add post-session notes and resources
// @route   POST /api/sessions/:id/notes
// @access  Private
export const addSessionNote = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    if (session.mentor.toString() !== req.user.id && session.learner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to add notes to this session' });
    }

    const { content, resources } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Note content is required' });
    }

    session.sharedNotes.push({
      user: req.user.id,
      content,
      resources: resources || [],
    });
    
    await session.save();
    
    const updatedSession = await Session.findById(req.params.id)
      .populate('mentor', 'name avatar')
      .populate('learner', 'name avatar')
      .populate('skill', 'name category')
      .populate('sharedNotes.user', 'name avatar');
      
    res.json(updatedSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
