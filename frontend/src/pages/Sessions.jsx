import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSessionStore } from '../store/sessionStore';
import { useReviewStore } from '../store/reviewStore';
import Avatar from '../components/Avatar';
import ReviewModal from '../components/ReviewModal';
import {
  Calendar, Clock, Video, CheckCircle, XCircle, MessageSquare, Star,
  Plus, ChevronDown, FileText, BookOpen, Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Sessions() {
  const { user } = useAuthStore();
  const { sessions, fetchSessions, updateSessionStatus, addSessionNote, isLoading } = useSessionStore();
  const { myGivenReviews, fetchMyGivenReviews, createReview } = useReviewStore();
  const [filter, setFilter] = useState('pending');
  const [activeNoteSession, setActiveNoteSession] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [reviewSession, setReviewSession] = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchSessions(); fetchMyGivenReviews(); }, [fetchSessions, fetchMyGivenReviews]);

  const handleStatusUpdate = async (sessionId, status) => {
    try {
      await updateSessionStatus(sessionId, status);
      toast.success(`Session ${status}`);
      if (status === 'completed') {
        const s = sessions.find(s => s._id === sessionId);
        if (s) setReviewSession(s);
      }
    } catch { toast.error('Failed to update status'); }
  };

  const handleReviewSubmit = async (rating, comment) => {
    try {
      await createReview(reviewSession._id, rating, comment);
      toast.success('Review submitted!');
      setReviewSession(null);
      fetchMyGivenReviews();
    } catch { toast.error('Failed to submit review'); }
  };

  const handleAddNote = async (sessionId) => {
    if (!noteContent.trim()) return;
    try {
      await addSessionNote(sessionId, noteContent, []);
      toast.success('Note added');
      setNoteContent('');
      setActiveNoteSession(null);
    } catch { toast.error('Failed to add note'); }
  };

  const pendingCount   = sessions.filter(s => s.status === 'pending').length;
  const completedCount = sessions.filter(s => s.status === 'completed').length;
  const otherCount     = sessions.filter(s => s.status !== 'completed' && s.status !== 'pending').length;

  const filteredSessions = sessions.filter(s => {
    if (filter === 'pending')     return s.status === 'pending';
    if (filter === 'completed')   return s.status === 'completed';
    if (filter === 'uncompleted') return s.status !== 'completed' && s.status !== 'pending';
    return true;
  });

  const tabs = [
    { key: 'pending',     label: 'Pending',     shortLabel: 'Pend',  count: pendingCount,   dot: 'bg-amber-400' },
    { key: 'completed',   label: 'Completed',   shortLabel: 'Done',  count: completedCount, dot: 'bg-emerald-400' },
    { key: 'uncompleted', label: 'In Progress', shortLabel: 'Active',count: otherCount,     dot: 'bg-blue-400' },
  ];

  const statusConfig = {
    accepted:  { label: 'Accepted',  color: 'text-blue-700 dark:text-blue-300',    bg: 'bg-blue-50 dark:bg-blue-950/30',    border: 'border-blue-100 dark:border-blue-900/40',    dot: 'bg-blue-500'    },
    completed: { label: 'Completed', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-100 dark:border-emerald-900/40', dot: 'bg-emerald-500' },
    pending:   { label: 'Pending',   color: 'text-amber-700 dark:text-amber-300',   bg: 'bg-amber-50 dark:bg-amber-950/30',   border: 'border-amber-100 dark:border-amber-900/40',   dot: 'bg-amber-500'   },
    cancelled: { label: 'Cancelled', color: 'text-red-700 dark:text-red-300',      bg: 'bg-red-50 dark:bg-red-950/30',      border: 'border-red-100 dark:border-red-900/40',      dot: 'bg-red-500'     },
    rejected:  { label: 'Rejected',  color: 'text-red-700 dark:text-red-300',      bg: 'bg-red-50 dark:bg-red-950/30',      border: 'border-red-100 dark:border-red-900/40',      dot: 'bg-red-500'     },
  };

  return (
    <div className="py-6 sm:py-8 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Sessions
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {sessions.length} total · {completedCount} completed
            </p>
          </div>
          <button
            onClick={() => navigate('/explore')}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Book </span>Session
          </button>
        </div>

        {/* ── Summary stat cards ── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all ${
                filter === tab.key
                  ? 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/30 shadow-sm'
                  : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700'
              }`}
            >
              <div className={`text-xl sm:text-2xl font-extrabold mb-0.5 ${filter === tab.key ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
                {tab.count}
              </div>
              <div className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide leading-tight ${filter === tab.key ? 'text-primary-500 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* ── Tab bar ── */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-5 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                filter === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                  filter === tab.key ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Session list ── */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-[3px] border-primary-100 dark:border-primary-900 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4">
            <div className="w-14 h-14 mx-auto mb-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">
              {filter === 'pending' ? 'No pending sessions' : filter === 'completed' ? 'No completed sessions yet' : 'No sessions in progress'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
              {filter === 'pending' ? 'No session requests awaiting response.' : filter === 'completed' ? 'Complete your first session to see it here.' : 'No accepted sessions right now.'}
            </p>
            <button onClick={() => navigate('/explore')} className="btn-primary mx-auto inline-flex text-sm py-2.5 px-5">
              Find a Mentor
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredSessions.map((session) => {
              const isMentor  = session.mentor?._id === user._id;
              const other     = isMentor ? session.learner : session.mentor;
              const sessionDate = new Date(session.scheduledAt);
              const givenReview = myGivenReviews.find(r => (r.session?._id === session._id) || (r.session === session._id));
              const config    = statusConfig[session.status] || statusConfig.pending;
              const isExpanded = expandedSession === session._id;

              return (
                <div
                  key={session._id}
                  className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md transition-all duration-300"
                >
                  {/* ── Main card body ── */}
                  <div className="p-4 sm:p-5">

                    {/* Top row: avatar + name/skill + status badge */}
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar src={other?.avatar} name={other?.name} size="md" className="rounded-xl shadow-sm shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white leading-tight truncate">{other?.name || 'User'}</h3>
                              <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 ${
                                isMentor ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                              }`}>
                                {isMentor ? 'Mentoring' : 'Learning'}
                              </span>
                            </div>
                            {session.skill?.name && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <BookOpen className="w-3 h-3 shrink-0" /><span className="truncate">{session.skill.name}</span>
                              </p>
                            )}
                          </div>
                          {/* Status badge — text hidden on xs */}
                          <span className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl border shrink-0 ${config.color} ${config.bg} ${config.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
                            <span className="hidden sm:inline">{config.label}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Date / time row */}
                    <div className="flex items-center gap-3 sm:gap-5 mb-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        {sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Action buttons — stacked on xs, row on sm+ */}
                    <div className="flex flex-col xs:flex-row gap-2">
                      {session.status === 'pending' && isMentor ? (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(session._id, 'accepted')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:shadow-md hover:shadow-emerald-500/25 transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Accept
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(session._id, 'cancelled')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/50 transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Decline
                          </button>
                        </>
                      ) : session.status === 'accepted' ? (
                        <>
                          <button
                            onClick={() => navigate(`/video/${session._id}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-md hover:shadow-blue-500/25 transition-all"
                          >
                            <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Join Room
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(session._id, 'completed')}
                            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 rounded-xl transition-all"
                            title="Mark complete"
                          >
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Complete</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => navigate('/chat')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Message
                        </button>
                      )}

                      {/* Expand toggle — only for accepted/completed */}
                      {(session.status === 'completed' || session.status === 'accepted') && (
                        <button
                          onClick={() => setExpandedSession(isExpanded ? null : session._id)}
                          className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
                          aria-label="Toggle details"
                        >
                          <span className="hidden sm:inline">Details</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notes preview (collapsed) */}
                  {session.notes && !isExpanded && (
                    <div className="px-4 sm:px-5 pb-4">
                      <div className="px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Goals</p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{session.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-800 px-4 sm:px-5 py-4 sm:py-5 space-y-4 bg-gray-50/50 dark:bg-gray-800/20">

                      {/* Goals */}
                      {session.notes && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                            <Target className="w-3 h-3" />Session Goals
                          </p>
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-gray-100 dark:border-gray-800">
                            {session.notes}
                          </p>
                        </div>
                      )}

                      {/* Review */}
                      {session.status === 'completed' && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                            <Star className="w-3 h-3" />Review
                          </p>
                          {givenReview ? (
                            <div className="flex items-start justify-between gap-3 p-3 sm:p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                              <div className="flex-1 min-w-0">
                                {givenReview.comment
                                  ? <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 italic">"{givenReview.comment}"</p>
                                  : <p className="text-xs sm:text-sm text-gray-400 italic">No comment provided</p>
                                }
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-3 sm:w-4 h-3 sm:h-4 ${i < givenReview.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'}`} />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReviewSession(session)}
                              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30 hover:bg-primary-100 dark:hover:bg-primary-950/50 rounded-xl border border-primary-100 dark:border-primary-900/40 transition-all"
                            >
                              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Leave a Review
                            </button>
                          )}
                        </div>
                      )}

                      {/* Shared Notes */}
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                          <FileText className="w-3 h-3" />Shared Notes
                        </p>

                        {session.sharedNotes?.length > 0 && (
                          <div className="space-y-2 mb-2">
                            {session.sharedNotes.map((note, idx) => (
                              <div key={idx} className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                                    {note.user?.name?.charAt(0) || '?'}
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{note.user?.name}</span>
                                  <span className="text-[10px] text-gray-400 shrink-0">{new Date(note.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{note.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {activeNoteSession === session._id ? (
                          <div className="space-y-2">
                            <textarea
                              autoFocus
                              value={noteContent}
                              onChange={(e) => setNoteContent(e.target.value)}
                              placeholder="Add a note or resource link..."
                              className="w-full px-3 sm:px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-all"
                              rows={3}
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setActiveNoteSession(null); setNoteContent(''); }} className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                                Cancel
                              </button>
                              <button onClick={() => handleAddNote(session._id)} className="px-3 sm:px-4 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setActiveNoteSession(session._id)}
                            className="w-full py-2.5 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 border border-dashed border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 rounded-xl hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition-all flex items-center justify-center gap-1.5"
                          >
                            + Add Note
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReviewModal
        isOpen={!!reviewSession}
        onClose={() => setReviewSession(null)}
        onSubmit={handleReviewSubmit}
        session={reviewSession}
        isMentor={reviewSession?.mentor?._id === user._id}
      />
    </div>
  );
}
