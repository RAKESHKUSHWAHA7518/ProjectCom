import React, { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { CATEGORIES, SKILLS_BY_CATEGORY } from '../data/skillsData';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight, Check, Sparkles, Eye, EyeOff, Mail, Lock, Calendar,
  User, ChevronLeft, ShieldCheck, Star, Users, Zap, CheckCircle2,
  ChevronRight, BookOpen, Target
} from 'lucide-react';
import PasswordStrength from '../components/PasswordStrength';
import TrustBadges from '../components/TrustBadges';
import FormStepper from '../components/FormStepper';

export default function Register() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState('account');
  const [selectedTeachSkills, setSelectedTeachSkills] = useState([]);
  const [selectedLearnSkills, setSelectedLearnSkills] = useState([]);
  const [selectedTeachCategory, setSelectedTeachCategory] = useState('');
  const [selectedLearnCategory, setSelectedLearnCategory] = useState('');
  const { register, error, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const MIN_AGE = 13;

  const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateAge = (dob) => {
    if (!dob) return false;
    return calculateAge(dob) >= MIN_AGE;
  };

  const allSkills = [...new Set([
    ...CATEGORIES.flatMap(c => SKILLS_BY_CATEGORY[c] || []),
    'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'SQL', 'AWS', 'Docker', 'Git', 'REST APIs',
    'Machine Learning', 'Data Science', 'UI/UX Design', 'Spanish', 'French', 'Guitar', 'Photography'
  ])].sort();

  const filteredTeachSkills = selectedTeachCategory
    ? allSkills.filter(s => SKILLS_BY_CATEGORY[selectedTeachCategory]?.includes(s))
    : allSkills;

  const filteredLearnSkills = selectedLearnCategory
    ? allSkills.filter(s => SKILLS_BY_CATEGORY[selectedLearnCategory]?.includes(s))
    : allSkills;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 'account') {
      if (!name || !email || !password || !dateOfBirth) return;
      if (!validateAge(dateOfBirth)) {
        import('react-hot-toast').then(module => {
          module.default.error(`${t('You must be at least')} ${MIN_AGE} ${t('years old to register')}`);
        });
        return;
      }
      try {
        const data = await register(name, email, password);
        if (data && data.message) {
          import('react-hot-toast').then(module => {
            module.default.success(data.message);
          });
          setStep('skills');
        }
      } catch {
        // Error handled in store
      }
    } else {
      navigate('/dashboard');
    }
  };

  const handleBack = () => setStep('account');

  const toggleTeachSkill = useCallback((skill) => {
    setSelectedTeachSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  }, []);

  const toggleLearnSkill = useCallback((skill) => {
    setSelectedLearnSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  }, []);

  const renderSkillSection = ({ label, skills, selectedSkills, onToggle, selectedCategory, setSelectedCategory, icon: Icon, color }) => {
    const SectionIcon = Icon;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <SectionIcon className={`w-5 h-5 ${color}`} />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</h3>
          <span className="badge badge-primary">{selectedSkills.length} selected</span>
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input-field text-sm mb-3"
          aria-label={`Filter ${label} by category`}
        >
          <option value="">{t('All Categories')}</option>
          {CATEGORIES.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-100 dark:border-gray-800">
          {skills.map(skill => (
            <button
              key={skill}
              type="button"
              onClick={() => onToggle(skill)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedSkills.includes(skill)
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-400'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const completedSteps = step === 'skills' ? ['account'] : [];

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-transparent font-sans text-gray-900 dark:text-gray-100 relative">
      {/* LEFT COLUMN: MINIMAL BRAND */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-6 relative flex-col justify-center p-8 xl:p-12 overflow-hidden bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-950 text-white border-r border-gray-200/20 dark:border-gray-800">
        <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

        <div className="relative z-10 max-w-md mx-auto text-center">
          <Link to="/" className="inline-flex items-center gap-3 text-2xl font-black tracking-tight text-white hover:opacity-90 transition-opacity mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span>SkillSwap</span>
          </Link>

          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight mb-4">
            Learn Any Skill. <br />
            <span className="bg-gradient-to-r from-primary-400 via-indigo-300 to-accent-400 bg-clip-text text-transparent">
              Teach What You Love.
            </span>
          </h1>

          <p className="text-base xl:text-lg text-gray-300 leading-relaxed mb-8">
            Join the peer-to-peer knowledge network. Swap skills 1-on-1 via HD live video, earn credits teaching, and learn anything without paying expensive tuition fees.
          </p>

          <TrustBadges variant="horizontal" />
        </div>
      </div>

      {/* RIGHT COLUMN: REGISTRATION FORM */}
      <div className="col-span-1 lg:col-span-6 xl:col-span-6 flex flex-col justify-center px-6 sm:px-12 lg:px-14 xl:px-16 py-10 relative overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-2xl font-black bg-gradient-to-r from-primary-500 via-indigo-500 to-accent-500 bg-clip-text text-transparent mb-1">
              <Sparkles className="w-7 h-7 text-primary-500" />
              SkillSwap
            </Link>
            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 tracking-wide uppercase">
              Exchange Skills. Grow Together.
            </p>
          </div>

          {step === 'account' ? (
            <div>
              {/* Form Header */}
              <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/30 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Claim 10 Free Credits</span>
                </div>
                <h2 className="text-2xl xl:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
                  {t('Create an Account')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('Join the community today')} • Start free
                </p>
              </div>

              {/* Form Stepper */}
              <FormStepper currentStep={step} completedSteps={completedSteps} />

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
                  <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                    {t('Full Name')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-gray-900 transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

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
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                    {t('Password')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength="6"
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

                <div>
                  <label htmlFor="dateOfBirth" className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                    {t('Date of Birth')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      id="dateOfBirth"
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={e => setDateOfBirth(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:focus:bg-gray-900 transition-all"
                    />
                  </div>
                  {!validateAge(dateOfBirth) && dateOfBirth && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
                      {t('You must be at least')} {MIN_AGE} {t('years old to register')}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      {t('Create Account')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Sign In Link */}
              <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                {t('Already have an account?')}{' '}
                <Link to="/login" className="font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 hover:underline transition-colors">
                  {t('Sign in here')}
                </Link>
              </p>

              {/* Trust Footnote */}
              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800/80">
                <TrustBadges variant="horizontal" />
              </div>
            </div>
          ) : (
            <div>
              {/* Step 2: Skills Selection */}
              <div className="mb-6 flex items-center justify-between">
                <button
                  onClick={handleBack}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Back to account details"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {t('Add Skills')}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Step 2 of 2 • Personalize your match profile
                  </p>
                </div>
                <div className="w-9" />
              </div>

              {/* Form Stepper */}
              <FormStepper currentStep={step} completedSteps={completedSteps} />

              {/* Skills Form */}
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="space-y-6">
                  {renderSkillSection({
                    label: t('Skills you can teach'),
                    skills: filteredTeachSkills,
                    selectedSkills: selectedTeachSkills,
                    onToggle: toggleTeachSkill,
                    selectedCategory: selectedTeachCategory,
                    setSelectedCategory: setSelectedTeachCategory,
                    icon: BookOpen,
                    color: 'text-primary-500',
                  })}

                  {renderSkillSection({
                    label: t('Skills you want to learn'),
                    skills: filteredLearnSkills,
                    selectedSkills: selectedLearnSkills,
                    onToggle: toggleLearnSkill,
                    selectedCategory: selectedLearnCategory,
                    setSelectedCategory: setSelectedLearnCategory,
                    icon: Target,
                    color: 'text-emerald-500',
                  })}
                </div>

                {/* Selected Summary */}
                {(selectedTeachSkills.length > 0 || selectedLearnSkills.length > 0) && (
                  <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/30">
                    <h4 className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-3 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Your Selections
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedTeachSkills.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-primary-600 dark:text-primary-400 mb-2 uppercase tracking-wider">Teaching ({selectedTeachSkills.length})</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedTeachSkills.map(s => (
                              <span key={s} className="badge badge-primary text-[10px]">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedLearnSkills.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wider">Learning ({selectedLearnSkills.length})</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedLearnSkills.map(s => (
                              <span key={s} className="badge badge-emerald text-[10px]">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? 'Saving...' : 'Finish Setup'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Trust Badges at bottom */}
              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800/80">
                <TrustBadges variant="horizontal" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}