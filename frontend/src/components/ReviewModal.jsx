import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ReviewModal({ isOpen, onClose, onSubmit, session, isMentor }) {
  // eslint-disable-next-line no-unused-vars
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      // Reset state on close
      setRating(0);
      setHoverRating(0);
      setComment('');
    };
  }, [isOpen]);

  if (!isOpen || !session) return null;

  const targetUser = isMentor ? session.learner : session.mentor;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit(rating, comment);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 p-6"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6 pt-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Rate your Session
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              How was your session with <span className="font-semibold text-gray-900 dark:text-gray-200">{targetUser?.name}</span>?
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            {/* Star Rating */}
            <div className="flex gap-2 mb-6" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-200 dark:text-gray-700'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>

            {/* Comment Area */}
            <div className="w-full mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Leave a Comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows="4"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-3 resize-none transition"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={rating === 0}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition ${
                rating > 0 
                  ? 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20' 
                  : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50'
              }`}
            >
              Submit Review
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
