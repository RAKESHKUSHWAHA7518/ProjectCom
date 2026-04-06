import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { CATEGORIES } from '../data/skillsData';

const API_URL = 'http://localhost:5000/api';

export default function Leaderboard() {
  const { user } = useAuthStore();
  const [leaders, setLeaders] = useState([]);
  const [category, setCategory] = useState('');
  const [type, setType] = useState('mentors');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [category, type]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (type) params.append('type', type);

      const res = await fetch(`${API_URL}/users/leaderboard?${params.toString()}`);
      const data = await res.json();
      setLeaders(data || []);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const getRankStyle = (index) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white shadow-lg shadow-yellow-400/30';
    if (index === 1) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white shadow-lg shadow-gray-400/30';
    if (index === 2) return 'bg-gradient-to-r from-orange-400 to-amber-600 text-white shadow-lg shadow-orange-400/30';
    return 'bg-gray-100 text-gray-600';
  };

  const getRankEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏆 Leaderboard</h1>
        <p className="mt-2 text-gray-500">Our top {type === 'learners' ? 'learners' : 'mentors'} in the community</p>
      </div>

      {/* Type Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
          <button
            onClick={() => setType('mentors')}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
              type === 'mentors' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Top Mentors
          </button>
          <button
            onClick={() => setType('learners')}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
              type === 'learners' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Top Learners
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <button
          onClick={() => setCategory('')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            !category ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              category === cat.value ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat.icon} {cat.value}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : leaders.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-6xl mb-4">🏅</div>
          <h3 className="text-xl font-semibold text-gray-700">No leaders yet</h3>
          <p className="text-gray-500 mt-2">Complete sessions and earn reviews to appear here!</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Top 3 Podium */}
          {leaders.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[1, 0, 2].map((idx) => {
                const leader = leaders[idx];
                if (!leader) return null;
                return (
                  <Link
                    to={`/profile/${leader._id}`}
                    key={leader._id}
                    className={`block p-6 rounded-2xl text-center transition-all hover:-translate-y-1 ${
                      idx === 0
                        ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 shadow-xl -mt-4'
                        : 'bg-white border border-gray-100 shadow-sm'
                    }`}
                  >
                    <div className="text-3xl mb-2">{getRankEmoji(idx)}</div>
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary-400 to-indigo-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-3">
                      {leader.name?.charAt(0)}
                    </div>
                    <h3 className="font-bold text-gray-900 truncate">{leader.name}</h3>
                    {type === 'mentors' ? (
                      <>
                        <div className="text-yellow-500 mt-1">{'⭐'.repeat(Math.round(leader.rating || 0))}</div>
                        <p className="text-sm text-gray-500">{leader.rating?.toFixed(1)} ({leader.numReviews} reviews)</p>
                      </>
                    ) : (
                      <div className="mt-1">
                        <span className="text-sm font-bold text-emerald-600">{leader.totalSessionsAsLearner}</span>
                        <p className="text-xs text-gray-500">Sessions Learned</p>
                      </div>
                    )}
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {leader.teachSkills?.slice(0, 2).map((s) => (
                        <span key={s._id} className={`px-2 py-0.5 text-[10px] rounded-md ${type === 'learners' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>{s.name}</span>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Rest of the list */}
          {leaders.slice(3).map((leader, index) => (
            <Link to={`/profile/${leader._id}`} key={leader._id} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${getRankStyle(index + 3)}`}>
                {index + 4}
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                {leader.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{leader.name}</h3>
                <p className="text-sm text-gray-500">{leader.location || 'Worldwide'}</p>
              </div>
              <div className="text-right shrink-0">
                {type === 'mentors' ? (
                  <>
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-bold text-gray-900">{leader.rating?.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-gray-500">{leader.numReviews} reviews</p>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-emerald-600">{leader.totalSessionsAsLearner}</div>
                    <p className="text-xs text-gray-500">learned</p>
                  </>
                )}
              </div>
              <div className="hidden md:flex flex-wrap gap-1 max-w-[200px]">
                {leader.teachSkills?.slice(0, 3).map((s) => (
                  <span key={s._id} className={`px-2 py-0.5 text-xs rounded-md ${type === 'learners' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>{s.name}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
