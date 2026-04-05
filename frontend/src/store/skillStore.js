import { create } from 'zustand';
import { useAuthStore } from './authStore';

const API_URL = 'http://localhost:5000/api';

export const useSkillStore = create((set, get) => ({
  skills: [],
  matches: [],
  isLoading: false,
  error: null,

  fetchMySkills: async () => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/skills`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set({ skills: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  addSkill: async (skillData) => {
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(skillData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set((state) => ({ skills: [...state.skills, data] }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  deleteSkill: async (id) => {
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/skills/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!response.ok) throw new Error('Failed to delete');
      set((state) => ({ skills: state.skills.filter((s) => s._id !== id) }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  fetchMatches: async () => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/matches`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set({ matches: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
