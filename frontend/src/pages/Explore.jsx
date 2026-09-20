import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { CATEGORIES, SKILLS_BY_CATEGORY } from '../data/skillsData';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import toast from 'react-hot-toast';
import { Search, MapPin, Star, Coins, Zap, Sparkles, Clock, BadgeCheck, Shield, Globe, Filter, SlidersHorizontal, X, TrendingUp, UserCheck, User, Award, MessageSquare, Calendar, ChevronLeft, ChevronRight, Link, Mail, Smartphone, Camera } from 'lucide-react';
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
  if (overlap.length > 0) {
    score += MATCH_WEIGHTS.skillOverlap * Math.min(overlap.length / 3, 1);
    reasons.push(`${overlap.length} matching skill${overlap.length > 1 ? 's' : ''}`);
  }

  const userAvail = currentUser?.availability?.length || 0;
  const mentorAvail = mentor?.availability?.length || 0;
  if (userAvail && mentorAvail) {
    score += MATCH_WEIGHTS.availability * 0.7;
    reasons.push('Flexible scheduling');
  }

  const rating = mentor?.rating || 0;
  if (rating >= 4.5) {
    score += MATCH_WEIGHTS.rating;
    reasons.push('Top rated');
  } else if (rating >= 4) {
    score += MATCH_WEIGHTS.rating * 0.7;
  }

  if (mentor?.avgResponseTime && mentor.avgResponseTime < 3600) {
    score += MATCH_WEIGHTS.responseTime;
    reasons.push('Fast responder');
  }

  const totalSessions = (mentor?.totalSessionsAsMentor || 0) + (mentor?.totalSessionsAsLearner || 0);
  if (totalSessions > 20) {
    score += MATCH_WEIGHTS.sessionCount;
    reasons.push('Experienced mentor');
  } else if (totalSessions > 5) {
    score += MATCH_WEIGHTS.sessionCount * 0.5;
  }

  const verifiedCount = Object.values(mentor?.verification || {}).filter(Boolean).length;
  if (verifiedCount >= 3) {
    score += MATCH_WEIGHTS.verification;
    reasons.push('Highly verified');
  } else if (verifiedCount > 0) {
    score += MATCH_WEIGHTS.verification * 0.5;
  }

  if (selectedSkill && mentorTeachSkills.includes(selectedSkill.toLowerCase())) {
    score += 0.05;
    reasons.push('Exact skill match');
  }

  return { score: Math.min(Math.round(score * 100), 100), reasons };
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

  // Advanced filters
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

      const response = await fetch(`${API_URL}/users/explore?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const mentorsWithScores = (data.users || [])
          .filter((item) => {
            const m = item?.mentor || item?.user || (item?._id ? item : null);
            return m && m._id;
          })
          .map((item) => {
            const mentor = item?.mentor || item?.user || item;
            const teachSkills = item?.teachSkills || mentor?.teachSkills || [];
            const { score, reasons } = calculateMatchScore(mentor, user, selectedSkill);
            return { mentor, teachSkills, matchScore: score, matchReasons: reasons };
          });

        if (!sortBy) {
          mentorsWithScores.sort((a, b) => b.matchScore - a.matchScore);
        }

        setResults(mentorsWithScores);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      console.error('Failed to fetch explore data');
    }
    setIsLoading(false);
  }, [user, page, sortBy, category, instantBook, verifiedOnly, priceRange, sessionLength, language, search, selectedSkill, minRating]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) fetchExplore();
  }, [fetchExplore, user]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExplore();
  };

  const clearFilters = () => {
    setSearch(''); setCategory(''); setSelectedSkill('');
    setMinRating(''); setSortBy(''); setInstantBook(false);
    setVerifiedOnly(false); setPriceRange(''); setSessionLength(''); setLanguage('');
    setPage(1); fetchExplore();
  };

  const handleStartChat = async (mentorId) => {
    try {
      const conv = await getOrCreateConversation(mentorId);
      navigate(`/chat/${conv._id}`);
    } catch {
      toast.error('Failed to start conversation');
    }
  };

  const handleOpenBooking = (mentor, skills) => {
    setSelectedMentor(mentor);
    setSelectedMentorSkills(skills || []);
    setSelectedSkillForBooking(skills?.[0] || null);
    setShowBooking(true);
  };

  const hasActiveFilters = search || category || selectedSkill || minRating || instantBook || verifiedOnly || priceRange || sessionLength || language;

  const getVerificationBadges = (verification) => {
    const badges = [];
    if (verification?.email) badges.push({ icon: BadgeCheck, label: 'Email', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' });
    if (verification?.phone) badges.push({ icon: Smartphone, label: 'Phone', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' });
    if (verification?.linkedin) badges.push({ icon: Link, label: 'LinkedIn', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' });
    if (verification?.identity) badges.push({ icon: Shield, label: 'ID Verified', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' });
    if (verification?.videoIntro) badges.push({ icon: Camera, label: 'Video Intro', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' });
    return badges;
  };

  return (
    <div className="py-8 lg:py-10 w-full">
      <div className="container-page">
        {/* Header */}
        <div className="mb-8 lg:mb-10">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
            {t('Explore Mentors')}
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
            {t('Discover skilled people')}
          </p>
        </div>

        {/* Search & Filters */}
        <section className="mb-8 lg:mb-10" aria-labelledby="filters-heading">
          <h2 id="filters-heading" className="sr-only">Search and Filter Mentors</h2>
          <div className="card-elevated p-6 lg:p-8">
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Primary Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <div>
                  <label htmlFor="search-skills" className="label-field">{t('Search Skills')}</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="search-skills"
                      type="text"
                      placeholder={t('Search Placeholder')}
                      className="input-field pl-12"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setSelectedSkill(''); }}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="category-filter" className="label-field">{t('Category')}</label>
                  <select
                    id="category-filter"
                    className="input-field appearance-none bg-white dark:bg-gray-900"
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setSelectedSkill(''); setPage(1); }}
                  >
                    <option value="">{t('All Categories')}</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.value}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="skill-filter" className="label-field">{t('Specific Skill')}</label>
                  <select
                    id="skill-filter"
                    className="input-field appearance-none bg-white dark:bg-gray-900"
                    value={selectedSkill}
                    onChange={(e) => { setSelectedSkill(e.target.value); if (e.target.value) setSearch(''); }}
                  >
                    <option value="">{category ? t('All Skills in Category') : t('Select category first')}</option>
                    {category && SKILLS_BY_CATEGORY[category]?.map((skill) => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Secondary Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div>
                  <label htmlFor="min-rating" className="label-field">{t('Min Rating')}</label>
                  <select
                    id="min-rating"
                    className="input-field appearance-none bg-white dark:bg-gray-900"
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                  >
                    <option value="">{t('Any')}</option>
                    <option value="3">3+ ⭐</option>
                    <option value="4">4+ ⭐</option>
                    <option value="4.5">4.5+ ⭐</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="sort-by" className="label-field">{t('Sort By')}</label>
                  <select
                    id="sort-by"
                    className="input-field appearance-none bg-white dark:bg-gray-900"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="">{t('Best Match')}</option>
                    <option value="rating">{t('Highest Rated')}</option>
                    <option value="reviews">{t('Most Reviewed')}</option>
                    <option value="sessions">{t('Most Experienced')}</option>
                    <option value="newest">{t('Newest')}</option>
                  </select>
                </div>
                <div className="sm:col-span-2 lg:col-span-2 flex flex-wrap items-end gap-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={instantBook}
                      onChange={(e) => setInstantBook(e.target.checked)}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {t('Instant Book')}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {t('Verified Only')}
                    </span>
                  </label>
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="btn-ghost flex items-center gap-2 px-4 py-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters</span>
                <Filter className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="animate-slide-down-fade grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <label htmlFor="price-range" className="label-field">{t('Price Range (credits/hr)')}</label>
                    <select
                      id="price-range"
                      className="input-field appearance-none bg-white dark:bg-gray-900"
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                    >
                      <option value="">{t('Any')}</option>
                      <option value="0-5">0-5 credits</option>
                      <option value="5-10">5-10 credits</option>
                      <option value="10-20">10-20 credits</option>
                      <option value="20+">20+ credits</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="session-length" className="label-field">{t('Session Length')}</label>
                    <select
                      id="session-length"
                      className="input-field appearance-none bg-white dark:bg-gray-900"
                      value={sessionLength}
                      onChange={(e) => setSessionLength(e.target.value)}
                    >
                      <option value="">{t('Any')}</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="90">90 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="language-filter" className="label-field">{t('Language')}</label>
                    <select
                      id="language-filter"
                      className="input-field appearance-none bg-white dark:bg-gray-900"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="">{t('Any')}</option>
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Japanese">Japanese</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  className="btn-primary flex-1 sm:flex-none"
                >
                  <Search className="w-4 h-4" />
                  {t('Search')}
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn-secondary flex-1 sm:flex-none"
                  >
                    <X className="w-4 h-4" />
                    {t('Clear Filters')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* Results */}
        <section aria-labelledby="results-heading">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h2 id="results-heading" className="sr-only">Mentor Results</h2>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              {!isLoading && results.length > 0 && (
                <span>{results.length} mentor{results.length !== 1 ? 's' : ''} found</span>
              )}
              {!isLoading && totalPages > 1 && (
                <span>Page {page} of {totalPages}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Sort:</span>
              <select
                className="input-field w-auto appearance-none bg-white dark:bg-gray-900"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              >
                <option value="">{t('Best Match')}</option>
                <option value="rating">{t('Highest Rated')}</option>
                <option value="reviews">{t('Most Reviewed')}</option>
                <option value="sessions">{t('Most Experienced')}</option>
                <option value="newest">{t('Newest')}</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading mentors">
              {[1, 2, 3].map((i) => (
                <article key={i} className="card-elevated p-6 animate-pulse">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-gray-200 dark:bg-gray-800 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-3 py-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mt-2" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
                  </div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                    <div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
                  </div>
                </article>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 lg:py-20 text-center flex flex-col items-center">
              <Search className="w-16 h-16 mb-6 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
              <h3 className="text-xl lg:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('No mentors found')}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">{t('Try adjusting filters')}</p>
              <div className="space-y-3 w-full max-w-md">
                <button
                  onClick={clearFilters}
                  className="btn-primary w-full"
                >
                  <Search className="w-5 h-5" />
                  Clear All Filters
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-secondary w-full"
                >
                  <Sparkles className="w-5 h-5" />
                  Add Skills You Want to Learn
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" role="list">
                {results
                .filter((item) => {
                  const m = item?.mentor || item?.user;
                  return m && m._id;
                })
                .map((item) => {
                  const mentor = item.mentor || item.user;
                  const teachSkills = item.teachSkills || [];
                  const matchScore = item.matchScore || 0;
                  const matchReasons = item.matchReasons || [];
                  return (
                  <article
                    key={mentor._id}
                    className="card-hover-interactive p-6 relative overflow-hidden group"
                    role="listitem"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="flex items-start gap-4 mb-5">
                      <Avatar src={mentor?.avatar} name={mentor?.name || 'Mentor'} size="xl" className="rounded-2xl shadow-lg shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold text-gray-900 dark:text-white truncate">{mentor?.name || 'Mentor'}</h3>
                          {matchScore > 70 && (
                            <span className="badge badge-emerald shrink-0 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              {matchScore}% Match
                            </span>
                          )}
                        </div>
                        {mentor?.location && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {mentor.location}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(mentor?.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {mentor?.rating?.toFixed(1) || 'New'} ({mentor?.numReviews || 0} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    {mentor?.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">{mentor.bio}</p>
                    )}

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      {teachSkills?.slice(0, 4).map((s, idx) => (
                        <span
                          key={s?._id || s?.name || idx}
                          className="px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-800"
                        >
                          {typeof s === 'string' ? s : s?.name} {s?.proficiencyLevel ? `• ${s.proficiencyLevel}` : ''}
                        </span>
                      ))}
                      {teachSkills && teachSkills.length > 4 && (
                        <span className="px-2.5 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          +{teachSkills.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Verification Badges */}
                    {mentor?.verification && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {getVerificationBadges(mentor.verification).map((badge, i) => (
                          <span key={i} className={`badge ${badge.color} flex items-center gap-1`}>
                            <badge.icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Match Reasons */}
                    {matchReasons?.length > 0 && (
                      <div className="mb-5 p-3 bg-primary-50 dark:bg-primary-950/30 rounded-xl border border-primary-100 dark:border-primary-900/30">
                        <p className="text-xs font-medium text-primary-700 dark:text-primary-300 mb-1">Why this match:</p>
                        <p className="text-xs text-primary-600 dark:text-primary-400">{matchReasons.slice(0, 3).join(' • ')}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => handleOpenBooking(mentor, teachSkills)}
                        className="w-full sm:flex-1 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        {t('Book Session')}
                      </button>
                      <button
                        onClick={() => handleStartChat(mentor?._id)}
                        className="w-full sm:flex-1 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {t('Message')}
                      </button>
                      <button
                        onClick={() => navigate(`/profile/${mentor?._id}`)}
                        className="w-full sm:flex-1 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        {t('View Profile')}
                      </button>
                    </div>
                  </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="flex justify-center gap-2 mt-10" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-xl font-medium transition-all ${
                          page === pageNum
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                        }`}
                        aria-label={`Page ${pageNum}`}
                        aria-current={page === pageNum ? 'page' : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </nav>
              )}
            </>
          )}
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
      </div>
    </div>
  );
}