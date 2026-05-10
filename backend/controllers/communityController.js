import Community from '../models/Community.js';
import User from '../models/User.js';

// @desc    Get all communities
// @route   GET /api/communities
// @access  Private
export const getCommunities = async (req, res) => {
  try {
    const communities = await Community.find()
      .select('-posts')
      .sort('-members');

    // Add member count
    const result = communities.map((c) => ({
      ...c.toObject(),
      memberCount: c.members.length,
      isMember: c.members.map(String).includes(req.user.id),
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single community with posts
// @route   GET /api/communities/:id
// @access  Private
export const getCommunityById = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('members', 'name avatar')
      .populate('posts.author', 'name avatar')
      .populate('posts.replies.author', 'name avatar');

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    res.json(community);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join a community
// @route   POST /api/communities/:id/join
// @access  Private
export const joinCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    if (community.members.map(String).includes(req.user.id)) {
      return res.status(400).json({ message: 'Already a member' });
    }

    community.members.push(req.user.id);
    await community.save();

    // Also track in user document
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { joinedCommunities: community._id },
    });

    res.json({ message: 'Joined community successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Leave a community
// @route   POST /api/communities/:id/leave
// @access  Private
export const leaveCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    community.members = community.members.filter((m) => m.toString() !== req.user.id);
    await community.save();

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { joinedCommunities: community._id },
    });

    res.json({ message: 'Left community' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a post in community
// @route   POST /api/communities/:id/posts
// @access  Private
export const createPost = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    if (!community.members.map(String).includes(req.user.id)) {
      return res.status(400).json({ message: 'Must be a member to post' });
    }

    community.posts.push({
      author: req.user.id,
      content: req.body.content,
    });

    await community.save();

    const updated = await Community.findById(req.params.id)
      .populate('posts.author', 'name avatar')
      .populate('posts.replies.author', 'name avatar');

    res.status(201).json(updated.posts[updated.posts.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reply to a post
// @route   POST /api/communities/:id/posts/:postId/reply
// @access  Private
export const replyToPost = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const post = community.posts.id(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.replies.push({
      author: req.user.id,
      content: req.body.content,
    });

    await community.save();

    const updated = await Community.findById(req.params.id)
      .populate('posts.author', 'name avatar')
      .populate('posts.replies.author', 'name avatar');

    const updatedPost = updated.posts.id(req.params.postId);
    res.status(201).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Like / unlike a post
// @route   POST /api/communities/:id/posts/:postId/like
// @access  Private
export const toggleLikePost = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    const post = community.posts.id(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const idx = post.likes.map(String).indexOf(req.user.id);
    if (idx > -1) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push(req.user.id);
    }

    await community.save();
    res.json({ likes: post.likes.length, liked: idx === -1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a community (admin/seed)
// @route   POST /api/communities
// @access  Private
export const createCommunity = async (req, res) => {
  try {
    const { name, description, category, icon } = req.body;
    const community = await Community.create({
      name,
      description,
      category,
      icon,
      members: [req.user.id],
      creator: req.user.id,
    });
    res.status(201).json(community);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Community with this name already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit a post
// @route   PUT /api/communities/:id/posts/:postId
// @access  Private (author only)
export const editPost = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    const post = community.posts.id(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised to edit this post' });
    }

    post.content = req.body.content || post.content;
    await community.save();

    const updated = await Community.findById(req.params.id)
      .populate('posts.author', 'name avatar')
      .populate('posts.replies.author', 'name avatar');

    res.json(updated.posts.id(req.params.postId));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a post
// @route   DELETE /api/communities/:id/posts/:postId
// @access  Private (author only)
export const deletePost = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    const post = community.posts.id(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised to delete this post' });
    }

    community.posts.pull(req.params.postId);
    await community.save();

    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit a reply
// @route   PUT /api/communities/:id/posts/:postId/replies/:replyId
// @access  Private (author only)
export const editReply = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    const post = community.posts.id(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const reply = post.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    if (reply.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised to edit this reply' });
    }

    reply.content = req.body.content || reply.content;
    await community.save();

    const updated = await Community.findById(req.params.id)
      .populate('posts.author', 'name avatar')
      .populate('posts.replies.author', 'name avatar');

    res.json(updated.posts.id(req.params.postId));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a reply
// @route   DELETE /api/communities/:id/posts/:postId/replies/:replyId
// @access  Private (author only)
export const deleteReply = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    const post = community.posts.id(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const reply = post.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    if (reply.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised to delete this reply' });
    }

    post.replies.pull(req.params.replyId);
    await community.save();

    res.json({ message: 'Reply deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Pin a post
// @route   POST /api/communities/:id/posts/:postId/pin
// @access  Private (creator only)
export const pinPost = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    if (community.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only community creator can pin posts' });
    }

    const post = community.posts.id(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.isPinned = true;
    await community.save();
    res.json({ message: 'Post pinned' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unpin a post
// @route   POST /api/communities/:id/posts/:postId/unpin
// @access  Private (creator only)
export const unpinPost = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    if (community.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only community creator can unpin posts' });
    }

    const post = community.posts.id(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.isPinned = false;
    await community.save();
    res.json({ message: 'Post unpinned' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
