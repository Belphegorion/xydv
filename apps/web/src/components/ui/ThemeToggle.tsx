'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Sun, Moon } from '@phosphor-icons/react';
import { EMIL_EASE } from '@/lib/motion';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    try {
      const storedTheme =
        localStorage.getItem('xydv-theme') || localStorage.getItem('vertex-theme');
      if (storedTheme === 'dark') {
        setTheme('dark');
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        setTheme('light');
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // LocalStorage access restricted
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);

    try {
      localStorage.setItem('xydv-theme', nextTheme);
      localStorage.removeItem('vertex-theme');
    } catch {
      // Ignore storage errors
    }

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  if (!mounted) {
    return (
      <div
        className={`touch-target h-9 w-9 border border-[var(--border)] bg-[var(--bg-surface)] ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`touch-target btn-tactile relative flex h-9 w-9 items-center justify-center border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition-colors hover:border-[var(--text-primary)] hover:bg-[var(--bg-elevated)] dark:hover:border-[var(--accent)] dark:hover:text-[var(--accent)] ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="dark-icon"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -45, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 45, scale: 0.8 }}
            transition={{ duration: 0.18, ease: EMIL_EASE }}
            className="flex items-center justify-center"
          >
            <Moon size={18} weight="bold" />
          </motion.span>
        ) : (
          <motion.span
            key="light-icon"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 45, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -45, scale: 0.8 }}
            transition={{ duration: 0.18, ease: EMIL_EASE }}
            className="flex items-center justify-center"
          >
            <Sun size={18} weight="bold" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
