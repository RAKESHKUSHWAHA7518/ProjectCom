import React from 'react';
import { CheckCircle, Shield, Award, Clock } from 'lucide-react';

const VERIFICATION_TYPES = {
  email: { label: 'Email', icon: '📧', color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
  phone: { label: 'Phone', icon: '📱', color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-950/30' },
  linkedin: { label: 'LinkedIn', icon: '💼', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
  identity: { label: 'Identity', icon: '🪪', color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-950/30' },
  videoIntro: { label: 'Video Intro', icon: '🎥', color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-950/30' },
};

export function VerificationBadge({ type, verified, size = 'md', showLabel = true, className = '' }) {
  if (!verified) return null;

  const config = VERIFICATION_TYPES[type];
  if (!config) return null;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bgColor} ${config.color} ${sizeClasses[size]} ${className}`}
      title={`${config.label} verified`}
    >
      <span className={iconSizes[size]}>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
      <CheckCircle className="w-3 h-3 flex-shrink-0" />
    </span>
  );
}

export function VerificationBadges({ verifications, size = 'md', maxVisible = 3, className = '' }) {
  if (!verifications) return null;

  const verifiedTypes = Object.entries(verifications)
    .filter(([, verified]) => verified)
    .map(([type]) => type);

  const visible = verifiedTypes.slice(0, maxVisible);
  const remaining = verifiedTypes.length - maxVisible;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {visible.map(type => (
        <VerificationBadge key={type} type={type} verified size={size} showLabel={size !== 'sm'} />
      ))}
      {remaining > 0 && (
        <span
          className={`inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 ${size === 'sm' ? 'px-2 py-0.5' : ''}`}
          title={`${remaining} more verifications`}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}

export function VerificationStatusCard({ verifications, requests, onRequestVerification, className = '' }) {
  if (!verifications) return null;

  const allTypes = ['email', 'phone', 'linkedin', 'identity', 'videoIntro'];
  const totalTypes = allTypes.length;
  const verifiedCount = allTypes.filter(t => verifications[t]).length;
  const progress = (verifiedCount / totalTypes) * 100;

  return (
    <div className={`p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-500" />
          Verification Status
        </h3>
        <div className="flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400">
          <span>{verifiedCount}</span> / <span>{totalTypes}</span>
        </div>
      </div>

      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {allTypes.map(type => {
          const config = VERIFICATION_TYPES[type];
          const isVerified = verifications[type];
          const request = requests?.find(r => r.type === type && r.status === 'pending');

          return (
            <button
              key={type}
              onClick={() => !isVerified && !request && onRequestVerification?.(type)}
              disabled={isVerified || !!request}
              className={`p-3 rounded-xl text-center transition-all ${
                isVerified
                  ? `${config.bgColor} ${config.color} border ${config.color}/30 cursor-default`
                  : request
                  ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 cursor-not-allowed'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/30'
              }`}
            >
              <div className="text-2xl mb-1">{config.icon}</div>
              <div className="text-xs font-medium">{config.label}</div>
              {isVerified && <CheckCircle className="w-4 h-4 mx-auto mt-1" />}
              {request && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px]">Pending</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}