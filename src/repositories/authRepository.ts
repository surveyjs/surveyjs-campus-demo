import { RosterEntry, Session } from '../types/auth';
import { api } from './api';
import { session, StoredSession } from './session';

export const authRepository = {
  roster: () => api<RosterEntry[]>('/auth/roster'),
  async login(username: string, password: string): Promise<Session> {
    return api<Session>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
  async logout() {
    try {
      await api<void>('/auth/logout', { method: 'POST' });
    } catch {
      // The local session is cleared even if the API is unavailable.
    }
    session.clear();
  },
  store: (value: StoredSession, remember: boolean) => session.store(value, remember),
  current: () => session.get(),
};
