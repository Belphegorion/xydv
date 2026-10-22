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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="w-full max-w-md rounded-none border border-[#1f1f1f] bg-[#111111] p-6 shadow-2xl text-[#f5f5f5]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border ${
                isDestructive
                  ? 'border-[#ff3b3b]/30 bg-[#ff3b3b]/10 text-[#ff3b3b]'
                  : 'border-[#e8ff00]/30 bg-[#e8ff00]/10 text-[#e8ff00]'
              }`}
            >
              <Warning size={22} weight="bold" />
            </div>
            <h2 id="confirm-dialog-title" className="font-mono text-sm font-bold uppercase tracking-wider">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 text-[#71717a] hover:text-[#f5f5f5] transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-[#a0a0a0] leading-relaxed mb-6 font-sans">
          {description}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1f1f1f]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#a0a0a0] hover:text-[#f5f5f5] border border-[#1f1f1f] hover:border-[#333333] transition-colors active:scale-[0.97]"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors active:scale-[0.97] ${
              isDestructive
                ? 'border border-[#ff3b3b] bg-[#ff3b3b] text-[#ffffff] hover:bg-[#ff3b3b]/90'
                : 'border border-[#e8ff00] bg-[#e8ff00] text-[#0a0a0a] hover:bg-[#e8ff00]/90'
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
