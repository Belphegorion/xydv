'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'volt' | 'subtle' | 'outline' | 'success' | 'danger';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  variant = 'subtle',
  size = 'md',
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center font-mono uppercase tracking-[0.2em] font-semibold select-none border transition-colors';

  const sizeStyles = {
    sm: 'text-[9px] px-2 py-0.5 gap-1.5',
    md: 'text-[11px] px-2.5 py-1 gap-2',
  }[size];

  const variantStyles = {
    volt: 'bg-zinc-950 border-zinc-800 text-zinc-100 dark:bg-white/10 dark:border-white/30 dark:text-zinc-100',
    subtle: 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)]',
    outline: 'bg-transparent border-[var(--text-primary)]/25 text-[var(--text-primary)] dark:border-white/20 dark:text-white',
    success: 'bg-[#15803d]/10 border-[#15803d]/30 text-[#15803d] dark:bg-[#22c55e]/10 dark:border-[#22c55e]/30 dark:text-[#22c55e]',
    danger: 'bg-[#b91c1c]/10 border-[#b91c1c]/30 text-[#b91c1c] dark:bg-[#ff3b3b]/10 dark:border-[#ff3b3b]/30 dark:text-[#ff3b3b]',
  }[variant];

  const dotColor = {
    volt: 'bg-zinc-100 dark:bg-white',
    subtle: 'bg-[var(--text-secondary)]',
    outline: 'bg-[var(--text-primary)] dark:bg-white',
    success: 'bg-[#15803d] dark:bg-[#22c55e]',
    danger: 'bg-[#b91c1c] dark:bg-[#ff3b3b]',
  }[variant];

  return (
    <span className={twMerge(clsx(baseStyles, sizeStyles, variantStyles, className))} {...props}>
      {dot && (
        <span
          className={twMerge('w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse', dotColor)}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}
