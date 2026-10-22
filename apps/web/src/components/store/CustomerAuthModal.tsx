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
            className="relative w-full max-w-md bg-[var(--bg)] border border-[var(--border)] p-6 sm:p-8 shadow-2xl z-10"
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              aria-label="Close authentication modal"
              className="absolute top-4 right-4 touch-target min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
            >
              <X size={20} weight="bold" />
            </button>

            {/* Header Badge */}
            <div className="mb-6">
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                AUTHENTICATION PORTAL
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase font-heading text-[var(--text-primary)] mt-1">
                {authMode === 'login' ? 'ATHLETE ACCESS' : 'ENLIST NEW MEMBER'}
              </h2>
              <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
                {authMode === 'login'
                  ? 'Sign in to access order archives and synchronized checkouts.'
                  : 'Register for tactical apparel telemetry and member drops.'}
              </p>
            </div>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[var(--bg-elevated)] border border-[var(--border)] mb-6">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors min-h-[44px] ${
                  authMode === 'login'
                    ? 'bg-[var(--bg)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                SIGN IN
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors min-h-[44px] ${
                  authMode === 'register'
                    ? 'bg-[var(--bg)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]'
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
                className="mb-5 p-3 bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-xs font-mono leading-relaxed"
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
                    className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                  >
                    FULL ATHLETE NAME
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
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
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] min-h-[44px]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
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
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  PASSWORD {authMode === 'register' && <span className="text-[10px] text-[var(--text-muted)]">(MIN 8 CHARS)</span>}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
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
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] min-h-[44px]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-[var(--accent)] text-black dark:text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50 min-h-[48px]"
              >
                {isLoading ? (
                  <>
                    <SpinnerGap size={16} className="animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span>{authMode === 'login' ? 'INITIALIZE SESSION' : 'SUBMIT ENLISTMENT'}</span>
                    <ArrowRight size={14} weight="bold" />
                  </>
                )}
              </button>
            </form>

            {/* Footer switcher note */}
            <div className="mt-6 pt-4 border-t border-[var(--border)] text-center">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[44px] flex items-center justify-center w-full"
              >
                {authMode === 'login'
                  ? "Don't have an account? Enlist as a new member"
                  : 'Already registered? Return to sign in'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export default CustomerAuthModal;
