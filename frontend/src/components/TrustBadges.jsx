import React from 'react';
import { Shield, Lock, Award, Users, Star, CheckCircle2 } from 'lucide-react';

const badges = [
  { icon: Shield, label: 'Verified Mentors', color: 'text-blue-600 dark:text-blue-400' },
  { icon: Lock, label: 'Secure Payments', color: 'text-emerald-600 dark:text-emerald-400' },
  { icon: Award, label: '4.9/5 Rating', color: 'text-amber-600 dark:text-amber-400' },
  { icon: Users, label: '10K+ Community', color: 'text-indigo-600 dark:text-indigo-400' },
];

export function TrustBadges({ variant = 'horizontal', className = '' }) {
  if (variant === 'horizontal') {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-3 md:gap-5 ${className}`} role="list" aria-label="Platform trust signals">
        {badges.map((badge, i) => (
          <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-sm transition-shadow" role="listitem">
            <badge.icon className={`w-4 h-4 ${badge.color}`} aria-hidden="true" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{badge.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`} role="list" aria-label="Platform trust signals">
      {badges.map((badge, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-sm transition-all" role="listitem">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${badge.color}/10`}>
            <badge.icon className={`w-4 h-4 ${badge.color}`} aria-hidden="true" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{badge.label}</span>
        </div>
      ))}
    </div>
  );
}

export default TrustBadges;