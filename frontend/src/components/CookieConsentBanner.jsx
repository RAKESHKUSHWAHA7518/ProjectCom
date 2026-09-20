import React, { useEffect, useState } from 'react';
import { X, Check, ChevronRight, Cookie } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'skillswap_cookie_consent';

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    preferences: false,
    analytics: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setTimeout(() => setShowBanner(true), 0);
    } else {
      try {
        const parsed = JSON.parse(consent);
        setTimeout(() => setPreferences(parsed), 0);
      } catch {
        setTimeout(() => setShowBanner(true), 0);
      }
    }
  }, []);

  const saveConsent = (prefs) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    setShowBanner(false);
    applyCookiePreferences(prefs);
  };

  const applyCookiePreferences = (prefs) => {
    if (prefs.analytics) {
      console.log('[CookieConsent] Analytics cookies enabled');
    } else {
      console.log('[CookieConsent] Analytics cookies disabled');
    }
    if (prefs.preferences) {
      console.log('[CookieConsent] Preference cookies enabled');
    }
  };

  const handleAcceptAll = () => {
    const prefs = { essential: true, preferences: true, analytics: true };
    setPreferences(prefs);
    saveConsent(prefs);
  };

  const handleRejectAll = () => {
    const prefs = { essential: true, preferences: false, analytics: false };
    setPreferences(prefs);
    saveConsent(prefs);
  };

  const handleSavePreferences = () => {
    saveConsent({ ...preferences, essential: true });
  };

  const togglePreference = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 md:bottom-6 md:right-6 md:left-auto md:w-[420px] z-50 animate-slide-up-fade" role="dialog" aria-label="Cookie consent">
      <div className="glass-card rounded-2xl p-5 shadow-2xl border border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
              <Cookie className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Cookie Preferences</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">We value your privacy</p>
            </div>
          </div>
          <button
            onClick={() => saveConsent(preferences)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          We use cookies to enhance your experience, analyze site usage, and remember your preferences. You can customize your choices below.
        </p>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between text-sm font-medium text-primary-600 dark:text-primary-400 mb-4 hover:underline"
        >
          <span>{showDetails ? 'Hide' : 'Show'} cookie details</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
        </button>

        {showDetails && (
          <div className="space-y-3 mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <div>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Essential Cookies</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Required for the website to function properly</p>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">Authentication, session management, security, cookie consent storage</p>
            </div>

            <div>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Preference Cookies</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Remember your settings and preferences</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.preferences}
                  onChange={() => togglePreference('preferences')}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">Theme, language, notification settings, dashboard layout</p>
            </div>

            <div>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Analytics Cookies</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Help us understand how visitors interact with our site</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={() => togglePreference('analytics')}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">Anonymous usage statistics, performance metrics, feature adoption</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleRejectAll}
            className="btn-secondary flex-1 py-2.5 text-sm font-medium"
          >
            Reject All
          </button>
          <button
            onClick={handleSavePreferences}
            className="btn-primary flex-1 py-2.5 text-sm font-medium hidden sm:block"
          >
            Save Preferences
          </button>
          <button
            onClick={handleAcceptAll}
            className="btn-primary flex-1 py-2.5 text-sm font-medium"
          >
            Accept All
          </button>
        </div>

        <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center mt-4">
          You can change your preferences anytime in Settings.{' '}
          <a href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</a>{' '}
          |{' '}
          <a href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">Terms of Service</a>
        </p>
      </div>
    </div>
  );
}