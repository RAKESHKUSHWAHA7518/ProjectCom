import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, X, Info, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SessionScheduler({ isOpen, onClose, mentor, skill, skills = [], currentUser }) {
  const [availableSkills, setAvailableSkills] = useState(skills || []);
  const [selectedSkill, setSelectedSkill] = useState(skill || (skills && skills[0]) || null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Skill & Time, 2: Confirm

  // Sync available skills when props change or fetch fallback from mentor's profile
  React.useEffect(() => {
    if (skills && skills.length > 0) {
      setAvailableSkills(skills);
      setSelectedSkill((prev) => {
        if (prev && skills.some((s) => s._id === prev._id)) return prev;
        return skill || skills[0];
      });
    } else if (mentor?._id) {
      fetch(`${API_URL}/users/${mentor._id}`, {
        headers: currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {},
      })
        .then((res) => res.json())
        .then((data) => {
          const teach = (data.skills || []).filter((s) => s.type === 'teach');
          if (teach.length > 0) {
            setAvailableSkills(teach);
            setSelectedSkill((prev) => {
              if (prev && teach.some((s) => s._id === prev._id)) return prev;
              return skill || teach[0];
            });
          } else if (skill) {
            setAvailableSkills([skill]);
            setSelectedSkill(skill);
          }
        })
        .catch(() => {
          if (skill) {
            setAvailableSkills([skill]);
            setSelectedSkill(skill);
          }
        });
    } else if (skill) {
      setAvailableSkills([skill]);
      setSelectedSkill(skill);
    }
  }, [mentor, skill, skills, currentUser]);

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">Request Session</h2>
                <p className="text-primary-100 text-sm mt-1">with {mentor.name}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-3 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                🎓
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-primary-200 font-medium uppercase tracking-wider">Learning Skill</p>
                <p className="font-semibold text-white truncate">{selectedSkill?.name || 'Select a skill'}</p>
              </div>
              {selectedSkill?.proficiencyLevel && (
                <span className="text-xs px-2.5 py-1 bg-white/20 text-white rounded-lg capitalize shrink-0 font-medium">
                  {selectedSkill.proficiencyLevel}
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="space-y-4">
                  {/* Skill Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Choose Skill to Learn
                      </label>
                      {availableSkills.length > 1 && (
                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                          {availableSkills.length} skills available
                        </span>
                      )}
                    </div>

                    {availableSkills.length > 1 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-0.5">
                        {availableSkills.map((s) => {
                          const isSelected = selectedSkill?._id === s._id;
                          return (
                            <button
                              key={s._id}
                              type="button"
                              onClick={() => setSelectedSkill(s)}
                              className={`p-3 rounded-xl text-left transition-all border flex items-center justify-between gap-2 ${
                                isSelected
                                  ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-500 ring-2 ring-primary-500/20 text-primary-900 dark:text-primary-100 shadow-sm'
                                  : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-sm truncate">{s.name}</span>
                                  {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                  {s.category || 'General'}
                                </p>
                              </div>
                              {s.proficiencyLevel && (
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                  isSelected
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                }`}>
                                  {s.proficiencyLevel}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                            🎓
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">
                              {selectedSkill?.name || 'Skill Exchange'}
                            </span>
                            {selectedSkill?.category && (
                              <p className="text-xs text-gray-400 dark:text-gray-500">{selectedSkill.category}</p>
                            )}
                          </div>
                        </div>
                        {selectedSkill?.proficiencyLevel && (
                          <span className="text-xs px-2.5 py-1 bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 rounded-lg font-medium capitalize">
                            {selectedSkill.proficiencyLevel}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition dark:text-white"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Time</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition dark:text-white"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                    <textarea
                      placeholder="What would you like to focus on?"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition h-24 resize-none dark:text-white"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!date || !time || !selectedSkill?._id}
                    className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    Next Step <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-2xl mb-6 flex gap-3">
                  <Info className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-primary-800 dark:text-primary-300">
                    A credit will be deducted from your balance once the mentor accepts your request.
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between p-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500">Mentor</span>
                    <span className="font-semibold dark:text-white">{mentor.name}</span>
                  </div>
                  <div className="flex justify-between p-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500">Skill to Learn</span>
                    <span className="font-semibold text-primary-600 dark:text-primary-400">
                      {selectedSkill?.name} {selectedSkill?.proficiencyLevel ? `(${selectedSkill.proficiencyLevel})` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500">Date</span>
                    <span className="font-semibold dark:text-white">{date}</span>
                  </div>
                  <div className="flex justify-between p-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500">Time</span>
                    <span className="font-semibold dark:text-white">{time}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-2 py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-600/20 disabled:opacity-50 px-8"
                  >
                    {isSubmitting ? 'Requesting...' : 'Confirm Request'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Request Sent!</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                  We've notified {mentor.name}. You'll get an update once they respond.
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl font-bold hover:opacity-90 transition"
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
