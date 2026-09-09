import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { CATEGORIES, SKILLS_BY_CATEGORY } from '../data/skillsData';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Account details, 2: Skills
  const [selectedTeachSkills, setSelectedTeachSkills] = useState([]);
  const [selectedLearnSkills, setSelectedLearnSkills] = useState([]);
  const [selectedTeachCategory, setSelectedTeachCategory] = useState('');
  const [selectedLearnCategory, setSelectedLearnCategory] = useState('');
  const { register, error, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const popularTeachSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'SQL', 'AWS', 'Docker', 'Git', 'REST APIs'];
  const popularLearnSkills = ['JavaScript', 'Python', 'React', 'Machine Learning', 'Data Science', 'UI/UX Design', 'Spanish', 'French', 'Guitar', 'Photography'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!name || !email || !password) return;
      try {
        const data = await register(name, email, password);
        if (data && data.message) {
          import('react-hot-toast').then(module => {
            module.default.success(data.message);
          });
          setStep(2);
        }
      } catch {
        // Error is handled in the store
      }
    } else {
      // Step 2: Skills selection - just navigate to dashboard
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const toggleTeachSkill = (skill) => {
    setSelectedTeachSkills(prev => {
      const exists = prev.includes(skill);
      if (exists) {
        return prev.filter(s => s !== skill);
      }
      return [...prev, skill];
    });
  };

  const toggleLearnSkill = (skill) => {
    setSelectedLearnSkills(prev => {
      const exists = prev.includes(skill);
      if (exists) {
        return prev.filter(s => s !== skill);
      }
      return [...prev, skill];
    });
  };

  const renderSkillChips = (skills, selectedSkills, onToggle, selectedCategory, setSelectedCategory, label) => {
    const allSkills = [...new Set([...popularTeachSkills, ...popularLearnSkills, ...CATEGORIES.flatMap(c => SKILLS_BY_CATEGORY[c] || [])])];
    const filteredSkills = selectedCategory
      ? allSkills.filter(s => SKILLS_BY_CATEGORY[selectedCategory]?.includes(s) || popularTeachSkills.includes(s) || popularLearnSkills.includes(s))
      : allSkills;

    return (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{label}</h4>
        <div className="mb-3">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">{t('All Skills')}</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {filteredSkills.map(skill => (
            <button
              key={skill}
              type="button"
              onClick={() => onToggle(skill)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                selectedSkills.includes(skill)
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {skill} {selectedSkills.includes(skill) && <Check className="w-4 h-4 inline ml-1" />}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (step === 1) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl dark:shadow-2xl">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white">{t('Join the community today')}</h2>
          <p className="mt-2 text-center text-gray-500 dark:text-gray-400">{t('Create an Account')}</p>

          {error && <div className="p-3 mt-4 text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Full Name')}</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Email Address')}</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Password')}</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength="6"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <button disabled={isLoading} type="submit" className="w-full px-4 py-2 font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {isLoading ? t('Create Account') + '...' : t('Create Account')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
            {t('Already have an account?')} <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500">{t('Sign in here')}</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-2xl p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl dark:shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <button onClick={handleBack} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="text-center flex-1">
            <div className="w-12 h-12 mx-auto mb-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Skills</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Select skills to personalize your experience</p>
          </div>
          <div className="w-10"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {renderSkillChips(
            popularTeachSkills,
            selectedTeachSkills,
            toggleTeachSkill,
            selectedTeachCategory,
            setSelectedTeachCategory,
            'Skills you can teach'
          )}
          {renderSkillChips(
            popularLearnSkills,
            selectedLearnSkills,
            toggleLearnSkill,
            selectedLearnCategory,
            setSelectedLearnCategory,
            'Skills you want to learn'
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Finish'} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}