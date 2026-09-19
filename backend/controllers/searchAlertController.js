import SearchAlert from '../models/SearchAlert.js';
import User from '../models/User.js';
import Community from '../models/Community.js';
import Skill from '../models/Skill.js';
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

// Build MongoDB query from alert filters
function buildSearchQuery(alert) {
  const { query, filters } = alert;
  const conditions = [];

  if (query) {
    conditions.push({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } },
        { 'skills.name': { $regex: query, $options: 'i' } },
      ],
    });
  }

  if (filters.category) {
    conditions.push({ 'skills.category': filters.category });
  }

  if (filters.priceRange) {
    const [min, max] = filters.priceRange.split('-').map(Number);
    if (!isNaN(min) && !isNaN(max)) {
      conditions.push({ hourlyRate: { $gte: min, $lte: max } });
    }
  }

  if (filters.sessionLength) {
    conditions.push({ sessionLength: parseInt(filters.sessionLength) });
  }

  if (filters.language) {
    conditions.push({ languages: { $regex: filters.language, $options: 'i' } });
  }

  if (filters.instantBook) {
    conditions.push({ instantBook: true });
  }

  if (filters.verifiedOnly) {
    conditions.push({ verification: { $exists: true, $ne: null } });
  }

  return conditions.length > 0 ? { $and: conditions } : {};
}

// @desc    Create a new search alert
// @route   POST /api/search/alerts
// @access  Private
export const createSearchAlert = async (req, res) => {
  try {
    const { name, query, filters, frequency } = req.body;

    if (!name || !query) {
      return res.status(400).json({ message: 'Name and query are required' });
    }

    const alert = await SearchAlert.create({
      user: req.user.id,
      name,
      query,
      filters: filters || {},
      frequency: frequency || 'daily',
    });

    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's search alerts
// @route   GET /api/search/alerts
// @access  Private
export const getSearchAlerts = async (req, res) => {
  try {
    const alerts = await SearchAlert.find({ user: req.user.id }).sort('-createdAt');
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a search alert
// @route   PATCH /api/search/alerts/:id
// @access  Private
export const updateSearchAlert = async (req, res) => {
  try {
    const { name, query, filters, frequency, isActive } = req.body;

    const alert = await SearchAlert.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name, query, filters, frequency, isActive },
      { returnDocument: 'after' }
    );

    if (!alert) {
      return res.status(404).json({ message: 'Search alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a search alert
// @route   DELETE /api/search/alerts/:id
// @access  Private
export const deleteSearchAlert = async (req, res) => {
  try {
    const alert = await SearchAlert.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!alert) {
      return res.status(404).json({ message: 'Search alert not found' });
    }

    res.json({ message: 'Search alert deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Manually trigger search alert check (for testing)
// @route   POST /api/search/alerts/:id/check
// @access  Private
export const checkSearchAlert = async (req, res) => {
  try {
    const alert = await SearchAlert.findOne({ _id: req.params.id, user: req.user.id, isActive: true });

    if (!alert) {
      return res.status(404).json({ message: 'Search alert not found' });
    }

    const searchQuery = buildSearchQuery(alert);

    // Search users (mentors)
    const users = await User.find(searchQuery)
      .select('name avatar bio hourlyRate sessionLength languages instantBook verification skills category')
      .limit(20)
      .lean();

    // Also search communities and skills
    const communities = await Community.find({
      $or: [
        { name: { $regex: alert.query, $options: 'i' } },
        { description: { $regex: alert.query, $options: 'i' } },
      ],
    })
      .select('name icon category description')
      .limit(5)
      .lean();

    const skills = await Skill.find({
      $or: [
        { name: { $regex: alert.query, $options: 'i' } },
        { category: { $regex: alert.query, $options: 'i' } },
      ],
    })
      .select('name category type')
      .limit(5)
      .lean();

    const results = { users, communities, skills };
    const totalResults = users.length + communities.length + skills.length;

    // Update alert with results count
    await SearchAlert.findByIdAndUpdate(alert._id, {
      resultsCount: totalResults,
      lastSentAt: new Date(),
    });

    if (totalResults > 0) {
      // Send notification
      await createAndEmit(req, {
        user: req.user.id,
        type: 'search_alert',
        title: `Search Alert: "${alert.name}"`,
        message: `Found ${totalResults} new matches for your search.`,
        link: `/search?alert=${alert._id}`,
        data: { alertId: alert._id, resultsCount: totalResults },
      });
    }

    res.json({ alert, results, totalResults });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Background job: Check all active alerts (to be called by cron)
// @route   GET /api/search/alerts/cron/check
// @access  Private (Admin or internal)
export const cronCheckAlerts = async (req, res) => {
  try {
    const now = new Date();
    const alerts = await SearchAlert.find({ isActive: true }).populate('user', '_id name');

    let processed = 0;
    let notificationsSent = 0;

    for (const alert of alerts) {
      const frequencyMs = {
        instant: 0,
        daily: 24 * 60 * 60 * 1000,
        weekly: 7 * 24 * 60 * 60 * 1000,
      }[alert.frequency];

      const lastSent = alert.lastSentAt ? new Date(alert.lastSentAt).getTime() : 0;
      const shouldCheck = frequencyMs === 0 || (now.getTime() - lastSent) >= frequencyMs;

      if (!shouldCheck) continue;

      processed++;

      const searchQuery = buildSearchQuery(alert);

      const users = await User.find(searchQuery)
        .select('name avatar bio hourlyRate sessionLength languages instantBook verification skills category')
        .limit(20)
        .lean();

      const totalResults = users.length;

      if (totalResults > 0) {
        await createAndEmit(req, {
          user: alert.user._id,
          type: 'search_alert',
          title: `Search Alert: "${alert.name}"`,
          message: `Found ${totalResults} new matches for your search.`,
          link: `/search?alert=${alert._id}`,
          data: { alertId: alert._id, resultsCount: totalResults },
        });
        notificationsSent++;
      }

      await SearchAlert.findByIdAndUpdate(alert._id, {
        resultsCount: totalResults,
        lastSentAt: now,
      });
    }

    res.json({ processed, notificationsSent, timestamp: now });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { buildSearchQuery };