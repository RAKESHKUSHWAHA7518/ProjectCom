import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSessionStore } from '../store/sessionStore';
import { useReviewStore } from '../store/reviewStore';
import Avatar from '../components/Avatar';
import ReviewModal from '../components/ReviewModal';
import {
  Calendar, Clock, Video, CheckCircle, XCircle, MessageSquare, Star,
  Plus, ChevronDown, FileText, BookOpen, Target, ArrowRight,
  Users, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

/* ── Tiny reusable action button ── */
function ActionBtn({ onClick, variant = 'default', icon: Icon, label, fullWidth = false, size = 'sm' }) {
  const base = `flex items-center justify-center gap-1.5 font-semibold rounded-xl transition-all ${fullWidth ? 'w-full' : ''} ${size === 'sm' ? 'py-2 px-3 text-xs' : 'py-2.5 px-4 text-sm'}`;
  const variants = {
    primary:  `${base} text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:shadow-md hover:shadow-primary-500/25 hover:-translate-y-0.5`,
    success:  `${base} text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-md hover:shadow-emerald-500/25 hover:-translate-y-0.5`,
    danger:   `${base} text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50`,
    blue:     `${base} text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-md hover:shadow-blue-500/25 hover:-translate-y-0.5`,
    complete: `${base} text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50`,
    ghost:    `${base} text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700`,
  };
  return (
    <button onClick={onClick} className={variants[variant] || variants.ghost}>
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      {label}
    </button>
  );
}

export default function Sessions() {
  const { user } = useAuthStore();
  const { sessions, fetchSessions, updateSessionStatus, addSessionNote, isLoading } = useSessionStore();
  const { myGivenReviews, fetchMyGivenReviews, createReview } = useReviewStore();

  const [filter, setFilter]                   = useState('all');
  const [activeNoteSession, setActiveNoteSession] = useState(null);
  const [noteContent, setNoteContent]         = useState('');
  const [reviewSession, setReviewSession]     = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
    fetchMyGivenReviews();
  }, [fetchSessions, fetchMyGivenReviews]);

  /* ── Status update helpers ── */
  const handleStatusUpdate = async (sessionId, status) => {
    try {
      await updateSessionStatus(sessionId, status);
      const labels = {
        accepted: 'Session accepted ✓',
        cancelled: 'Session cancelled',
        completed: 'Marked as completed ✓',
        rejected: 'Session declined',
      };
      if (status === 'cancelled' || status === 'rejected') {
        toast.error(labels[status] || `Session ${status}`);
      } else {
        toast.success(labels[status] || `Session ${status}`);
      }
      if (status === 'completed') {
        const s = sessions.find(s => s._id === sessionId);
        if (s) setReviewSession(s);
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to update session');
    }
  };

  const handleReviewSubmit = async (rating, comment) => {
    try {
      await createReview(reviewSession._id, rating, comment);
      toast.success('Review submitted! 🌟');
      setReviewSession(null);
      fetchMyGivenReviews();
    } catch { toast.error('Failed to submit review'); }
  };

  const handleAddNote = async (sessionId) => {
    if (!noteContent.trim()) return;
    try {
      await addSessionNote(sessionId, noteContent, []);
      toast.success('Note saved');
      setNoteContent('');
      setActiveNoteSession(null);
    } catch { toast.error('Failed to add note'); }
  };

  /* ── Counts ── */
  const pendingCount   = sessions.filter(s => s.status === 'pending').length;
  const completedCount = sessions.filter(s => s.status === 'completed').length;
  const activeCount    = sessions.filter(s => s.status === 'accepted').length;
  const allCount       = sessions.length;

  /* ── Filter tabs ── */
  const tabs = [
    { key: 'all',       label: 'All',        count: allCount,       dot: 'bg-gray-400' },
    { key: 'pending',   label: 'Pending',    count: pendingCount,   dot: 'bg-amber-400' },
    { key: 'active',    label: 'Active',     count: activeCount,    dot: 'bg-blue-400' },
    { key: 'completed', label: 'Completed',  count: completedCount, dot: 'bg-emerald-400' },
  ];

  const filteredSessions = sessions.filter(s => {
    if (filter === 'pending')   return s.status === 'pending';
    if (filter === 'active')    return s.status === 'accepted';
    if (filter === 'completed') return s.status === 'completed';
    return true; // 'all'
  });

  /* ── Status config ── */
  const statusConfig = {
    accepted:  { label: 'Active',    color: 'text-blue-700 dark:text-blue-300',       bg: 'bg-blue-50 dark:bg-blue-950/30',       border: 'border-blue-100 dark:border-blue-900/40',       dot: 'bg-blue-500' },
    completed: { label: 'Completed', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-100 dark:border-emerald-900/40',  dot: 'bg-emerald-500' },
    pending:   { label: 'Pending',   color: 'text-amber-700 dark:text-amber-300',     bg: 'bg-amber-50 dark:bg-amber-950/30',     border: 'border-amber-100 dark:border-amber-900/40',     dot: 'bg-amber-500' },
    cancelled: { label: 'Cancelled', color: 'text-gray-600 dark:text-gray-400',       bg: 'bg-gray-100 dark:bg-gray-800',         border: 'border-gray-200 dark:border-gray-700',          dot: 'bg-gray-400' },
    rejected:  { label: 'Declined',  color: 'text-red-700 dark:text-red-300',         bg: 'bg-red-50 dark:bg-red-950/30',         border: 'border-red-100 dark:border-red-900/40',         dot: 'bg-red-500' },
  };

  return (
    <div className="py-6 sm:py-8 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ════════════════════════
            PAGE HEADER
        ════════════════════════ */}
        <div className="flex items-start justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              My Sessions
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {allCount} total · {activeCount} active · {completedCount} completed
            </p>
          </div>
          <button
            onClick={() => navigate('/explore')}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Book Session
          </button>
        </div>

        {/* ════════════════════════
            SUMMARY STAT CARDS
        ════════════════════════ */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all ${
                filter === tab.key
                  ? 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/30 shadow-sm'
                  : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm'
              }`}
            >
              <div className={`text-lg sm:text-2xl font-extrabold mb-0.5 tabular-nums ${filter === tab.key ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
                {tab.count}
              </div>
              <div className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide leading-tight flex items-center gap-1 ${filter === tab.key ? 'text-primary-500 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tab.dot} ${filter === tab.key ? 'opacity-100' : 'opacity-60'}`} />
                {tab.label}
              </div>
            </button>
          ))}
        </div>

        {/* ════════════════════════
            FILTER TAB BAR
        ════════════════════════ */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto scrollbar-hide">
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
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tab.dot}`} />
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full tabular-nums ${
                  filter === tab.key
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ════════════════════════
            SESSION LIST
        ════════════════════════ */}
        {isLoading ? (
          /* Loading skeleton */
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
                  </div>
                  <div className="w-20 h-7 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0" />
                </div>
                <div className="flex gap-2 mt-3">
                  <div className="h-9 flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                  <div className="h-9 flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                </div>
              </div>
            ))}
          </div>

        ) : filteredSessions.length === 0 ? (
          /* Empty state */
          <div className="py-16 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-6">
            <div className="w-16 h-16 mx-auto mb-5 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
              {filter === 'completed'
                ? <Star className="w-8 h-8 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                : filter === 'active'
                  ? <Video className="w-8 h-8 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                  : <Calendar className="w-8 h-8 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
              }
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">
              {filter === 'pending'   ? 'No pending requests'       :
               filter === 'active'    ? 'No active sessions'         :
               filter === 'completed' ? 'No completed sessions yet'  :
               'No sessions yet'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
              {filter === 'pending'   ? 'No session requests awaiting your response.' :
               filter === 'active'    ? 'Accept a pending request to start a session.' :
               filter === 'completed' ? 'Your completed sessions will appear here.' :
               'Book your first session with a mentor to get started.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs mx-auto">
              <button
                onClick={() => navigate('/explore')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <Sparkles className="w-4 h-4" />Find a Mentor
              </button>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  View all
                </button>
              )}
            </div>
          </div>

        ) : (
          /* Session cards */
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              const isMentor     = session.mentor?._id === user._id;
              const other        = isMentor ? session.learner : session.mentor;
              const sessionDate  = new Date(session.scheduledAt);
              const givenReview  = myGivenReviews.find(r =>
                (r.session?._id === session._id) || (r.session === session._id)
              );
              const config       = statusConfig[session.status] || statusConfig.pending;
              const isExpanded   = expandedSession === session._id;
              const canExpand    = session.status === 'completed' || session.status === 'accepted';
              const isPast       = sessionDate < new Date();

              return (
                <div
                  key={session._id}
                  className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-300"
                >
                  {/* ── Card header: avatar + info + status ── */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Avatar with status dot */}
                      <div className="relative shrink-0">
                        <Avatar src={other?.avatar} name={other?.name} size="md" className="rounded-xl shadow-sm" />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${config.dot}`} />
                      </div>

                      {/* Name, skill, date */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white leading-tight truncate">
                                {other?.name || 'Unknown User'}
                              </h3>
                              <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 ${
                                isMentor
                                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                              }`}>
                                {isMentor ? 'Mentoring' : 'Learning'}
                              </span>
                            </div>
                            {session.skill?.name && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                <BookOpen className="w-3 h-3 shrink-0" />
                                <span className="truncate">{session.skill.name}</span>
                              </p>
                            )}
                          </div>

                          {/* Status badge — always visible */}
                          <span className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold rounded-xl border shrink-0 ${config.color} ${config.bg} ${config.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                            {config.label}
                          </span>
                        </div>

                        {/* Date + time chips */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                            <Clock className="w-3 h-3 shrink-0" />
                            {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isPast && session.status === 'accepted' && (
                            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded-lg border border-orange-100 dark:border-orange-900/40">
                              Past due
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── Action buttons ── */}
                    <div className="flex flex-wrap gap-2 mt-4">

                      {/* PENDING — Mentor: Accept / Decline */}
                      {session.status === 'pending' && isMentor && (
                        <>
                          <ActionBtn onClick={() => handleStatusUpdate(session._id, 'accepted')} variant="success" icon={CheckCircle} label="Accept" size="sm" />
                          <ActionBtn onClick={() => handleStatusUpdate(session._id, 'rejected')} variant="danger" icon={XCircle} label="Decline" size="sm" />
                        </>
                      )}

                      {/* PENDING — Learner: Cancel their own request */}
                      {session.status === 'pending' && !isMentor && (
                        <>
                          <span className="flex-1 flex items-center gap-1.5 px-3 py-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/40 font-semibold">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            Awaiting mentor response
                          </span>
                          <ActionBtn onClick={() => handleStatusUpdate(session._id, 'cancelled')} variant="danger" icon={XCircle} label="Cancel Request" size="sm" />
                        </>
                      )}

                      {/* ACCEPTED — Both: Join Room */}
                      {session.status === 'accepted' && (
                        <>
                          <ActionBtn
                            onClick={() => navigate(`/video/${session._id}`)}
                            variant="blue"
                            icon={Video}
                            label="Join Room"
                            fullWidth={false}
                            size="sm"
                          />
                          {/* Mark complete — either party can do this */}
                          <ActionBtn
                            onClick={() => handleStatusUpdate(session._id, 'completed')}
                            variant="complete"
                            icon={CheckCircle}
                            label="Mark Complete"
                            size="sm"
                          />
                          <ActionBtn
                            onClick={() => navigate('/chat')}
                            variant="ghost"
                            icon={MessageSquare}
                            label="Message"
                            size="sm"
                          />
                        </>
                      )}

                      {/* COMPLETED — Message + Leave Review */}
                      {session.status === 'completed' && (
                        <>
                          {!givenReview && (
                            <ActionBtn
                              onClick={() => setReviewSession(session)}
                              variant="primary"
                              icon={Star}
                              label="Leave Review"
                              size="sm"
                            />
                          )}
                          <ActionBtn
                            onClick={() => navigate('/chat')}
                            variant="ghost"
                            icon={MessageSquare}
                            label="Message"
                            size="sm"
                          />
                        </>
                      )}

                      {/* CANCELLED / REJECTED */}
                      {(session.status === 'cancelled' || session.status === 'rejected') && (
                        <>
                          <ActionBtn
                            onClick={() => navigate('/explore')}
                            variant="primary"
                            icon={ArrowRight}
                            label="Book Again"
                            size="sm"
                          />
                          <ActionBtn
                            onClick={() => navigate('/chat')}
                            variant="ghost"
                            icon={MessageSquare}
                            label="Message"
                            size="sm"
                          />
                        </>
                      )}

                      {/* Expand toggle for accepted/completed */}
                      {canExpand && (
                        <button
                          onClick={() => setExpandedSession(isExpanded ? null : session._id)}
                          className="flex items-center gap-1 ml-auto px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
                          aria-label="Toggle details"
                        >
                          <span className="hidden sm:inline">Details</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Notes preview (when collapsed) ── */}
                  {session.notes && !isExpanded && (
                    <div className="px-4 sm:px-5 pb-4 -mt-1">
                      <div className="px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Session Goals</p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">{session.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* ── Expanded detail panel ── */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/20">
                      <div className="px-4 sm:px-5 py-4 sm:py-5 space-y-5">

                        {/* Session Goals */}
                        {session.notes && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <Target className="w-3 h-3" />Session Goals
                            </p>
                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800 leading-relaxed">
                              {session.notes}
                            </p>
                          </div>
                        )}

                        {/* Review section (completed only) */}
                        {session.status === 'completed' && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <Star className="w-3 h-3" />Review
                            </p>
                            {givenReview ? (
                              <div className="flex items-start justify-between gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div className="flex-1 min-w-0">
                                  {givenReview.comment
                                    ? <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">"{givenReview.comment}"</p>
                                    : <p className="text-xs sm:text-sm text-gray-400 italic">No comment provided</p>
                                  }
                                  <p className="text-[10px] text-gray-400 mt-1.5">Your review</p>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`w-3.5 h-3.5 ${i < givenReview.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'}`} />
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setReviewSession(session)}
                                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30 hover:bg-primary-100 dark:hover:bg-primary-950/50 rounded-xl border border-primary-100 dark:border-primary-900/40 transition-all"
                              >
                                <Star className="w-4 h-4" />Leave a Review
                              </button>
                            )}
                          </div>
                        )}

                        {/* Shared Notes */}
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <FileText className="w-3 h-3" />Shared Notes
                          </p>

                          {session.sharedNotes?.length > 0 && (
                            <div className="space-y-2 mb-3">
                              {session.sharedNotes.map((note, idx) => (
                                <div key={idx} className="p-3.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                                      {note.user?.name?.charAt(0) || '?'}
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{note.user?.name}</span>
                                    <span className="text-[10px] text-gray-400 ml-auto shrink-0">{new Date(note.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{note.content}</p>
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
                                placeholder="Add a note, resource link, or key takeaway..."
                                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-all"
                                rows={3}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => { setActiveNoteSession(null); setNoteContent(''); }}
                                  className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleAddNote(session._id)}
                                  disabled={!noteContent.trim()}
                                  className="px-4 py-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors"
                                >
                                  Save Note
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setActiveNoteSession(session._id)}
                              className="w-full py-2.5 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 rounded-xl hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition-all flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" />Add a Note
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Review Modal ── */}
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
