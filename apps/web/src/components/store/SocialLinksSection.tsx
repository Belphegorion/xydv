'use client';

import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { EMIL_EASE } from '@/lib/motion';

interface SocialChannel {
  id: string;
  platform: string;
  handle: string;
  description: string;
  actionLabel: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

const SOCIAL_CHANNELS: SocialChannel[] = [
  {
    id: 'instagram',
    platform: 'Instagram',
    handle: '@xydv.division',
    description: 'Pro athlete testing rosters, behind-the-scenes laboratory development, and field imagery.',
    actionLabel: 'Follow on Instagram',
    href: 'https://instagram.com',
    icon: ({ className }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    platform: 'Facebook',
    handle: 'XYDV Technical Division',
    description: 'Official athlete community group, global training logs, and regional endurance meetups.',
    actionLabel: 'Join community',
    href: 'https://facebook.com',
    icon: ({ className }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: 'x',
    platform: 'X / Twitter',
    handle: '@XYDV_DIVISION',
    description: 'Instant drop alerts, restock announcements, firmware-level dispatch notices, and direct updates.',
    actionLabel: 'Follow on X',
    href: 'https://x.com',
    icon: ({ className }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: 'youtube',
    platform: 'YouTube',
    handle: 'XYDV Textile Lab',
    description: 'Long-form material abrasion stress tests, fabric teardowns, and athlete documentary features.',
    actionLabel: 'Subscribe on YouTube',
    href: 'https://youtube.com',
    icon: ({ className }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

export function SocialLinksSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="social-links-heading"
      className="border-t border-[var(--border)] bg-[var(--bg-surface)] py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 max-w-2xl sm:mb-14">
          <span className="font-mono text-xs font-semibold tracking-[0.25em] text-[var(--text-secondary)] uppercase dark:text-[var(--accent)]">
            COMMUNITY DISPATCH
          </span>
          <h2
            id="social-links-heading"
            className="font-heading mt-2 text-2xl font-bold tracking-tighter text-[var(--text-primary)] uppercase sm:text-3xl md:text-4xl"
          >
            GLOBAL FIELD NETWORK
          </h2>
          <p className="mt-3 font-sans text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
            Connect directly with the XYDV development unit. Field test logs, material research
            whitepapers, and early dispatch windows are broadcast across our verified channels.
          </p>
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {SOCIAL_CHANNELS.map((channel, idx) => {
            const Icon = channel.icon;
            return (
              <motion.a
                key={channel.id}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.28,
                  delay: shouldReduceMotion ? 0 : idx * 0.08,
                  ease: EMIL_EASE,
                }}
                className="group relative flex flex-col justify-between border border-[var(--border)] bg-[var(--bg-elevated)] p-5 transition-[border-color,box-shadow,transform] duration-200 hover:border-[var(--text-primary)] hover:shadow-md focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none active:scale-[0.98]"
                aria-label={`${channel.actionLabel} (opens in new tab)`}
              >
                <div>
                  {/* Top Bar with Icon & Platform */}
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition-colors group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase">
                          {channel.platform}
                        </span>
                        <span className="block font-mono text-[10px] text-[var(--text-muted)]">
                          {channel.handle}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight
                      size={14}
                      weight="bold"
                      className="text-[var(--text-muted)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--text-primary)] dark:group-hover:text-[var(--accent)]"
                    />
                  </div>

                  {/* Channel Description */}
                  <p className="mt-4 font-sans text-xs leading-relaxed text-[var(--text-secondary)]">
                    {channel.description}
                  </p>
                </div>

                {/* Bottom Action Pill */}
                <div className="mt-6 pt-4 border-t border-[var(--border)]">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                    {channel.actionLabel}
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
