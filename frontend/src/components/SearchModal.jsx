import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, Globe, BookOpen, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSearchStore } from '../store/searchStore';
import Avatar from './Avatar';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const { results, performSearch, isLoading, clearSearch } = useSearchStore();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        clearSearch();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
        >
          {/* Search Input */}
          <div className="relative flex items-center border-b border-gray-100 dark:border-gray-800 p-4">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 dark:text-white placeholder-gray-400"
              placeholder="Search users, skills, or communities..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {isLoading && (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                <p className="mt-2 text-sm text-gray-500">Searching...</p>
              </div>
            )}

            {!isLoading && !query.trim() && (
              <div className="py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">Type something to search...</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {['React', 'Design', 'Marketing', 'JavaScript'].map(s => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && query.trim() && results.users.length === 0 && results.communities.length === 0 && results.skills.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-gray-500">No results found for "{query}"</p>
              </div>
            )}

            {/* User Results */}
            {results.users.length > 0 && (
              <div className="mb-4">
                <h3 className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Users</h3>
                {results.users.map(u => (
                  <button
                    key={u._id}
                    onClick={() => handleNavigate(`/profile/${u._id}`)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition text-left group"
                  >
                    <Avatar src={u.avatar} name={u.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.bio || 'No bio available'}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition" />
                  </button>
                ))}
              </div>
            )}

            {/* Community Results */}
            {results.communities.length > 0 && (
              <div className="mb-4">
                <h3 className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Communities</h3>
                {results.communities.map(c => (
                  <button
                    key={c._id}
                    onClick={() => handleNavigate(`/community/${c._id}`)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-2xl">
                      {c.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition">{c.name}</p>
                      <p className="text-xs text-gray-500 truncate">{c.category} • {c.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition" />
                  </button>
                ))}
              </div>
            )}

            {/* Skill Results */}
            {results.skills.length > 0 && (
              <div className="mb-2">
                <h3 className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Skills</h3>
                {results.skills.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleNavigate(`/explore?search=${s.name}`)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.category} • {s.type === 'teach' ? 'Mentors available' : 'Learners interested'}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-800/30 px-4 py-2 flex items-center justify-between text-[10px] text-gray-400 font-medium">
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-sm">Enter</kbd> to select</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-sm">Esc</kbd> to close</span>
            </div>
            <span>Global Search</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
