import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCommunityStore } from '../store/communityStore';

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
    isLoading,
  } = useCommunityStore();

  const [newPostContent, setNewPostContent] = useState('');
  const [replyContent, setReplyContent] = useState({});
  const [showReplyFor, setShowReplyFor] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunity, setNewCommunity] = useState({ name: '', description: '', category: '', icon: '💬' });

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
    fetchCommunityById(id); // Refresh
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    try {
      await createCommunity(newCommunity.name, newCommunity.description, newCommunity.category, newCommunity.icon);
      setShowCreateModal(false);
      setNewCommunity({ name: '', description: '', category: '', icon: '💬' });
    } catch (err) {
      alert(err.message);
    }
  };

  // Community List View
  if (!id) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Community Spaces</h1>
            <p className="mt-1 text-gray-500">Join skill-specific communities and connect with others</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg transition-all"
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
            <h3 className="text-xl font-semibold text-gray-700">No communities yet</h3>
            <p className="text-gray-500 mt-2">Be the first to create a community!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <div
                key={community._id}
                className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
                onClick={() => navigate(`/community/${community._id}`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{community.icon}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition">{community.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md">{community.category}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{community.description || 'No description'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">👥 {community.memberCount || 0} members</span>
                  {community.isMember ? (
                    <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-medium">Joined</span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        joinCommunity(community._id);
                      }}
                      className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg font-medium hover:bg-primary-100 transition"
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
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create Community</h3>
              <form onSubmit={handleCreateCommunity} className="space-y-4">
                <div className="flex gap-3">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Icon</label>
                    <select
                      className="px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-2xl"
                      value={newCommunity.icon}
                      onChange={(e) => setNewCommunity({ ...newCommunity, icon: e.target.value })}
                    >
                      {['💬', '💻', '🎨', '🎵', '📚', '🔬', '🏋️', '📸', '🌍', '🚀'].map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 text-sm font-medium text-gray-700">Name</label>
                    <input
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50"
                      placeholder="e.g. React Developers"
                      value={newCommunity.name}
                      onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Category</label>
                  <input
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50"
                    placeholder="e.g. Programming"
                    value={newCommunity.category}
                    onChange={(e) => setNewCommunity({ ...newCommunity, category: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50"
                    rows="3"
                    placeholder="What is this community about?"
                    value={newCommunity.description}
                    onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg transition">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Single Community View (with posts)
  if (!activeCommunity) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const isMember = activeCommunity.members?.some((m) => (m._id || m) === user._id);

  return (
    <div className="py-8 max-w-3xl mx-auto">
      {/* Header */}
      <button onClick={() => navigate('/community')} className="text-sm text-primary-600 hover:text-primary-700 mb-4 inline-block">
        ← Back to Communities
      </button>

      <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-4xl">{activeCommunity.icon}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{activeCommunity.name}</h1>
            <p className="text-sm text-gray-500">{activeCommunity.description}</p>
          </div>
          {isMember ? (
            <button
              onClick={() => leaveCommunity(activeCommunity._id)}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-xl hover:bg-red-100 transition"
            >
              Leave
            </button>
          ) : (
            <button
              onClick={() => joinCommunity(activeCommunity._id)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition"
            >
              Join Community
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>👥 {activeCommunity.members?.length || 0} members</span>
          <span>📝 {activeCommunity.posts?.length || 0} posts</span>
          <span className="px-2 py-0.5 bg-gray-100 rounded-md">{activeCommunity.category}</span>
        </div>
      </div>

      {/* Create Post */}
      {isMember && (
        <form onSubmit={handleCreatePost} className="mb-6 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <textarea
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 resize-none"
            rows="3"
            placeholder="Share something with the community..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!newPostContent.trim()}
              className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg transition disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </form>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {(!activeCommunity.posts || activeCommunity.posts.length === 0) ? (
          <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
            <div className="text-4xl mb-2">📝</div>
            <p>No posts yet. Be the first to share!</p>
          </div>
        ) : (
          [...activeCommunity.posts].reverse().map((post) => (
            <div key={post._id} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-indigo-500 text-white rounded-full flex items-center justify-center font-bold">
                  {post.author?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{post.author?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

              <div className="flex items-center gap-4 text-sm">
                <button
                  onClick={() => handleLike(post._id)}
                  className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition"
                >
                  {post.likes?.includes(user._id) ? '❤️' : '🤍'} {post.likes?.length || 0}
                </button>
                <button
                  onClick={() => setShowReplyFor(showReplyFor === post._id ? null : post._id)}
                  className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition"
                >
                  💬 {post.replies?.length || 0}
                </button>
              </div>

              {/* Replies */}
              {post.replies && post.replies.length > 0 && (
                <div className="mt-4 space-y-2 pl-4 border-l-2 border-gray-100">
                  {post.replies.map((reply, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-700">{reply.author?.name || 'Unknown'}</span>
                        <span className="text-xs text-gray-400">{new Date(reply.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-600">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              {showReplyFor === post._id && isMember && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50"
                    value={replyContent[post._id] || ''}
                    onChange={(e) => setReplyContent({ ...replyContent, [post._id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleReply(post._id)}
                  />
                  <button
                    onClick={() => handleReply(post._id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition"
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
