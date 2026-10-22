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
    <section aria-labelledby="social-proof-heading" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 md:mb-16 border-b border-[var(--border)] pb-6">
        <div>
          <span className="text-[var(--text-secondary)] dark:text-[var(--accent)] text-xs font-mono font-semibold uppercase tracking-[0.25em]">
            FIELD TESTED / ATHLETE REPORTS
          </span>
          <h2
            id="social-proof-heading"
            className="text-[var(--text-primary)] text-3xl md:text-5xl font-bold uppercase tracking-tighter font-heading mt-2"
          >
            VERIFIED IN THE ARENA
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 md:mt-0">
          <div
            role="img"
            className="flex items-center gap-1 text-zinc-900 bg-zinc-100 px-2 py-0.5 border border-zinc-200 dark:bg-white/10 dark:border-white/20 dark:text-white"
            aria-label="Rating 5 out of 5 stars"
          >
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} weight="fill" />
            ))}
          </div>
          <span className="text-[var(--text-primary)] text-xs font-mono font-bold">4.92 / 5.0</span>
          <span className="text-[var(--text-muted)] text-[11px] font-mono">(1,840+ VERIFIED ATHLETES)</span>
        </div>
      </div>

      {/* Testimonial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
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
            className="bg-[var(--bg-surface)] border border-[var(--border)] p-5 sm:p-8 flex flex-col justify-between hover:border-[var(--text-primary)]/40 transition-[border-color,box-shadow] duration-200 shadow-sm"
          >
            <div>
              {/* Stars & Verified Badge */}
              <div className="flex items-center justify-between mb-6">
                <div
                  className="flex text-zinc-900 dark:text-white gap-0.5"
                  aria-hidden="true"
                >
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={14} weight="fill" />
                  ))}
                </div>
                <Badge variant="success" size="sm" dot>
                  VERIFIED ATHLETE
                </Badge>
              </div>

              {/* Quote */}
              <blockquote className="text-[var(--text-primary)] text-xs sm:text-sm md:text-base leading-relaxed font-sans mb-8">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
            </div>

            {/* Author Meta */}
            <div className="pt-4 border-t border-[var(--border)]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-[var(--text-primary)] text-xs font-bold uppercase tracking-wider font-heading">
                    {t.author}
                  </p>
                  <p className="text-[var(--text-secondary)] dark:text-[var(--accent)] text-[10px] font-mono tracking-widest uppercase mt-0.5">
                    {t.role}
                  </p>
                </div>
                <Badge variant="outline" size="sm">
                  {t.verifiedPiece}
                </Badge>
              </div>
              <p className="text-[var(--text-muted)] text-[10px] font-mono uppercase mt-2">
                DISCIPLINE: {t.discipline}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
