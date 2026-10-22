'use client';

import React, { useEffect } from 'react';
import { Warning, X } from '@phosphor-icons/react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="w-full max-w-md rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-none border ${
                isDestructive
                  ? 'border-[#b91c1c]/30 bg-[#b91c1c]/10 text-[#b91c1c] dark:border-[#ff3b3b]/30 dark:bg-[#ff3b3b]/10 dark:text-[#ff3b3b]'
                  : 'border-[#15803d]/30 bg-[#15803d]/10 text-[#15803d] dark:border-[#e8ff00]/40 dark:bg-[#e8ff00]/10 dark:text-[#e8ff00]'
              }`}
            >
              <Warning size={22} weight="bold" />
            </div>
            <h2
              id="confirm-dialog-title"
              className="font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase"
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-6 font-sans text-xs leading-relaxed text-[var(--text-secondary)]">
          {description}
        </p>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn-tactile rounded-none border border-[var(--border)] bg-transparent px-4 py-2 font-mono text-xs tracking-wider text-[var(--text-secondary)] uppercase transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] active:scale-[0.97]"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`btn-tactile inline-flex items-center justify-center gap-2 rounded-none px-5 py-2 font-mono text-xs font-bold tracking-wider uppercase transition-colors active:scale-[0.97] ${
              isDestructive
                ? 'border border-[#b91c1c] bg-[#b91c1c] text-white hover:bg-[#b91c1c]/90 dark:border-[#ff3b3b] dark:bg-[#ff3b3b] dark:text-[#0a0a0a] dark:hover:bg-[#ff3b3b]/90'
                : 'border border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg)] hover:opacity-90 dark:border-[#e8ff00] dark:bg-[#e8ff00] dark:text-[#0a0a0a]'
            }`}
          >
            {isLoading && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
