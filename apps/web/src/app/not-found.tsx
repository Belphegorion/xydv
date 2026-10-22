'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, WarningCircle } from '@phosphor-icons/react';

export default function NotFound() {
  return (
    <main
      role="main"
      className="flex min-h-[80vh] items-center justify-center bg-[var(--bg)] px-4 py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-xl space-y-8 text-center">
        {/* Status Emblem & Badge */}
        <div className="inline-flex items-center gap-2 border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5">
          <WarningCircle size={14} className="text-[#e8ff00]" weight="bold" />
          <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase sm:text-xs">
            HTTP 404 // ROUTE_UNRESOLVED
          </span>
        </div>

        {/* Display Code */}
        <div className="space-y-2">
          <h1 className="font-heading text-6xl font-black tracking-tighter text-[var(--text-primary)] sm:text-8xl md:text-9xl">
            404
          </h1>
          <h2 className="font-mono text-sm font-bold tracking-[0.25em] text-[var(--text-primary)] uppercase sm:text-base">
            SPECIFICATION NOT FOUND
          </h2>
          <p className="mx-auto max-w-md font-sans text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
            The requested technical coordinate does not exist or has been decommissioned from active
            deployment.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 bg-[var(--text-primary)] px-6 py-3 font-mono text-xs font-bold tracking-widest text-[var(--bg)] uppercase transition-colors hover:bg-[var(--text-primary)]/90 focus-visible:ring-2 focus-visible:ring-[#e8ff00] focus-visible:outline-none active:scale-[0.97] sm:w-auto"
          >
            <ArrowLeft size={14} weight="bold" />
            <span>Return to Base</span>
          </Link>
          <Link
            href="/products"
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 border border-[var(--border)] bg-transparent px-6 py-3 font-mono text-xs font-bold tracking-widest text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[#e8ff00] focus-visible:outline-none active:scale-[0.97] sm:w-auto"
          >
            <span>Explore Catalog</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>

        {/* Technical Footer */}
        <div className="border-t border-[var(--border-subtle)] pt-8">
          <p className="font-mono text-[9px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
            XYDV TECHNICAL DIVISION // OPERATIONAL INTEGRITY RECOVERY
          </p>
        </div>
      </div>
    </main>
  );
}
