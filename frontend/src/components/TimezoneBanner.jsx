import React, { useState, useEffect } from 'react';
import { Globe, Check, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Warsaw',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
];

export default function TimezoneBanner() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuthStore();
  const [showBanner, setShowBanner] = useState(true);
  const [detectedTimezone, setDetectedTimezone] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.timezone) {
      setShowBanner(false);
      return;
    }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setDetectedTimezone(tz);
    setSelectedTimezone(tz);
    setShowBanner(true);
  }, [user?.timezone]);

  const handleSave = async () => {
    if (!selectedTimezone) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/timezone`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ timezone: selectedTimezone }),
      });
      if (res.ok) {
        // Update local user state
        if (refreshUser) {
          await refreshUser();
        }
        toast.success('Timezone saved!');
        setShowBanner(false);
      } else {
        toast.error('Failed to save timezone');
      }
    } catch {
      toast.error('Failed to save timezone');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner || !user || user.timezone) return null;

  return (
    <div className="relative w-full z-40 bg-blue-50 dark:bg-blue-950/60 border-b border-blue-200 dark:border-blue-800/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-blue-800 dark:text-blue-200">
                Set your timezone
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                We detected <strong>{detectedTimezone}</strong>. Please confirm or select your correct timezone for accurate session scheduling.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              value={selectedTimezone}
              onChange={e => setSelectedTimezone(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-blue-300 dark:border-blue-700 rounded-xl bg-white dark:bg-gray-850 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm"
            >
              <option value="">{t('Select your timezone')}</option>
              <option value={detectedTimezone} disabled>
                {detectedTimezone} (detected)
              </option>
              {COMMON_TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || !selectedTimezone}
            className="px-6 py-2.5 font-semibold text-white bg-blue-600 dark:bg-blue-700 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition flex items-center justify-center gap-2 shrink-0 text-sm shadow-sm"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            {isSaving ? 'Saving...' : 'Confirm & Save'}
          </button>
        </div>
      </div>
    </div>
  );
}