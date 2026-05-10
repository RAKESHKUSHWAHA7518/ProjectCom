import React from 'react';
import { User } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getAvatarUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_URL.replace('/api', '')}${path}`;
};

export default function Avatar({ src, name, size = 'md', className = '' }) {
  const url = getAvatarUrl(src);
  
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  return (
    <div className={`${sizeClasses[size] || sizeClasses.md} rounded-xl overflow-hidden bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold shrink-0 shadow-sm ${className}`}>
      {url ? (
        <img src={url} alt={name || 'User'} className="w-full h-full object-cover" />
      ) : (
        <span>{name ? name.charAt(0).toUpperCase() : <User className="w-1/2 h-1/2" />}</span>
      )}
    </div>
  );
}
