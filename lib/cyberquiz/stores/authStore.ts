'use client';
import { create } from 'zustand';
import type { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  _initialized: boolean;
  setUser:    (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  signOut:    () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:         null,
  loading:      true,
  _initialized: false,

  setUser:    (user)    => set({ user }),
  setLoading: (loading) => set({ loading }),
  updateUser: (updates) => set({ user: get().user ? { ...get().user!, ...updates } : null }),

  signOut: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('qa_token');
    set({ user: null, _initialized: false });
  },

  initialize: async () => {
    if (get()._initialized) return;
    set({ _initialized: true });
    if (typeof window === 'undefined') { set({ loading: false }); return; }
    const token = localStorage.getItem('qa_token');
    if (!token) { set({ loading: false }); return; }
    try {
      const res = await fetch('/api/cyberquiz/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('invalid token');
      const user = await res.json();
      set({ user, loading: false });
    } catch {
      localStorage.removeItem('qa_token');
      set({ user: null, loading: false, _initialized: false });
    }
  },
}));
