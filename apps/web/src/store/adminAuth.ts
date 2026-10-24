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

let initializePromise: Promise<void> | null = null;

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    if (typeof window === 'undefined') return;
    if (initializePromise) return initializePromise;

    initializePromise = (async () => {
      // Clean up any legacy plain tokens from localStorage for security compliance
      try {
        localStorage.removeItem('vertex_admin_token');
        localStorage.removeItem('vertex_admin_user');
        localStorage.removeItem('xydv_admin_token');
        localStorage.removeItem('xydv_admin_user');
      } catch {}

      // Validate the in-memory token belongs to an admin before trusting it.
      // A storefront customer login sets the same singleton; we must not let it
      // grant admin access.
      const currentMemoryToken = getAccessToken();
      if (currentMemoryToken) {
        try {
          const parts = currentMemoryToken.split('.');
          if (parts.length === 3 && parts[1]) {
            const payload = JSON.parse(
              atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
            ) as { role?: string; isBlocked?: boolean };
            if (payload.role === 'admin' && !payload.isBlocked) {
              set({ token: currentMemoryToken, isAuthenticated: true });
              return;
            }
          }
        } catch {
          // Malformed token — fall through to server refresh
        }
        // Token present but not an admin token — clear it and re-authenticate
        setAccessToken(null);
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
    })().finally(() => {
      initializePromise = null;
    });

    return initializePromise;
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
      return;
    }
    // Only mark admin store authenticated when the token carries admin role.
    // Storefront customer tokens share the same singleton — reject them here.
    try {
      const parts = token.split('.');
      if (parts.length === 3 && parts[1]) {
        const payload = JSON.parse(
          atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
        ) as { role?: string; isBlocked?: boolean };
        if (payload.role === 'admin' && !payload.isBlocked) {
          useAdminAuthStore.setState((state) => ({ ...state, token, isAuthenticated: true }));
          return;
        }
      }
    } catch {
      // Malformed token
    }
    // Non-admin token — clear admin auth state
    useAdminAuthStore.setState({ token: null, user: null, isAuthenticated: false });
  });
}
