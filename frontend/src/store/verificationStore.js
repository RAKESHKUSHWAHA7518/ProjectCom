import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useVerificationStore = create((set, get) => ({
  verificationStatus: null,
  verificationRequests: [],
  isLoading: false,
  error: null,
  getAuthToken: () => '',

  fetchVerificationStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/verification/status`, {
        headers: { Authorization: `Bearer ${get().getAuthToken()}` },
      });
      if (!response.ok) throw new Error('Failed to fetch verification status');
      const data = await response.json();
      set({ verificationStatus: data.verification, verificationRequests: data.verificationRequests, isLoading: false });
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  requestPhoneVerification: async (phoneNumber) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/verification/phone/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${get().getAuthToken()}`,
        },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to request phone verification');
      set({ isLoading: false });
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  verifyPhone: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/verification/phone/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${get().getAuthToken()}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to verify phone');
      
      // Update local state
      set(() => ({
        verificationStatus: data.verification,
        isLoading: false,
      }));
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  requestLinkedInVerification: async (linkedinUrl) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/verification/linkedin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${get().getAuthToken()}`,
        },
        body: JSON.stringify({ linkedinUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to request LinkedIn verification');
      set({ isLoading: false });
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  requestIdentityVerification: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/verification/identity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${get().getAuthToken()}`,
        },
        body: JSON.stringify(data),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Failed to request identity verification');
      set({ isLoading: false });
      return resData;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  requestVideoIntroVerification: async (videoUrl) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/verification/video-intro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${get().getAuthToken()}`,
        },
        body: JSON.stringify({ videoUrl }),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Failed to request video intro verification');
      set({ isLoading: false });
      return resData;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));