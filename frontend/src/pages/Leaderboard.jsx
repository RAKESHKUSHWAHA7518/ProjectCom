import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trophy, Star, BookOpen, ChevronRight, Globe } from 'lucide-react';
import { CATEGORIES } from '../data/skillsData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function PodiumCard({ leader, rank, type }) {
  const isFirst = rank === 0;

  /* rank 0 = 1st, 1 = 2nd, 2 = 3rd  →  podium order passed is [1,0,2] */
  const meta = [
    {
      place: '2nd', medal: '🥈',
      avatarSize: 'w-14 h-14 sm:w-16 sm:h-16',
      podiumH: 'h-16 sm:h-20',
      podiumBg: 'bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700',
      podiumText: 'text-gray-700 dark:text-gray-200',
      ring: 'ring-2 ring-gray-200 dark:ring-gray-600',
    },
    {
      place: '1st', medal: '🥇',
      avatarSize: 'w-16 h-16 sm:w-20 sm:h-20',
      podiumH: 'h-20 sm:h-28',
      podiumBg: 'bg-gradient-to-b from-amber-300 to-yellow-400 dark:from-amber-400 dark:to-yellow-500',
      podiumText: 'text-amber-900',
      ring: 'ring-2 ring-amber-300 dark:ring-amber-400',
    },
    {
      place: '3rd', medal: '🥉',
      avatarSize: 'w-12 h-12 sm:w-14 sm:h-14',
      podiumH: 'h-12 sm:h-16',
      podiumBg: 'bg-gradient-to-b from-orange-300 to-amber-500 dark:from-orange-400 dark:to-amber-600',
      podiumText: 'text-orange-900',
      ring: 'ring-2 ring-orange-300 dark:ring-orange-400',
    },
  ][rank];

  return (
    <Link to={`/profile/${leader._id}`} className="flex flex-col items-center group flex-1 min-w-0">
      {isFirst && <div className="mb-1 text-xl sm:text-2xl">👑</div>}

      <div className="relative mb-2 sm:mb-3">
        <div className={`${meta.avatarSize} rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-white font-extrabold text-lg sm:text-xl shadow-lg ${meta.ring} group-hover:scale-105 transition-transform duration-300 overflow-hidden`}>
          {leader.avatar
            ? <img src={leader.avatar} alt={leader.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = leader.name?.charAt(0) || '?'; }} />
            : leader.name?.charAt(0) || '?'
          }
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 text-sm sm:text-lg leading-none">{meta.medal}</div>
      </div>

      <div className="text-center mb-2 sm:mb-3 px-1 w-full">
        <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors px-1">{leader.name}</h3>
        {type === 'mentors' ? (
          <div className="flex items-center justify-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-gray-900 dark:text-white">{leader.rating?.toFixed(1)}</span>
          </div>
        ) : (
          <div className="mt-0.5 sm:mt-1">
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{leader.totalSessionsAsLearner}</span>
            <span className="text-[10px] text-gray-400 ml-0.5">sess.</span>
          </div>
        )}
      </div>

      <div className={`w-full rounded-t-lg sm:rounded-t-xl ${meta.podiumH} ${meta.podiumBg} flex items-center justify-center shadow-md transition-all duration-300 group-hover:brightness-105`}>
        <span className={`text-sm sm:text-lg font-extrabold ${meta.podiumText}`}>{meta.place}</span>
      </div>
    </Link>
  );
}

function LeaderRow({ leader, rank, type }) {
  const isTop3 = rank <= 3;
  return (
    <Link
      to={`/profile/${leader._id}`}
      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md transition-all duration-200 group"
    >
      {/* Rank badge */}
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold border shrink-0 ${
        isTop3
          ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-100 dark:border-primary-900/40 text-primary-700 dark:text-primary-300'
          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400'
      }`}>
        {rank}
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-400 to-indigo-500 text-white flex items-center justify-center font-bold text-sm sm:text-base shrink-0 shadow-sm overflow-hidden">
        {leader.avatar
          ? <img src={leader.avatar} alt={leader.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = leader.name?.charAt(0) || '?'; }} />
          : leader.name?.charAt(0) || '?'
        }
      </div>

      {/* Name + location */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">{leader.name}</p>
        <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 flex items-center gap-0.5 sm:gap-1 mt-0.5">
          <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" /><span className="truncate">{leader.location || 'Worldwide'}</span>
        </p>
      </div>

      {/* Skill tags — visible only on md+ */}
      <div className="hidden md:flex flex-wrap gap-1 max-w-[140px] lg:max-w-[160px]">
        {leader.teachSkills?.slice(0, 2).map((s) => (
          <span key={s._id || s.name} className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            {s.name || s}
          </span>
        ))}
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        {type === 'mentors' ? (
          <>
            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
              <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{leader.rating?.toFixed(1)}</span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">{leader.numReviews} reviews</p>
          </>
        ) : (
          <>
            <div className="text-sm sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{leader.totalSessionsAsLearner}</div>
            <p className="text-[9px] sm:text-[10px] text-gray-400">sessions</p>
          </>
        )}
      </div>

      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 shrink-0 transition-colors hidden sm:block" />
    </Link>
  );
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [category, setCategory] = useState('');
  const [type, setType] = useState('mentors');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (type) params.append('type', type);
      const res  = await fetch(`${API_URL}/users/leaderboard?${params.toString()}`);
      const data = await res.json();
      setLeaders(data || []);
    } catch { console.error('Failed to fetch leaderboard'); }
    setIsLoading(false);
  }, [category, type]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const podiumOrder = [1, 0, 2]; // silver, gold, bronze

  return (
    <div className="py-6 sm:py-8 lg:py-10 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 mb-3 sm:mb-4 text-[10px] sm:text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-full border border-amber-100 dark:border-amber-900/40">
            <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Rankings
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1.5 sm:mb-2">
            {type === 'learners' ? 'Top Learners' : 'Top Mentors'}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {type === 'learners' ? 'Most dedicated learners in our community' : 'Highly rated experts sharing their knowledge'}
          </p>
        </div>

        {/* ── Type toggle ── */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="flex items-center gap-0.5 sm:gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700">
            {[
              { key: 'mentors',  label: 'Top Mentors' },
              { key: 'learners', label: 'Top Learners' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setType(key)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all whitespace-nowrap ${
                  type === key
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Category chips (horizontal scroll) ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 mb-6 sm:mb-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setCategory('')}
            className={`shrink-0 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              !category
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" />All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`shrink-0 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                category === cat.value
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span className="hidden sm:inline">{cat.value}</span>
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="space-y-3">
            {/* Podium skeleton */}
            <div className="flex items-end gap-3 sm:gap-4 justify-center mb-6 sm:mb-8 h-36 sm:h-48 px-4">
              {[1, 0, 2].map((i, pos) => (
                <div key={i} className="flex-1 flex flex-col items-center animate-pulse">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl mb-2" />
                  <div className={`w-full ${['h-16', 'h-20', 'h-12'][pos]} bg-gray-200 dark:bg-gray-800 rounded-t-xl`} />
                </div>
              ))}
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl animate-pulse">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 sm:h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/5" />
                  <div className="h-2.5 sm:h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
                </div>
                <div className="w-12 sm:w-16 space-y-1">
                  <div className="h-3 sm:h-4 bg-gray-100 dark:bg-gray-800 rounded" />
                  <div className="h-2 sm:h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : leaders.length === 0 ? (
          <div className="py-16 sm:py-20 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🏅</div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">No rankings yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">Complete sessions to appear on the leaderboard.</p>
            <Link to="/explore" className="btn-primary mx-auto inline-flex text-sm">
              <Search className="w-4 h-4" />Find a Mentor
            </Link>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {leaders.length >= 3 && (
              <div className="mb-6 sm:mb-10 px-2 sm:px-4">
                <div className="flex items-end gap-2 sm:gap-4 justify-center">
                  {podiumOrder.map((idx) => {
                    const leader = leaders[idx];
                    if (!leader) return null;
                    return <PodiumCard key={leader._id} leader={leader} rank={idx} type={type} />;
                  })}
                </div>
              </div>
            )}

            {/* Ranked list 4+ */}
            {leaders.length > 3 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3 sm:mb-4 px-1">
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest whitespace-nowrap">Rankings 4+</p>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                </div>
                {leaders.slice(3).map((leader, index) => (
                  <LeaderRow key={leader._id} leader={leader} rank={index + 4} type={type} />
                ))}
              </div>
            )}

            {/* If fewer than 3 — list them directly */}
            {leaders.length < 3 && (
              <div className="space-y-2">
                {leaders.map((leader, index) => (
                  <LeaderRow key={leader._id} leader={leader} rank={index + 1} type={type} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── CTA banner ── */}
        {!isLoading && leaders.length > 0 && (
          <div className="mt-8 sm:mt-10 p-5 sm:p-6 bg-gradient-to-r from-primary-600 via-indigo-600 to-accent-600 rounded-2xl text-center text-white shadow-xl shadow-primary-500/20">
            <Trophy className="w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 opacity-80" />
            <h3 className="text-base sm:text-lg font-bold mb-1">Want to rank higher?</h3>
            <p className="text-xs sm:text-sm text-white/80 mb-3 sm:mb-4">Complete more sessions and earn top ratings to climb the leaderboard.</p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold bg-white text-primary-700 rounded-xl hover:bg-white/90 shadow-lg transition-all hover:-translate-y-0.5"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Find Mentors
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
