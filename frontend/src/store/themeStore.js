import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('skillswap-theme') || 'light',
  
  toggleTheme: () => set((state) => {
    const next = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('skillswap-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    return { theme: next };
  }),

  initTheme: () => {
    const saved = localStorage.getItem('skillswap-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('skillswap-theme', theme);
    set({ theme });
  },
}));
