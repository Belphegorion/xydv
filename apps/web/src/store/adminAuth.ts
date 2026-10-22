'use client';

import { create } from 'zustand';
import { api } from '../lib/api';

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
  initialize: () => void;
  clearError: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initialize: () => {
    if (typeof window === 'undefined') return;
    try {
      const storedToken = localStorage.getItem('vertex_admin_token');
      const storedUser = localStorage.getItem('vertex_admin_user');
      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser);
        if (user.role === 'admin') {
          set({
            token: storedToken,
            user,
            isAuthenticated: true,
            error: null,
          });
          return;
        }
      }
    } catch {
      // Ignored: corrupt local storage
    }
    set({ token: null, user: null, isAuthenticated: false });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<{
        user?: AdminUser;
        data?: AdminUser;
        token: string;
      }>('/auth/login', { email, password });

      const user = (res as any).user ?? (res as any).data;
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

      if (typeof window !== 'undefined') {
        localStorage.setItem('vertex_admin_token', token);
        localStorage.setItem('vertex_admin_user', JSON.stringify(user));
      }

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please check credentials.';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('vertex_admin_token');
        localStorage.removeItem('vertex_admin_user');
      } catch {}
    }
    set({ token: null, user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
