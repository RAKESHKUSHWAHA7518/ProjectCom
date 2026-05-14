import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('skillswap-theme') || 'light',
  
  toggleTheme: async () => {
    let next;
    set((state) => {
      next = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('skillswap-theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return { theme: next };
    });

    // Sync to backend if logged in
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.token) {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          await fetch(`${API_URL}/users/theme`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify({ theme: next }),
          });
        }
      } catch (e) {
        console.error('Failed to sync theme', e);
      }
    }
  },

  setTheme: (theme) => {
    localStorage.setItem('skillswap-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },

  initTheme: () => {
    const saved = localStorage.getItem('skillswap-theme');
    const userStr = localStorage.getItem('user');
    let dbTheme = null;
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.settings && user.settings.theme) {
          dbTheme = user.settings.theme;
        }
      } catch (e) {}
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = dbTheme || saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('skillswap-theme', theme);
    set({ theme });
  },
}));
