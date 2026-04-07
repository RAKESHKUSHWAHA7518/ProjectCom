import { create } from 'zustand';
import { useAuthStore } from './authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useReviewStore = create((set) => ({
  reviews: [],
  isLoading: false,
  error: null,

  createReview: async (sessionId, rating, comment) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ sessionId, rating, comment }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set((state) => ({ reviews: [data, ...state.reviews], isLoading: false }));
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchReviews: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/reviews/${userId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set({ reviews: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
