import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { CATEGORIES, SKILLS_BY_CATEGORY } from '../data/skillsData';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import toast from 'react-hot-toast';
import {
  Search, MapPin, Star, Zap, Sparkles, BadgeCheck, Shield,
  SlidersHorizontal, X, UserCheck, MessageSquare, Calendar, ChevronLeft,
  ChevronRight, Link, Mail, Smartphone, Camera, Users,
  ChevronDown, LayoutGrid, List, Globe
} from 'lucide-react';
import Avatar from '../components/Avatar';
import SessionScheduler from '../components/SessionScheduler';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MATCH_WEIGHTS = {
  skillOverlap: 0.35,
  availability: 0.20,
  rating: 0.15,
  responseTime: 0.10,
  sessionCount: 0.10,
  verification: 0.10,
};

function calculateMatchScore(mentor, currentUser, selectedSkill) {
  let score = 0;
  const reasons = [];
  const userLearnSkills = currentUser?.learnSkills?.map(s => (typeof s === 'string' ? s : s?.name || '').toLowerCase()).filter(Boolean) || [];
  const mentorTeachSkills = (mentor?.teachSkills || []).map(s => (typeof s === 'string' ? s : s?.name || '').toLowerCase()).filter(Boolean);
  const overlap = userLearnSkills.filter(s => mentorTeachSkills.includes(s));
  if (overlap.length > 0) { score += MATCH_WEIGHTS.skillOverlap * Math.min(overlap.length / 3, 1); reasons.push(`${overlap.length} matching skill${overlap.length > 1 ? 's' : ''}`); }
  if (currentUser?.availability?.length && mentor?.availability?.length) { score += MATCH_WEIGHTS.availability * 0.7; reasons.push('Flexible scheduling'); }
  const rating = mentor?.rating || 0;
  if (rating >= 4.5) { score += MATCH_WEIGHTS.rating; reasons.push('Top rated'); } else if (rating >= 4) { score += MATCH_WEIGHTS.rating * 0.7; }
  if (mentor?.avgResponseTime && mentor.avgResponseTime < 3600) { score += MATCH_WEIGHTS.responseTime; reasons.push('Fast responder'); }
  const totalSessions = (mentor?.totalSessionsAsMentor || 0) + (mentor?.totalSessionsAsLearner || 0);
  if (totalSessions > 20) { score += MATCH_WEIGHTS.sessionCount; reasons.push('Experienced mentor'); } else if (totalSessions > 5) { score += MATCH_WEIGHTS.sessionCount * 0.5; }
  const verifiedCount = Object.values(mentor?.verification || {}).filter(Boolean).length;
  if (verifiedCount >= 3) { score += MATCH_WEIGHTS.verification; reasons.push('Highly verified'); } else if (verifiedCount > 0) { score += MATCH_WEIGHTS.verification * 0.5; }
  if (selectedSkill && mentorTeachSkills.includes(selectedSkill.toLowerCase())) { score += 0.05; reasons.push('Exact skill match'); }
  return { score: Math.min(Math.round(score * 100), 100), reasons };
}

function MentorCard({ item, onBook, onChat, onProfile, viewMode }) {
  const { t } = useTranslation();
  const mentor = item.mentor || item.user;
  const teachSkills = item.teachSkills || [];
  const matchScore = item.matchScore || 0;
  const matchReasons = item.matchReasons || [];

  const getVerificationBadges = (verification) => {
    const badges = [];
    if (verification?.email) badges.push({ icon: Mail, label: 'Email', color: 'text-blue-600 dark:text-blue-400' });
    if (verification?.phone) badges.push({ icon: Smartphone, label: 'Phone', color: 'text-emerald-600 dark:text-emerald-400' });
    if (verification?.linkedin) badges.push({ icon: Link, label: 'LinkedIn', color: 'text-indigo-600 dark:text-indigo-400' });
    if (verification?.identity) badges.push({ icon: Shield, label: 'ID', color: 'text-purple-600 dark:text-purple-400' });
    if (verification?.videoIntro) badges.push({ icon: Camera, label: 'Video', color: 'text-rose-600 dark:text-rose-400' });
    return badges;
  };

  const verifiedBadges = getVerificationBadges(mentor?.verification);
  const totalSessions = (mentor?.totalSessionsAsMentor || 0) + (mentor?.totalSessionsAsLearner || 0);

  // List view — mobile-friendly stacked layout
  if (viewMode === 'list') {
    return (
      <article className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg transition-all duration-300 group">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="relative shrink-0">
            <Avatar src={mentor?.avatar} name={mentor?.name || 'Mentor'} size="lg" className="rounded-2xl shadow-md" />
            {matchScore > 80 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                <Zap className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {/* Name row */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight truncate">{mentor?.name || 'Mentor'}</h3>
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">{mentor?.rating?.toFixed(1) || '—'}</span>
              </div>
            </div>
            {mentor?.location && (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
                <MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{mentor.location}</span>
              </p>
            )}
            {/* Skills */}
            <div className="flex flex-wrap gap-1 mb-3">
              {teachSkills?.slice(0, 3).map((s, idx) => (
                <span key={s?._id || s?.name || idx} className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md">
                  {typeof s === 'string' ? s : s?.name}
                </span>
              ))}
              {teachSkills?.length > 3 && <span className="px-2 py-0.5 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-md">+{teachSkills.length - 3}</span>}
            </div>
            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => onBook(mentor, teachSkills)} className="flex-1 py-2 text-xs font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-md transition-all flex items-center justify-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />Book
              </button>
              <button onClick={() => onChat(mentor?._id)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-xl border border-gray-200 dark:border-gray-700 transition-all">
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onProfile(mentor?._id)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-all">
                <UserCheck className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Grid view card
  return (
    <article className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-xl dark:hover:shadow-black/30 hover:-translate-y-1 transition-all duration-300 group flex flex-col">
      <div className="h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative shrink-0">
            <Avatar src={mentor?.avatar} name={mentor?.name || 'Mentor'} size="lg" className="rounded-2xl shadow-md" />
            {matchScore > 80 && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                <Zap className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1.5 mb-0.5">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">{mentor?.name || 'Mentor'}</h3>
              {matchScore > 70 && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-100 dark:border-emerald-800 shrink-0">
                  <Sparkles className="w-2.5 h-2.5" />{matchScore}%
                </span>
              )}
            </div>
            {mentor?.location && (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1.5">
                <MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{mentor.location}</span>
              </p>
            )}
            <div className="flex items-center gap-1">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < Math.round(mentor?.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'}`} />
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-0.5">{mentor?.rating?.toFixed(1) || 'New'}</span>
              <span className="text-xs text-gray-400">({mentor?.numReviews || 0})</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Users className="w-3 h-3" />
            <span><strong className="text-gray-900 dark:text-white">{totalSessions}</strong> sessions</span>
          </div>
          {verifiedBadges.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 ml-auto">
              <BadgeCheck className="w-3 h-3 text-emerald-500" />
              <span>{verifiedBadges.length} verified</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {mentor?.bio && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">{mentor.bio}</p>
        )}

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {teachSkills?.slice(0, 3).map((s, idx) => (
            <span key={s?._id || s?.name || idx} className="px-2 py-1 text-xs font-medium bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 rounded-lg border border-primary-100 dark:border-primary-900/30">
              {typeof s === 'string' ? s : s?.name}
            </span>
          ))}
          {teachSkills?.length > 3 && (
            <span className="px-2 py-1 text-xs font-medium text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-800">
              +{teachSkills.length - 3}
            </span>
          )}
        </div>

        {/* Match reasons */}
        {matchReasons?.length > 0 && (
          <div className="mb-3 px-3 py-2 bg-primary-50/70 dark:bg-primary-950/20 rounded-xl border border-primary-100 dark:border-primary-900/30">
            <p className="text-xs text-primary-600 dark:text-primary-400 leading-relaxed">
              {matchReasons.slice(0, 2).join(' · ')}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-1">
          <button onClick={() => onBook(mentor, teachSkills)} className="flex-1 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{t('Book Session')}
          </button>
          <button onClick={() => onChat(mentor?._id)} className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-xl border border-gray-200 dark:border-gray-700 transition-all" title="Message">
            <MessageSquare className="w-4 h-4" />
          </button>
          <button onClick={() => onProfile(mentor?._id)} className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-all" title="View Profile">
            <UserCheck className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Explore() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { getOrCreateConversation } = useChatStore();
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedSkillForBooking, setSelectedSkillForBooking] = useState(null);
  const [selectedMentorSkills, setSelectedMentorSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [instantBook, setInstantBook] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [priceRange, setPriceRange] = useState('');
  const [sessionLength, setSessionLength] = useState('');
  const [language, setLanguage] = useState('');

  const fetchExplore = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const searchTerm = selectedSkill || search;
      if (searchTerm) params.set('search', searchTerm);
      if (category) params.set('category', category);
      if (minRating) params.set('minRating', minRating);
      if (sortBy) params.set('sortBy', sortBy);
      if (instantBook) params.set('instantBook', 'true');
      if (verifiedOnly) params.set('verifiedOnly', 'true');
      if (priceRange) params.set('priceRange', priceRange);
      if (sessionLength) params.set('sessionLength', sessionLength);
      if (language) params.set('language', language);
      params.set('page', page);
      const response = await fetch(`${API_URL}/users/explore?${params}`, { headers: { Authorization: `Bearer ${user.token}` } });
      const data = await response.json();
      if (response.ok) {
        const mentorsWithScores = (data.users || [])
          .filter((item) => { const m = item?.mentor || item?.user || (item?._id ? item : null); return m && m._id; })
          .map((item) => {
            const mentor = item?.mentor || item?.user || item;
            const teachSkills = item?.teachSkills || mentor?.teachSkills || [];
            const { score, reasons } = calculateMatchScore(mentor, user, selectedSkill);
            return { mentor, teachSkills, matchScore: score, matchReasons: reasons };
          });
        if (!sortBy) mentorsWithScores.sort((a, b) => b.matchScore - a.matchScore);
        setResults(mentorsWithScores);
        setTotalPages(data.totalPages || 1);
      }
    } catch { console.error('Failed to fetch explore data'); }
    setIsLoading(false);
  }, [user, page, sortBy, category, instantBook, verifiedOnly, priceRange, sessionLength, language, search, selectedSkill, minRating]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) fetchExplore();
  }, [fetchExplore, user]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchExplore(); };
  const clearFilters = () => {
    setSearch(''); setCategory(''); setSelectedSkill(''); setMinRating(''); setSortBy('');
    setInstantBook(false); setVerifiedOnly(false); setPriceRange(''); setSessionLength(''); setLanguage('');
    setPage(1);
  };
  const handleStartChat = async (mentorId) => {
    try { const conv = await getOrCreateConversation(mentorId); navigate(`/chat/${conv._id}`); }
    catch { toast.error('Failed to start conversation'); }
  };
  const handleOpenBooking = (mentor, skills) => {
    setSelectedMentor(mentor); setSelectedMentorSkills(skills || []);
    setSelectedSkillForBooking(skills?.[0] || null); setShowBooking(true);
  };
  const hasActiveFilters = search || category || selectedSkill || minRating || instantBook || verifiedOnly || priceRange || sessionLength || language;
  const activeFilterCount = [search, category, selectedSkill, minRating, instantBook, verifiedOnly, priceRange, sessionLength, language].filter(Boolean).length;

  return (
    <div className="py-6 sm:py-8 lg:py-10 w-full min-h-screen">
      <div className="container-page">

        {/* ── Page Header ── */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-2 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 rounded-full border border-primary-100 dark:border-primary-900/40">
                Mentor Discovery
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {t('Explore Mentors')}
              </h1>
              <p className="mt-1.5 text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-xl">
                Find skilled experts who match your learning goals.
              </p>
            </div>
            {/* View toggle — hidden on xs, shown on sm+ */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 self-start shrink-0 mt-1">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`} aria-label="Grid view">
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`} aria-label="List view">
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Filter Panel ── */}
        <section className="mb-6 sm:mb-8" aria-labelledby="filters-heading">
          <h2 id="filters-heading" className="sr-only">Search and Filter Mentors</h2>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <form onSubmit={handleSearch} className="p-4 sm:p-5 lg:p-6">

              {/* Row 1: Search input full width */}
              <div className="relative mb-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search skills, mentors, topics..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-900 transition-all"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelectedSkill(''); }}
                />
              </div>

              {/* Row 2: Category + Skill + Rating selects */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-3">
                <div className="relative">
                  <select
                    className="w-full px-3.5 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-900 transition-all cursor-pointer"
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setSelectedSkill(''); setPage(1); }}
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.icon} {cat.value}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    className="w-full px-3.5 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-900 transition-all cursor-pointer disabled:opacity-50"
                    value={selectedSkill}
                    onChange={(e) => { setSelectedSkill(e.target.value); if (e.target.value) setSearch(''); }}
                    disabled={!category}
                  >
                    <option value="">{category ? 'All Skills' : 'Select category first'}</option>
                    {category && SKILLS_BY_CATEGORY[category]?.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    className="w-full px-3.5 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-900 transition-all cursor-pointer"
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                  >
                    <option value="">Any Rating</option>
                    <option value="3">3+ ⭐</option>
                    <option value="4">4+ ⭐</option>
                    <option value="4.5">4.5+ ⭐</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Row 3: Toggles + controls + search button */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Toggle switches */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${instantBook ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                    onClick={() => setInstantBook(!instantBook)}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${instantBook ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Instant Book</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${verifiedOnly ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${verifiedOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Verified Only</span>
                </label>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Clear & Advanced */}
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all whitespace-nowrap">
                    <X className="w-3 h-3" />Clear {activeFilterCount > 1 ? `(${activeFilterCount})` : ''}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${showAdvancedFilters ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800' : 'text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                >
                  <SlidersHorizontal className="w-3 h-3" />Filters
                  <ChevronDown className={`w-3 h-3 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </button>
                <button
                  type="submit"
                  className="px-4 sm:px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl shadow-sm hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 transition-all flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Search className="w-3.5 h-3.5" />{t('Search')}
                </button>
              </div>

              {/* Advanced filters */}
              {showAdvancedFilters && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  {[
                    { label: 'Price / hr', value: priceRange, onChange: setPriceRange, options: [['', 'Any price'], ['0-5', '0–5 cr'], ['5-10', '5–10 cr'], ['10-20', '10–20 cr'], ['20+', '20+ cr']] },
                    { label: 'Length', value: sessionLength, onChange: setSessionLength, options: [['', 'Any'], ['30', '30 min'], ['45', '45 min'], ['60', '60 min'], ['90', '90 min']] },
                    { label: 'Language', value: language, onChange: setLanguage, options: [['', 'Any'], ['English', 'English'], ['Spanish', 'Spanish'], ['French', 'French'], ['German', 'German'], ['Hindi', 'Hindi'], ['Chinese', 'Chinese']] },
                    { label: 'Sort By', value: sortBy, onChange: (v) => { setSortBy(v); setPage(1); }, options: [['', 'Best Match'], ['rating', 'Top Rated'], ['reviews', 'Most Reviews'], ['sessions', 'Experienced'], ['newest', 'Newest']] },
                  ].map(({ label, value, onChange, options }) => (
                    <div key={label} className="relative">
                      <label className="block mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
                      <select
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                      >
                        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2.5 bottom-2.5 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        </section>

        {/* ── Results header ── */}
        {!isLoading && results.length > 0 && (
          <div className="flex items-center justify-between mb-4 gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-bold text-gray-900 dark:text-white">{results.length}</span> mentor{results.length !== 1 ? 's' : ''} found
              {totalPages > 1 && <span className="ml-2 text-gray-400">· Page {page}/{totalPages}</span>}
            </p>
            <select
              className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-primary-500 hidden sm:block"
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            >
              <option value="">Best Match</option>
              <option value="rating">Highest Rated</option>
              <option value="reviews">Most Reviewed</option>
              <option value="sessions">Most Experienced</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        )}

        {/* ── Results ── */}
        <section aria-labelledby="results-heading">
          <h2 id="results-heading" className="sr-only">Mentor Results</h2>

          {isLoading ? (
            // Always single column on mobile, 2 on sm, 3 on lg for grid skeletons
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 animate-pulse">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="flex gap-1.5 mb-4">
                    <div className="h-6 w-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                    <div className="h-6 w-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                  </div>
                  <div className="h-9 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 sm:py-20 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4">
              <div className="w-14 h-14 mx-auto mb-5 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                <Search className="w-7 h-7 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">No mentors found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6">Try adjusting your filters or searching for a different skill.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs mx-auto">
                <button onClick={clearFilters} className="btn-primary flex-1 text-sm">
                  <X className="w-4 h-4" />Clear Filters
                </button>
                <button onClick={() => navigate('/dashboard')} className="btn-secondary flex-1 text-sm">
                  <Sparkles className="w-4 h-4" />Add Skills
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile always grid (1col), sm = 2col, lg = 3col; list view = always 1col */}
              <div className={viewMode === 'list' ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'} role="list">
                {results
                  .filter((item) => { const m = item?.mentor || item?.user; return m && m._id; })
                  .map((item) => (
                    <MentorCard
                      key={(item.mentor || item.user)._id}
                      item={item}
                      viewMode={viewMode}
                      onBook={handleOpenBooking}
                      onChat={handleStartChat}
                      onProfile={(id) => navigate(`/profile/${id}`)}
                    />
                  ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-1.5 mt-8 sm:mt-10" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2.5 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (page <= 3) pageNum = i + 1;
                      else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = page - 2 + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-9 h-9 sm:w-10 sm:h-10 text-sm font-semibold rounded-xl transition-all ${page === pageNum ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                          aria-current={page === pageNum ? 'page' : undefined}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2.5 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>

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
      </div>
    </div>
  );
}
