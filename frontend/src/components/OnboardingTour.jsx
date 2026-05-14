import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useAuthStore } from '../store/authStore';

export default function OnboardingTour() {
  const { user } = useAuthStore();
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Only run tour if user is logged in and hasn't completed it
    if (user) {
      const hasCompletedTour = localStorage.getItem(`tourCompleted_${user._id}`);
      if (!hasCompletedTour) {
        // Small delay to ensure components are mounted
        const timer = setTimeout(() => {
          setRun(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem(`tourCompleted_${user._id}`, 'true');
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
      content: 'Manage all your upcoming and past sessions here. You can accept pending requests or check their status.',
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
