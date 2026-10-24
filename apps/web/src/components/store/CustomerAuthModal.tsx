'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, LockKey, Envelope, User, ArrowRight, SpinnerGap } from '@phosphor-icons/react';
import { useCustomerAuthStore } from '@/store/customerAuth';
import { EMIL_EASE, SPRING_TACTILE } from '@/lib/motion';

export function CustomerAuthModal() {
  const {
    isModalOpen,
    authMode,
    closeModal,
    setAuthMode,
    login,
    register,
    logout,
    isAuthenticated,
    user: customerUser,
    isLoading,
    error,
    clearError,
  } = useCustomerAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const shouldReduceMotion = useReducedMotion();
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      clearError();
      setEmail('');
      setPassword('');
      setName('');
      document.body.style.overflow = 'hidden';
      setTimeout(() => firstInputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen, authMode, clearError]);

  // Trap Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      await login(email, password);
    } else {
      await register(name, email, password);
    }
  };

  return (
    <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EMIL_EASE }}
            onClick={closeModal}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Customer Authentication"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
            transition={SPRING_TACTILE}
            className="relative z-10 w-full max-w-md border border-[var(--border)] bg-[var(--bg)] p-6 shadow-2xl sm:p-8"
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              aria-label="Close authentication modal"
              className="touch-target absolute top-4 right-4 flex min-h-[44px] min-w-[44px] items-center justify-center text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
            >
              <X size={20} weight="bold" />
            </button>

            {isAuthenticated && customerUser ? (
              <div>
                <div className="mb-6">
                  <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                    ACTIVE ATHLETE SESSION
                  </span>
                  <h2 className="font-heading mt-1 text-xl font-black text-[var(--text-primary)] uppercase sm:text-2xl">
                    {customerUser.name || 'ATHLETE PROFILE'}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                    {customerUser.email}
                  </p>
                </div>

                <div className="mb-6 space-y-4">
                  <div className="space-y-2 border border-[var(--border)] bg-[var(--bg-elevated)] p-4 font-mono text-xs">
                    <div className="flex items-center justify-between text-[10px] uppercase">
                      <span className="text-[var(--text-muted)]">TELEMETRY STATUS</span>
                      <span className="flex items-center gap-1.5 font-bold text-emerald-500">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        SYNCHRONIZED
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[var(--border)]/50 pt-1 text-[var(--text-primary)]">
                      <span className="text-[var(--text-secondary)]">DESIGNATION</span>
                      <span className="font-bold text-[var(--accent)] uppercase">
                        {customerUser.role || 'ATHLETE'}
                      </span>
                    </div>
                    {customerUser.phone && (
                      <div className="flex items-center justify-between border-t border-[var(--border)]/50 pt-1 text-[var(--text-primary)]">
                        <span className="text-[var(--text-secondary)]">COMMUNICATION</span>
                        <span>{customerUser.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      closeModal();
                    }}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 font-mono text-xs font-bold tracking-wider text-red-500 uppercase transition-colors hover:border-red-500/50 hover:text-red-400 focus-visible:ring-1 focus-visible:ring-red-500 focus-visible:outline-none active:scale-[0.98]"
                  >
                    TERMINATE SESSION / SIGN OUT
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex min-h-[44px] w-full items-center justify-center py-2.5 font-mono text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
                  >
                    RETURN TO STOREFRONT
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header Badge */}
                <div className="mb-6">
                  <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                    AUTHENTICATION PORTAL
                  </span>
                  <h2 className="font-heading mt-1 text-xl font-black text-[var(--text-primary)] uppercase sm:text-2xl">
                    {authMode === 'login' ? 'ATHLETE ACCESS' : 'ENLIST NEW MEMBER'}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                    {authMode === 'login'
                      ? 'Sign in to access order archives and synchronized checkouts.'
                      : 'Register for tactical apparel telemetry and member drops.'}
                  </p>
                </div>

                {/* Mode Switch Tabs */}
                <div className="mb-6 grid grid-cols-2 gap-1 border border-[var(--border)] bg-[var(--bg-elevated)] p-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`min-h-[44px] py-2 font-mono text-xs font-bold tracking-wider uppercase transition-colors ${
                      authMode === 'login'
                        ? 'border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    SIGN IN
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className={`min-h-[44px] py-2 font-mono text-xs font-bold tracking-wider uppercase transition-colors ${
                      authMode === 'register'
                        ? 'border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    CREATE ACCOUNT
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div
                    role="alert"
                    className="mb-5 border border-red-500/30 bg-red-500/10 p-3 font-mono text-xs leading-relaxed text-red-500 dark:text-red-400"
                  >
                    {error}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {authMode === 'register' && (
                    <div>
                      <label
                        htmlFor="auth-name"
                        className="mb-1.5 block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase"
                      >
                        FULL ATHLETE NAME
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-muted)]">
                          <User size={16} weight="bold" />
                        </div>
                        <input
                          ref={firstInputRef}
                          id="auth-name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Kai Nakamura"
                          className="min-h-[44px] w-full border border-[var(--border)] bg-[var(--bg-elevated)] py-2.5 pr-3 pl-9 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="auth-email"
                      className="mb-1.5 block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase"
                    >
                      EMAIL ADDRESS
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-muted)]">
                        <Envelope size={16} weight="bold" />
                      </div>
                      <input
                        ref={authMode === 'login' ? firstInputRef : undefined}
                        id="auth-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="athlete@domain.com"
                        className="min-h-[44px] w-full border border-[var(--border)] bg-[var(--bg-elevated)] py-2.5 pr-3 pl-9 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-password"
                      className="mb-1.5 block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase"
                    >
                      PASSWORD{' '}
                      {authMode === 'register' && (
                        <span className="text-[10px] text-[var(--text-muted)]">(MIN 8 CHARS)</span>
                      )}
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-muted)]">
                        <LockKey size={16} weight="bold" />
                      </div>
                      <input
                        id="auth-password"
                        type="password"
                        required
                        minLength={authMode === 'register' ? 8 : 1}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="min-h-[44px] w-full border border-[var(--border)] bg-[var(--bg-elevated)] py-2.5 pr-3 pl-9 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 bg-[var(--accent)] px-4 py-3 font-mono text-xs font-bold tracking-wider text-[var(--accent-foreground)] uppercase transition-transform active:scale-[0.98] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <SpinnerGap size={16} className="animate-spin" />
                        <span>AUTHENTICATING...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {authMode === 'login' ? 'INITIALIZE SESSION' : 'SUBMIT ENLISTMENT'}
                        </span>
                        <ArrowRight size={14} weight="bold" />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer switcher note */}
                <div className="mt-6 border-t border-[var(--border)] pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    className="flex min-h-[44px] w-full items-center justify-center font-mono text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                  >
                    {authMode === 'login'
                      ? "Don't have an account? Enlist as a new member"
                      : 'Already registered? Return to sign in'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export default CustomerAuthModal;
