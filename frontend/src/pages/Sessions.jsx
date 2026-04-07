import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSessionStore } from '../store/sessionStore';
import { useReviewStore } from '../store/reviewStore';

export default function Sessions() {
  const { user } = useAuthStore();
  const { sessions, fetchSessions, updateSessionStatus, isLoading } = useSessionStore();
  const { createReview } = useReviewStore();
  const [filter, setFilter] = useState('');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    fetchSessions(filter || undefined);
  }, [filter, fetchSessions]);

  const handleStatusUpdate = async (sessionId, status) => {
    try {
      await updateSessionStatus(sessionId, status);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewModal) return;
    try {
      await createReview(reviewModal._id, reviewRating, reviewComment);
      setReviewModal(null);
      setReviewRating(5);
      setReviewComment('');
      alert('Review submitted!');
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      accepted: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      completed: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      cancelled: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800',
    };
    return styles[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
  };

  const getStatusIcon = (status) => {
    const icons = { pending: '⏳', accepted: '✅', completed: '🎉', cancelled: '❌' };
    return icons[status] || '📌';
  };

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Sessions</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Track your learning and mentoring sessions</p>
        </div>
        <div className="flex gap-2">
          {['', 'pending', 'accepted', 'completed', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                filter === f
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {f || 'All'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No sessions yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Book a session from the Explore page to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const isMentor = session.mentor?._id === user._id;
            const otherPerson = isMentor ? session.learner : session.mentor;
            const role = isMentor ? 'Mentoring' : 'Learning';

            return (
              <div key={session._id} className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 ${isMentor ? 'bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/40 dark:to-blue-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 text-emerald-600 dark:text-emerald-400'}`}>
                      {otherPerson?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 dark:text-white">{otherPerson?.name || 'Unknown'}</h3>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${getStatusBadge(session.status)}`}>
                          {getStatusIcon(session.status)} {session.status}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${isMentor ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                          {role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {session.skill?.name} • {session.skill?.category}
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                        📅 {new Date(session.scheduledAt).toLocaleString()}
                      </p>
                      {session.notes && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">"{session.notes}"</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    {isMentor && session.status === 'pending' && (
                      <button onClick={() => handleStatusUpdate(session._id, 'accepted')} className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition">Accept</button>
                    )}
                    {isMentor && session.status === 'accepted' && (
                      <button onClick={() => handleStatusUpdate(session._id, 'completed')} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition">Mark Complete</button>
                    )}
                    {session.status === 'accepted' && session.meetingLink && (
                      <a href={`/video/${session.meetingLink}`} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl hover:shadow-lg transition">🎥 Join Call</a>
                    )}
                    {session.status === 'completed' && (
                      <button onClick={() => setReviewModal(session)} className="px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900/60 transition">⭐ Leave Review</button>
                    )}
                    {(session.status === 'pending' || session.status === 'accepted') && (
                      <button onClick={() => handleStatusUpdate(session._id, 'cancelled')} className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition">Cancel</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Leave a Review</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              How was your session with {reviewModal.mentor?._id === user._id ? reviewModal.learner?.name : reviewModal.mentor?.name}?
            </p>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className={`text-3xl transition-transform hover:scale-110 ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Comment (optional)</label>
              <textarea
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                rows="3"
                placeholder="Share your experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setReviewModal(null); setReviewRating(5); setReviewComment(''); }} className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition">Cancel</button>
              <button onClick={handleSubmitReview} className="flex-1 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg transition">Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
