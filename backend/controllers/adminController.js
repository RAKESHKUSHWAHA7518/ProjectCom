import User from '../models/User.js';
import Skill from '../models/Skill.js';
import Session from '../models/Session.js';
import Community from '../models/Community.js';
import Report from '../models/Report.js';

// GET /api/admin/users — paginated, filterable
export const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const filter = {};
    if (req.query.name) filter.name = { $regex: req.query.name, $options: 'i' };
    if (req.query.email) filter.email = { $regex: req.query.email, $options: 'i' };
    if (req.query.role) filter.role = { $regex: req.query.role, $options: 'i' };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email role createdAt emailVerified isActive')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/admin/users/:id/status
export const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, select: 'name email role isActive emailVerified createdAt' }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/stats
export const getStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalUsers, totalSkills, totalSessions, totalCommunities, newUsersLast30Days] =
      await Promise.all([
        User.countDocuments(),
        Skill.countDocuments(),
        Session.countDocuments(),
        Community.countDocuments(),
        User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      ]);
    res.json({ totalUsers, totalSkills, totalSessions, totalCommunities, newUsersLast30Days });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/reports
export const getReports = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const [reports, openCount] = await Promise.all([
      Report.find({ status: 'open' })
        .select('reporterId reportedUserId reason details createdAt status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Report.countDocuments({ status: 'open' }),
    ]);

    res.json({ reports, openCount, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/admin/reports/:id
export const updateReport = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'status must be resolved or dismissed' });
    }
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
