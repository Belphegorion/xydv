'use client';

import { create } from 'zustand';
import { api, setAccessToken } from '../lib/api';

export interface CustomerUser {
  _id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  avatar?: string;
}

interface CustomerAuthState {
  token: string | null;
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isModalOpen: boolean;
  authMode: 'login' | 'register';
  openModal: (mode?: 'login' | 'register') => void;
  closeModal: () => void;
  setAuthMode: (mode: 'login' | 'register') => void;
  clearError: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useCustomerAuthStore = create<CustomerAuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isModalOpen: false,
  authMode: 'login',

  openModal: (mode = 'login') => set({ isModalOpen: true, authMode: mode, error: null }),
  closeModal: () => set({ isModalOpen: false, error: null }),
  setAuthMode: (mode) => set({ authMode: mode, error: null }),
  clearError: () => set({ error: null }),

  initialize: async () => {
    if (typeof window === 'undefined') return;
    try {
      const storedUser = localStorage.getItem('xydv_customer_user');
      const storedToken = localStorage.getItem('xydv_auth_token');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (storedToken) {
          setAccessToken(storedToken);
        }
        set({ user, token: storedToken || null, isAuthenticated: true });
      }
    } catch {}
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<{
        token: string;
        data?: CustomerUser;
        user?: CustomerUser;
        error?: string;
        message?: string;
      }>('/auth/login', { email: email.trim().toLowerCase(), password });

      const user = res.data ?? res.user;
      const token = res.token;

      if (!user || !token) {
        throw new Error(res.error || res.message || 'Authentication failed');
      }

      setAccessToken(token);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('xydv_auth_token', token);
          localStorage.setItem('xydv_customer_user', JSON.stringify(user));
        } catch {}
      }

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        isModalOpen: false,
        error: null,
      });

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<{
        token: string;
        data?: CustomerUser;
        user?: CustomerUser;
        error?: string;
        message?: string;
      }>('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      const user = res.data ?? res.user;
      const token = res.token;

      if (!user || !token) {
        throw new Error(res.error || res.message || 'Registration failed');
      }

      setAccessToken(token);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('xydv_auth_token', token);
          localStorage.setItem('xydv_customer_user', JSON.stringify(user));
        } catch {}
      }

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        isModalOpen: false,
        error: null,
      });

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register account';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  logout: () => {
    setAccessToken(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('xydv_auth_token');
        localStorage.removeItem('xydv_customer_user');
      } catch {}
    }
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
    api.post('/auth/logout', {}).catch(() => {});
  },
}));
