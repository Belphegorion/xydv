'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Badge } from '@/components/ui/Badge';
import { EMIL_EASE } from '@/lib/motion';

const MARQUEE_TEXT =
  'XYDV TACTICAL LUXURY • ZERO COMPROMISE • SWEATSHIELD+ • AEROFLEX 4-WAY • 500D RIPSTOP • CLIMATESYNC • SS26 ARCHIVE';

export function BrandStatement() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      aria-label="Brand Philosophy"
      className="relative overflow-hidden border-y border-[var(--border)] bg-[var(--bg-surface)] pt-16 pb-0 sm:pt-24 md:pt-32"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 text-center sm:px-6 sm:pb-20 md:pb-24">
        {/* Metric Tag */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.3, ease: EMIL_EASE }}
          className="mb-6 sm:mb-8"
        >
          <Badge variant="subtle" size="md" dot>
            MANIFESTO / ZERO COMPROMISE
          </Badge>
        </motion.div>

        {/* Monolithic Kinetic Statement */}
        <motion.h2
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.3, delay: shouldReduceMotion ? 0 : 0.08, ease: EMIL_EASE }}
          className="font-heading max-w-5xl text-2xl leading-[0.95] font-bold tracking-tighter text-balance text-[var(--text-primary)] uppercase sm:text-4xl md:text-6xl lg:text-7xl"
        >
          WE DO NOT DESIGN FOR CONVENIENCE.{' '}
          <span className="text-[var(--text-primary)] underline decoration-[var(--text-primary)] decoration-4 underline-offset-8 dark:text-[var(--accent)] dark:decoration-[var(--accent)]/60">
            WE ENGINEER FOR EXTREMES.
          </span>
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.28, delay: shouldReduceMotion ? 0 : 0.16, ease: EMIL_EASE }}
          className="mt-6 max-w-2xl font-sans text-xs leading-relaxed text-[var(--text-secondary)] sm:mt-8 sm:text-sm md:text-base"
        >
          Every seam, hem, and zipper pull is calibrated to survive the heaviest load, the longest
          mile, and the harshest climate. When equipment fails, focus shatters. We ensure your gear
          never gives in before you do.
        </motion.p>

        {/* Technical Coordinate Strip */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.3, delay: shouldReduceMotion ? 0 : 0.24 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-2.5 border-t border-[var(--border)] pt-6 font-mono text-[10px] tracking-widest text-[var(--text-muted)] uppercase sm:mt-12 sm:gap-8 sm:pt-8 sm:text-xs"
        >
          <span>LAT 34.0522° N / LON 118.2437° W</span>
          <span className="hidden sm:inline" aria-hidden="true">
            •
          </span>
          <span>500+ ABRASION CYCLES</span>
          <span className="hidden sm:inline" aria-hidden="true">
            •
          </span>
          <span>AEROFLEX REBOUND RATING: 94%</span>
        </motion.div>
      </div>

      {/* High-performance continuous infinite velocity marquee ribbon running at 60fps with CSS hardware transforms translate3d */}
      <div
        className="relative w-full overflow-hidden border-t border-[var(--border)] bg-[var(--bg-elevated)] py-3 select-none sm:py-3.5"
        aria-label="Tactical Velocity Marquee"
      >
        <div className="animate-marquee flex items-center whitespace-nowrap">
          <div className="flex shrink-0 items-center pr-8 font-mono text-xs font-bold tracking-[0.25em] text-[var(--text-secondary)] uppercase">
            <span className="mr-8">{MARQUEE_TEXT}</span>
            <span className="mr-8 text-[var(--text-primary)] dark:text-[var(--accent)]">•</span>
            <span className="mr-8">{MARQUEE_TEXT}</span>
            <span className="mr-8 text-[var(--text-primary)] dark:text-[var(--accent)]">•</span>
          </div>
          <div
            className="flex shrink-0 items-center pr-8 font-mono text-xs font-bold tracking-[0.25em] text-[var(--text-secondary)] uppercase"
            aria-hidden="true"
          >
            <span className="mr-8">{MARQUEE_TEXT}</span>
            <span className="mr-8 text-[var(--text-primary)] dark:text-[var(--accent)]">•</span>
            <span className="mr-8">{MARQUEE_TEXT}</span>
            <span className="mr-8 text-[var(--text-primary)] dark:text-[var(--accent)]">•</span>
          </div>
        </div>
      </div>
    </section>
  );
}
