import { create } from 'zustand';
import { useAuthStore } from './authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useSearchStore = create((set) => ({
  results: {
    users: [],
    communities: [],
    skills: [],
  },
  isLoading: false,
  error: null,

  performSearch: async (query) => {
    if (!query.trim()) {
      set({ results: { users: [], communities: [], skills: [] } });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set({ results: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  clearSearch: () => {
    set({ results: { users: [], communities: [], skills: [] }, error: null });
  },
}));
