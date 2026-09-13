import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, X, Info, CheckCircle2, ChevronRight, AlertCircle, Sparkles, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSkillStore } from '../store/skillStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SessionScheduler({ isOpen, onClose, mentor, skill, skills = [], currentUser }) {
  const mySkills = useSkillStore((state) => state.skills);
  const myLearnSkills = mySkills.filter((s) => s.type === 'learn');

  const [availableSkills, setAvailableSkills] = useState(skills || []);
  const [selectedSkill, setSelectedSkill] = useState(skill || (skills && skills[0]) || null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Skill & Time, 2: Confirm

  // Sync available skills when props change and fetch mentor's complete teach skills
  React.useEffect(() => {
    let isMounted = true;

    // Immediately load provided skills
    if (skills && skills.length > 0) {
      setAvailableSkills(skills);
      setSelectedSkill((prev) => {
        if (prev && skills.some((s) => s._id === prev._id)) return prev;
        return skill || skills[0];
      });
    } else if (skill) {
      setAvailableSkills([skill]);
      setSelectedSkill(skill);
    }

    // Always fetch complete list of skills the mentor teaches to give full choice
    if (mentor?._id) {
      fetch(`${API_URL}/users/${mentor._id}`, {
        headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {},
      })
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          const teach = (data.skills || []).filter((s) => s.type === 'teach');
          if (teach.length > 0) {
            setAvailableSkills(teach);
            setSelectedSkill((prev) => {
              if (prev && teach.some((s) => s._id === prev._id)) return prev;
              if (skill && teach.some((s) => s._id === skill._id)) return skill;
              // Check if any of mentor's skills match the user's learning goals
              const matchedGoal = teach.find((ts) =>
                myLearnSkills.some(
                  (ls) =>
                    ls.name.toLowerCase() === ts.name.toLowerCase() ||
                    ts.name.toLowerCase().includes(ls.name.toLowerCase()) ||
                    ls.name.toLowerCase().includes(ts.name.toLowerCase())
                )
              );
              return matchedGoal || teach[0];
            });
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [mentor, skill, skills, currentUser, myLearnSkills]);

  const handleSubmit = async () => {
    if (!selectedSkill?._id) {
      toast.error('Please select a skill to learn');
      return;
    }
    if (!date || !time) {
      toast.error('Please select date and time');
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`);
      const res = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          mentorId: mentor._id,
          skillId: selectedSkill._id,
          scheduledAt,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Session requested successfully!');
        setStep(3); // Success state
      } else {
        toast.error(data.message || 'Failed to request session');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm -z-10"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] max-h-[92dvh] my-auto"
        >
          {/* Header (Pinned at top) */}
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-4 sm:p-6 text-white shrink-0">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="min-w-0 pr-2">
                <h2 className="text-xl sm:text-2xl font-bold truncate">Request Session</h2>
                <p className="text-primary-100 text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">with {mentor?.name || 'Mentor'}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-white/20 active:bg-white/30 rounded-full transition shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2.5 sm:gap-3 bg-white/10 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 backdrop-blur-md">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center text-base sm:text-xl shrink-0">
                🎓
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-primary-200 font-medium uppercase tracking-wider">Learning Skill</p>
                <p className="font-semibold text-white text-sm sm:text-base truncate">{selectedSkill?.name || 'Select a skill'}</p>
              </div>
              {selectedSkill?.proficiencyLevel && (
                <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 bg-white/20 text-white rounded-lg capitalize shrink-0 font-medium">
                  {selectedSkill.proficiencyLevel}
                </span>
              )}
            </div>
          </div>

          {/* Scrollable Modal Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="space-y-3.5 sm:space-y-4">
                  {/* Skill Selector Dropdown */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Choose Skill to Learn
                      </label>
                      {availableSkills.length > 0 && (
                        <span className="text-[11px] sm:text-xs font-medium text-primary-600 dark:text-primary-400">
                          {availableSkills.length} {availableSkills.length === 1 ? 'skill' : 'skills'} available
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <select
                        value={selectedSkill?._id || ''}
                        onChange={(e) => {
                          const skillFound = availableSkills.find((s) => s._id === e.target.value);
                          if (skillFound) setSelectedSkill(skillFound);
                        }}
                        className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition appearance-none cursor-pointer pr-10"
                      >
                        {availableSkills.length === 0 ? (
                          <option value="">No specific skills listed</option>
                        ) : (
                          availableSkills.map((s) => {
                            const isGoalMatch = myLearnSkills.some(
                              (ls) =>
                                ls.name.toLowerCase() === s.name.toLowerCase() ||
                                s.name.toLowerCase().includes(ls.name.toLowerCase()) ||
                                ls.name.toLowerCase().includes(s.name.toLowerCase())
                            );
                            return (
                              <option
                                key={s._id}
                                value={s._id}
                                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-1"
                              >
                                {s.name}{s.proficiencyLevel ? ` (${s.proficiencyLevel.toUpperCase()})` : ''}{s.category ? ` - ${s.category}` : ''}{isGoalMatch ? ' ⭐ [Matches Goal]' : ''}
                              </option>
                            );
                          })
                        )}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    </div>

                    {/* Selected Skill Quick Info */}
                    {selectedSkill && (
                      <div className="mt-2 p-2.5 sm:p-3 bg-primary-50/60 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/40 rounded-xl flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
                          <span className="font-semibold text-primary-900 dark:text-primary-200 truncate">
                            {selectedSkill.name}
                          </span>
                          {selectedSkill.proficiencyLevel && (
                            <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded font-medium uppercase text-[10px]">
                              {selectedSkill.proficiencyLevel}
                            </span>
                          )}
                          {selectedSkill.category && (
                            <span className="text-gray-500 dark:text-gray-400 hidden sm:inline text-[11px]">
                              • {selectedSkill.category}
                            </span>
                          )}
                        </div>
                        {myLearnSkills.some(
                          (ls) =>
                            ls.name.toLowerCase() === selectedSkill.name.toLowerCase() ||
                            selectedSkill.name.toLowerCase().includes(ls.name.toLowerCase()) ||
                            ls.name.toLowerCase().includes(selectedSkill.name.toLowerCase())
                        ) && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                            <Sparkles className="w-2.5 h-2.5" /> Matches goal
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Date & Time Grid (Side-by-side on sm+ screens) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                        Select Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition text-xs sm:text-sm dark:text-white"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                        Select Time
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                        <input
                          type="time"
                          className="w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition text-xs sm:text-sm dark:text-white"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Notes (Optional)
                    </label>
                    <textarea
                      placeholder="What would you like to focus on?"
                      className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition h-20 sm:h-24 resize-none text-xs sm:text-sm dark:text-white placeholder:text-gray-400"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  {/* Next Step CTA */}
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!date || !time || !selectedSkill?._id}
                    className="w-full py-3 sm:py-3.5 bg-primary-600 text-white rounded-xl sm:rounded-2xl font-bold hover:bg-primary-700 active:scale-[0.99] transition shadow-lg shadow-primary-600/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:cursor-not-allowed"
                  >
                    Next Step <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="bg-primary-50 dark:bg-primary-900/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 flex gap-2.5 sm:gap-3">
                  <Info className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-primary-800 dark:text-primary-300">
                    A credit will be deducted from your balance once the mentor accepts your request.
                  </p>
                </div>

                <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 text-xs sm:text-sm">
                  <div className="flex justify-between items-center p-2.5 sm:p-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">Mentor</span>
                    <span className="font-semibold dark:text-white truncate ml-2">{mentor?.name}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 sm:p-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">Skill to Learn</span>
                    <span className="font-semibold text-primary-600 dark:text-primary-400 truncate ml-2 text-right">
                      {selectedSkill?.name} {selectedSkill?.proficiencyLevel ? `(${selectedSkill.proficiencyLevel})` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 sm:p-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">Date</span>
                    <span className="font-semibold dark:text-white">{date}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 sm:p-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">Time</span>
                    <span className="font-semibold dark:text-white">{time}</span>
                  </div>
                  {notes && (
                    <div className="p-2.5 sm:p-3 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400 block mb-1">Notes</span>
                      <p className="font-medium text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 sm:py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl sm:rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.99] transition text-sm sm:text-base cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-[2] py-3 sm:py-3.5 bg-primary-600 text-white rounded-xl sm:rounded-2xl font-bold hover:bg-primary-700 active:scale-[0.99] transition shadow-lg shadow-primary-600/20 disabled:opacity-50 px-4 sm:px-8 text-sm sm:text-base cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Requesting...' : 'Confirm Request'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 sm:py-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Request Sent!</h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8">
                  We've notified {mentor?.name || 'the mentor'}. You'll get an update once they respond.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 sm:py-3.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl sm:rounded-2xl font-bold hover:opacity-90 active:scale-[0.99] transition text-sm sm:text-base cursor-pointer"
                >
                  Done
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
