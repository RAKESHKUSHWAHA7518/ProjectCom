import { create } from 'zustand';

// Note: In an actual app these endpoints point to localhost:5000/api or similar
const API_URL = 'http://localhost:5000/api/auth';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');

      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  refreshUser: async () => {
    try {
      const currentUser = get().user;
      if (!currentUser || !currentUser.token) return;
      const response = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const updatedUser = { ...data, token: currentUser.token };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      }
    } catch (error) {
      console.error('Failed to refresh user', error);
    }
  },

  logout: () => {
    localStorage.removeItem('user');
    set({ user: null });
  },
}));
