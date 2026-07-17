import Report from '../models/Report.js';
import User from '../models/User.js';

// POST /api/reports
export const createReport = async (req, res) => {
  try {
    const { reportedUserId, reason, details } = req.body;
    const reporterId = req.user._id;

    if (reportedUserId === reporterId.toString()) {
      return res.status(400).json({ message: 'You cannot report yourself' });
    }

    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ message: 'Reported user not found' });
    }

    const report = await Report.create({
      reporterId,
      reportedUserId,
      reason,
      details: details || '',
      status: 'open',
    });

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
