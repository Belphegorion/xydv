'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, EnvelopeSimple, Warning, ArrowLeft } from '@phosphor-icons/react';
import { useAdminAuthStore } from '../../../store/adminAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAdminAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setLocalError(null);
    clearError();

    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password.');
      return;
    }

    const res = await login(email.trim(), password);
    if (res.success) {
      router.push('/admin');
    }
  };

  const displayedError = localError || error;

  return (
    <div className="w-full max-w-md">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#71717a] hover:text-[#f5f5f5] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Return to Storefront</span>
        </Link>
      </div>

      <div className="rounded-none border border-[#1f1f1f] bg-[#111111] p-8 shadow-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xl font-bold tracking-widest text-[#e8ff00]">
              XYDV
            </span>
            <span className="h-4 w-[1px] bg-[#333333]" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#a0a0a0]">
              ADMIN ACCESS
            </span>
          </div>
          <p className="text-xs text-[#71717a] font-sans">
            Enter authorized administrator credentials to manage catalog, orders, and telemetry.
          </p>
        </div>

        {displayedError && (
          <div className="mb-6 flex items-start gap-3 rounded border border-[#ff3b3b]/30 bg-[#ff3b3b]/10 p-3 text-xs text-[#ff3b3b]">
            <Warning size={18} className="flex-shrink-0 mt-0.5" />
            <p className="font-mono">{displayedError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block font-mono text-xs uppercase tracking-wider text-[#a0a0a0] mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#71717a]">
                <EnvelopeSimple size={16} />
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vertex.com"
                className="w-full rounded-none border border-[#1f1f1f] bg-[#0a0a0a] py-3 pl-10 pr-4 font-mono text-xs text-[#f5f5f5] placeholder-[#52525b] focus:border-[#e8ff00] focus:outline-none focus:ring-1 focus:ring-[#e8ff00] transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-mono text-xs uppercase tracking-wider text-[#a0a0a0] mb-2"
            >
              Master Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#71717a]">
                <Lock size={16} />
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-none border border-[#1f1f1f] bg-[#0a0a0a] py-3 pl-10 pr-4 font-mono text-xs text-[#f5f5f5] placeholder-[#52525b] focus:border-[#e8ff00] focus:outline-none focus:ring-1 focus:ring-[#e8ff00] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-none border border-[#e8ff00] bg-[#e8ff00] py-3.5 font-mono text-xs font-bold uppercase tracking-widest text-[#0a0a0a] transition-colors duration-120 hover:bg-[#e8ff00]/90 active:scale-[0.97] disabled:opacity-50"
          >
            {isLoading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            <span>{isLoading ? 'Authenticating...' : 'Sign In to Console'}</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#1f1f1f] text-center">
          <p className="font-mono text-[10px] text-[#52525b] uppercase tracking-wider">
            Protected endpoint • Roles strictly verified via HMAC & JWT tokens
          </p>
        </div>
      </div>
    </div>
  );
}
