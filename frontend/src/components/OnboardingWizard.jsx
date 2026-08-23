import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle, Sparkles, Search, Calendar, Video, MessageCircle, Star, Zap, Clock } from 'lucide-react';

import { useAuthStore } from '../store/authStore';
import { useSkillStore } from '../store/skillStore';
import Avatar from './Avatar';
import { CATEGORIES, SKILLS_BY_CATEGORY } from '../data/skillsData';

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to SkillSwap!',
    subtitle: 'Let\'s set up your profile in 3 quick steps',
    icon: Sparkles,
  },
  {
    id: 'skills-teach',
    title: 'What can you teach?',
    subtitle: 'Select skills you\'re proficient in',
    icon: Star,
  },
  {
    id: 'skills-learn',
    title: 'What do you want to learn?',
    subtitle: 'Pick skills you\'d like to master',
    icon: Search,
  },
  {
    id: 'availability',
    title: 'When are you available?',
    subtitle: 'Set your preferred time slots',
    icon: Calendar,
  },
  {
    id: 'complete',
    title: 'You\'re all set!',
    subtitle: 'Start exploring mentors and booking sessions',
    icon: CheckCircle,
  },
];

export default function OnboardingWizard({ onComplete, onSkip }) {
  const { user } = useAuthStore();
  const { addSkill, fetchMySkills } = useSkillStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [teachSkills, setTeachSkills] = useState([]);
  const [learnSkills, setLearnSkills] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [customTeachSkill, setCustomTeachSkill] = useState('');
  const [customLearnSkill, setCustomLearnSkill] = useState('');
  const [selectedTeachCategory, setSelectedTeachCategory] = useState('');
  const [selectedLearnCategory, setSelectedLearnCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMySkills();
  }, [fetchMySkills]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // Add teach skills
      for (const skill of teachSkills) {
        await addSkill({ ...skill, type: 'teach' });
      }
      // Add learn skills
      for (const skill of learnSkills) {
        await addSkill({ ...skill, type: 'learn' });
      }
      // Update user availability
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ availability }),
      });

      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTeachSkill = (skill) => {
    setTeachSkills(prev => {
      const exists = prev.find(s => s.name === skill.name && s.category === skill.category);
      if (exists) {
        return prev.filter(s => s !== exists);
      }
      return [...prev, { ...skill, proficiencyLevel: 'intermediate' }];
    });
  };

  const toggleLearnSkill = (skill) => {
    setLearnSkills(prev => {
      const exists = prev.find(s => s.name === skill.name && s.category === skill.category);
      if (exists) {
        return prev.filter(s => s !== exists);
      }
      return [...prev, { ...skill, proficiencyLevel: 'beginner' }];
    });
  };

  const addCustomTeachSkill = () => {
    if (customTeachSkill.trim() && selectedTeachCategory) {
      const skill = { name: customTeachSkill.trim(), category: selectedTeachCategory };
      if (!teachSkills.find(s => s.name === skill.name && s.category === skill.category)) {
        setTeachSkills(prev => [...prev, { ...skill, proficiencyLevel: 'intermediate' }]);
        setCustomTeachSkill('');
      }
    }
  };

  const addCustomLearnSkill = () => {
    if (customLearnSkill.trim() && selectedLearnCategory) {
      const skill = { name: customLearnSkill.trim(), category: selectedLearnCategory };
      if (!learnSkills.find(s => s.name === skill.name && s.category === skill.category)) {
        setLearnSkills(prev => [...prev, { ...skill, proficiencyLevel: 'beginner' }]);
        setCustomLearnSkill('');
      }
    }
  };

  const toggleAvailability = (slot) => {
    setAvailability(prev => {
      const exists = prev.find(s => s === slot);
      if (exists) {
        return prev.filter(s => s !== slot);
      }
      return [...prev, slot];
    });
  };

  const step = STEPS[currentStep];

  const canProceed = () => {
    switch (currentStep) {
      case 1: // teach skills
        return teachSkills.length > 0;
      case 2: // learn skills
        return learnSkills.length > 0;
      case 3: // availability
        return availability.length > 0;
      default:
        return true;
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Step {currentStep + 1} of {STEPS.length}
              </span>
              {currentStep > 0 && currentStep < STEPS.length - 1 && (
                <button
                  onClick={onSkip}
                  className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Skip for now
                </button>
              )}
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="p-6">
            {/* Step Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
                <step.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{step.title}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">{step.subtitle}</p>
            </motion.div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-950/30 dark:to-indigo-950/30 rounded-2xl p-6 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Exchange Skills. Grow Together.
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      A peer-to-peer ecosystem where you teach what you know and learn what you don't.
                      Connect with mentors globally, earn credits, and level up your skills!
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-xl">
                        <Video className="w-5 h-5 mx-auto mb-1 text-primary-500" />
                        <p className="font-medium text-gray-900 dark:text-white">Live Video</p>
                        <p className="text-gray-500 dark:text-gray-400">Real-time sessions</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-xl">
                        <MessageCircle className="w-5 h-5 mx-auto mb-1 text-primary-500" />
                        <p className="font-medium text-gray-900 dark:text-white">In-App Chat</p>
                        <p className="text-gray-500 dark:text-gray-400">Message mentors</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-xl">
                        <Zap className="w-5 h-5 mx-auto mb-1 text-primary-500" />
                        <p className="font-medium text-gray-900 dark:text-white">Earn Credits</p>
                        <p className="text-gray-500 dark:text-gray-400">Level up skills</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleNext}
                    className="w-full py-3 px-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition flex items-center justify-center gap-2"
                  >
                    Get Started <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="skills-teach"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <SkillSelector
                    title="Skills You Can Teach"
                    selectedSkills={teachSkills}
                    onToggle={toggleTeachSkill}
                    customSkill={customTeachSkill}
                    setCustomSkill={setCustomTeachSkill}
                    selectedCategory={selectedTeachCategory}
                    setSelectedCategory={setSelectedTeachCategory}
                    onAddCustom={addCustomTeachSkill}
                    mode="teach"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleBack}
                      className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                      <ArrowLeft className="w-5 h-5 inline mr-1" /> Back
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!canProceed() || isSubmitting}
                      className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      Continue <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="skills-learn"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <SkillSelector
                    title="Skills You Want to Learn"
                    selectedSkills={learnSkills}
                    onToggle={toggleLearnSkill}
                    customSkill={customLearnSkill}
                    setCustomSkill={setCustomLearnSkill}
                    selectedCategory={selectedLearnCategory}
                    setSelectedCategory={setSelectedLearnCategory}
                    onAddCustom={addCustomLearnSkill}
                    mode="learn"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleBack}
                      className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                      <ArrowLeft className="w-5 h-5 inline mr-1" /> Back
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!canProceed() || isSubmitting}
                      className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      Continue <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="availability"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
                      Select your typical availability (mentors will see this when booking)
                    </p>
                    <AvailabilityGrid onToggle={toggleAvailability} selected={availability} />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleBack}
                      className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                      <ArrowLeft className="w-5 h-5 inline mr-1" /> Back
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!canProceed() || isSubmitting}
                      className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      Continue <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="w-24 h-24 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">You're Ready!</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Your profile is set up with {teachSkills.length} teaching skills, {learnSkills.length} learning skills, and {availability.length} availability slots.
                  </p>
                  <div className="bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-950/30 dark:to-indigo-950/30 rounded-2xl p-6 space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">What's next?</h4>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 text-left">
                      <li className="flex items-center gap-2"><Search className="w-4 h-4 text-primary-500" /> Explore mentors for your learning skills</li>
                      <li className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary-500" /> Book your first session</li>
                      <li className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-primary-500" /> Message potential mentors</li>
                      <li className="flex items-center gap-2"><Star className="w-4 h-4 text-primary-500" /> Complete weekly challenges for rewards</li>
                    </ul>
                  </div>
                  <button
                    onClick={handleFinish}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Saving...' : 'Start Exploring'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SkillSelector({ selectedSkills, onToggle, customSkill, setCustomSkill, selectedCategory, setSelectedCategory, onAddCustom, mode }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSkills = CATEGORIES
    .filter(cat => !searchQuery || cat.toLowerCase().includes(searchQuery.toLowerCase()))
    .map(function(cat) {
      const skills = SKILLS_BY_CATEGORY[cat] || [];
      const skillObjects = skills.map(function(skill) {
        return {
          name: skill,
          category: cat,
          selected: selectedSkills.some(function(s) {
            return s.name === skill && s.category === cat;
          }),
        };
      });
      return {
        category: cat,
        skills: skillObjects,
      };
    });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div className="max-h-64 overflow-y-auto space-y-4">
        {filteredSkills.filter(g => g.skills.length > 0).map(group => (
          <div key={group.category} className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
              {group.category}
            </h4>
            <div className="flex flex-wrap gap-2">
              {group.skills.map(skill => (
                <button
                  key={`${group.category}-${skill}`}
                  onClick={() => onToggle({ name: skill, category: group.category })}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                    skill.selected
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Don't see your skill? Add a custom one:
        </h4>
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="flex-1 min-w-[150px] px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select category...</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder={`Enter ${mode === 'teach' ? 'teaching' : 'learning'} skill...`}
            value={customSkill}
            onChange={e => setCustomSkill(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && onAddCustom()}
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={onAddCustom}
            disabled={!customSkill.trim() || !selectedCategory}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function AvailabilityGrid({ onToggle, selected }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeSlots = ['6-9', '9-12', '12-15', '15-18', '18-21', '21-24'];

  const slots = [];
days.forEach(function(day) {
    timeSlots.forEach(function(time) {
      slots.push(`${day} ${time}`);
    });
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1 px-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
        {['', ...days].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {slots.map((slot, idx) => {
          const dayIdx = idx % 7;
          if (dayIdx === 0) {
            return (
              <div key={slot} className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
                {timeSlots[Math.floor(idx / 7)]}
              </div>
            );
          }
          const isSelected = selected.includes(slot);
          return (
            <button
              key={slot}
              onClick={() => onToggle(slot)}
              className={`py-2 px-1 text-xs rounded-lg transition ${
                isSelected
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {slot.split(' ')[1]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

