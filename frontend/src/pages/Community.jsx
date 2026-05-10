import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCommunityStore } from '../store/communityStore';
import toast from 'react-hot-toast';
import Avatar from '../components/Avatar';

export default function Community() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    communities,
    activeCommunity,
    fetchCommunities,
    fetchCommunityById,
    joinCommunity,
    leaveCommunity,
    createPost,
    replyToPost,
    toggleLike,
    createCommunity,
    editPost,
    deletePost,
    editReply,
    deleteReply,
    pinPost,
    unpinPost,
    isLoading,
  } = useCommunityStore();

  const [newPostContent, setNewPostContent] = useState('');
  const [replyContent, setReplyContent] = useState({});
  const [showReplyFor, setShowReplyFor] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunity, setNewCommunity] = useState({ name: '', description: '', category: '', icon: '💬' });

  // Edit state for posts
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingPostContent, setEditingPostContent] = useState('');
  // Edit state for replies
  const [editingReply, setEditingReply] = useState(null); // { postId, replyId }
  const [editingReplyContent, setEditingReplyContent] = useState('');

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    if (id) fetchCommunityById(id);
  }, [id]);

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    createPost(id, newPostContent.trim());
    setNewPostContent('');
  };

  const handleReply = (postId) => {
    if (!replyContent[postId]?.trim()) return;
    replyToPost(id, postId, replyContent[postId].trim());
    setReplyContent({ ...replyContent, [postId]: '' });
    setShowReplyFor(null);
  };

  const handleLike = async (postId) => {
    await toggleLike(id, postId);
    fetchCommunityById(id);
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    try {
      await createCommunity(newCommunity.name, newCommunity.description, newCommunity.category, newCommunity.icon);
      setShowCreateModal(false);
      setNewCommunity({ name: '', description: '', category: '', icon: '💬' });
      toast.success('Community created!');
    } catch (err) {
      toast.error(err.message || 'Failed to create community');
    }
  };

  // Post edit/delete
  const handleStartEditPost = (post) => {
    setEditingPostId(post._id);
    setEditingPostContent(post.content);
  };
  const handleSaveEditPost = async (postId) => {
    if (!editingPostContent.trim()) return;
    try {
      await editPost(id, postId, editingPostContent.trim());
      setEditingPostId(null);
      toast.success('Post updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update post');
    }
  };
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePost(id, postId);
      toast.success('Post deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete post');
    }
  };

  // Reply edit/delete
  const handleStartEditReply = (postId, reply) => {
    setEditingReply({ postId, replyId: reply._id });
    setEditingReplyContent(reply.content);
  };
  const handleSaveEditReply = async () => {
    if (!editingReplyContent.trim() || !editingReply) return;
    try {
      await editReply(id, editingReply.postId, editingReply.replyId, editingReplyContent.trim());
      setEditingReply(null);
      toast.success('Reply updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update reply');
    }
  };
  const handleDeleteReply = async (postId, replyId) => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      await deleteReply(id, postId, replyId);
      toast.success('Reply deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete reply');
    }
  };

  const handlePin = async (postId) => {
    try {
      await pinPost(id, postId);
      toast.success('Post pinned');
    } catch (err) {
      toast.error(err.message || 'Failed to pin post');
    }
  };

  const handleUnpin = async (postId) => {
    try {
      await unpinPost(id, postId);
      toast.success('Post unpinned');
    } catch (err) {
      toast.error(err.message || 'Failed to unpin post');
    }
  };

  /* ─── Community List View ─── */
  if (!id) {
    return (
      <div className="py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Community Spaces</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Join skill-specific communities and connect with others</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="self-start sm:self-auto px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg transition-all"
          >
            + Create Community
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : communities.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-6xl mb-4">🌐</div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No communities yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Be the first to create a community!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <div
                key={community._id}
                className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
                onClick={() => navigate(`/community/${community._id}`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{community.icon}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">{community.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md">{community.category}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">{community.description || 'No description'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">👥 {community.memberCount || 0} members</span>
                  {community.isMember ? (
                    <span className="text-xs px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-lg font-medium">Joined</span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); joinCommunity(community._id); }}
                      className="text-xs px-3 py-1.5 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 rounded-lg font-medium hover:bg-primary-100 dark:hover:bg-primary-900/40 transition"
                    >
                      Join
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Community Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Community</h3>
              <form onSubmit={handleCreateCommunity} className="space-y-4">
                <div className="flex gap-3">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Icon</label>
                    <select
                      className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-2xl"
                      value={newCommunity.icon}
                      onChange={(e) => setNewCommunity({ ...newCommunity, icon: e.target.value })}
                    >
                      {['💬', '💻', '🎨', '🎵', '📚', '🔬', '🏋️', '📸', '🌍', '🚀'].map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="e.g. React Developers"
                      value={newCommunity.name}
                      onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                  <input
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="e.g. Programming"
                    value={newCommunity.category}
                    onChange={(e) => setNewCommunity({ ...newCommunity, category: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                    rows="3"
                    placeholder="What is this community about?"
                    value={newCommunity.description}
                    onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg transition">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── Single Community View ─── */
  if (!activeCommunity) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const isMember = activeCommunity.members?.some((m) => (m._id || m) === user._id);
  const isCreator = user._id === (activeCommunity.creator?._id || activeCommunity.creator);

  const sortedPosts = activeCommunity.posts ? [...activeCommunity.posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  }) : [];

  return (
    <div className="py-8 max-w-3xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/community')} className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4 inline-block">
        ← Back to Communities
      </button>

      {/* Community header */}
      <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-4xl">{activeCommunity.icon}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{activeCommunity.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{activeCommunity.description}</p>
          </div>
          {isMember ? (
            <button onClick={() => leaveCommunity(activeCommunity._id)} className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition">Leave</button>
          ) : (
            <button onClick={() => joinCommunity(activeCommunity._id)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition">Join Community</button>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span>👥 {activeCommunity.members?.length || 0} members</span>
          <span>📝 {activeCommunity.posts?.length || 0} posts</span>
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">{activeCommunity.category}</span>
        </div>
      </div>

      {/* Create Post */}
      {isMember && (
        <form onSubmit={handleCreatePost} className="mb-6 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
          <textarea
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            rows="3"
            placeholder="Share something with the community..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <button type="submit" disabled={!newPostContent.trim()} className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg transition disabled:opacity-50">
              Post
            </button>
          </div>
        </form>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {(!activeCommunity.posts || activeCommunity.posts.length === 0) ? (
          <div className="py-12 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="text-4xl mb-2">📝</div>
            <p>No posts yet. Be the first to share!</p>
          </div>
        ) : (
          sortedPosts.map((post) => {
            const isPostAuthor = post.author?._id === user._id || post.author === user._id;
            return (
              <div key={post._id} className={`p-5 bg-white dark:bg-gray-900 border rounded-2xl shadow-sm transition-all ${post.isPinned ? 'border-primary-400 dark:border-primary-600 ring-1 ring-primary-100 dark:ring-primary-900/30' : 'border-gray-100 dark:border-gray-800'}`}>
                {post.isPinned && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-3">
                    <span className="p-1 bg-primary-100 dark:bg-primary-900/30 rounded">📌 PINNED</span>
                  </div>
                )}

                {/* Post Header */}
                <div className="flex items-center gap-3 mb-3">
                  <Avatar src={post.author?.avatar} name={post.author?.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{post.author?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(post.createdAt).toLocaleString()}</p>
                  </div>
                  {/* Author edit/delete controls */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isCreator && (
                      <button
                        onClick={() => post.isPinned ? handleUnpin(post._id) : handlePin(post._id)}
                        className={`p-1.5 rounded-lg transition-all ${post.isPinned ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        title={post.isPinned ? 'Unpin' : 'Pin'}
                      >
                        {post.isPinned ? '📌' : '📍'}
                      </button>
                    )}
                    {isPostAuthor && (
                      <>
                        <button
                          onClick={() => handleStartEditPost(post)}
                          className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg transition"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                {editingPostId === post._id ? (
                  <div className="mb-4">
                    <textarea
                      className="w-full px-3 py-2 text-sm border border-primary-300 dark:border-primary-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-400"
                      rows="3"
                      value={editingPostContent}
                      onChange={(e) => setEditingPostContent(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleSaveEditPost(post._id)} className="px-4 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition">Save</button>
                      <button onClick={() => setEditingPostId(null)} className="px-4 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-800 dark:text-gray-200 mb-4 whitespace-pre-wrap">{post.content}</p>
                )}

                {/* Like & Reply buttons */}
                <div className="flex items-center gap-4 text-sm">
                  <button onClick={() => handleLike(post._id)} className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition">
                    {post.likes?.includes(user._id) ? '❤️' : '🤍'} {post.likes?.length || 0}
                  </button>
                  <button onClick={() => setShowReplyFor(showReplyFor === post._id ? null : post._id)} className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition">
                    💬 {post.replies?.length || 0}
                  </button>
                </div>

                {/* Replies */}
                {post.replies && post.replies.length > 0 && (
                  <div className="mt-4 space-y-2 pl-4 border-l-2 border-gray-100 dark:border-gray-800">
                    {post.replies.map((reply) => {
                      const isReplyAuthor = reply.author?._id === user._id || reply.author === user._id;
                      const isEditingThisReply = editingReply?.postId === post._id && editingReply?.replyId === reply._id;
                      return (
                        <div key={reply._id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar src={reply.author?.avatar} name={reply.author?.name} size="xs" />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{reply.author?.name || 'Unknown'}</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(reply.createdAt).toLocaleString()}</span>
                            {isReplyAuthor && (
                              <div className="ml-auto flex gap-1">
                                <button onClick={() => handleStartEditReply(post._id, reply)} className="text-[10px] px-1.5 py-0.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded transition">✏️</button>
                                <button onClick={() => handleDeleteReply(post._id, reply._id)} className="text-[10px] px-1.5 py-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition">🗑️</button>
                              </div>
                            )}
                          </div>
                          {isEditingThisReply ? (
                            <div>
                              <input
                                type="text"
                                className="w-full px-2 py-1.5 text-sm border border-primary-300 dark:border-primary-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-400"
                                value={editingReplyContent}
                                onChange={(e) => setEditingReplyContent(e.target.value)}
                                autoFocus
                              />
                              <div className="flex gap-2 mt-1.5">
                                <button onClick={handleSaveEditReply} className="px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition">Save</button>
                                <button onClick={() => setEditingReply(null)} className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{reply.content}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reply Input */}
                {showReplyFor === post._id && isMember && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a reply..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                      value={replyContent[post._id] || ''}
                      onChange={(e) => setReplyContent({ ...replyContent, [post._id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleReply(post._id)}
                    />
                    <button onClick={() => handleReply(post._id)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition">
                      Reply
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
