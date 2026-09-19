import Session from '../models/Session.js';
import User from '../models/User.js';
import Skill from '../models/Skill.js';
import Notification from '../models/Notification.js';
import { v4 as uuidv4 } from 'uuid';
import rrule from 'rrule';
const { RRule } = rrule;
import {
  sendSessionRequestEmail,
  sendSessionConfirmedEmail,
} from '../services/emailService.js';

// Helper: generate recurring session occurrences from RRULE
function generateRecurringSessions(baseSession, recurrenceRule, recurrenceEnd, recurrenceId) {
  try {
    const rule = RRule.fromString(recurrenceRule);
    const dtstart = new Date(baseSession.scheduledAt);
    const until = recurrenceEnd ? new Date(recurrenceEnd) : new Date(dtstart.getTime() + 365 * 24 * 60 * 60 * 1000); // Default 1 year
    
    rule.options.dtstart = dtstart;
    rule.options.until = until;
    
    const occurrences = rule.all();
    // Skip the first occurrence (it's the base session)
    return occurrences.slice(1).map((date, index) => ({
      ...baseSession,
      scheduledAt: date,
      recurrenceId,
      parentSession: baseSession._id,
      isRecurring: true,
      recurrenceRule,
      recurrenceEnd,
    }));
  } catch (error) {
    console.error('RRULE parse error:', error);
    return [];
  }
}

// @desc    Create a new session request
// @route   POST /api/sessions
// @access  Private
export const createSession = async (req, res) => {
  let creditDeducted = false;
  const creditsCost = 1;

  try {
    const { mentorId, skillId, scheduledAt, notes, duration, template, isRecurring, recurrenceRule, recurrenceEnd } = req.body;

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

    // Validate recurrence
    if (isRecurring && !recurrenceRule) {
      return res.status(400).json({ message: 'Recurrence rule is required for recurring sessions' });
    }
    if (isRecurring && recurrenceEnd && new Date(recurrenceEnd) <= sessionTime) {
      return res.status(400).json({ message: 'Recurrence end date must be after the first session' });
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
    const recurrenceId = isRecurring ? uuidv4() : null;

    // Create the base session
    const session = await Session.create({
      mentor: mentorId,
      learner: req.user.id,
      skill: skillId,
      scheduledAt: sessionTime,
      duration: sessionDuration,
      template: template || 'standard',
      isRecurring: Boolean(isRecurring),
      recurrenceRule: recurrenceRule || '',
      recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null,
      recurrenceId,
      creditsExchanged: creditsCost,
      notes,
    });

    // Generate recurring sessions if applicable
    let createdSessions = [session];
    if (isRecurring && recurrenceRule) {
      const recurringSessions = generateRecurringSessions(
        {
          mentor: mentorId,
          learner: req.user.id,
          skill: skillId,
          duration: sessionDuration,
          template: template || 'standard',
          creditsExchanged: creditsCost,
          notes,
        },
        recurrenceRule,
        recurrenceEnd,
        recurrenceId
      );

      if (recurringSessions.length > 0) {
        // Check for conflicts for each recurring session
        const conflictChecks = recurringSessions.map(async (s) => {
          return Session.findOne({
            mentor: mentorId,
            status: { $in: ['pending', 'accepted'] },
            scheduledAt: {
              $gte: new Date(s.scheduledAt.getTime() - bufferMs),
              $lte: new Date(s.scheduledAt.getTime() + bufferMs),
            },
          });
        });
        const conflicts = await Promise.all(conflictChecks);
        const hasConflict = conflicts.some(c => c !== null);
        
        if (!hasConflict) {
          const inserted = await Session.insertMany(recurringSessions);
          createdSessions = [session, ...inserted];
        } else {
          // If any conflict, rollback and return error
          await Session.findByIdAndDelete(session._id);
          creditDeducted = false;
          await User.findByIdAndUpdate(req.user.id, { $inc: { skillCredits: creditsCost } });
          return res.status(409).json({ message: 'One or more recurring sessions conflict with existing bookings' });
        }
      }
    }

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

    res.status(201).json({ session: createdSessions[0], allSessions: createdSessions, learnerCredits: updatedLearner.skillCredits });
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

// @desc    Cancel or update entire recurring series
// @route   PUT /api/sessions/:id/series
// @access  Private
export const updateRecurringSeries = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (!session.recurrenceId) {
      return res.status(400).json({ message: 'This session is not part of a recurring series' });
    }

    const { status, cancelFutureOnly } = req.body; // status: 'cancelled', cancelFutureOnly: boolean

    const isMentor = session.mentor.toString() === req.user.id;
    const isLearner = session.learner.toString() === req.user.id;

    if (!isMentor && !isLearner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this series' });
    }

    // Find all sessions in the series
    const query = { recurrenceId: session.recurrenceId };
    if (cancelFutureOnly) {
      query.scheduledAt = { $gte: new Date() };
    }
    
    const seriesSessions = await Session.find(query);
    
    if (seriesSessions.length === 0) {
      return res.status(404).json({ message: 'No sessions found in this series' });
    }

    // Check authorization for all sessions
    for (const s of seriesSessions) {
      const isMentor = s.mentor.toString() === req.user.id;
      const isLearner = s.learner.toString() === req.user.id;
      if (!isMentor && !isLearner && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized for all sessions in this series' });
      }
    }

    let creditsRefunded = 0;
    const updatedSessions = [];

    for (const s of seriesSessions) {
      const oldStatus = s.status;
      s.status = status || 'cancelled';
      
      // Refund credits for cancelled sessions that weren't already cancelled/completed
      if (s.status === 'cancelled' && oldStatus !== 'cancelled' && oldStatus !== 'completed') {
        creditsRefunded += s.creditsExchanged || 1;
      }
      
      await s.save();
      updatedSessions.push(s);
    }

    // Refund learner credits
    if (creditsRefunded > 0) {
      await User.findByIdAndUpdate(session.learner, {
        $inc: { skillCredits: creditsRefunded },
      }).catch(() => {});
    }

    // Notify other party
    const recipient = session.mentor.toString() === req.user.id ? session.learner : session.mentor;
    await createAndEmit(req, {
      user: recipient,
      relatedUser: req.user.id,
      type: 'series_cancelled',
      title: 'Recurring Series Cancelled',
      message: `${req.user.name} cancelled the recurring session series.`,
      link: `/sessions`,
    });

    res.json({ 
      message: `Series updated: ${updatedSessions.length} sessions ${cancelFutureOnly ? 'from now on' : ''}`, 
      updatedSessions,
      creditsRefunded 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
