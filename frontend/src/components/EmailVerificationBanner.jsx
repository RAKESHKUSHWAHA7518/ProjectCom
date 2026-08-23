import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function EmailVerificationBanner() {
  const { user } = useAuthStore();
  const [showBanner, setShowBanner] = useState(true);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (user?.emailVerified) {
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }
  }, [user?.emailVerified]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResendLoading(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      setResendSent(true);
      toast.success('Verification email sent!');
    } catch {
      toast.success('If the account exists, a verification email has been sent.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner || !user) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">
                Verify your email address
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                You need to verify your email to access all features.
              </p>
              <form onSubmit={handleResend} className="mt-3 flex flex-col sm:flex-row gap-2 max-w-md">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={e => setResendEmail(e.target.value)}
                  placeholder="Enter your email to resend"
                  required
                  className="flex-1 px-4 py-2 text-sm rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={resendLoading || !resendEmail.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 dark:bg-amber-700 rounded-lg hover:bg-amber-700 dark:hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {resendLoading ? 'Sending...' : 'Resend Email'}
                </button>
              </form>
              {resendSent && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  Verification email sent! Please check your inbox.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}