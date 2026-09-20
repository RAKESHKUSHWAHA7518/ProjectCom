import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSkillStore } from '../store/skillStore';
import { useSessionStore } from '../store/sessionStore';
import { CATEGORIES, SKILLS_BY_CATEGORY } from '../data/skillsData';
import toast from 'react-hot-toast';
import {
  Search, MessageCircle, Trophy, Globe, Calendar, Coins, Check, X,
  Star, Zap, ArrowRight, BarChart2, Sparkles, TrendingUp, Target,
  Clock, Users, Award, BookOpen, User, ChevronDown, Plus, ArrowUpRight,
  Layers, Video, CheckCircle
} from 'lucide-react';
import Avatar from '../components/Avatar';
import SessionScheduler from '../components/SessionScheduler';
import OnboardingTour from '../components/OnboardingTour';
import WeeklyChallenges from '../components/WeeklyChallenges';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ─── Stat card ─── */
function StatCard({ stat }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
          <stat.icon className={`w-5 h-5 ${stat.iconColor}`} strokeWidth={2} />
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${stat.badgeBg} ${stat.badgeText}`}>
          {stat.badge}
        </span>
      </div>
      <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none mb-1">
        {stat.value}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
    </div>
  );
}

/* ─── Session row ─── */
function SessionRow({ session, userId, onAccept, onReject, onJoin }) {
  const isMentor = session.mentor?._id === userId;
  const other = isMentor ? session.learner : session.mentor;

  const statusMap = {
    completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
    pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
    accepted:  { label: 'Accepted',  cls: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' },
    rejected:  { label: 'Rejected',  cls: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' },
  };
  const st = statusMap[session.status] || statusMap.pending;

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar src={other?.avatar} name={other?.name} size="sm" className="rounded-xl shadow-sm" />
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${
          session.status === 'accepted' ? 'bg-blue-500' :
          session.status === 'completed' ? 'bg-emerald-500' :
          session.status === 'pending' ? 'bg-amber-400' : 'bg-gray-400'
        }`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{other?.name || '—'}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate flex items-center gap-1">
          <BookOpen className="w-3 h-3 shrink-0" />
          {session.skill?.name || 'Skill session'} · {new Date(session.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* Status + actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wide ${st.cls}`}>
          {st.label}
        </span>
        {session.status === 'pending' && isMentor && (
          <>
            <button onClick={() => onAccept(session._id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors" title="Accept">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onReject(session._id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors" title="Reject">
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        {session.status === 'accepted' && (
          <button onClick={() => onJoin(session._id)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            <Video className="w-3 h-3" />Join
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Mentor card ─── */
function MentorCard({ match, onBook }) {
  const isMutual = match.isMutualSwap;
  return (
    <div className={`relative p-4 rounded-2xl border transition-all hover:shadow-md ${
      isMutual
        ? 'border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/20'
        : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-200 dark:hover:border-primary-800'
    }`}>
      {isMutual && (
        <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 rounded-full border border-emerald-200 dark:border-emerald-800">
          <Zap className="w-2.5 h-2.5" />Mutual
        </span>
      )}

      <div className="flex items-start gap-3 mb-3">
        <Avatar src={match.user?.avatar} name={match.user?.name} size="md" className="rounded-xl shadow-sm shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 dark:text-white truncate pr-12">{match.user?.name}</p>
          {match.user?.bio && <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5">{match.user.bio}</p>}
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{match.user?.rating?.toFixed(1) || 'New'}</span>
            {match.user?.numReviews > 0 && <span className="text-[10px] text-gray-400">({match.user.numReviews})</span>}
          </div>
        </div>
      </div>

      {/* Skill tags */}
      {match.matchedSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {match.matchedSkills.slice(0, 3).map((s, i) => (
            <span key={s?._id || i} className="px-2.5 py-1 text-xs font-medium bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-lg border border-primary-100 dark:border-primary-900/40">
              {s?.name || s}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => onBook(match)}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg hover:shadow-primary-500/20 hover:-translate-y-0.5 transition-all"
      >
        <Calendar className="w-4 h-4" />Book Session
      </button>
    </div>
  );
}

/* ─── Main dashboard ─── */
export default function Dashboard() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();
  const { skills, matches, fetchMySkills, addSkill, deleteSkill, fetchMatches } = useSkillStore();
  const { sessions, fetchSessions, updateSessionStatus } = useSessionStore();

  const [newSkill, setNewSkill] = useState({ name: '', category: '', type: 'teach', proficiencyLevel: 'beginner' });
  const [customSkillName, setCustomSkillName] = useState('');
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
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

  const handleAccept = async (id) => { await updateSessionStatus(id, 'accepted'); toast.success('Session accepted!'); };
  const handleReject = async (id) => { await updateSessionStatus(id, 'rejected'); toast.error('Session declined'); };
  const handleJoin   = (id) => navigate(`/video/${id}`);
  const handleComplete = async (id) => { await updateSessionStatus(id, 'completed'); toast.success('Marked complete!'); };

  const recentSessions = sessions.slice(0, 5);
  const pendingCount   = sessions.filter(s => s.status === 'pending').length;
  const completedCount = sessions.filter(s => s.status === 'completed').length;
  const teachSkills    = skills.filter(s => s.type === 'teach');
  const learnSkills    = skills.filter(s => s.type === 'learn');
  const activeSkills   = activeSkillTab === 'teach' ? teachSkills : learnSkills;

  const statCards = [
    {
      label: 'Skill Credits', value: user?.skillCredits || 0,
      icon: Coins, bg: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-600 dark:text-amber-400',
      badge: 'Wallet', badgeBg: 'bg-amber-50 dark:bg-amber-950/40', badgeText: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Skills Teaching', value: teachSkills.length,
      icon: BookOpen, bg: 'bg-indigo-50 dark:bg-indigo-950/30', iconColor: 'text-indigo-600 dark:text-indigo-400',
      badge: teachSkills.length > 0 ? 'Active' : 'Empty',
      badgeBg: teachSkills.length > 0 ? 'bg-indigo-50 dark:bg-indigo-950/40' : 'bg-gray-100 dark:bg-gray-800',
      badgeText: teachSkills.length > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400',
    },
    {
      label: 'Pending Sessions', value: pendingCount,
      icon: Clock, bg: 'bg-orange-50 dark:bg-orange-950/30', iconColor: 'text-orange-600 dark:text-orange-400',
      badge: pendingCount > 0 ? 'Action needed' : 'All clear',
      badgeBg: pendingCount > 0 ? 'bg-orange-50 dark:bg-orange-950/40' : 'bg-emerald-50 dark:bg-emerald-950/40',
      badgeText: pendingCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Sessions Done', value: completedCount,
      icon: CheckCircle, bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-600 dark:text-emerald-400',
      badge: completedCount > 0 ? `${completedCount} total` : 'Start now',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40', badgeText: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="py-6 sm:py-8 lg:py-10 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ═══════════════════════════════════════
            HEADER
        ═══════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar src={user?.avatar} name={user?.name} size="lg"
                className="rounded-2xl ring-2 ring-white dark:ring-gray-800 shadow-lg" />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white dark:border-gray-900" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Good to see you,</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {user?.name?.split(' ')[0] || 'User'} 👋
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/explore"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all">
              <Search className="w-4 h-4" />Find Mentors
            </Link>
            <Link to="/sessions"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-0.5 transition-all shadow-sm">
              <Calendar className="w-4 h-4" />Sessions
            </Link>
            <Link to="/profile"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-0.5 transition-all shadow-sm">
              <User className="w-4 h-4" />Profile
            </Link>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            STAT CARDS — 4 col
        ═══════════════════════════════════════ */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => <StatCard key={i} stat={s} />)}
        </div>

        {/* ═══════════════════════════════════════
            ANALYTICS (full width)
        ═══════════════════════════════════════ */}
        {personalStats && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden mb-8">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="flex items-center gap-2.5 text-base font-bold text-gray-900 dark:text-white">
                <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center">
                  <BarChart2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                Performance Analytics
              </h2>
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />Last 6 months
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-800">
              {/* Bar chart */}
              <div className="p-5 sm:p-6">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-5">Sessions Over Time</p>
                <div className="flex items-end gap-2 sm:gap-3 h-32 sm:h-40">
                  {personalStats.sessionsOverTime?.length > 0 ? (
                    personalStats.sessionsOverTime.map((item, idx) => {
                      const max = Math.max(...personalStats.sessionsOverTime.map(i => i.count), 1);
                      const h   = Math.max((item.count / max) * 100, 5);
                      const mo  = new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'short' });
                      return (
                        <div key={idx} className="flex-1 flex flex-col justify-end items-center gap-2 h-full group relative cursor-default">
                          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl pointer-events-none">
                            {item.count} session{item.count !== 1 ? 's' : ''}
                          </div>
                          <div
                            className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-400 group-hover:from-primary-700 group-hover:to-primary-500 transition-all duration-300"
                            style={{ height: `${h}%` }}
                          />
                          <span className="text-[10px] font-medium text-gray-400 shrink-0">{mo}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center gap-2 text-gray-300 dark:text-gray-700">
                      <BarChart2 className="w-10 h-10" strokeWidth={1} />
                      <p className="text-xs text-gray-400">No session data yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Skill demand */}
              <div className="p-5 sm:p-6">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-5">Top Skill Demand</p>
                {personalStats.skillPopularity?.length > 0 ? (
                  <div className="space-y-4">
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
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate pr-3">{skill.name}</span>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0 tabular-nums">{skill.count} req</span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${colors[idx]} rounded-full transition-all duration-700`} style={{ width: w }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-300 dark:text-gray-700">
                    <TrendingUp className="w-10 h-10" strokeWidth={1} />
                    <p className="text-xs text-gray-400 text-center">Add skills you teach to see demand data</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            MAIN 3-COLUMN GRID
            Left (skills) | Centre (sessions) | Right (challenges + mentors)
        ═══════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 mb-8">

          {/* ── COLUMN 1: Skills Portfolio ── */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="flex items-center gap-2.5 text-sm font-bold text-gray-900 dark:text-white">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                Skills Portfolio
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">{skills.length}</span>
                <button
                  onClick={() => setShowAddSkill(!showAddSkill)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    showAddSkill
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                      : 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-950/60'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />Add
                </button>
              </div>
            </div>

            {/* Add skill form */}
            {showAddSkill && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const name = newSkill.name === '__custom__' ? customSkillName : newSkill.name;
                    if (!name || !newSkill.category) return;
                    addSkill({ ...newSkill, name });
                    setNewSkill({ name: '', category: '', type: 'teach', proficiencyLevel: 'beginner' });
                    setCustomSkillName('');
                    setShowAddSkill(false);
                    toast.success('Skill added!');
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative col-span-2">
                      <select
                        className="input-field text-sm py-2.5 appearance-none pr-8"
                        value={newSkill.category}
                        onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value, name: '' })}
                      >
                        <option value="">Category</option>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.value}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative col-span-2">
                      <select
                        className="input-field text-sm py-2.5 appearance-none pr-8 disabled:opacity-50"
                        value={newSkill.name}
                        onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                        disabled={!newSkill.category}
                      >
                        <option value="">{newSkill.category ? 'Select skill' : 'Select category first'}</option>
                        {newSkill.category && SKILLS_BY_CATEGORY[newSkill.category]?.map(s => <option key={s} value={s}>{s}</option>)}
                        {newSkill.category && <option value="__custom__">✏️ Custom skill…</option>}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    {newSkill.name === '__custom__' && (
                      <input
                        className="input-field text-sm py-2.5 col-span-2"
                        placeholder="Skill name…"
                        value={customSkillName}
                        onChange={(e) => setCustomSkillName(e.target.value)}
                        autoFocus
                      />
                    )}
                    <div className="relative">
                      <select className="input-field text-sm py-2.5 appearance-none pr-8" value={newSkill.type} onChange={(e) => setNewSkill({ ...newSkill, type: e.target.value })}>
                        <option value="teach">Teach</option>
                        <option value="learn">Learn</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select className="input-field text-sm py-2.5 appearance-none pr-8" value={newSkill.proficiencyLevel} onChange={(e) => setNewSkill({ ...newSkill, proficiencyLevel: e.target.value })}>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!newSkill.category || (!newSkill.name || (newSkill.name === '__custom__' && !customSkillName))}
                      className="flex-1 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl disabled:opacity-40 hover:shadow-lg hover:shadow-primary-500/20 transition-all"
                    >
                      Add Skill
                    </button>
                    <button type="button" onClick={() => setShowAddSkill(false)} className="px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab switcher */}
            <div className="flex p-2 gap-1 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
              <button
                onClick={() => setActiveSkillTab('teach')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeSkillTab === 'teach'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                Teaching ({teachSkills.length})
              </button>
              <button
                onClick={() => setActiveSkillTab('learn')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeSkillTab === 'learn'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                Learning ({learnSkills.length})
              </button>
            </div>

            {/* Skill chips */}
            <div className="p-4 flex-1">
              {activeSkills.length === 0 ? (
                <button
                  onClick={() => setShowAddSkill(true)}
                  className="w-full h-full min-h-[120px] flex flex-col items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:text-primary-600 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition-all"
                >
                  <Plus className="w-6 h-6 opacity-50" />
                  <span className="text-sm font-medium">
                    {activeSkillTab === 'teach' ? 'Add skills you can teach' : 'Add skills you want to learn'}
                  </span>
                </button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeSkills.map((skill) => (
                    <div
                      key={skill._id}
                      className={`group flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl border transition-all hover:shadow-sm ${
                        activeSkillTab === 'teach'
                          ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/40 hover:border-indigo-300 dark:hover:border-indigo-700'
                          : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-700'
                      }`}
                    >
                      <div>
                        <span className={`text-sm font-semibold block leading-tight ${activeSkillTab === 'teach' ? 'text-indigo-800 dark:text-indigo-200' : 'text-emerald-800 dark:text-emerald-200'}`}>
                          {skill.name}
                        </span>
                        <span className={`text-[10px] font-medium ${activeSkillTab === 'teach' ? 'text-indigo-400 dark:text-indigo-500' : 'text-emerald-400 dark:text-emerald-500'}`}>
                          {skill.proficiencyLevel}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteSkill(skill._id)}
                        className="w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
                        aria-label={`Remove ${skill.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── COLUMN 2: Recent Sessions ── */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="flex items-center gap-2.5 text-sm font-bold text-gray-900 dark:text-white">
                <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                Recent Sessions
              </h2>
              <Link to="/sessions" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Session summary pills */}
            <div className="flex gap-2 px-4 py-3 bg-gray-50/60 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800">
              {[
                { label: 'Total', value: sessions.length, cls: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
                { label: 'Pending', value: pendingCount, cls: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' },
                { label: 'Done', value: completedCount, cls: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' },
              ].map(p => (
                <Link key={p.label} to="/sessions" className={`flex-1 flex flex-col items-center py-2 rounded-xl ${p.cls} hover:opacity-80 transition-opacity`}>
                  <span className="text-base font-extrabold tabular-nums">{p.value}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide">{p.label}</span>
                </Link>
              ))}
            </div>

            {recentSessions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No sessions yet</p>
                  <p className="text-xs text-gray-400">Find a mentor and book your first session</p>
                </div>
                <Link to="/explore" className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                  Browse mentors <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/60 flex-1">
                {recentSessions.map(session => (
                  <SessionRow
                    key={session._id}
                    session={session}
                    userId={user._id}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onJoin={handleJoin}
                    onComplete={handleComplete}
                  />
                ))}
              </div>
            )}

            <div className="p-3 border-t border-gray-100 dark:border-gray-800">
              <Link to="/sessions" className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                View all sessions <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* ── COLUMN 3: Challenges + Recommended ── */}
          <div className="space-y-5 md:col-span-2 xl:col-span-1">
            {/* Weekly Challenges */}
            <div id="tour-challenges">
              <WeeklyChallenges />
            </div>

            {/* Recommended Mentors */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="flex items-center gap-2.5 text-sm font-bold text-gray-900 dark:text-white">
                  <div className="w-7 h-7 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  Recommended Mentors
                </h2>
                <Link to="/explore" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 transition-colors">
                  See all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {matches.filter(m => m?.user?._id).length === 0 ? (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No recommendations yet</p>
                    <p className="text-xs text-gray-400">Add learning skills to get matched</p>
                  </div>
                  <button onClick={() => { setActiveSkillTab('learn'); setShowAddSkill(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                    Add learning skills <ArrowRight className="w-3 h-3" />
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
          </div>
        </div>

        {/* ═══════════════════════════════════════
            QUICK ACCESS
        ═══════════════════════════════════════ */}
        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-3 px-1">Quick Access</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { to: '/explore',     icon: Search,       label: 'Find Mentors', sub: 'Discover experts',  iconCls: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/30',   border: 'border-blue-100 dark:border-blue-900/40',   hover: 'hover:border-blue-300 dark:hover:border-blue-700' },
              { to: '/chat',        icon: MessageCircle,label: 'Messages',     sub: 'Chat with peers',   iconCls: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-100 dark:border-emerald-900/40', hover: 'hover:border-emerald-300 dark:hover:border-emerald-700' },
              { to: '/leaderboard', icon: Trophy,       label: 'Leaderboard', sub: 'See rankings',      iconCls: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-950/30',  border: 'border-amber-100 dark:border-amber-900/40',  hover: 'hover:border-amber-300 dark:hover:border-amber-700' },
              { to: '/community',   icon: Globe,        label: 'Community',   sub: 'Join discussions',  iconCls: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-100 dark:border-purple-900/40', hover: 'hover:border-purple-300 dark:hover:border-purple-700' },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`group flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border ${link.border} ${link.hover} rounded-2xl hover:shadow-md transition-all`}
              >
                <div className={`w-10 h-10 rounded-xl ${link.bg} flex items-center justify-center shrink-0`}>
                  <link.icon className={`w-5 h-5 ${link.iconCls}`} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{link.label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{link.sub}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Modals */}
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
