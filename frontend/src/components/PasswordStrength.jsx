import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

const criteria = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Number', test: (p) => /\d/.test(p) },
  { label: 'Special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function PasswordStrength({ password, show = true }) {
  if (!show || !password) return null;

  const passed = criteria.filter(c => c.test(password)).length;
  const total = criteria.length;
  const score = Math.round((passed / total) * 100);

  const getStrength = () => {
    if (score < 40) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-600 dark:text-red-400' };
    if (score < 70) return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
    if (score < 90) return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
    return { label: 'Very Strong', color: 'bg-emerald-600', text: 'text-emerald-700 dark:text-emerald-300' };
  };

  const strength = getStrength();

  return (
    <div className="mt-3 space-y-2 animate-slide-down-fade" role="status" aria-live="polite">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className={`text-xs font-semibold ${strength.text}`}>{strength.label}</span>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">{passed}/{total} requirements</span>
      </div>

      <ul className="space-y-1" role="list" aria-label="Password requirements">
        {criteria.map((c, i) => {
          const met = c.test(password);
          return (
            <li key={i} className="flex items-center gap-2 text-[11px] transition-colors">
              {met ? (
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
              )}
              <span className={met ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}>
                {c.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}