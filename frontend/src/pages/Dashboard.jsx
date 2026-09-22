import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSkillStore } from '../store/skillStore';
import { useSessionStore } from '../store/sessionStore';
import { CATEGORIES, SKILLS_BY_CATEGORY } from '../data/skillsData';
import toast from 'react-hot-toast';
import {
  Search, MessageCircle, Trophy, Globe, Calendar, Coins, Check, X,
  Star, Zap, ArrowRight, BarChart2, TrendingUp, Target,
  Clock, Users, BookOpen, User, ChevronDown, Plus, ArrowUpRight,
  Layers, Video, CheckCircle, Sparkles
} from 'lucide-react';
import Avatar from '../components/Avatar';
import SessionScheduler from '../components/SessionScheduler';
import OnboardingTour from '../components/OnboardingTour';
import WeeklyChallenges from '../components/WeeklyChallenges';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */
function StatCard({ stat }) {
  const CardWrapper = stat.to ? Link : 'div';
  return (
    <CardWrapper
      to={stat.to}
      className="relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 overflow-hidden hover:shadow-xl hover:border-primary-500/30 dark:hover:border-primary-500/20 transition-all duration-300 group hover:-translate-y-1 block cursor-pointer shadow-xs"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${stat.hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110 duration-300 shadow-xs`}>
            <stat.icon className={`w-5 h-5 ${stat.iconColor}`} strokeWidth={2} />
          </div>
          <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg ${stat.badgeBg} ${stat.badgeText} border border-current/10 flex items-center gap-1`}>
            {stat.badge}
          </span>
        </div>
        <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1">
          {stat.value}
        </p>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
      </div>
    </CardWrapper>
  );
}

/* ─────────────────────────────────────────
   SESSION ROW
───────────────────────────────────────── */
function SessionRow({ session, userId, onAccept, onReject, onJoin }) {
  const isMentor = session.mentor?._id === userId;
  const other    = isMentor ? session.learner : session.mentor;

  const statusMap = {
    completed: { label: 'Completed', dot: 'bg-emerald-400', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50' },
    pending:   { label: 'Pending',   dot: 'bg-amber-400',   cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50' },
    accepted:  { label: 'Accepted',  dot: 'bg-blue-400',    cls: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50' },
    cancelled: { label: 'Cancelled', dot: 'bg-gray-400',    cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-200/50 dark:border-gray-700/50' },
    rejected:  { label: 'Rejected',  dot: 'bg-red-400',     cls: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border-red-200/50 dark:border-red-800/50' },
  };
  const st = statusMap[session.status] || statusMap.pending;

  return (
    <div className="flex items-center gap-3.5 px-4 sm:px-5 py-3.5 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-all rounded-xl my-1 group">
      <div className="relative shrink-0">
        <Avatar src={other?.avatar} name={other?.name} size="md" className="rounded-xl shadow-sm" />
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${st.dot}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{other?.name || 'Partner'}</p>
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
            {isMentor ? 'Learner' : 'Mentor'}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
          <BookOpen className="w-3.5 h-3.5 text-primary-500 shrink-0" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">{session.skill?.name || 'General Session'}</span>
          <span>·</span>
          <span>{new Date(session.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wide border ${st.cls}`}>
          {st.label}
        </span>
        {session.status === 'pending' && isMentor && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onAccept(session._id)}
              className="p-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors shadow-xs"
              title="Accept Session"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => onReject(session._id)}
              className="p-1.5 text-red-500 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors shadow-xs"
              title="Decline Session"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {session.status === 'accepted' && (
          <button
            onClick={() => onJoin(session._id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-primary-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 rounded-xl transition-all hover:scale-105 active:scale-95"
          >
            <Video className="w-3.5 h-3.5" />Join Call
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MENTOR CARD
───────────────────────────────────────── */
function MentorCard({ match, onBook }) {
  const isMutual = match.isMutualSwap;
  return (
    <div className={`relative p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
      isMutual
        ? 'border-emerald-500/30 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-gray-900 shadow-xs'
        : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/80 hover:border-primary-500/30 dark:hover:border-primary-500/20 shadow-xs'
    }`}>
      {/* Mutual badge */}
      {isMutual && (
        <span className="absolute top-3.5 right-3.5 flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/50 rounded-full border border-emerald-300 dark:border-emerald-700 shadow-xs">
          <Zap className="w-2.5 h-2.5 fill-emerald-500" />Mutual Swap
        </span>
      )}

      {/* Avatar + info */}
      <div className="flex items-center gap-3.5 mb-3.5">
        <Avatar src={match.user?.avatar} name={match.user?.name} size="md" className="rounded-xl shadow-md shrink-0 ring-2 ring-white/10" />
        <div className="flex-1 min-w-0 pr-12">
          <p className="font-extrabold text-sm text-gray-900 dark:text-white truncate">{match.user?.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{match.user?.rating?.toFixed(1) || '5.0'}</span>
            {match.user?.numReviews > 0 ? (
              <span className="text-[10px] text-gray-400 font-medium">({match.user.numReviews} reviews)</span>
            ) : (
              <span className="text-[10px] text-emerald-500 font-semibold">New mentor</span>
            )}
          </div>
        </div>
      </div>

      {/* Skills */}
      {match.matchedSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {match.matchedSkills.slice(0, 3).map((s, i) => (
            <span key={s?._id || i} className="px-2.5 py-0.5 text-xs font-semibold bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700">
              {s?.name || s}
            </span>
          ))}
        </div>
      )}

      {/* Book button */}
      <button
        onClick={() => onBook(match)}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-primary-500/25 hover:opacity-95 transition-all"
      >
        <Calendar className="w-3.5 h-3.5" />Book Session
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   DASHBOARD PAGE
───────────────────────────────────────── */
export default function Dashboard() {
  const navigate   = useNavigate();
  const { user, refreshUser } = useAuthStore();
  const { skills, matches, fetchMySkills, addSkill, deleteSkill, fetchMatches } = useSkillStore();
  const { sessions, fetchSessions, updateSessionStatus } = useSessionStore();

  const [newSkill, setNewSkill]         = useState({ name: '', category: '', type: 'teach', proficiencyLevel: 'beginner' });
  const [customSkillName, setCustomSkillName] = useState('');
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showBooking, setShowBooking]   = useState(false);
  const [selectedMentor, setSelectedMentor]             = useState(null);
  const [selectedSkillForBooking, setSelectedSkillForBooking] = useState(null);
  const [selectedMentorSkills, setSelectedMentorSkills] = useState([]);
  const [personalStats, setPersonalStats] = useState(null);
  const [activeSkillTab, setActiveSkillTab] = useState('teach');

  useEffect(() => {
    if (refreshUser) refreshUser();
    fetchMySkills();
    fetchMatches();
    fetchSessions();
  }, [fetchMySkills, fetchMatches, fetchSessions, refreshUser]);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API_URL}/stats/me`, { headers: { Authorization: `Bearer ${user.token}` } });
        const d = await r.json();
        if (r.ok) setPersonalStats(d);
      } catch (e) { console.error(e); }
    };
    if (user?.token) load();
  }, [user]);

  const handleOpenBooking = (match) => {
    setSelectedMentor(match.user);
    setSelectedMentorSkills(match.matchedSkills || []);
    setSelectedSkillForBooking(match.matchedSkills?.[0] || null);
    setShowBooking(true);
  };

  const handleAccept   = async (id) => { await updateSessionStatus(id, 'accepted');  toast.success('Session accepted!'); };
  const handleReject   = async (id) => { await updateSessionStatus(id, 'rejected');  toast.error('Session declined'); };
  const handleJoin     = (id)       => navigate(`/video/${id}`);

  const recentSessions = sessions.slice(0, 5);
  const pendingCount   = sessions.filter(s => s.status === 'pending').length;
  const completedCount = sessions.filter(s => s.status === 'completed').length;
  const teachSkills    = skills.filter(s => s.type === 'teach');
  const learnSkills    = skills.filter(s => s.type === 'learn');
  const activeSkills   = activeSkillTab === 'teach' ? teachSkills : learnSkills;

  const statCards = [
    {
      label: 'Skill Credits', value: user?.skillCredits || 0,
      icon: Coins,
      to: '/profile',
      bg: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-500 dark:text-amber-400',
      badge: 'Wallet', badgeBg: 'bg-amber-50 dark:bg-amber-950/40', badgeText: 'text-amber-600 dark:text-amber-400',
      hoverGradient: 'from-amber-500/5 to-orange-500/5',
    },
    {
      label: 'Skills Teaching', value: teachSkills.length,
      icon: BookOpen,
      to: '/profile',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30', iconColor: 'text-indigo-500 dark:text-indigo-400',
      badge: teachSkills.length > 0 ? 'Active' : 'Add skills',
      badgeBg: teachSkills.length > 0 ? 'bg-indigo-50 dark:bg-indigo-950/40' : 'bg-gray-100 dark:bg-gray-800',
      badgeText: teachSkills.length > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500',
      hoverGradient: 'from-indigo-500/5 to-purple-500/5',
    },
    {
      label: 'Pending Sessions', value: pendingCount,
      icon: Clock,
      to: '/sessions',
      bg: 'bg-orange-50 dark:bg-orange-950/30', iconColor: 'text-orange-500 dark:text-orange-400',
      badge: pendingCount > 0 ? 'Action needed' : 'All clear',
      badgeBg: pendingCount > 0 ? 'bg-orange-50 dark:bg-orange-950/40' : 'bg-emerald-50 dark:bg-emerald-950/40',
      badgeText: pendingCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400',
      hoverGradient: 'from-orange-500/5 to-amber-500/5',
    },
    {
      label: 'Sessions Done', value: completedCount,
      icon: CheckCircle,
      to: '/sessions',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-500 dark:text-emerald-400',
      badge: completedCount > 0 ? `${completedCount} total` : 'Start now',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40', badgeText: 'text-emerald-600 dark:text-emerald-400',
      hoverGradient: 'from-emerald-500/5 to-teal-500/5',
    },
  ];

  return (
    <div className="py-6 sm:py-8 lg:py-10 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ══════════════════════════════════
            HERO GREETING BANNER
        ══════════════════════════════════ */}
        <div className="relative bg-gradient-to-r from-gray-900 via-gray-900 to-indigo-950/40 border border-gray-800/80 rounded-3xl p-6 sm:p-7 shadow-xl overflow-hidden mb-8 backdrop-blur-md">
          {/* Ambient background glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <Avatar
                  src={user?.avatar}
                  name={user?.name}
                  size="xl"
                  className="rounded-2xl ring-2 ring-primary-500/30 shadow-xl"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-gray-900 shadow-sm" />
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    Good to see you, {user?.name?.split(' ')[0] || 'User'}! 👋
                  </h1>
                  {user?.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                  {user?.role === 'admin' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
                  {pendingCount > 0
                    ? `You have ${pendingCount} pending session request${pendingCount > 1 ? 's' : ''} awaiting your action.`
                    : `Exchange skills, book mentor sessions, and level up your knowledge.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <Link
                to="/explore"
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/35 hover:-translate-y-0.5 transition-all"
              >
                <Search className="w-4 h-4" />Find Mentors
              </Link>
              <Link
                to="/sessions"
                className="relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-200 bg-gray-800/80 hover:bg-gray-800 border border-gray-700/80 rounded-xl hover:-translate-y-0.5 transition-all shadow-sm"
              >
                <Calendar className="w-4 h-4 text-indigo-400" />Sessions
                {pendingCount > 0 && (
                  <span className="w-5 h-5 bg-amber-500 text-white rounded-full text-[10px] font-black flex items-center justify-center -mr-1">
                    {pendingCount}
                  </span>
                )}
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-200 bg-gray-800/80 hover:bg-gray-800 border border-gray-700/80 rounded-xl hover:-translate-y-0.5 transition-all shadow-sm"
              >
                <User className="w-4 h-4 text-emerald-400" />Profile
              </Link>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════
            STAT CARDS
        ══════════════════════════════════ */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-8">
          {statCards.map((s, i) => <StatCard key={i} stat={s} />)}
        </div>

        {/* ══════════════════════════════════
            ANALYTICS (IF AVAILABLE)
        ══════════════════════════════════ */}
        {personalStats && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden mb-8 shadow-xs">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center shrink-0">
                  <BarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-600 dark:text-primary-400" />
                </div>
                Performance Analytics
              </h2>
              <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />Last 6 months
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-800">
              {/* Sessions bar chart */}
              <div className="p-4 sm:p-6">
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Sessions Over Time</p>
                <div className="flex items-end gap-2 sm:gap-3 h-28 sm:h-36">
                  {personalStats.sessionsOverTime?.length > 0 ? (
                    personalStats.sessionsOverTime.map((item, idx) => {
                      const max = Math.max(...personalStats.sessionsOverTime.map(i => i.count), 1);
                      const h   = Math.max((item.count / max) * 100, 5);
                      const mo  = new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'short' });
                      return (
                        <div key={idx} className="flex-1 flex flex-col justify-end items-center gap-1.5 h-full group relative cursor-default">
                          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg pointer-events-none">
                            {item.count} session{item.count !== 1 ? 's' : ''}
                          </div>
                          <div
                            className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-400 group-hover:from-primary-500 group-hover:to-primary-300 transition-all duration-300"
                            style={{ height: `${h}%` }}
                          />
                          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 shrink-0">{mo}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center gap-2">
                      <BarChart2 className="w-10 h-10 text-gray-200 dark:text-gray-700" strokeWidth={1} />
                      <p className="text-xs text-gray-400">No session data yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Skill demand */}
              <div className="p-4 sm:p-6">
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Top Skill Demand</p>
                {personalStats.skillPopularity?.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {personalStats.skillPopularity.slice(0, 5).map((skill, idx) => {
                      const max = Math.max(...personalStats.skillPopularity.map(s => s.count), 1);
                      const w   = `${(skill.count / max) * 100}%`;
                      const colors = [
                        'from-primary-500 to-indigo-400',
                        'from-emerald-500 to-teal-400',
                        'from-amber-500 to-orange-400',
                        'from-purple-500 to-pink-400',
                        'from-blue-500 to-cyan-400',
                      ];
                      return (
                        <div key={idx}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 truncate pr-3">{skill.name}</span>
                            <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0 tabular-nums">{skill.count} req</span>
                          </div>
                          <div className="h-1.5 sm:h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${colors[idx]} rounded-full transition-all duration-700`} style={{ width: w }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-28 sm:h-36 gap-2">
                    <TrendingUp className="w-10 h-10 text-gray-200 dark:text-gray-700" strokeWidth={1} />
                    <p className="text-xs text-gray-400 text-center">Add skills you teach to see demand</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            MAIN ASYMMETRIC GRID
        ══════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-8">

          {/* ── LEFT / MAIN COLUMN (7 cols): Recent Sessions + Skills Portfolio ── */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">

            {/* CARD 1: RECENT SESSIONS */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white leading-none">
                      Recent Sessions
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Your upcoming and previous mentorship calls</p>
                  </div>
                </div>
                <Link
                  to="/sessions"
                  className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Mini stat pills */}
              <div className="grid grid-cols-3 gap-2 px-5 py-3 bg-gray-50/60 dark:bg-gray-850/30 border-b border-gray-100 dark:border-gray-800">
                {[
                  { label: 'Total', value: sessions.length, cls: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200/60 dark:border-gray-700/60' },
                  { label: 'Pending', value: pendingCount, cls: 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60' },
                  { label: 'Completed', value: completedCount, cls: 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60' },
                ].map(p => (
                  <Link
                    key={p.label}
                    to="/sessions"
                    className={`flex flex-col items-center py-2 px-3 rounded-xl border ${p.cls} hover:scale-[1.02] transition-transform`}
                  >
                    <span className="text-lg font-black tabular-nums leading-tight">{p.value}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">{p.label}</span>
                  </Link>
                ))}
              </div>

              {/* Sessions list */}
              {recentSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">No sessions booked yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Connect with a peer or mentor to schedule your first swap</p>
                  </div>
                  <Link
                    to="/explore"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-500 rounded-xl transition-all shadow-md shadow-primary-500/20"
                  >
                    Browse Mentors <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="p-2 divide-y divide-gray-100 dark:divide-gray-800/60">
                  {recentSessions.map(session => (
                    <SessionRow
                      key={session._id}
                      session={session}
                      userId={user._id}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      onJoin={handleJoin}
                    />
                  ))}
                </div>
              )}

              {/* Footer link */}
              <div className="p-3 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800">
                <Link
                  to="/sessions"
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 bg-gray-100/70 dark:bg-gray-800/80 hover:bg-primary-50 dark:hover:bg-primary-950/40 border border-gray-200/80 dark:border-gray-700/80 hover:border-primary-300 dark:hover:border-primary-600/50 rounded-xl transition-all shadow-xs group"
                >
                  <span>View All Sessions</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 text-gray-400 group-hover:text-primary-500" />
                </Link>
              </div>
            </div>

            {/* CARD 2: SKILLS PORTFOLIO */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white leading-none">
                      Skills Portfolio
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Manage what you teach and what you want to learn</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                    {skills.length} Total
                  </span>
                  <button
                    onClick={() => setShowAddSkill(!showAddSkill)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      showAddSkill
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25'
                        : 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-100'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />Add Skill
                  </button>
                </div>
              </div>

              {/* Add skill drawer / form */}
              {showAddSkill && (
                <div className="p-5 bg-gray-50/80 dark:bg-gray-850/40 border-b border-gray-100 dark:border-gray-800">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const name = newSkill.name === '__custom__' ? customSkillName : newSkill.name;
                      if (!name || !newSkill.category) return;
                      addSkill({ ...newSkill, name });
                      setNewSkill({ name: '', category: '', type: 'teach', proficiencyLevel: 'beginner' });
                      setCustomSkillName('');
                      setShowAddSkill(false);
                      toast.success('Skill added to your portfolio!');
                    }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative">
                        <select
                          className="input-field text-sm py-2.5 appearance-none pr-8 bg-white dark:bg-gray-900"
                          value={newSkill.category}
                          onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value, name: '' })}
                        >
                          <option value="">Select Category</option>
                          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.value}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <select
                          className="input-field text-sm py-2.5 appearance-none pr-8 disabled:opacity-50 bg-white dark:bg-gray-900"
                          value={newSkill.name}
                          onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                          disabled={!newSkill.category}
                        >
                          <option value="">{newSkill.category ? 'Select Skill' : 'Select category first'}</option>
                          {newSkill.category && SKILLS_BY_CATEGORY[newSkill.category]?.map(s => <option key={s} value={s}>{s}</option>)}
                          {newSkill.category && <option value="__custom__">✏️ Custom Skill Name…</option>}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {newSkill.name === '__custom__' && (
                      <input
                        className="input-field text-sm py-2.5 bg-white dark:bg-gray-900"
                        placeholder="Enter custom skill name…"
                        value={customSkillName}
                        onChange={(e) => setCustomSkillName(e.target.value)}
                        autoFocus
                      />
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <select
                          className="input-field text-sm py-2.5 appearance-none pr-7 bg-white dark:bg-gray-900"
                          value={newSkill.type}
                          onChange={(e) => setNewSkill({ ...newSkill, type: e.target.value })}
                        >
                          <option value="teach">Teach (I am a mentor)</option>
                          <option value="learn">Learn (I want to learn)</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      </div>
                      <div className="relative">
                        <select
                          className="input-field text-sm py-2.5 appearance-none pr-7 bg-white dark:bg-gray-900"
                          value={newSkill.proficiencyLevel}
                          onChange={(e) => setNewSkill({ ...newSkill, proficiencyLevel: e.target.value })}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="expert">Expert</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-1">
                      <button
                        type="submit"
                        disabled={!newSkill.category || (!newSkill.name || (newSkill.name === '__custom__' && !customSkillName))}
                        className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl disabled:opacity-40 hover:shadow-lg hover:shadow-primary-500/25 transition-all"
                      >
                        Save Skill
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddSkill(false)}
                        className="px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Teach / Learn tab selector */}
              <div className="flex gap-2 p-4 bg-gray-50/40 dark:bg-gray-850/20 border-b border-gray-100 dark:border-gray-800">
                {[
                  { key: 'teach', label: 'Skills I Teach', count: teachSkills.length, activeClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' },
                  { key: 'learn', label: 'Skills I Want to Learn', count: learnSkills.length, activeClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveSkillTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                      activeSkillTab === tab.key
                        ? tab.activeClass
                        : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${activeSkillTab === tab.key ? 'bg-white' : tab.key === 'teach' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                    {tab.label}
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeSkillTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Skills list / tag showcase */}
              <div className="p-4 sm:p-5">
                {activeSkills.length === 0 ? (
                  <button
                    onClick={() => setShowAddSkill(true)}
                    className="w-full py-8 flex flex-col items-center justify-center gap-2 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:text-primary-600 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/30 dark:hover:bg-primary-950/10 transition-all cursor-pointer"
                  >
                    <Plus className="w-6 h-6 opacity-60 text-primary-500" />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {activeSkillTab === 'teach' ? 'Add skills you can mentor' : 'Add skills you wish to learn'}
                    </span>
                    <span className="text-xs text-gray-400">Click to add your first skill</span>
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {activeSkills.map((skill) => (
                      <div
                        key={skill._id}
                        className={`group flex items-center gap-3 pl-3.5 pr-2.5 py-2 rounded-xl border transition-all hover:shadow-md ${
                          activeSkillTab === 'teach'
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200/60 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-200'
                            : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold leading-tight">
                            {skill.name}
                          </p>
                          <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider ${
                            activeSkillTab === 'teach' ? 'text-indigo-500 dark:text-indigo-400' : 'text-emerald-500 dark:text-emerald-400'
                          }`}>
                            {skill.proficiencyLevel}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteSkill(skill._id)}
                          className="w-5 h-5 rounded-lg flex items-center justify-center opacity-40 group-hover:opacity-100 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all"
                          aria-label={`Remove ${skill.name}`}
                          title="Remove skill"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Explore matching mentors bar */}
              {activeSkills.length > 0 && (
                <div className="px-5 pb-4">
                  <Link
                    to="/explore"
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50/60 dark:bg-primary-950/30 hover:bg-primary-100 dark:hover:bg-primary-950/50 rounded-xl border border-primary-200/60 dark:border-primary-800/60 transition-all"
                  >
                    <Search className="w-3.5 h-3.5" />Find peers and mentors matching your skills <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT / SIDEBAR COLUMN (5 cols): Recommended Mentors + Weekly Challenges ── */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">

            {/* CARD 1: RECOMMENDED MENTORS */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white leading-none">
                      Recommended Mentors
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Matched to what you want to learn</p>
                  </div>
                </div>
                <Link
                  to="/explore"
                  className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-1"
                >
                  See all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {matches.filter(m => m?.user?._id).length === 0 ? (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">No matches found yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Add skills you want to learn to get matched with mentors</p>
                  </div>
                  <button
                    onClick={() => { setActiveSkillTab('learn'); setShowAddSkill(true); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                    className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                  >
                    Add learning skills <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {matches.filter(m => m?.user?._id).slice(0, 3).map(match => (
                    <MentorCard key={match.user._id} match={match} onBook={handleOpenBooking} />
                  ))}
                </div>
              )}
            </div>

            {/* CARD 2: WEEKLY CHALLENGES */}
            <div id="tour-challenges">
              <WeeklyChallenges />
            </div>

          </div>

        </div>

        {/* ══════════════════════════════════
            QUICK ACCESS
        ══════════════════════════════════ */}
        <div>
          <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-3 px-1">Quick Access</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { to: '/explore',     icon: Search,        label: 'Find Mentors', sub: 'Discover experts',  iconCls: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/30',   border: 'border-blue-100 dark:border-blue-900/40',   hover: 'hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-blue-100/50 dark:hover:shadow-blue-950/30' },
              { to: '/chat',        icon: MessageCircle, label: 'Messages',     sub: 'Chat with peers',   iconCls: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-100 dark:border-emerald-900/40', hover: 'hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-emerald-100/50 dark:hover:shadow-emerald-950/30' },
              { to: '/leaderboard', icon: Trophy,        label: 'Leaderboard', sub: 'See rankings',      iconCls: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-950/30',  border: 'border-amber-100 dark:border-amber-900/40',  hover: 'hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-amber-100/50 dark:hover:shadow-amber-950/30' },
              { to: '/community',   icon: Globe,         label: 'Community',   sub: 'Join discussions',  iconCls: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-100 dark:border-purple-900/40', hover: 'hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-purple-100/50 dark:hover:shadow-purple-950/30' },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`group flex items-center gap-3 p-3.5 sm:p-4 bg-white dark:bg-gray-900 border ${link.border} ${link.hover} rounded-2xl hover:shadow-md transition-all duration-200`}
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${link.bg} flex items-center justify-center shrink-0`}>
                  <link.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${link.iconCls}`} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{link.label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{link.sub}</p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* ── Booking modal ── */}
        {showBooking && selectedMentor && (
          <SessionScheduler
            isOpen={showBooking}
            onClose={() => setShowBooking(false)}
            mentor={selectedMentor}
            skill={selectedSkillForBooking}
            skills={selectedMentorSkills}
            currentUser={user}
          />
        )}
        <OnboardingTour />
      </div>
    </div>
  );
}
