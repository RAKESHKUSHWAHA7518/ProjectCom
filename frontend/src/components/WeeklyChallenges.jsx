import React, { useEffect } from 'react';
import { useChallengeStore } from '../store/challengeStore';
import { useTranslation } from 'react-i18next';
import { Trophy, Gift, Check, ShieldAlert, Sparkles, Flame } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WeeklyChallenges() {
  const { t } = useTranslation();
  const { challenges, fetchChallenges, claimReward, isLoading } = useChallengeStore();

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const handleClaim = async (challengeId) => {
    try {
      const res = await claimReward(challengeId);
      toast.success(res.message || 'Reward claimed!');
    } catch (err) {
      toast.error(err.message || 'Failed to claim reward');
    }
  };

  const getChallengeIcon = (type) => {
    switch (type) {
      case 'mentor':
        return '🧠';
      case 'learner':
        return '📖';
      case 'community':
        return '💬';
      default:
        return '🏆';
    }
  };

  if (!challenges || challenges.length === 0) {
    return null;
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500 animate-bounce" /> {t('Weekly Challenges')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Resets every Sunday at 11:59 PM
          </p>
        </div>
        <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Earn Credits
        </div>
      </div>

      <div className="space-y-4">
        {challenges.map((ch) => {
          const percent = (ch.progress / ch.target) * 100;
          return (
            <div
              key={ch.id}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                ch.isClaimed
                  ? 'bg-gray-50/50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800 opacity-70'
                  : ch.isCompleted
                  ? 'bg-gradient-to-br from-primary-50/40 to-indigo-50/40 dark:from-primary-950/10 dark:to-indigo-950/10 border-primary-200 dark:border-primary-800 shadow-sm'
                  : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  {getChallengeIcon(ch.type)}
                </span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {t(ch.titleKey)}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {t(ch.descriptionKey)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Gift className="w-3 h-3" /> +{ch.reward}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span className="font-bold">
                        {ch.progress} / {ch.target}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-850 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          ch.isClaimed
                            ? 'bg-gray-400'
                            : ch.isCompleted
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            : 'bg-gradient-to-r from-primary-500 to-indigo-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3.5 flex justify-end">
                    {ch.isClaimed ? (
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 flex items-center gap-1 bg-gray-100 dark:bg-gray-850 px-2.5 py-1 rounded-lg">
                        <Check className="w-3.5 h-3.5" /> {t('Claimed')}
                      </span>
                    ) : ch.isCompleted ? (
                      <button
                        onClick={() => handleClaim(ch.id)}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:shadow-md hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer animate-pulse"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {t('Claim Reward')}
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/40 px-2.5 py-1 rounded-lg">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
