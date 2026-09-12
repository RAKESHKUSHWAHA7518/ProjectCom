import { create } from 'zustand';
import { useAuthStore } from './authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    try {
      const { user, refreshAccessToken } = useAuthStore.getState();
      if (!user?.token) return;
      let response = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          response = await fetch(`${API_URL}/notifications`, {
            headers: { Authorization: `Bearer ${newToken}` },
          });
        } else {
          console.warn('Notification polling unauthorized; skipping update without forced logout');
          return;
        }
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch notifications');
      set({ notifications: data.notifications || [], unreadCount: data.unreadCount || 0 });
    } catch (error) {
      console.warn('Failed to fetch notifications:', error.message);
    }
  },

  markAsRead: async (id) => {
    try {
      const { user } = useAuthStore.getState();
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const { user } = useAuthStore.getState();
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all notifications:', error);
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));
