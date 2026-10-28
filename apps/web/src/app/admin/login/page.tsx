'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, EnvelopeSimple, Warning, ArrowLeft } from '@phosphor-icons/react';
import { BrandLogo } from '../../../components/ui/BrandLogo';
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
          className="inline-flex min-h-[44px] items-center gap-2 py-2 px-1 font-mono text-xs tracking-wider text-[var(--text-muted)] uppercase transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
        >
          <ArrowLeft size={14} />
          <span>Return to Storefront</span>
        </Link>
      </div>

      <div className="rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-[var(--text-primary)] shadow-2xl">
        <div className="mb-8">
          <div className="mb-2.5 flex items-center gap-2.5">
            <BrandLogo size={32} showWordmark={false} />
            <span className="font-mono text-xl font-bold tracking-widest text-[var(--text-primary)] dark:text-[#e8ff00]">
              XYDV
            </span>
            <span className="h-4 w-[1px] bg-[var(--border)]" />
            <h1 className="font-mono text-xs tracking-widest text-[var(--text-muted)] uppercase">
              ADMIN ACCESS
            </h1>
          </div>
          <p className="font-sans text-xs leading-relaxed text-[var(--text-secondary)]">
            Enter authorized administrator credentials to manage catalog, orders, and telemetry.
          </p>
        </div>

        {displayedError && (
          <div className="mb-6 flex items-start gap-3 rounded-none border border-[#b91c1c]/30 bg-[#b91c1c]/10 p-3 text-xs text-[#b91c1c] dark:border-[#ff3b3b]/30 dark:bg-[#ff3b3b]/10 dark:text-[#ff3b3b]">
            <Warning size={18} className="mt-0.5 flex-shrink-0" />
            <p className="font-mono">{displayedError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block font-mono text-xs tracking-wider text-[var(--text-muted)] uppercase"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-muted)]">
                <EnvelopeSimple size={16} />
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@xydv.com"
                className="h-11 w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] py-3 pr-4 pl-10 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00] dark:focus:ring-[#e8ff00]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-mono text-xs tracking-wider text-[var(--text-muted)] uppercase"
            >
              Master Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-muted)]">
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
                className="h-11 w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] py-3 pr-4 pl-10 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00] dark:focus:ring-[#e8ff00]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-tactile flex w-full items-center justify-center gap-2 rounded-none border border-[var(--text-primary)] bg-[var(--text-primary)] py-3.5 font-mono text-xs font-bold tracking-widest text-[var(--bg)] uppercase transition-colors duration-120 hover:opacity-90 active:scale-[0.97] disabled:opacity-50 dark:border-[#e8ff00] dark:bg-[#e8ff00] dark:text-[#0a0a0a]"
          >
            {isLoading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            <span>{isLoading ? 'Authenticating...' : 'Sign In to Console'}</span>
          </button>
        </form>

        <div className="mt-8 border-t border-[var(--border)] pt-6 text-center">
          <p className="font-mono text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
            Protected endpoint • Roles strictly verified via HMAC & JWT tokens
          </p>
        </div>
      </div>
    </div>
  );
}
