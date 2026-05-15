import { create } from 'zustand';

// Note: In an actual app these endpoints point to localhost:5000/api or similar
const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth`;

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
        credentials: 'include',
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

  googleLogin: async (credential) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Google login failed');
      
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
        credentials: 'include',
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

  refreshAccessToken: async () => {
    try {
      const response = await fetch(`${API_URL}/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, token: data.token };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          set({ user: updatedUser });
          return data.token;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  refreshUser: async () => {
    try {
      let currentUser = get().user;
      if (!currentUser || !currentUser.token) return;

      let response = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });

      // If token expired, try to refresh it
      if (response.status === 401) {
        const newToken = await get().refreshAccessToken();
        if (newToken) {
          response = await fetch(`${API_URL}/profile`, {
            headers: { Authorization: `Bearer ${newToken}` }
          });
        } else {
          get().logout();
          return;
        }
      }

      if (response.ok) {
        const data = await response.json();
        currentUser = get().user; // grab again in case it changed
        const updatedUser = { ...data, token: currentUser.token };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      }
    } catch (error) {
      console.error('Failed to refresh user', error);
    }
  },

  logout: async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {}
    localStorage.removeItem('user');
    set({ user: null });
  },
}));
