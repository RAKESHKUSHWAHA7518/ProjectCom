import Dispute from '../models/Dispute.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

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

// @desc    Create a new dispute for a session
// @route   POST /api/disputes
// @access  Private
export const createDispute = async (req, res) => {
  try {
    const { sessionId, reason, details, evidence } = req.body;

    const session = await Session.findById(sessionId).populate('mentor learner');
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const isMentor = session.mentor._id.toString() === req.user.id;
    const isLearner = session.learner._id.toString() === req.user.id;

    if (!isMentor && !isLearner) {
      return res.status(403).json({ message: 'You can only raise disputes for your own sessions' });
    }

    if (session.status !== 'completed' && session.status !== 'cancelled') {
      return res.status(400).json({ message: 'Disputes can only be raised for completed or cancelled sessions' });
    }

    const existingDispute = await Dispute.findOne({ session: sessionId, raisedBy: req.user.id });
    if (existingDispute) {
      return res.status(409).json({ message: 'You have already raised a dispute for this session' });
    }

    const againstUser = isMentor ? session.learner._id : session.mentor._id;

    const dispute = await Dispute.create({
      session: sessionId,
      raisedBy: req.user.id,
      againstUser,
      reason,
      details: details || '',
      evidence: evidence || [],
    });

    // Notify the other party
    await createAndEmit(req, {
      user: againstUser,
      relatedUser: req.user.id,
      type: 'dispute_raised',
      title: 'Dispute Raised ⚠️',
      message: `${req.user.name} raised a dispute for your session.`,
      link: `/disputes/${dispute._id}`,
    });

    // Notify admins
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await createAndEmit(req, {
        user: admin._id,
        relatedUser: req.user.id,
        type: 'dispute_raised',
        title: 'New Dispute Requires Review',
        message: `Dispute raised for session ${sessionId}.`,
        link: `/admin/disputes/${dispute._id}`,
      });
    }

    res.status(201).json(dispute);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's disputes (as raiser or against)
// @route   GET /api/disputes
// @access  Private
export const getMyDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({
      $or: [{ raisedBy: req.user.id }, { againstUser: req.user.id }],
    })
      .populate('session', 'skill scheduledAt status')
      .populate('raisedBy', 'name avatar')
      .populate('againstUser', 'name avatar')
      .populate('resolvedBy', 'name')
      .sort('-createdAt');

    res.json(disputes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dispute by ID
// @route   GET /api/disputes/:id
// @access  Private
export const getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('session', 'skill scheduledAt status mentor learner')
      .populate('raisedBy', 'name avatar email')
      .populate('againstUser', 'name avatar email')
      .populate('resolvedBy', 'name');

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    const isRaiser = dispute.raisedBy._id.toString() === req.user.id;
    const isAgainst = dispute.againstUser._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isRaiser && !isAgainst && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this dispute' });
    }

    res.json(dispute);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Get all disputes (paginated, filterable)
// @route   GET /api/admin/disputes
// @access  Private (Admin)
export const getAllDisputes = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.raisedBy) filter.raisedBy = req.query.raisedBy;

    const [disputes, total] = await Promise.all([
      Dispute.find(filter)
        .populate('session', 'skill scheduledAt')
        .populate('raisedBy', 'name avatar email')
        .populate('againstUser', 'name avatar email')
        .populate('resolvedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Dispute.countDocuments(filter),
    ]);

    res.json({ disputes, total, page, pageSize });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Resolve a dispute
// @route   PATCH /api/admin/disputes/:id
// @access  Private (Admin)
export const resolveDispute = async (req, res) => {
  try {
    const { status, resolution, adminNotes } = req.body;

    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be resolved or dismissed' });
    }
    if (status === 'resolved' && !resolution) {
      return res.status(400).json({ message: 'Resolution is required when status is resolved' });
    }
    if (resolution && !['refund_learner', 'refund_mentor', 'partial_refund', 'warning', 'no_action'].includes(resolution)) {
      return res.status(400).json({ message: 'Invalid resolution type' });
    }

    const dispute = await Dispute.findById(req.params.id)
      .populate('session', 'mentor learner creditsExchanged')
      .populate('raisedBy', 'name')
      .populate('againstUser', 'name');

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    dispute.status = status;
    dispute.resolution = resolution || null;
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = new Date();
    dispute.adminNotes = adminNotes || '';
    await dispute.save();

    // Handle resolution actions
    if (status === 'resolved' && resolution) {
      const session = dispute.session;
      const credits = session.creditsExchanged || 1;

      if (resolution === 'refund_learner') {
        await User.findByIdAndUpdate(session.learner._id, { $inc: { skillCredits: credits } });
      } else if (resolution === 'refund_mentor') {
        await User.findByIdAndUpdate(session.mentor._id, { $inc: { skillCredits: credits } });
      } else if (resolution === 'partial_refund') {
        const half = Math.ceil(credits / 2);
        await User.findByIdAndUpdate(session.learner._id, { $inc: { skillCredits: half } });
      }
      // 'warning' and 'no_action' don't change credits
    }

    // Notify both parties
    const recipient = dispute.raisedBy._id.toString() === req.user.id ? dispute.againstUser._id : dispute.raisedBy._id;
    const raiserId = dispute.raisedBy._id;

    await createAndEmit(req, {
      user: raiserId,
      relatedUser: req.user.id,
      type: 'dispute_resolved',
      title: 'Dispute Resolved',
      message: `Your dispute has been ${status}. ${resolution ? `Resolution: ${resolution.replace('_', ' ')}` : ''}`,
      link: `/disputes/${dispute._id}`,
    });

    await createAndEmit(req, {
      user: recipient,
      relatedUser: req.user.id,
      type: 'dispute_resolved',
      title: 'Dispute Resolved',
      message: `A dispute involving you has been ${status}.`,
      link: `/disputes/${dispute._id}`,
    });

    res.json(dispute);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createAndEmit };