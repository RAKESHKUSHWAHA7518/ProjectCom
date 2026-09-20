import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSkillStore } from '../store/skillStore';
import { useSessionStore } from '../store/sessionStore';
import { CATEGORIES, SKILLS_BY_CATEGORY } from '../data/skillsData';
import toast from 'react-hot-toast';
import { Search, MessageCircle, Trophy, Globe, Calendar, Coins, Check, X, Star, Zap, ArrowRight, Heart, BarChart2, Sparkles, TrendingUp, Target, Clock, Users, Award, BookOpen, User } from 'lucide-react';
import Avatar from '../components/Avatar';
import SessionScheduler from '../components/SessionScheduler';
import OnboardingTour from '../components/OnboardingTour';
import WeeklyChallenges from '../components/WeeklyChallenges';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuthStore();
  const { skills, matches, fetchMySkills, addSkill, deleteSkill, fetchMatches } = useSkillStore();
  const { sessions, fetchSessions, updateSessionStatus } = useSessionStore();

  const [newSkill, setNewSkill] = useState({ name: '', category: '', type: 'teach', proficiencyLevel: 'beginner' });
  const [customSkillName, setCustomSkillName] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedSkillForBooking, setSelectedSkillForBooking] = useState(null);
  const [selectedMentorSkills, setSelectedMentorSkills] = useState([]);
  const [personalStats, setPersonalStats] = useState(null);

  useEffect(() => {
    if (refreshUser) refreshUser();
    fetchMySkills();
    fetchMatches();
    fetchSessions();
  }, [fetchMySkills, fetchMatches, fetchSessions, refreshUser]);

  useEffect(() => {
    const fetchPersonalStats = async () => {
      try {
        const response = await fetch(`${API_URL}/stats/me`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await response.json();
        if (response.ok) setPersonalStats(data);
      } catch (error) {
        console.error('Failed to fetch personal stats:', error);
      }
    };
    if (user?.token) fetchPersonalStats();
  }, [user]);

  const handleOpenBooking = (match) => {
    setSelectedMentor(match.user);
    setSelectedMentorSkills(match.matchedSkills || []);
    setSelectedSkillForBooking(match.matchedSkills?.[0] || null);
    setShowBooking(true);
  };

  const recentSessions = sessions.slice(0, 3);
  const pendingCount = sessions.filter((s) => s.status === 'pending').length;
  const completedCount = sessions.filter((s) => s.status === 'completed').length;
  const teachSkills = skills.filter((s) => s.type === 'teach');
  const learnSkills = skills.filter((s) => s.type === 'learn');

  const statCards = [
    {
      label: t('Credits Available'),
      value: user?.skillCredits || 0,
      icon: Coins,
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      trend: '+3 this week',
      trendIcon: TrendingUp,
    },
    {
      label: t('Skills Teaching'),
      value: teachSkills.length,
      icon: BookOpen,
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      trend: teachSkills.length > 0 ? '+2 this month' : 'Add your first skill',
      trendIcon: teachSkills.length > 0 ? TrendingUp : Sparkles,
    },
    {
      label: t('Pending Sessions'),
      value: pendingCount,
      icon: Clock,
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      trend: pendingCount > 0 ? 'Awaiting response' : 'No pending requests',
      trendIcon: Clock,
    },
    {
      label: t('Completed'),
      value: completedCount,
      icon: Award,
      gradient: 'from-purple-500 to-pink-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      trend: completedCount > 0 ? `+${completedCount} total` : 'Complete your first session',
      trendIcon: completedCount > 0 ? TrendingUp : Target,
    },
  ];

  return (
    <div className="py-6 sm:py-8 lg:py-10 w-full">
      <div className="container-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 lg:mb-10 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('Welcome back', { name: user?.name || '' })}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-xl">
              {t('Portfolio desc')}
            </p>
          </div>
          <Link to="/profile" className="btn-secondary px-5 py-2.5 text-sm self-start sm:self-auto">
            <User className="w-4 h-4" />
            {t('View Profile')}
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10" role="list" aria-label="Key metrics">
          {statCards.map((stat, i) => (
            <article
              key={i}
              className={`group card-hover-interactive p-5 lg:p-6 relative overflow-hidden`}
              style={{ animationDelay: `${i * 80}ms` }}
              role="listitem"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: stat.gradient }} />
              <div className="relative flex items-start justify-between">
                <div className="flex-1">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-6 h-6 text-gray-900 dark:text-white" strokeWidth={2} />
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
                <div className="flex items-end gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                  <stat.trendIcon className="w-4 h-4" />
                  <span>{stat.trend}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Personal Analytics Dashboard */}
        {personalStats && (
          <section className="mb-10" aria-labelledby="analytics-heading">
            <div className="card-elevated p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 id="analytics-heading" className="flex items-center gap-2 text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  <BarChart2 className="w-5 h-5 lg:w-6 lg:h-6 text-primary-500" />
                  {t('Personal Analytics')}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Last 6 months</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Sessions Over Time */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 lg:p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-5">{t('Sessions (Last 6 Months)')}</h3>
                  <div className="flex items-end gap-3 h-40 lg:h-48">
                    {personalStats.sessionsOverTime?.length > 0 ? (
                      personalStats.sessionsOverTime.map((item, idx) => {
                        const maxCount = Math.max(...personalStats.sessionsOverTime.map(i => i.count), 1);
                        const height = `${Math.max((item.count / maxCount) * 100, 8)}%`;
                        const monthName = new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'short' });
                        return (
                          <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                              {item.count} {item.count === 1 ? 'session' : 'sessions'}
                            </div>
                            <div className="w-full max-w-[36px] bg-gradient-to-t from-primary-500 to-primary-400 dark:from-primary-600 dark:to-primary-500 rounded-t-sm transition-all duration-500 hover:from-primary-600 hover:to-primary-500" style={{ height }} />
                            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-3">{monthName}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                        No session data yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Skill Popularity */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 lg:p-6 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-5">{t('Skill Demand (Requests Received)')}</h3>
                  <div className="space-y-5">
                    {personalStats.skillPopularity?.length > 0 ? (
                      personalStats.skillPopularity.slice(0, 5).map((skill, idx) => {
                        const maxCount = Math.max(...personalStats.skillPopularity.map(s => s.count), 1);
                        const width = `${(skill.count / maxCount) * 100}%`;
                        return (
                          <div key={idx} className="group">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-medium text-gray-700 dark:text-gray-300 truncate pr-2">{skill.name}</span>
                              <span className="text-gray-500 dark:text-gray-400 font-medium">{skill.count} requests</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2.5 rounded-full transition-all duration-700 ease-out group-hover:shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                style={{ width }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                        No requests yet — add skills you teach!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {/* Left Column - Skills Management */}
          <section id="skills-section" className="space-y-6" aria-labelledby="skills-heading">
            <div id="tour-skills" className="card-elevated p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 id="skills-heading" className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 lg:w-6 lg:h-6 text-primary-500" />
                  {t('Your Skills Portfolio')}
                </h2>
                <span className="badge badge-primary">{skills.length} total skills</span>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const finalName = newSkill.name === '__custom__' ? customSkillName : newSkill.name;
                if (!finalName || !newSkill.category) return;
                addSkill({ ...newSkill, name: finalName });
                setNewSkill({ name: '', category: '', type: 'teach', proficiencyLevel: 'beginner' });
                setCustomSkillName('');
              }} className="space-y-5 mb-6 p-5 lg:p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  {t('Add a new skill')}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">{t('Category')}</label>
                    <select
                      className="input-field"
                      value={newSkill.category}
                      onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value, name: '' })}
                    >
                      <option value="">{t('Select Category')}</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.icon} {cat.value}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-field">{t('Skill')}</label>
                    <select
                      className="input-field"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                      disabled={!newSkill.category}
                    >
                      <option value="">{newSkill.category ? t('Select Skill') : t('Select category first')}</option>
                      {newSkill.category && SKILLS_BY_CATEGORY[newSkill.category]?.map((skill) => (
                        <option key={skill} value={skill}>{skill}</option>
                      ))}
                      {newSkill.category && <option value="__custom__">{t('Type custom skill...')}</option>}
                    </select>
                  </div>
                </div>

                {newSkill.name === '__custom__' && (
                  <div className="sm:col-span-2">
                    <label className="label-field">{t('Custom Skill Name')}</label>
                    <input
                      type="text"
                      placeholder="Enter your custom skill name..."
                      className="input-field"
                      value={customSkillName}
                      onChange={(e) => setCustomSkillName(e.target.value)}
                      autoFocus
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select className="input-field" value={newSkill.type} onChange={(e) => setNewSkill({ ...newSkill, type: e.target.value })}>
                    <option value="teach">{t('I want to TEACH')}</option>
                    <option value="learn">{t('I want to LEARN')}</option>
                  </select>
                  <select className="input-field" value={newSkill.proficiencyLevel} onChange={(e) => setNewSkill({ ...newSkill, proficiencyLevel: e.target.value })}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!newSkill.category || (!newSkill.name || (newSkill.name === '__custom__' && !customSkillName))}
                  className="btn-primary w-full sm:w-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  {t('Add')}
                </button>
              </form>

              <div className="space-y-6">
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    {t('Skills You Teach')} ({teachSkills.length})
                  </h4>
                  {teachSkills.length === 0 ? (
                    <div className="p-6 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 border-dashed">
                      <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                      <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">Add skills you can teach others</p>
                      <button type="button" onClick={() => document.getElementById('skills-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                        Add your first skill →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teachSkills.map((skill) => (
                        <div key={skill._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-xl border border-indigo-100 dark:border-indigo-800 card-hover">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                              <BookOpen className="w-5 h-5" strokeWidth={2} />
                            </div>
                            <div>
                              <span className="font-semibold text-indigo-900 dark:text-indigo-300">{skill.name}</span>
                              <span className="text-xs text-indigo-500 dark:text-indigo-400 ml-2">({skill.proficiencyLevel})</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">• {skill.category}</span>
                            </div>
                          </div>
                          <button onClick={() => deleteSkill(skill._id)} className="btn-ghost p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" aria-label={`Remove ${skill.name}`}>
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {t('Skills You Want to Learn')} ({learnSkills.length})
                  </h4>
                  {learnSkills.length === 0 ? (
                    <div className="p-6 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 border-dashed">
                      <Target className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                      <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">Add skills you want to learn</p>
                      <button type="button" onClick={() => document.getElementById('skills-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                        Add learning goals →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {learnSkills.map((skill) => (
                        <div key={skill._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl border border-emerald-100 dark:border-emerald-800 card-hover">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                              <Target className="w-5 h-5" strokeWidth={2} />
                            </div>
                            <div>
                              <span className="font-semibold text-emerald-900 dark:text-emerald-300">{skill.name}</span>
                              <span className="text-xs text-emerald-500 dark:text-emerald-400 ml-2">({skill.proficiencyLevel})</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">• {skill.category}</span>
                            </div>
                          </div>
                          <button onClick={() => deleteSkill(skill._id)} className="btn-ghost p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" aria-label={`Remove ${skill.name}`}>
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Right Column */}
          <section className="space-y-6 lg:space-y-8">
            {/* Weekly Challenges */}
            <div id="tour-challenges">
              <WeeklyChallenges />
            </div>

            {/* Recent Sessions */}
            <div id="tour-sessions" className="card-elevated p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-primary-500" />
                  {t('Recent Sessions')}
                </h2>
                <Link to="/sessions" className="btn-ghost text-sm">
                  {t('View All')}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {recentSessions.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 border-dashed">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">No sessions yet. Find mentors on the Explore page!</p>
                  <Link to="/explore" className="btn-primary inline-flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Explore Mentors
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSessions.map((session) => {
                    const isMentor = session.mentor?._id === user._id;
                    const other = isMentor ? session.learner : session.mentor;
                    return (
                      <div key={session._id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl card-hover border border-gray-100 dark:border-gray-800">
                        <Avatar src={other?.avatar} name={other?.name} size="md" className="rounded-xl shadow-lg" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{other?.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {session.skill?.name} • {new Date(session.scheduledAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                            session.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                            session.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                            session.status === 'accepted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                          }`}>
                            {session.status}
                          </span>
                          {session.status === 'pending' && isMentor && (
                            <div className="flex gap-1">
                              <button onClick={async () => { await updateSessionStatus(session._id, 'accepted'); toast.success('Session accepted'); }} className="btn-ghost p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" title="Accept" aria-label="Accept session">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={async () => { await updateSessionStatus(session._id, 'rejected'); toast.error('Session rejected'); }} className="btn-ghost p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" title="Reject" aria-label="Reject session">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recommended Mentors */}
            <div id="tour-mentors" className="card-elevated p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 lg:w-6 lg:h-6 text-primary-500" />
                  {t('Recommended Mentors')}
                </h2>
                <Link to="/explore" className="btn-ghost text-sm">
                  {t('Explore More')}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">Based on skills you want to learn</p>
              <div className="space-y-4">
                {matches.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 border-dashed">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">No mentors found. Add skills you want to learn!</p>
                    <Link to="/dashboard#skills-section" className="btn-primary inline-flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Add Learning Skills
                    </Link>
                  </div>
                ) : (
                  matches
                    .filter((m) => m?.user?._id)
                    .slice(0, 3)
                    .map((match) => (
                    <div
                      key={match.user._id}
                      className={`relative card-hover-interactive p-5 border rounded-2xl ${
                        match.isMutualSwap
                          ? 'border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30'
                          : 'border-gray-100 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800'
                      }`}
                    >
                      {match.isMutualSwap && (
                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1 z-10">
                          <Zap className="w-3 h-3" />
                          MUTUAL SWAP
                        </div>
                      )}
                      <div className="flex items-start gap-4">
                        <Avatar src={match.user?.avatar} name={match.user?.name || 'User'} size="lg" className="rounded-xl shadow-lg shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-4 mb-2">
                            <h3 className="font-bold text-gray-900 dark:text-white">{match.user?.name || 'User'}</h3>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className="badge badge-amber flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" />
                                {match.user?.rating || 'New'}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">{match.user?.bio || 'Ready to share knowledge!'}</p>
                          <div className="mt-3 flex flex-wrap gap-1.5 mb-3">
                            {match.matchedSkills?.map((s, idx) => (
                              <span key={s?._id || s?.name || idx} className="px-2.5 py-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-md border border-emerald-100 dark:border-emerald-800">
                                {s?.name || s}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => handleOpenBooking(match)}
                            className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-primary-500/25 transition-all flex items-center justify-center gap-2"
                          >
                            {t('Book Session')}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Quick Links */}
        <section className="mt-10" aria-labelledby="quick-links-heading">
          <h2 id="quick-links-heading" className="sr-only">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6" role="list">
            {[
              { to: '/explore', icon: Search, label: t('Find Mentors'), gradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30', iconColor: 'text-blue-600 dark:text-blue-400' },
              { to: '/chat', icon: MessageCircle, label: t('Messages'), gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
              { to: '/leaderboard', icon: Trophy, label: t('Leaderboard'), gradient: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30', iconColor: 'text-amber-600 dark:text-amber-400' },
              { to: '/community', icon: Globe, label: t('Community'), gradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30', iconColor: 'text-purple-600 dark:text-purple-400' },
            ].map((link) => (
              <Link key={link.to} to={link.to} className={`group p-5 lg:p-6 bg-gradient-to-br ${link.gradient} card-hover-interactive rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center`} role="listitem">
                <div className="mb-3"><link.icon className={`w-7 h-7 lg:w-8 lg:h-8 ${link.iconColor}`} strokeWidth={1.5} /></div>
                <p className="text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{link.label}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Booking Modal */}
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