'use client';

import { create } from 'zustand';
import { api, setAccessToken, getAccessToken, onAccessTokenChange } from '../lib/api';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  isBlocked?: boolean;
}

interface AdminAuthState {
  token: string | null;
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  initialize: () => Promise<void>;
  clearError: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    if (typeof window === 'undefined') return;

    // Clean up any legacy plain tokens from localStorage for security compliance
    try {
      localStorage.removeItem('vertex_admin_token');
      localStorage.removeItem('vertex_admin_user');
      localStorage.removeItem('xydv_admin_token');
      localStorage.removeItem('xydv_admin_user');
    } catch {}

    // Check if token already present in memory
    const currentMemoryToken = getAccessToken();
    if (currentMemoryToken) {
      set({ token: currentMemoryToken, isAuthenticated: true });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await api.post<{
        token: string;
        data?: AdminUser;
        user?: AdminUser;
      }>('/auth/refresh', {});

      const user = res.data ?? res.user;
      const token = res.token;

      if (token && user && user.role === 'admin' && !user.isBlocked) {
        setAccessToken(token);
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return;
      }
    } catch {
      // Session expired, unavailable, or invalid
    }

    setAccessToken(null);
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<{
        user?: AdminUser;
        data?: AdminUser;
        token: string;
      }>('/auth/login', { email, password });

      const user = res.user ?? res.data;
      const token = res.token;

      if (!user || user.role !== 'admin') {
        const err = 'Access restricted: Administrator role required.';
        set({ error: err, isLoading: false });
        return { success: false, error: err };
      }

      if (user.isBlocked) {
        const err = 'Your account has been suspended. Please contact support.';
        set({ error: err, isLoading: false });
        return { success: false, error: err };
      }

      if (!token) {
        const err = 'Authentication failed: No token received.';
        set({ error: err, isLoading: false });
        return { success: false, error: err };
      }

      // Store in memory (HIGH-08) and remove any plain localStorage tokens
      setAccessToken(token);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('vertex_admin_token');
          localStorage.removeItem('vertex_admin_user');
          localStorage.removeItem('xydv_admin_token');
          localStorage.removeItem('xydv_admin_user');
        } catch {}
      }

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Authentication failed. Please check credentials.';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  logout: () => {
    setAccessToken(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('vertex_admin_token');
        localStorage.removeItem('vertex_admin_user');
        localStorage.removeItem('xydv_admin_token');
        localStorage.removeItem('xydv_admin_user');
      } catch {}
    }
    // Call server to clear httpOnly refresh cookie
    api.post('/auth/logout', {}).catch(() => {});
    set({ token: null, user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));

if (typeof window !== 'undefined') {
  onAccessTokenChange((token) => {
    if (!token) {
      useAdminAuthStore.setState({ token: null, user: null, isAuthenticated: false });
    } else {
      useAdminAuthStore.setState((state) => ({ ...state, token, isAuthenticated: true }));
    }
  });
}
