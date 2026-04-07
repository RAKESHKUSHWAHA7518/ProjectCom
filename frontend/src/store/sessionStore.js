import { create } from 'zustand';
import { useAuthStore } from './authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useSessionStore = create((set, get) => ({
  sessions: [],
  isLoading: false,
  error: null,

  fetchSessions: async (status) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      const query = status ? `?status=${status}` : '';
      const response = await fetch(`${API_URL}/sessions${query}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set({ sessions: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  bookSession: async (mentorId, skillId, scheduledAt, notes) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ mentorId, skillId, scheduledAt, notes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set((state) => ({ sessions: [data, ...state.sessions], isLoading: false }));

      // Deduct credit locally
      const authStore = useAuthStore.getState();
      if (authStore.user) {
        const updatedUser = { ...authStore.user, skillCredits: (authStore.user.skillCredits || 0) - 1 };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        useAuthStore.setState({ user: updatedUser });
      }

      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateSessionStatus: async (sessionId, status) => {
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/sessions/${sessionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set((state) => ({
        sessions: state.sessions.map((s) => (s._id === sessionId ? data : s)),
      }));
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
}));
