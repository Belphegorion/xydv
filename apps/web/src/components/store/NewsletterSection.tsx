'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ArrowRight, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EMIL_EASE } from '@/lib/motion';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 400);
  };

  return (
    <section
      aria-label="Priority Drop Registration"
      className="border-t border-[var(--border)] bg-[var(--bg-surface)] py-16 sm:py-24 px-4 sm:px-6 md:px-12 text-center"
    >
      <div className="max-w-2xl mx-auto flex flex-col items-center">
        {/* Eyebrow */}
        <div className="mb-6">
          <Badge variant="subtle" size="md" dot>
            DISPATCH / EARLY DROP ACCESS
          </Badge>
        </div>

        {/* Heading */}
        <h2
          id="newsletter-heading"
          className="text-[var(--text-primary)] text-3xl md:text-5xl font-bold uppercase tracking-tighter font-heading mb-4"
        >
          SECURE PRIORITY ALLOCATION
        </h2>

        {/* Subtitle */}
        <p className="text-[var(--text-secondary)] text-xs md:text-sm font-sans max-w-lg mb-8 sm:mb-10 leading-relaxed">
          Limited batch production. Subscribers receive private checkout links 1 hour prior to public drop release. Zero marketing noise.
        </p>

        {/* Form or Success State */}
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: EMIL_EASE }}
              className="flex items-center gap-3 p-4 bg-[var(--bg)] border border-[var(--border)] text-[#15803d] dark:text-[#22c55e]"
            >
              <CheckCircle size={22} weight="fill" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--text-primary)]">
                COORDINATES LOGGED. WELCOME TO THE XYDV DIVISION.
              </span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-2.5">
              <label htmlFor="newsletter-email" className="sr-only">
                Athlete Email Address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ATHLETE@DOMAIN.COM"
                className="flex-1 min-h-[48px] bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] px-4 py-3.5 text-base sm:text-xs font-mono tracking-wider outline-none focus-visible:border-[var(--text-primary)] dark:focus-visible:border-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--text-primary)] dark:focus-visible:ring-[var(--accent)] transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--text-muted)]"
              />
              <Button
                type="submit"
                variant="volt"
                size="md"
                isLoading={isLoading}
                className="w-full sm:w-auto min-h-[48px]"
                icon={<ArrowRight size={14} weight="bold" />}
              >
                REGISTER
              </Button>
            </form>
          )}
        </AnimatePresence>

        {/* Policy Micro-Text */}
        <p className="text-[var(--text-muted)] text-[10px] font-mono uppercase tracking-widest mt-6">
          256-BIT ENCRYPTED / ONE-CLICK UNSUBSCRIBE ANYTIME
        </p>
      </div>
    </section>
  );
}
