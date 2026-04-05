import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSkillStore } from '../store/skillStore';
import { CATEGORIES, SKILLS_BY_CATEGORY } from '../data/skillsData';

const API_URL = 'http://localhost:5000/api';

export default function Explore() {
  const { user } = useAuthStore();
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showBooking, setShowBooking] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSkill, setBookingSkill] = useState('');

  const [selectedSkill, setSelectedSkill] = useState('');

  const fetchExplore = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      // Use selected skill as search term, or fall back to general search text
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

  const handleBookSession = async () => {
    if (!bookingDate || !bookingSkill) return;
    try {
      const response = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          mentorId: showBooking.user._id,
          skillId: bookingSkill,
          scheduledAt: bookingDate,
          notes: bookingNotes,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Session booked successfully!');
        setShowBooking(null);
        setBookingDate('');
        setBookingNotes('');
        setBookingSkill('');
      } else {
        alert(data.message || 'Failed to book session');
      }
    } catch (err) {
      alert('Failed to book session');
    }
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Explore Mentors</h1>
        <p className="mt-1 text-gray-500">Discover skilled people ready to share their knowledge</p>
      </div>

      {/* Search & Filters */}
      <div className="p-6 mb-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Row 1: Search + Category + Skill */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Search Skills</label>
              <input
                type="text"
                placeholder="e.g. React, Guitar, Photography..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedSkill(''); }}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Category</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setSelectedSkill(''); setPage(1); }}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.icon} {cat.value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Specific Skill</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50"
                value={selectedSkill}
                onChange={(e) => { setSelectedSkill(e.target.value); if (e.target.value) setSearch(''); }}
              >
                <option value="">{category ? 'All Skills in Category' : 'Select category first or type above'}</option>
                {category && SKILLS_BY_CATEGORY[category]?.map((skill) => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Filters + Search button */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Min Rating</label>
              <select
                className="px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
              >
                <option value="">Any</option>
                <option value="3">3+ ⭐</option>
                <option value="4">4+ ⭐</option>
                <option value="4.5">4.5+ ⭐</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Sort By</label>
              <select
                className="px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="">Newest</option>
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviewed</option>
                <option value="sessions">Most Experienced</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 text-white font-medium bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              🔍 Search
            </button>
            {(search || category || selectedSkill || minRating) && (
              <button
                type="button"
                onClick={() => { setSearch(''); setCategory(''); setSelectedSkill(''); setMinRating(''); setSortBy(''); setPage(1); fetchExplore(); }}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-700">No mentors found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map(({ user: mentor, teachSkills }) => (
              <div
                key={mentor._id}
                className="group p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-indigo-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shrink-0">
                    {mentor.avatar ? (
                      <img src={mentor.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      mentor.name?.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{mentor.name}</h3>
                    {mentor.location && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        📍 {mentor.location}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-yellow-500">{'⭐'.repeat(Math.round(mentor.rating || 0))}</span>
                      <span className="text-sm text-gray-500">
                        {mentor.rating?.toFixed(1) || 'New'} ({mentor.numReviews || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                {mentor.bio && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{mentor.bio}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {teachSkills?.map((s) => (
                    <span
                      key={s._id}
                      className="px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 rounded-lg border border-emerald-100"
                    >
                      {s.name} • {s.proficiencyLevel}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBooking({ user: mentor, skills: teachSkills })}
                    className="flex-1 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg transition-all"
                  >
                    Book Session
                  </button>
                  <a
                    href={`/profile/${mentor._id}`}
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                  >
                    View
                  </a>
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
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
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
      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Book a Session</h3>
            <p className="text-sm text-gray-500 mb-6">with {showBooking.user.name}</p>

            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Skill to Learn</label>
                <select
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50"
                  value={bookingSkill}
                  onChange={(e) => setBookingSkill(e.target.value)}
                >
                  <option value="">Select a skill</option>
                  {showBooking.skills?.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.proficiencyLevel})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Notes (optional)</label>
                <textarea
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50"
                  rows="3"
                  placeholder="What would you like to learn? Any specific topics?"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <span className="mr-2">💰</span> This will cost 1 credit. You have {user?.skillCredits || 0} credits.
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBooking(null)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBookSession}
                disabled={!bookingSkill || !bookingDate}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg transition disabled:opacity-50"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
