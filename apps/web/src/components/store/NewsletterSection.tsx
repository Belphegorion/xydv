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
  const [error, setError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Unable to register subscription. Please try again.');
      }
    } catch {
      setError('Unable to register subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      aria-label="Priority Drop Registration"
      className="border-t border-[var(--border)] bg-[var(--bg-surface)] px-4 py-16 text-center sm:px-6 sm:py-24 md:px-12"
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center">
        {/* Eyebrow */}
        <div className="mb-6">
          <Badge variant="subtle" size="md" dot>
            DISPATCH / EARLY DROP ACCESS
          </Badge>
        </div>

        {/* Heading */}
        <h2
          id="newsletter-heading"
          className="font-heading mb-4 text-2xl font-bold tracking-tighter text-balance text-[var(--text-primary)] uppercase sm:text-3xl md:text-5xl"
        >
          SECURE PRIORITY ALLOCATION
        </h2>

        {/* Subtitle */}
        <p className="mb-8 max-w-lg font-sans text-xs leading-relaxed text-[var(--text-secondary)] sm:mb-10 md:text-sm">
          Limited batch production. Subscribers receive private checkout links 1 hour prior to
          public drop release. Zero marketing noise.
        </p>

        {/* Form or Success State */}
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: EMIL_EASE }}
              className="flex items-center gap-3 border border-[var(--border)] bg-[var(--bg)] p-4 text-[#15803d] dark:text-[#22c55e]"
            >
              <CheckCircle size={22} weight="fill" />
              <span className="font-mono text-xs font-bold tracking-widest text-[var(--text-primary)] uppercase">
                COORDINATES LOGGED. WELCOME TO THE XYDV DIVISION.
              </span>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex w-full max-w-md flex-col gap-2.5 sm:flex-row"
            >
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
                className="min-h-[48px] flex-1 border border-[var(--border)] bg-[var(--bg)] px-4 py-3.5 font-mono text-base tracking-wider text-[var(--text-primary)] transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-[var(--text-muted)] focus-visible:border-[var(--text-primary)] focus-visible:ring-1 focus-visible:ring-[var(--text-primary)] sm:text-xs dark:focus-visible:border-[var(--accent)] dark:focus-visible:ring-[var(--accent)]"
              />
              <Button
                type="submit"
                variant="volt"
                size="md"
                isLoading={isLoading}
                className="min-h-[48px] w-full sm:w-auto"
                icon={<ArrowRight size={14} weight="bold" />}
              >
                REGISTER
              </Button>
            </form>
          )}
        </AnimatePresence>

        {error && (
          <p className="mt-3 font-mono text-xs text-red-500">{error}</p>
        )}

        {/* Policy Micro-Text */}
        <p className="mt-6 font-mono text-[10px] tracking-widest text-[var(--text-muted)] uppercase">
          256-BIT ENCRYPTED / ONE-CLICK UNSUBSCRIBE ANYTIME
        </p>
      </div>
    </section>
  );
}
