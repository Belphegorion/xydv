'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Warning, ArrowCounterClockwise, ArrowLeft } from '@phosphor-icons/react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Unhandled Application Exception caught by Error Boundary:', error);
  }, [error]);

  return (
    <main
      role="main"
      className="min-h-[80vh] flex items-center justify-center bg-[var(--bg)] px-4 py-24 sm:py-32"
    >
      <div className="max-w-xl w-full mx-auto text-center space-y-8">
        {/* Status Emblem & Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-red-500/30 bg-red-500/10">
          <Warning size={14} className="text-red-500" weight="bold" />
          <span className="font-mono text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-red-400">
            500 // RUNTIME_INTERRUPTION
          </span>
        </div>

        {/* Display Code */}
        <div className="space-y-2">
          <h1 className="font-heading font-black text-6xl sm:text-8xl md:text-9xl tracking-tighter text-[var(--text-primary)]">
            500
          </h1>
          <h2 className="font-mono text-sm sm:text-base uppercase tracking-[0.25em] text-[var(--text-primary)] font-bold">
            SYSTEM EXCEPTION DETECTED
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            An unexpected execution interruption occurred during stream rendering. All transactional state remains isolated.
          </p>
          {error.digest && (
            <div className="pt-2">
              <span className="inline-block px-2.5 py-1 font-mono text-[10px] text-[var(--text-muted)] border border-[var(--border)] bg-[var(--bg-surface)]">
                DIGEST: {error.digest}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest bg-[#e8ff00] text-[#0a0a0a] hover:bg-[#e8ff00]/90 transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8ff00]"
          >
            <ArrowCounterClockwise size={14} weight="bold" />
            <span>Re-execute Pipeline</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest border border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8ff00]"
          >
            <ArrowLeft size={14} weight="bold" />
            <span>Return to Base</span>
          </Link>
        </div>

        {/* Technical Diagnostics Footer */}
        <div className="pt-8 border-t border-[var(--border-subtle)]">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)]">
            XYDV TECHNICAL DIVISION // ISOLATED FAULT TOLERANCE ARCHITECTURE
          </p>
        </div>
      </div>
    </main>
  );
}
