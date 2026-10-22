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
      className="flex min-h-[80vh] items-center justify-center bg-[var(--bg)] px-4 py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-xl space-y-8 text-center">
        {/* Status Emblem & Badge */}
        <div className="inline-flex items-center gap-2 border border-red-500/30 bg-red-500/10 px-3 py-1.5">
          <Warning size={14} className="text-red-500" weight="bold" />
          <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-red-400 uppercase sm:text-xs">
            500 // RUNTIME_INTERRUPTION
          </span>
        </div>

        {/* Display Code */}
        <div className="space-y-2">
          <h1 className="font-heading text-6xl font-black tracking-tighter text-[var(--text-primary)] sm:text-8xl md:text-9xl">
            500
          </h1>
          <h2 className="font-mono text-sm font-bold tracking-[0.25em] text-[var(--text-primary)] uppercase sm:text-base">
            SYSTEM EXCEPTION DETECTED
          </h2>
          <p className="mx-auto max-w-md font-sans text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
            An unexpected execution interruption occurred during stream rendering. All transactional
            state remains isolated.
          </p>
          {error.digest && (
            <div className="pt-2">
              <span className="inline-block border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1 font-mono text-[10px] text-[var(--text-muted)]">
                DIGEST: {error.digest}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 bg-[#e8ff00] px-6 py-3 font-mono text-xs font-bold tracking-widest text-[#0a0a0a] uppercase transition-colors hover:bg-[#e8ff00]/90 focus-visible:ring-2 focus-visible:ring-[#e8ff00] focus-visible:outline-none active:scale-[0.97] sm:w-auto"
          >
            <ArrowCounterClockwise size={14} weight="bold" />
            <span>Re-execute Pipeline</span>
          </button>
          <Link
            href="/"
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 border border-[var(--border)] bg-transparent px-6 py-3 font-mono text-xs font-bold tracking-widest text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[#e8ff00] focus-visible:outline-none active:scale-[0.97] sm:w-auto"
          >
            <ArrowLeft size={14} weight="bold" />
            <span>Return to Base</span>
          </Link>
        </div>

        {/* Technical Diagnostics Footer */}
        <div className="border-t border-[var(--border-subtle)] pt-8">
          <p className="font-mono text-[9px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
            XYDV TECHNICAL DIVISION // ISOLATED FAULT TOLERANCE ARCHITECTURE
          </p>
        </div>
      </div>
    </main>
  );
}
