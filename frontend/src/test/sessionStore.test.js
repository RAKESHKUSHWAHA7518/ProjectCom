import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSessionStore } from '../store/sessionStore';
import { useAuthStore } from '../store/authStore';

describe('useSessionStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.setState({ sessions: [], isLoading: false, error: null });
    useAuthStore.setState({
      user: { _id: 'user123', name: 'Tester', token: 'fake-jwt', skillCredits: 5 },
    });
  });

  it('initializes with empty sessions array and false loading state', () => {
    const state = useSessionStore.getState();
    expect(state.sessions).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('fetchSessions populates sessions on successful response', async () => {
    const mockSessions = [
      { _id: 's1', mentor: 'm1', learner: 'user123', status: 'pending' },
      { _id: 's2', mentor: 'm2', learner: 'user123', status: 'accepted' },
    ];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSessions,
    }));

    await useSessionStore.getState().fetchSessions();

    const state = useSessionStore.getState();
    expect(state.sessions).toEqual(mockSessions);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('fetchSessions sets error state on API failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Unauthorized' }),
    }));

    await useSessionStore.getState().fetchSessions();

    const state = useSessionStore.getState();
    expect(state.error).toBe('Unauthorized');
    expect(state.isLoading).toBe(false);
  });

  it('updateSessionStatus updates the session in store upon success', async () => {
    const initialSessions = [
      { _id: 's1', status: 'pending', mentor: 'm1' },
      { _id: 's2', status: 'pending', mentor: 'm2' },
    ];
    useSessionStore.setState({ sessions: initialSessions });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ _id: 's1', status: 'accepted', mentor: 'm1' }),
    }));

    await useSessionStore.getState().updateSessionStatus('s1', 'accepted');

    const updatedSessions = useSessionStore.getState().sessions;
    expect(updatedSessions.find((s) => s._id === 's1').status).toBe('accepted');
    expect(updatedSessions.find((s) => s._id === 's2').status).toBe('pending');
  });
});
