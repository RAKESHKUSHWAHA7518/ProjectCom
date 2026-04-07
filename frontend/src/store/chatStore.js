import { create } from 'zustand';
import { useAuthStore } from './authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentMessages: [],
  activeConversation: null,
  isLoading: false,
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set({ conversations: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  getOrCreateConversation: async (otherUserId) => {
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/chat/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ otherUserId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set({ activeConversation: data });
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  fetchMessages: async (conversationId) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/chat/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set({ currentMessages: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  sendMessage: async (conversationId, content) => {
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ conversationId, content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set((state) => ({
        currentMessages: [...state.currentMessages, data],
      }));
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  addMessage: (message) => {
    set((state) => ({
      currentMessages: [...state.currentMessages, message],
    }));
  },

  setActiveConversation: (conv) => set({ activeConversation: conv }),
}));
