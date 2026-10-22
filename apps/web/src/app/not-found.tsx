'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, WarningCircle } from '@phosphor-icons/react';

export default function NotFound() {
  return (
    <main
      role="main"
      className="min-h-[80vh] flex items-center justify-center bg-[var(--bg)] px-4 py-24 sm:py-32"
    >
      <div className="max-w-xl w-full mx-auto text-center space-y-8">
        {/* Status Emblem & Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] bg-[var(--bg-surface)]">
          <WarningCircle size={14} className="text-[#e8ff00]" weight="bold" />
          <span className="font-mono text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--text-muted)]">
            HTTP 404 // ROUTE_UNRESOLVED
          </span>
        </div>

        {/* Display Code */}
        <div className="space-y-2">
          <h1 className="font-heading font-black text-6xl sm:text-8xl md:text-9xl tracking-tighter text-[var(--text-primary)]">
            404
          </h1>
          <h2 className="font-mono text-sm sm:text-base uppercase tracking-[0.25em] text-[var(--text-primary)] font-bold">
            SPECIFICATION NOT FOUND
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            The requested technical coordinate does not exist or has been decommissioned from active deployment.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest bg-[var(--text-primary)] text-[var(--bg)] hover:bg-[var(--text-primary)]/90 transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8ff00]"
          >
            <ArrowLeft size={14} weight="bold" />
            <span>Return to Base</span>
          </Link>
          <Link
            href="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest border border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8ff00]"
          >
            <span>Explore Catalog</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>

        {/* Technical Footer */}
        <div className="pt-8 border-t border-[var(--border-subtle)]">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[var(--text-muted)]">
            XYDV TECHNICAL DIVISION // OPERATIONAL INTEGRITY RECOVERY
          </p>
        </div>
      </div>
    </main>
  );
}
