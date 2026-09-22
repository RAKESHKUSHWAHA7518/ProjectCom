import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useReviewStore } from '../store/reviewStore';
import { useChatStore } from '../store/chatStore';
import {
  MapPin, Star, Edit3, MessageCircle, Trophy, Medal, Target, Flame,
  Gem, Crown, Rocket, Camera, Trash2, Zap, Mail, Globe, Calendar,
  CheckCircle, BookOpen, Award, TrendingUp, X, Plus, Shield,
  ExternalLink, ChevronRight, Users, Clock, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../components/Avatar';
import VerificationPanel from '../components/VerificationPanel';
import SessionScheduler from '../components/SessionScheduler';
import { useTranslation } from 'react-i18next';

const ICON_MAP = { Star, Target, Flame, Gem, Crown, Rocket, Trophy, Medal };
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ── Small section card wrapper ── */
function SectionCard({ title, icon: Icon, iconBg, iconColor, badge, children, action }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="flex items-center gap-2.5 text-sm font-bold text-gray-900 dark:text-white">
          <div className={`w-7 h-7 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} strokeWidth={2} />
          </div>
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {badge !== undefined && (
            <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">{badge}</span>
          )}
          {action}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function Profile() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { reviews, fetchReviews } = useReviewStore();
  const { getOrCreateConversation } = useChatStore();
  const isOwnProfile = !id || id === currentUser?._id;

  const [profile, setProfile]     = useState(null);
  const [skills, setSkills]       = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData]   = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [activeSkillTab, setActiveSkillTab] = useState('teach');

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isOwnProfile) {
        const [profileRes, skillsRes] = await Promise.all([
          fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${currentUser.token}` } }),
          fetch(`${API_URL}/skills`,         { headers: { Authorization: `Bearer ${currentUser.token}` } }),
        ]);
        const data = await profileRes.json();
        setProfile(data);
        setEditData({ name: data.name, bio: data.bio, location: data.location, timezone: data.timezone, socialLinks: data.socialLinks || {} });
        if (skillsRes.ok) {
          const skillsData = await skillsRes.json();
          setSkills(Array.isArray(skillsData) ? skillsData : []);
        } else setSkills([]);
        fetchReviews(currentUser._id);
      } else {
        const res = await fetch(`${API_URL}/users/${id}`, { headers: { Authorization: `Bearer ${currentUser.token}` } });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
          setSkills(Array.isArray(data.skills) ? data.skills : []);
        } else { setProfile(null); setSkills([]); }
        fetchReviews(id);
      }
    } catch { console.error('Failed to load profile'); }
    setIsLoading(false);
  }, [id, isOwnProfile, currentUser, fetchReviews]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentUser.token}` },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (res.ok) { setProfile(data); setIsEditing(false); toast.success('Profile updated!'); }
      else toast.error(data.message || 'Failed to update');
    } catch { toast.error('Failed to save changes'); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await fetch(`${API_URL}/users/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentUser.token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) { setProfile(p => ({ ...p, avatar: data.avatar })); toast.success('Avatar updated!'); }
      else toast.error(data.message || 'Upload failed');
    } catch { toast.error('Failed to upload image'); }
  };

  const handleStartChat = async () => {
    try {
      const conv = await getOrCreateConversation(profile._id);
      navigate(`/chat/${conv._id}`);
    } catch { toast.error('Failed to start conversation'); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure? This permanently deletes your account and all data.')) return;
    try {
      const res = await fetch(`${API_URL}/users/me`, { method: 'DELETE', headers: { Authorization: `Bearer ${currentUser.token}` } });
      if (res.ok) { useAuthStore.getState().logout(); navigate('/login'); toast.success('Account deleted'); }
      else { const d = await res.json(); toast.error(d.message || 'Failed to delete'); }
    } catch { toast.error('Failed to delete account'); }
  };

  const handleEndorse = async (skillId) => {
    try {
      const res = await fetch(`${API_URL}/skills/${skillId}/endorse`, { method: 'POST', headers: { Authorization: `Bearer ${currentUser.token}` } });
      if (res.ok) {
        const newEndorsements = await res.json();
        setSkills(prev => (Array.isArray(prev) ? prev : []).map(s => s._id === skillId ? { ...s, endorsements: newEndorsements } : s));
      } else { const d = await res.json(); toast.error(d.message || 'Failed to endorse'); }
    } catch { toast.error('Failed to endorse skill'); }
  };

  const getCompletenessScore = () => {
    if (!profile) return 0;
    let s = 0;
    const safeList = Array.isArray(skills) ? skills : [];
    if (profile.name) s += 20;
    if (profile.bio) s += 20;
    if (profile.location) s += 15;
    if (safeList.filter(x => x.type === 'teach').length > 0) s += 20;
    if (safeList.filter(x => x.type === 'learn').length > 0) s += 15;
    if (profile.avatar) s += 10;
    return s;
  };

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="py-6 sm:py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden animate-pulse">
          <div className="h-28 sm:h-36 bg-gray-200 dark:bg-gray-800" />
          <div className="px-5 pb-5">
            <div className="flex items-end gap-4 -mt-10 mb-4">
              <div className="w-20 h-20 bg-gray-300 dark:bg-gray-700 rounded-2xl border-4 border-white dark:border-gray-900 shrink-0" />
              <div className="flex-1 space-y-2 pb-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-4">
              {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl animate-pulse" />
          <div className="h-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center">
        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-700" strokeWidth={1.5} />
        <p className="text-gray-500 dark:text-gray-400 font-medium">User not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 mx-auto">
          <ArrowRight className="w-4 h-4 rotate-180" />Go back
        </button>
      </div>
    );
  }

  const safeSkills    = Array.isArray(skills) ? skills : [];
  const teachSkills   = safeSkills.filter(s => s.type === 'teach');
  const learnSkills   = safeSkills.filter(s => s.type === 'learn');
  const activeSkills  = activeSkillTab === 'teach' ? teachSkills : learnSkills;
  const completeness  = getCompletenessScore();
  const isVerified    = profile.emailVerified || Object.values(profile.verification || {}).some(Boolean);

  return (
    <div className="py-6 sm:py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* ═══════════════════════════════════
          HERO CARD
      ═══════════════════════════════════ */}
      <div className="relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm mb-6">
        {/* Cover */}
        <div className="h-28 sm:h-36 bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
          <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute top-4 left-1/3 w-24 h-24 bg-white/5 rounded-full blur-xl" />
        </div>

        <div className="px-4 sm:px-6 pb-6">
          {/* Avatar + action row */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 sm:-mt-12 mb-5">
            {/* Avatar */}
            <div className="relative group/av w-fit">
              <div className="border-4 border-white dark:border-gray-900 rounded-2xl shadow-xl overflow-hidden">
                <Avatar src={profile.avatar} name={profile.name} size="xl" className="rounded-none" />
              </div>
              {isOwnProfile && (
                <label className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-white rounded-xl opacity-0 group-hover/av:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]">
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Change</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 flex-wrap sm:pb-1">
              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all border ${
                    isEditing
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  {isEditing ? 'Cancel' : t('Edit Profile')}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowBooking(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    <Calendar className="w-4 h-4" />{t('Book Session')}
                  </button>
                  <button
                    onClick={handleStartChat}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />{t('Message')}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Name + meta */}
          <div className="mb-5">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{profile.name}</h1>
              {isVerified && (
                <CheckCircle className="w-5 h-5 fill-emerald-500 text-white dark:text-gray-900" title="Verified" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400 mb-3">
              {profile.email && (
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{profile.email}</span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>
              )}
              <span className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(profile.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'}`} />
                ))}
                <span className="ml-1 text-xs font-bold text-gray-700 dark:text-gray-300">{profile.rating?.toFixed(1) || '0.0'}</span>
                <span className="text-xs text-gray-400 ml-0.5">({profile.numReviews || 0})</span>
              </span>
            </div>

            {profile.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mb-3">{profile.bio}</p>
            )}

            {/* Social links */}
            {profile.socialLinks && (profile.socialLinks.github || profile.socialLinks.linkedin || profile.socialLinks.website) && (
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { key: 'github',   label: 'GitHub',   icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>, hover: 'hover:text-gray-900 dark:hover:text-white' },
                  { key: 'linkedin', label: 'LinkedIn', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>, hover: 'hover:text-blue-600 dark:hover:text-blue-400' },
                  { key: 'website',  label: 'Website',  icon: <Globe className="w-4 h-4" />, hover: 'hover:text-primary-600 dark:hover:text-primary-400' },
                ].filter(l => profile.socialLinks[l.key]).map(l => {
                  const href = profile.socialLinks[l.key];
                  return (
                    <a key={l.key} href={href.startsWith('http') ? href : `https://${href}`} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 ${l.hover} transition-colors`}>
                      {l.icon}{l.label}<ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stat pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: t('Credits'),          value: profile.skillCredits || 0,           from: 'from-amber-50 dark:from-amber-950/20',   to: 'to-orange-50 dark:to-orange-950/20',   border: 'border-amber-100 dark:border-amber-900/30',   val: 'text-amber-600 dark:text-amber-400' },
              { label: t('Sessions Taught'),   value: profile.totalSessionsAsMentor || 0,  from: 'from-indigo-50 dark:from-indigo-950/20', to: 'to-blue-50 dark:to-blue-950/20',       border: 'border-indigo-100 dark:border-indigo-900/30', val: 'text-indigo-600 dark:text-indigo-400' },
              { label: t('Sessions Learned'),  value: profile.totalSessionsAsLearner || 0, from: 'from-emerald-50 dark:from-emerald-950/20', to: 'to-teal-50 dark:to-teal-950/20',   border: 'border-emerald-100 dark:border-emerald-900/30', val: 'text-emerald-600 dark:text-emerald-400' },
              { label: t('Day Streak'),        value: profile.streak?.current || 0,         from: 'from-purple-50 dark:from-purple-950/20', to: 'to-pink-50 dark:to-pink-950/20',     border: 'border-purple-100 dark:border-purple-900/30', val: 'text-purple-600 dark:text-purple-400' },
            ].map((s, i) => (
              <div key={i} className={`bg-gradient-to-br ${s.from} ${s.to} border ${s.border} rounded-xl p-3 text-center`}>
                <p className={`text-xl sm:text-2xl font-extrabold ${s.val} leading-none mb-1 tabular-nums`}>{s.value}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Completeness */}
          {isOwnProfile && (
            <div className="mt-4 relative group/complete">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('Profile Completeness')}</span>
                <span className={`text-xs font-bold ${completeness === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary-600 dark:text-primary-400'}`}>{completeness}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${completeness === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-primary-500 to-indigo-500'}`}
                  style={{ width: `${completeness}%` }}
                />
              </div>
              {completeness < 100 && (
                <div className="absolute top-full left-0 mt-2 w-64 p-3.5 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover/complete:opacity-100 group-hover/complete:visible transition-all z-20 text-xs">
                  <p className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-primary-500" />Complete your profile
                  </p>
                  <ul className="space-y-1.5 text-gray-500 dark:text-gray-400">
                    {!profile.bio && <li className="flex items-center gap-1.5"><Plus className="w-3 h-3 shrink-0" />Add a bio (+20%)</li>}
                    {!profile.location && <li className="flex items-center gap-1.5"><Plus className="w-3 h-3 shrink-0" />Add location (+15%)</li>}
                    {!profile.avatar && <li className="flex items-center gap-1.5"><Plus className="w-3 h-3 shrink-0" />Upload avatar (+10%)</li>}
                    {teachSkills.length === 0 && <li className="flex items-center gap-1.5"><Plus className="w-3 h-3 shrink-0" />Add skills to teach (+20%)</li>}
                    {learnSkills.length === 0 && <li className="flex items-center gap-1.5"><Plus className="w-3 h-3 shrink-0" />Add skills to learn (+15%)</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════
          EDIT FORM
      ═══════════════════════════════════ */}
      {isEditing && (
        <div className="bg-white dark:bg-gray-900 border border-primary-200 dark:border-primary-800/50 rounded-2xl overflow-hidden shadow-sm mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-primary-50/40 dark:bg-primary-950/10">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-primary-500" />{t('Edit Profile')}
            </h2>
            <button onClick={() => setIsEditing(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('Name')}</label>
              <input className="input-field text-sm" placeholder="Full name" value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('Location')}</label>
              <input className="input-field text-sm" placeholder="City, Country" value={editData.location || ''} onChange={(e) => setEditData({ ...editData, location: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('Bio')}</label>
              <textarea className="input-field text-sm resize-none" rows={3} placeholder="Tell the community about yourself..." value={editData.bio || ''} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">GitHub URL</label>
              <input className="input-field text-sm" placeholder="https://github.com/username" value={editData.socialLinks?.github || ''} onChange={(e) => setEditData({ ...editData, socialLinks: { ...editData.socialLinks, github: e.target.value } })} />
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">LinkedIn URL</label>
              <input className="input-field text-sm" placeholder="https://linkedin.com/in/username" value={editData.socialLinks?.linkedin || ''} onChange={(e) => setEditData({ ...editData, socialLinks: { ...editData.socialLinks, linkedin: e.target.value } })} />
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Website URL</label>
              <input className="input-field text-sm" placeholder="https://yourwebsite.com" value={editData.socialLinks?.website || ''} onChange={(e) => setEditData({ ...editData, socialLinks: { ...editData.socialLinks, website: e.target.value } })} />
            </div>
          </div>
          <div className="px-5 pb-5 flex gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
            <button onClick={handleSave} className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              {t('Save Changes')}
            </button>
            <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          SKILLS + BADGES
      ═══════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

        {/* ── Skills (2 cols) ── */}
        <div className="lg:col-span-2">
          <SectionCard
            title={t('Skills')}
            icon={BookOpen}
            iconBg="bg-indigo-50 dark:bg-indigo-950/40"
            iconColor="text-indigo-600 dark:text-indigo-400"
            badge={safeSkills.length}
          >
            {/* Tab switcher */}
            <div className="flex gap-1 px-3 pt-3 pb-2">
              {[
                { key: 'teach', label: `Teaching`, count: teachSkills.length, activeClass: 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20' },
                { key: 'learn', label: `Learning`, count: learnSkills.length, activeClass: 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSkillTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeSkillTab === tab.key
                      ? tab.activeClass
                      : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeSkillTab === tab.key ? 'bg-white/70' : tab.key === 'teach' ? 'bg-indigo-400' : 'bg-emerald-400'}`} />
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div className="px-4 pb-4">
              {activeSkills.length === 0 ? (
                <div className="py-8 flex flex-col items-center gap-2 text-center bg-gray-50 dark:bg-gray-800/40 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <BookOpen className="w-8 h-8 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {activeSkillTab === 'teach' ? 'No teaching skills added yet' : 'No learning skills added yet'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeSkills.map(s => {
                    const isEndorsed = s.endorsements?.includes(currentUser?._id);
                    const count = s.endorsements?.length || 0;
                    const isTeach = activeSkillTab === 'teach';
                    return (
                      <div key={s._id} className={`flex items-stretch rounded-xl border overflow-hidden ${isTeach ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/40' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40'}`}>
                        <div className="px-3 py-2">
                          <p className={`text-sm font-bold leading-tight ${isTeach ? 'text-indigo-800 dark:text-indigo-200' : 'text-emerald-800 dark:text-emerald-200'}`}>{s.name}</p>
                          <p className={`text-[10px] font-medium ${isTeach ? 'text-indigo-400 dark:text-indigo-500' : 'text-emerald-400 dark:text-emerald-500'}`}>{s.proficiencyLevel}</p>
                        </div>
                        {isTeach && !isOwnProfile && (
                          <button
                            onClick={() => handleEndorse(s._id)}
                            className={`px-2.5 flex items-center gap-1 text-xs font-bold transition border-l ${isTeach ? 'border-indigo-100 dark:border-indigo-900/40' : 'border-emerald-100 dark:border-emerald-900/40'} ${isEndorsed ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'}`}
                            title={isEndorsed ? 'Remove endorsement' : 'Endorse'}
                          >
                            <Zap className="w-3 h-3" />{count > 0 ? count : ''}
                          </button>
                        )}
                        {isTeach && isOwnProfile && count > 0 && (
                          <span className="px-2.5 flex items-center gap-1 text-xs font-bold text-indigo-500 border-l border-indigo-100 dark:border-indigo-900/40">
                            <Zap className="w-3 h-3" />{count}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* ── Badges ── */}
        <SectionCard
          title={t('Badges')}
          icon={Trophy}
          iconBg="bg-amber-50 dark:bg-amber-950/40"
          iconColor="text-amber-600 dark:text-amber-400"
          badge={profile.badges?.length || 0}
        >
          <div className="p-4">
            {profile.badges && profile.badges.length > 0 ? (
              <div className="space-y-2">
                {profile.badges.map((badge, i) => {
                  const BadgeIcon = ICON_MAP[badge.icon] || Trophy;
                  const isEmoji   = badge.icon && !ICON_MAP[badge.icon];
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                      {isEmoji
                        ? <span className="text-xl shrink-0">{badge.icon}</span>
                        : <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0"><BadgeIcon className="w-4 h-4" strokeWidth={2} /></div>
                      }
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{badge.label || badge.type}</p>
                        {badge.earnedAt && <p className="text-[10px] text-gray-400 mt-0.5">{new Date(badge.earnedAt).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 flex flex-col items-center gap-2.5 text-center">
                <Medal className="w-10 h-10 text-gray-200 dark:text-gray-700" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('No badges yet')}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Complete sessions to earn badges</p>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ═══════════════════════════════════
          REVIEWS
      ═══════════════════════════════════ */}
      <SectionCard
        title={t('Reviews')}
        icon={Star}
        iconBg="bg-amber-50 dark:bg-amber-950/40"
        iconColor="text-amber-500 dark:text-amber-400"
        badge={reviews.length}
      >
        <div className="p-5">
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review._id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                        {review.reviewer?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{review.reviewer?.name || 'Anonymous'}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'}`} />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-10">"{review.comment}"</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center gap-2.5 text-center">
              <Star className="w-10 h-10 text-gray-200 dark:text-gray-700" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('No reviews yet')}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Reviews appear after completed sessions</p>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ═══════════════════════════════════
          VERIFICATION PANEL
      ═══════════════════════════════════ */}
      {isOwnProfile && (
        <div className="mt-6">
          <VerificationPanel user={profile} isOwnProfile={true} />
        </div>
      )}

      {/* ═══════════════════════════════════
          DANGER ZONE
      ═══════════════════════════════════ */}
      {isOwnProfile && (
        <div className="mt-6 bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900/30 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10">
            <div className="w-7 h-7 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
              <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-sm font-bold text-red-600 dark:text-red-400">{t('Danger Zone')}</h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md">
              {t('Danger Text') !== 'Danger Text'
                ? t('Danger Text')
                : 'Permanently delete your account and all associated data. This action cannot be undone.'}
            </p>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/40 hover:border-red-300 dark:hover:border-red-800 transition-all"
            >
              <Trash2 className="w-4 h-4" />{t('Delete Account')}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          BOOKING MODAL
      ═══════════════════════════════════ */}
      {showBooking && profile && (
        <SessionScheduler
          isOpen={showBooking}
          onClose={() => setShowBooking(false)}
          mentor={profile}
          skills={safeSkills.filter(s => s.type === 'teach')}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
