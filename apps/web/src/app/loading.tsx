'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { EMIL_EASE } from '@/lib/motion';
import { LoadingSymbol } from '@/components/ui/LoadingSymbol';

/**
 * Next.js App Router Page Loading Screen (loading.tsx)
 * Displays while route segments or Suspense boundaries resolve.
 * Uses the official XYDV brand symbol (outline and solid static images for light and dark modes)
 * with a continuous rhythmic pulse and sleek indeterminate progress indicator.
 */
export default function Loading() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
      className="flex min-h-[70vh] w-full flex-col items-center justify-center bg-[var(--bg)] px-4 py-16 text-[var(--text-primary)] select-none"
    >
      <div className="flex max-w-xs flex-col items-center text-center">
        {/* Rhythmic Breathing Brand Symbol */}
        <LoadingSymbol size={88} variant="pulse" priority className="mb-8" />

        {/* Sleek Indeterminate Progress Track */}
        <div
          role="progressbar"
          aria-label="Loading page content"
          className="relative mb-4 h-[2px] w-44 overflow-hidden rounded-none bg-[var(--border)] sm:w-52"
        >
          <motion.div
            className="absolute inset-y-0 left-0 w-1/3 bg-[var(--text-primary)] dark:bg-[var(--accent)]"
            initial={shouldReduceMotion ? { opacity: 0.6 } : { x: '-100%' }}
            animate={shouldReduceMotion ? { opacity: [0.6, 1, 0.6] } : { x: ['-100%', '300%'] }}
            transition={
              shouldReduceMotion
                ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 1.3, repeat: Infinity, ease: EMIL_EASE }
            }
          />
        </div>

        {/* Technical Typography & Status Indicator */}
        <div className="font-mono text-[10px] tracking-[0.25em] text-[var(--text-muted)] uppercase">
          XYDV // SYNCHRONIZING
        </div>
        <p className="mt-2 font-mono text-[9px] tracking-[0.2em] text-[var(--text-muted)] uppercase opacity-75">
          RETRIEVING PERFORMANCE SPECIFICATIONS
        </p>
      </div>
    </div>
  );
}
