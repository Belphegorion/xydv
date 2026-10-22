'use client';

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'volt' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'volt',
      size = 'md',
      isLoading = false,
      disabled = false,
      icon,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-mono font-bold uppercase tracking-widest cursor-pointer select-none relative transition-[transform,background-color,border-color,color,opacity] duration-120 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000000] dark:focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:pointer-events-none disabled:opacity-40';

    const sizeStyles = {
      sm: 'text-[11px] px-4 py-2 min-h-[36px] gap-2',
      md: 'text-xs px-6 py-3.5 min-h-[48px] gap-2.5',
      lg: 'text-sm px-8 py-4 min-h-[54px] gap-3',
    }[size];

    const variantStyles = {
      volt: 'bg-[var(--accent)] text-[var(--accent-foreground,#ffffff)] dark:text-[#0a0a0a] border border-[var(--accent)] hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)] transition-colors shadow-sm',
      outline:
        'bg-transparent text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--text-primary)] hover:text-[var(--bg)]',
      ghost:
        'bg-transparent text-[var(--text-secondary)] border border-transparent hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
      danger:
        'bg-transparent text-[#b91c1c] border border-[#b91c1c]/40 hover:bg-[#b91c1c]/10 hover:border-[#b91c1c] dark:text-[#ff3b3b] dark:border-[#ff3b3b]/40 dark:hover:bg-[#ff3b3b]/10 dark:hover:border-[#ff3b3b]',
    }[variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={twMerge(clsx(baseStyles, sizeStyles, variantStyles, className))}
        {...props}
      >
        {isLoading ? (
          <span
            className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : (
          icon && <span className="flex flex-shrink-0 items-center">{icon}</span>
        )}
        <span>{children}</span>
      </button>
    );
  },
);

Button.displayName = 'Button';
