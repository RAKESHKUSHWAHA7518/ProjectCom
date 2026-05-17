import { create } from 'zustand';
import { useAuthStore } from './authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useChallengeStore = create((set, get) => ({
  challenges: [],
  weekKey: '',
  isLoading: false,
  error: null,

  fetchChallenges: async () => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      if (!user?.token) return;
      const response = await fetch(`${API_URL}/challenges`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set({ 
        challenges: data.challenges, 
        weekKey: data.weekKey, 
        isLoading: false 
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  claimReward: async (challengeId) => {
    set({ isLoading: true, error: null });
    try {
      const { user, refreshUser } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/challenges/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ challengeId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      // Update local state for challenges
      set((state) => ({
        challenges: state.challenges.map((ch) =>
          ch.id === challengeId ? { ...ch, isClaimed: true } : ch
        ),
        isLoading: false
      }));

      // Refresh the user's skill credits in the authStore
      if (refreshUser) {
        await refreshUser();
      }

      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
