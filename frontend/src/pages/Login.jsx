import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import {
  Eye, EyeOff, Sparkles, ArrowRight, Mail, Lock,
  Users, Zap, ShieldCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PasswordStrength from '../components/PasswordStrength';
import TrustBadges from '../components/TrustBadges';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
    const { user } = useAuthStore.getState();
    if (user) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 relative">
      {/* LEFT COLUMN: MINIMAL BRAND */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-6 relative flex-col justify-center p-8 xl:p-12 overflow-hidden bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-950 text-white border-r border-gray-200/20 dark:border-gray-800">
        <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

        <div className="relative z-10 max-w-md mx-auto text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-white hover:opacity-90 transition-opacity mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center shadow-md shadow-primary-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span>SkillSwap</span>
          </Link>

          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight mb-4">
            Exchange Skills. <br />
            <span className="bg-gradient-to-r from-primary-400 via-indigo-300 to-accent-400 bg-clip-text text-transparent">
              Grow Together.
            </span>
          </h1>

          <p className="text-base xl:text-lg text-gray-300 leading-relaxed mb-8">
            Trade your expertise 1-on-1 with passionate peers worldwide. Teach what you know, earn escrow credits, and learn anything completely free.
          </p>

          <TrustBadges variant="horizontal" />
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN FORM */}
      <div className="col-span-1 lg:col-span-6 xl:col-span-6 flex flex-col justify-center px-6 sm:px-10 lg:px-8 xl:px-12 py-10 relative overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-2xl font-black bg-gradient-to-r from-primary-500 via-indigo-500 to-accent-500 bg-clip-text text-transparent mb-2">
              <Sparkles className="w-7 h-7 text-primary-500" />
              SkillSwap
            </Link>
            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 tracking-wide uppercase">
              Exchange Skills. Grow Together.
            </p>
          </div>

          {/* Form Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/30 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Welcome back to SkillSwap
            </div>
            <h2 className="text-2xl xl:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
              {t('Welcome Back')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('Please enter details')}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 flex items-start gap-3 animate-slide-down-fade" role="alert">
              <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                {t('Email Address')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-gray-900 transition-all"
                  placeholder="you@example.com"
                  aria-describedby="email-error"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  {t('Password')}
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-gray-900 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Strength */}
            <PasswordStrength password={password} show={password.length > 0} />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing In...
                </>
              ) : (
                <>
                  {t('Sign In')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {t("Don't have an account?")}{' '}
            <Link to="/register" className="font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 hover:underline transition-colors">
              {t('Sign up here')}
            </Link>
          </p>

          {/* Trust Footnote */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800/80">
            <TrustBadges variant="horizontal" />
          </div>
        </div>
      </div>
    </div>
  );
}