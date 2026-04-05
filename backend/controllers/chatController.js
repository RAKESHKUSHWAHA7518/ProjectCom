import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

// @desc    Get or create conversation between two users
// @route   POST /api/chat/conversation
// @access  Private
export const getOrCreateConversation = async (req, res) => {
  try {
    const { otherUserId } = req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, otherUserId] },
    }).populate('participants', 'name avatar');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, otherUserId],
      });
      conversation = await conversation.populate('participants', 'name avatar');
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all conversations for current user
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate('participants', 'name avatar')
      .sort('-lastMessageAt');

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messages in a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Ensure user is a participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 50;

    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate('sender', 'name avatar')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit);

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        sender: { $ne: req.user.id },
        readBy: { $nin: [req.user.id] },
      },
      { $push: { readBy: req.user.id } }
    );

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a message
// @route   POST /api/chat/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, fileUrl } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.map(String).includes(req.user.id)) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      content,
      fileUrl,
      readBy: [req.user.id],
    });

    // Update conversation's last message
    conversation.lastMessage = content.substring(0, 100);
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await message.populate('sender', 'name avatar');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
