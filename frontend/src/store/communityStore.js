import { create } from 'zustand';
import { useAuthStore } from './authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useCommunityStore = create((set) => ({
  communities: [],
  activeCommunity: null,
  isLoading: false,
  error: null,

  fetchCommunities: async () => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/communities`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set({ communities: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchCommunityById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/communities/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set({ activeCommunity: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  joinCommunity: async (id) => {
    try {
      const { user } = useAuthStore.getState();
      await fetch(`${API_URL}/communities/${id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      set((state) => ({
        communities: state.communities.map((c) =>
          c._id === id ? { ...c, isMember: true, memberCount: c.memberCount + 1 } : c
        ),
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  leaveCommunity: async (id) => {
    try {
      const { user } = useAuthStore.getState();
      await fetch(`${API_URL}/communities/${id}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      set((state) => ({
        communities: state.communities.map((c) =>
          c._id === id ? { ...c, isMember: false, memberCount: Math.max(0, c.memberCount - 1) } : c
        ),
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  createPost: async (communityId, content) => {
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/communities/${communityId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set((state) => ({
        activeCommunity: state.activeCommunity
          ? { ...state.activeCommunity, posts: [...state.activeCommunity.posts, data] }
          : null,
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  replyToPost: async (communityId, postId, content) => {
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/communities/${communityId}/posts/${postId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set((state) => ({
        activeCommunity: state.activeCommunity
          ? {
              ...state.activeCommunity,
              posts: state.activeCommunity.posts.map((p) =>
                p._id === postId ? data : p
              ),
            }
          : null,
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  toggleLike: async (communityId, postId) => {
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/communities/${communityId}/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
    } catch (error) {
      set({ error: error.message });
    }
  },

  createCommunity: async (name, description, category, icon) => {
    try {
      const { user } = useAuthStore.getState();
      const response = await fetch(`${API_URL}/communities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ name, description, category, icon }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      set((state) => ({
        communities: [...state.communities, { ...data, memberCount: 1, isMember: true }],
      }));
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
}));
