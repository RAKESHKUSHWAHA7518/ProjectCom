import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSkillStore } from '../store/skillStore';
import { useSessionStore } from '../store/sessionStore';
import { CATEGORIES, SKILLS_BY_CATEGORY } from '../data/skillsData';
import toast from 'react-hot-toast';
import { Search, MessageCircle, Trophy, Globe, Calendar, Coins, Check, X, Star, Zap, ArrowRight, Heart } from 'lucide-react';
import Avatar from '../components/Avatar';
import SessionScheduler from '../components/SessionScheduler';

export default function Dashboard() {
  const { user, refreshUser } = useAuthStore();
  const { skills, matches, fetchMySkills, addSkill, deleteSkill, fetchMatches } = useSkillStore();
  const { sessions, fetchSessions, updateSessionStatus } = useSessionStore();

  const [newSkill, setNewSkill] = useState({ name: '', category: '', type: 'teach', proficiencyLevel: 'beginner' });
  const [customSkillName, setCustomSkillName] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedSkillForBooking, setSelectedSkillForBooking] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (refreshUser) refreshUser();
    fetchMySkills();
    fetchMatches();
    fetchSessions();
  }, [fetchMySkills, fetchMatches, fetchSessions, refreshUser]);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.name || !newSkill.category) return;
    addSkill(newSkill);
    setNewSkill({ name: '', category: '', type: 'teach', proficiencyLevel: 'beginner' });
  };

  const handleOpenBooking = (match) => {
    setSelectedMentor(match.user);
    setSelectedSkillForBooking(match.matchedSkills[0]);
    setShowBooking(true);
  };

  const recentSessions = sessions.slice(0, 3);
  const pendingCount = sessions.filter((s) => s.status === 'pending').length;
  const completedCount = sessions.filter((s) => s.status === 'completed').length;

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.name} 👋</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Here's what's happening with your skill portfolio</p>
        </div>
        <Link to="/profile" className="self-start sm:self-auto px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/40 transition">
          View Profile
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
          <div className="text-3xl font-bold">{user?.skillCredits || 0}</div>
          <div className="text-sm text-blue-100 mt-1">Credits Available</div>
        </div>
        <div className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
          <div className="text-3xl font-bold">{skills.filter((s) => s.type === 'teach').length}</div>
          <div className="text-sm text-emerald-100 mt-1">Skills Teaching</div>
        </div>
        <div className="p-5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl text-white shadow-lg shadow-orange-500/20">
          <div className="text-3xl font-bold">{pendingCount}</div>
          <div className="text-sm text-orange-100 mt-1">Pending Sessions</div>
        </div>
        <div className="p-5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl text-white shadow-lg shadow-purple-500/20">
          <div className="text-3xl font-bold">{completedCount}</div>
          <div className="text-sm text-purple-100 mt-1">Completed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Skills Management */}
        <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Your Skills Portfolio</h2>

          <form onSubmit={(e) => {
            e.preventDefault();
            const finalName = newSkill.name === '__custom__' ? customSkillName : newSkill.name;
            if (!finalName || !newSkill.category) return;
            addSkill({ ...newSkill, name: finalName });
            setNewSkill({ name: '', category: '', type: 'teach', proficiencyLevel: 'beginner' });
            setCustomSkillName('');
          }} className="flex flex-col gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Add a new skill</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Category</label>
                <select
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value, name: '' })}
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.value}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Skill</label>
                <select
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  disabled={!newSkill.category}
                >
                  <option value="">{newSkill.category ? 'Select Skill' : 'Select a category first'}</option>
                  {newSkill.category && SKILLS_BY_CATEGORY[newSkill.category]?.map((skill) => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                  {newSkill.category && <option value="__custom__">Type custom skill...</option>}
                </select>
              </div>
            </div>

            {newSkill.name === '__custom__' && (
              <input
                type="text"
                placeholder="Enter your custom skill name..."
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                value={customSkillName}
                onChange={(e) => setCustomSkillName(e.target.value)}
                autoFocus
              />
            )}

            <div className="flex gap-2">
              <select className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" value={newSkill.type} onChange={(e) => setNewSkill({ ...newSkill, type: e.target.value })}>
                <option value="teach">I want to TEACH</option>
                <option value="learn">I want to LEARN</option>
              </select>
              <select className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" value={newSkill.proficiencyLevel} onChange={(e) => setNewSkill({ ...newSkill, proficiencyLevel: e.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
              <button
                type="submit"
                disabled={!newSkill.category || (!newSkill.name || (newSkill.name === '__custom__' && !customSkillName))}
                className="px-5 py-2.5 text-white font-medium bg-gradient-to-r from-primary-600 to-indigo-600 rounded-lg hover:shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Skills You Teach</h4>
              {skills.filter((s) => s.type === 'teach').length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 p-3">Add skills you can teach others</p>
              ) : (
                skills.filter((s) => s.type === 'teach').map((skill) => (
                  <div key={skill._id} className="flex items-center justify-between p-3 mb-2 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
                    <div>
                      <span className="font-semibold text-indigo-900 dark:text-indigo-300">{skill.name}</span>
                      <span className="text-xs text-indigo-500 dark:text-indigo-400 ml-2">({skill.proficiencyLevel})</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">• {skill.category}</span>
                    </div>
                    <button onClick={() => deleteSkill(skill._id)} className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition">Remove</button>
                  </div>
                ))
              )}
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-4">Skills You Want to Learn</h4>
              {skills.filter((s) => s.type === 'learn').length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 p-3">Add skills you want to learn</p>
              ) : (
                skills.filter((s) => s.type === 'learn').map((skill) => (
                  <div key={skill._id} className="flex items-center justify-between p-3 mb-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg border border-emerald-100 dark:border-emerald-800">
                    <div>
                      <span className="font-semibold text-emerald-900 dark:text-emerald-300">{skill.name}</span>
                      <span className="text-xs text-emerald-500 dark:text-emerald-400 ml-2">({skill.proficiencyLevel})</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">• {skill.category}</span>
                    </div>
                    <button onClick={() => deleteSkill(skill._id)} className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition">Remove</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Recent Sessions */}
          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Sessions</h2>
              <Link to="/sessions" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700">View All →</Link>
            </div>
            {recentSessions.length === 0 ? (
              <div className="p-6 text-center bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-400 dark:text-gray-500 flex flex-col items-center">
                <Calendar className="w-10 h-10 mb-2 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                <p className="text-sm">No sessions yet. Find mentors on the Explore page!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => {
                  const isMentor = session.mentor?._id === user._id;
                  const other = isMentor ? session.learner : session.mentor;
                  return (
                    <div key={session._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <Avatar src={other?.avatar} name={other?.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{other?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{session.skill?.name} • {new Date(session.scheduledAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                          session.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' :
                          session.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' :
                          session.status === 'accepted' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' :
                          'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                        }`}>
                          {session.status}
                        </span>
                        {session.status === 'pending' && isMentor && (
                          <div className="flex gap-1">
                            <button onClick={async () => { await updateSessionStatus(session._id, 'accepted'); toast.success('Session accepted'); }} className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md" title="Accept">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={async () => { await updateSessionStatus(session._id, 'rejected'); toast.error('Session rejected'); }} className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md" title="Reject">
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
          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recommended Mentors</h2>
              <Link to="/explore" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700">Explore More →</Link>
            </div>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Based on skills you want to learn</p>
            <div className="space-y-4">
              {matches.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-400 dark:text-gray-500 flex flex-col items-center">
                  <Search className="w-10 h-10 mb-2 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                  <p className="text-sm">No mentors found. Add skills you want to learn!</p>
                </div>
              ) : (
                matches.slice(0, 3).map((match) => (
                  <div
                    key={match.user._id}
                    className={`relative flex items-start p-4 border rounded-2xl hover:shadow-md transition bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 ${match.isMutualSwap ? 'border-emerald-400 dark:border-emerald-600 ring-1 ring-emerald-50 dark:ring-emerald-950/20' : 'border-gray-100 dark:border-gray-800'}`}
                  >
                    {match.isMutualSwap && (
                      <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 z-10">
                        <Zap className="w-3 h-3" /> MUTUAL SWAP
                      </div>
                    )}
                    <Avatar src={match.user.avatar} name={match.user.name} size="md" className="mr-4 rounded-xl shadow-lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900 dark:text-white">{match.user.name}</h3>
                        <div className="flex flex-col items-end gap-1">
                          <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> {match.user.rating || 'New'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{match.user.bio || 'Ready to share knowledge!'}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {match.matchedSkills.map((s) => (
                          <span key={s._id} className="px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-md">
                            {s.name}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleOpenBooking(match)}
                        className="mt-3 w-full py-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        Book Session <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[
          { to: '/explore', icon: Search, label: 'Find Mentors', color: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30' },
          { to: '/chat', icon: MessageCircle, label: 'Messages', color: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30' },
          { to: '/leaderboard', icon: Trophy, label: 'Leaderboard', color: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30' },
          { to: '/community', icon: Globe, label: 'Communities', color: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30' },
        ].map((link) => (
          <Link key={link.to} to={link.to} className={`p-4 bg-gradient-to-br ${link.color} rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col items-center justify-center`}>
            <div className="mb-2"><link.icon className="w-7 h-7 text-gray-700 dark:text-gray-300" strokeWidth={1.5} /></div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{link.label}</p>
          </Link>
        ))}
      </div>

      {/* Booking Modal */}
      {showBooking && selectedMentor && selectedSkillForBooking && (
        <SessionScheduler
          isOpen={showBooking}
          onClose={() => setShowBooking(false)}
          mentor={selectedMentor}
          skill={selectedSkillForBooking}
          currentUser={user}
        />
      )}
    </div>
  );
}
