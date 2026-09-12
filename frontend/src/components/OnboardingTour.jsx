import React, { useState, useEffect, useCallback } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useAuthStore } from '../store/authStore';

export default function OnboardingTour() {
  const { user } = useAuthStore();
  const [run, setRun] = useState(false);

  const markTourComplete = useCallback(() => {
    setRun(false);
    if (!user) return;
    const userId = user._id || user.id;
    if (userId) {
      localStorage.setItem(`tourCompleted_${userId}`, 'true');
    }
    // Also persist to backend so it never shows again across any browser/device
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    if (user.token) {
      fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ hasSeenTour: true }),
      }).catch(() => {});
    }
    // Update local user state in auth store
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      const updated = { ...currentUser, hasSeenTour: true };
      localStorage.setItem('user', JSON.stringify(updated));
      useAuthStore.setState({ user: updated });
    }
  }, [user]);

  useEffect(() => {
    // Only run tour if user is logged in
    if (!user) return;

    const userId = user._id || user.id;
    const tourKey = `tourCompleted_${userId}`;
    const hasCompletedLocal = localStorage.getItem(tourKey) === 'true';

    // Check if user is an existing user or has already seen the tour:
    // 1. Explicitly has seen tour (DB or localStorage)
    // 2. Already has a completed profile
    // 3. Has existing sessions (mentor or learner)
    const isReturningUser =
      user.hasSeenTour === true ||
      hasCompletedLocal ||
      user.profileComplete === true ||
      (user.totalSessionsAsMentor > 0) ||
      (user.totalSessionsAsLearner > 0);

    if (isReturningUser) {
      // Ensure local storage is also flagged so we never check again
      if (userId && !hasCompletedLocal) {
        localStorage.setItem(tourKey, 'true');
      }
      return;
    }

    // Only run for brand-new users logging in for the first time
    const timer = setTimeout(() => {
      setRun(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [user]);

  const handleJoyrideCallback = (data) => {
    const { status, action, type } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED, 'finished', 'skipped'];

    // Permanently complete on any exit event: finish, skip, clicking 'X' close, or tour ending
    if (
      finishedStatuses.includes(status) ||
      action === 'close' ||
      action === 'skip' ||
      type === 'tour:end'
    ) {
      markTourComplete();
    }
  };

  const steps = [
    {
      target: 'body',
      placement: 'center',
      content: (
        <div className="text-center p-2">
          <h2 className="text-xl font-bold mb-3 text-gray-900">Welcome to SkillSwap! 🎉</h2>
          <p className="text-sm text-gray-600">Let's take a quick tour to help you get started with the platform.</p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: '#tour-skills',
      content: 'Start by adding your skills! List what you can teach and what you want to learn to get matched with others.',
      placement: 'right',
    },
    {
      target: '#tour-mentors',
      content: 'Based on your skills, we will recommend top mentors here. You can book sessions with them easily!',
      placement: 'left',
    },
    {
      target: '#tour-sessions',
      content: 'Manage all your pending, completed, and uncompleted sessions here. You can accept pending requests or check their status.',
      placement: 'left',
    },
    {
      target: '#tour-quick-links',
      content: 'Use these quick links to explore the community, view the leaderboard, or check your messages.',
      placement: 'top',
    }
  ];

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          primaryColor: '#6366f1', // indigo-500
          zIndex: 10000,
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
        },
        buttonNext: {
          backgroundColor: '#4f46e5',
          borderRadius: '8px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: '8px',
        },
        buttonSkip: {
          color: '#9ca3af',
        },
        tooltipContainer: {
          textAlign: 'left',
        }
      }}
    />
  );
}
