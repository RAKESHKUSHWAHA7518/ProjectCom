import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSkillStore } from '../store/skillStore';
import { CATEGORIES, SKILLS_BY_CATEGORY } from '../data/skillsData';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import toast from 'react-hot-toast';
import { Search, MapPin, Star, Coins, Zap } from 'lucide-react';
import Avatar from '../components/Avatar';
import SessionScheduler from '../components/SessionScheduler';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  const [selectedSkill, setSelectedSkill] = useState('');

  const fetchExplore = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const searchTerm = selectedSkill || search;
      if (searchTerm) params.set('search', searchTerm);
      if (category) params.set('category', category);
      if (minRating) params.set('minRating', minRating);
      if (sortBy) params.set('sortBy', sortBy);
      params.set('page', page);

      const response = await fetch(`${API_URL}/users/explore?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setResults(data.users || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) fetchExplore();
  }, [page, sortBy, category]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExplore();
  };

  const handleStartChat = async (mentorId) => {
    try {
      const conv = await getOrCreateConversation(mentorId);
      navigate(`/chat/${conv._id}`);
    } catch (err) {
      toast.error('Failed to start conversation');
    }
  };

  const handleOpenBooking = (mentor, skills) => {
    setSelectedMentor(mentor);
    setSelectedSkillForBooking(skills[0]); // Default to first skill
    setShowBooking(true);
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('Explore Mentors')}</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">{t('Discover skilled people')}</p>
      </div>

      {/* Search & Filters */}
      <div className="p-6 mb-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Search Skills')}</label>
              <input
                type="text"
                placeholder={t('Search Placeholder')}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedSkill(''); }}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Category')}</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
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
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Specific Skill')}</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-4 items-end">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Min Rating')}</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
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
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Sort By')}</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="">{t('Newest')}</option>
                <option value="rating">{t('Highest Rated')}</option>
                <option value="reviews">{t('Most Reviewed')}</option>
                <option value="sessions">{t('Most Experienced')}</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-auto flex gap-2">
              <button
                type="submit"
                className="flex-1 lg:flex-none px-6 py-2.5 text-white font-medium bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" /> {t('Search')}
              </button>
              {(search || category || selectedSkill || minRating) && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setCategory(''); setSelectedSkill(''); setMinRating(''); setSortBy(''); setPage(1); fetchExplore(); }}
                  className="flex-1 lg:flex-none px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  {t('Clear Filters')}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm animate-pulse">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-gray-200 dark:bg-gray-800 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2 py-1">
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
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center">
          <Search className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{t('No mentors found')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{t('Try adjusting filters')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map(({ user: mentor, teachSkills }) => (
              <div
                key={mentor._id}
                className="group p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start gap-4 mb-4">
                  <Avatar src={mentor.avatar} name={mentor.name} size="lg" className="rounded-2xl shadow-lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{mentor.name}</h3>
                    {mentor.location && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {mentor.location}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(mentor.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {mentor.rating?.toFixed(1) || 'New'} ({mentor.numReviews || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                {mentor.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">{mentor.bio}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {teachSkills?.map((s) => (
                    <span
                      key={s._id}
                      className="px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-800"
                    >
                      {s.name} • {s.proficiencyLevel}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleOpenBooking(mentor, teachSkills)}
                    className="w-full sm:flex-1 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:shadow-lg transition-all"
                  >
                    {t('Book Session')}
                  </button>
                  <button
                    onClick={() => handleStartChat(mentor._id)}
                    className="w-full sm:flex-1 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg transition-all"
                  >
                    {t('Message')}
                  </button>
                  <button
                    onClick={() => navigate(`/profile/${mentor._id}`)}
                    className="w-full sm:flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    {t('View Profile')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    page === i + 1
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

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
