import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

const testimonials = [
  {
    quote: '"SkillSwap helped me learn React architecture from a senior engineer in just 3 sessions. The credit system makes exchanging skills fair and effortless."',
    author: 'Sarah Chen',
    role: 'Frontend Lead',
    company: 'TechCorp',
    avatar: 'SC',
    rating: 5,
  },
  {
    quote: '"Teaching photography on weekends earns me credits to learn Spanish. It\'s a brilliant exchange model that actually works for busy professionals."',
    author: 'Marcus Johnson',
    role: 'Creative Director',
    company: 'Freelance',
    avatar: 'MJ',
    rating: 5,
  },
  {
    quote: '"The community aspect is amazing. I\'ve made genuine connections and learned skills I never thought I\'d pick up. Best learning platform I\'ve used."',
    author: 'Aisha Patel',
    role: 'Data Analyst',
    company: 'DataFlow Inc',
    avatar: 'AP',
    rating: 5,
  },
  {
    quote: '"Swapped my Python expertise for UI/UX mentorship. The live video quality is exceptional and the escrow system gives peace of mind."',
    author: 'David Kim',
    role: 'Backend Engineer',
    company: 'StartupHub',
    avatar: 'DK',
    rating: 5,
  },
];

export default function TestimonialCarousel({ autoPlay = true, interval = 5000, className = '' }) {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex(i => (i + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setIndex(i => (i - 1 + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, next]);

  return (
    <div className={`relative ${className}`} role="region" aria-label="Testimonials">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
          role="list"
          aria-live="polite"
        >
          {testimonials.map((t, i) => (
            <div key={i} className="w-full flex-shrink-0 px-2" role="listitem">
              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow h-full">
                <Quote className="w-6 h-6 text-primary-500/30 dark:text-primary-500/20 mb-3" aria-hidden="true" />
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3">{t.quote}</p>
                <div className="flex items-center gap-2 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className={`w-3.5 h-3.5 ${j < t.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}`} aria-hidden="true" />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xs">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{t.author}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{t.role} • {t.company}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-5">
        <button
          onClick={prev}
          className="p-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-200 dark:hover:border-primary-800 transition-all"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-1.5" role="tablist" aria-label="Testimonial navigation">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === index
                  ? 'bg-primary-600 w-6'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="p-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-200 dark:hover:border-primary-800 transition-all"
          aria-label="Next testimonial"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}