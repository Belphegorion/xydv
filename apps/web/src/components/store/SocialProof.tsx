'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Star } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';

const TESTIMONIALS = [
  {
    author: 'MARCUS V.',
    role: 'COMPETITIVE POWERLIFTER & COACH',
    discipline: 'STRENGTH / HEAVY COMPOUND',
    quote:
      'The Apex Shorts survive brutal 600lb deadlift sessions with zero seam tearing or knee restriction. The phone liner pocket does not budge during box jumps.',
    rating: 5,
    verifiedPiece: 'APEX MODULAR SHORTS',
  },
  {
    author: 'DR. ELENA R.',
    role: 'HYROX PRO ATHLETE',
    discipline: 'ENDURANCE & FUNCTIONAL FITNESS',
    quote:
      'SweatShield+ is real. Through a 90-minute sled push and erg workout, the fabric did not cling to my chest once. Breathability is on an entirely different level.',
    rating: 5,
    verifiedPiece: 'TECHNICAL PERFORMANCE TEE',
  },
  {
    author: 'KAI CHEN',
    role: 'ALPINIST & ULTRA RUNNER',
    discipline: 'MOUNTAIN & TRAIL RECON',
    quote:
      'The Stealth Hoodie with Cordura reinforcements took multiple rock scrapes in the Cascades without a single frayed stitch. It has replaced three other layers in my pack.',
    rating: 5,
    verifiedPiece: 'STEALTH TACTICAL HOODIE',
  },
];

export function SocialProof() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="social-proof-heading"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24"
    >
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between border-b border-[var(--border)] pb-6 sm:mb-12 md:mb-16 md:flex-row md:items-end">
        <div>
          <span className="font-mono text-xs font-semibold tracking-[0.25em] text-[var(--text-secondary)] uppercase dark:text-[var(--accent)]">
            FIELD TESTED / ATHLETE REPORTS
          </span>
          <h2
            id="social-proof-heading"
            className="font-heading mt-2 text-3xl font-bold tracking-tighter text-[var(--text-primary)] uppercase md:text-5xl"
          >
            VERIFIED IN THE ARENA
          </h2>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3 md:mt-0">
          <div
            role="img"
            className="flex items-center gap-1 border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-zinc-900 dark:border-white/20 dark:bg-white/10 dark:text-white"
            aria-label="Rating 5 out of 5 stars"
          >
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} weight="fill" />
            ))}
          </div>
          <span className="font-mono text-xs font-bold text-[var(--text-primary)]">4.92 / 5.0</span>
          <span className="font-mono text-[11px] text-[var(--text-muted)]">
            (1,840+ VERIFIED ATHLETES)
          </span>
        </div>
      </div>

      {/* Testimonial Cards */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t, idx) => (
          <motion.div
            key={t.author}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={
              shouldReduceMotion
                ? { duration: 0.01 }
                : {
                    type: 'spring',
                    stiffness: 280,
                    damping: 26,
                    delay: idx * 0.09,
                  }
            }
            className="flex flex-col justify-between border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-[var(--text-primary)]/40 sm:p-8"
          >
            <div>
              {/* Stars & Verified Badge */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex gap-0.5 text-zinc-900 dark:text-white" aria-hidden="true">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={14} weight="fill" />
                  ))}
                </div>
                <Badge variant="success" size="sm" dot>
                  VERIFIED ATHLETE
                </Badge>
              </div>

              {/* Quote */}
              <blockquote className="mb-8 font-sans text-xs leading-relaxed text-[var(--text-primary)] sm:text-sm md:text-base">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
            </div>

            {/* Author Meta */}
            <div className="border-t border-[var(--border)] pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-heading text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
                    {t.author}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] tracking-widest text-[var(--text-secondary)] uppercase dark:text-[var(--accent)]">
                    {t.role}
                  </p>
                </div>
                <Badge variant="outline" size="sm">
                  {t.verifiedPiece}
                </Badge>
              </div>
              <p className="mt-2 font-mono text-[10px] text-[var(--text-muted)] uppercase">
                DISCIPLINE: {t.discipline}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
