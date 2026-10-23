'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { Badge } from '@/components/ui/Badge';
import { EMIL_EASE } from '@/lib/motion';

export interface ShowcaseDisciplineItem {
  id: string;
  divisionNumber: string;
  divisionBadge: string;
  title: string;
  subtitle: string;
  actions: {
    men: { label: string; href: string };
    women: { label: string; href: string };
  };
  images: {
    desktop: string;
    tablet: string;
    mobile: string;
    alt: string;
    fallback?: string;
  };
}

export const SHOWCASE_COLLECTIONS: ShowcaseDisciplineItem[] = [
  {
    id: 'discipline-run',
    divisionNumber: 'DIV.01',
    divisionBadge: 'DIV.01 // SWEATSHIELD+',
    title: 'RUN',
    subtitle: 'Specialized gear for high-intensity training and running.',
    actions: {
      men: { label: 'Men', href: '/products?category=tops&discipline=run' },
      women: { label: 'Women', href: '/products?category=tops&discipline=run&gender=women' },
    },
    images: {
      desktop: '/lookbook/image-12-1.jpg',
      tablet: '/lookbook/image-12-1.jpg',
      mobile: '/lookbook/image-12-1.jpg',
      alt: 'XYDV Run Collection high-intensity training and running gear',
    },
  },
  {
    id: 'discipline-train',
    divisionNumber: 'DIV.02',
    divisionBadge: 'DIV.02 // CORDURA® RIPSTOP',
    title: 'TRAIN',
    subtitle: 'Durable training apparel with advanced fabric technologies.',
    actions: {
      men: { label: 'Men', href: '/products?category=bottoms&discipline=train' },
      women: { label: 'Women', href: '/products?category=bottoms&discipline=train&gender=women' },
    },
    images: {
      desktop: '/lookbook/image-31-1.jpg',
      tablet: '/lookbook/image-31-1.jpg',
      mobile: '/lookbook/image-31-1.jpg',
      fallback: '/lookbook/ASRV-WOMENS-133.jpg',
      alt: 'XYDV Train Collection featuring athlete in training gear',
    },
  },
  {
    id: 'discipline-rec',
    divisionNumber: 'DIV.03',
    divisionBadge: 'DIV.03 // AEROFLEX',
    title: 'REC',
    subtitle: 'Technical, versatile gear for everyday use.',
    actions: {
      men: { label: 'Men', href: '/products?category=outerwear&discipline=rec' },
      women: { label: 'Women', href: '/products?category=outerwear&discipline=rec&gender=women' },
    },
    images: {
      desktop: '/lookbook/image-13-1.jpg',
      tablet: '/lookbook/image-13-1.jpg',
      mobile: '/lookbook/image-13-1.jpg',
      alt: 'XYDV Rec Collection versatile everyday activewear',
    },
  },
];

export function CollectionShowcase() {
  const shouldReduceMotion = useReducedMotion();
  const [activeMobileCardId, setActiveMobileCardId] = useState<string | null>(null);

  const toggleMobileCard = (id: string) => {
    if (typeof window !== 'undefined') {
      const isTouch = window.matchMedia('(hover: none)').matches;
      if (!isTouch && window.innerWidth >= 640) return;
    }
    setActiveMobileCardId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      aria-labelledby="collection-showcase-heading"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24"
    >
      {/* Section Header */}
      <div className="mb-8 flex flex-col justify-between border-b border-[var(--border)] pb-6 sm:mb-12 md:flex-row md:items-end">
        <div>
          <span className="font-mono text-xs font-semibold tracking-[0.25em] text-[var(--text-secondary)] uppercase dark:text-zinc-400">
            DISCIPLINE ARCHIVE // CAMPAIGN SS26
          </span>
          <h2
            id="collection-showcase-heading"
            className="font-heading mt-2 text-3xl font-bold tracking-tighter text-[var(--text-primary)] uppercase md:text-5xl"
          >
            TECHNICAL DISCIPLINE SHOWCASE
          </h2>
        </div>
        <div className="mt-4 flex items-center gap-3 font-mono text-xs tracking-widest text-[var(--text-secondary)] uppercase md:mt-0">
          <span>03 DISCIPLINES</span>
          <span aria-hidden="true">•</span>
          <span>LAB TESTED</span>
        </div>
      </div>

      {/* Split 3-Column Editorial Showcase Grid */}
      {/* prettier-ignore */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {SHOWCASE_COLLECTIONS.map((item, idx) => {
          const isMobileActive = activeMobileCardId === item.id;

          return (
            <motion.div
              key={item.id}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.3,
                delay: shouldReduceMotion ? 0 : idx * 0.15,
                ease: EMIL_EASE,
              }}
              className="h-full"
            >
              <div
                role="region"
                aria-label={`${item.title} discipline showcase`}
                tabIndex={0}
                onClick={() => toggleMobileCard(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleMobileCard(item.id);
                  }
                }}
                className={`group dark relative flex flex-col justify-between overflow-hidden border bg-[#0a0a0a] ${
                  isMobileActive ? 'border-white/40 shadow-2xl' : 'border-[#1f1f1f]'
                } min-h-[480px] cursor-pointer p-6 transition-[border-color,box-shadow] duration-300 hover:border-white/40 hover:shadow-2xl focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none sm:min-h-[560px] sm:cursor-default sm:p-8 lg:min-h-[640px]`}
              >
                {/* Media Container with Semantic <picture> & Responsive Art Direction */}
                <div className="absolute inset-0 z-0 overflow-hidden bg-[#0a0a0a]">
                  <picture className="block h-full w-full">
                    <source media="(min-width: 1024px)" srcSet={item.images.desktop} />
                    <source media="(min-width: 640px)" srcSet={item.images.tablet} />
                    {/* prettier-ignore */}
                    <img
                      src={item.images.mobile}
                      alt={item.images.alt}
                      loading="lazy"
                      decoding="async"
                      className={`w-full h-full object-cover object-center brightness-[0.94] contrast-[1.08] saturate-[0.95] ${
                        isMobileActive ? 'scale-105 brightness-100 saturate-100' : ''
                      } group-hover:scale-105 group-hover:brightness-100 group-hover:saturate-100 transition-[transform,filter] duration-300 delay-75 ease-[cubic-bezier(0.23,1,0.32,1)]`}
                    />
                  </picture>

                  {/* Multi-Layer Calibrated Directional Scrim:
                      Top Scrim: Calibrated gradient for taxonomy/badges.
                      Bottom Scrim: Atmospheric gradient for typography/buttons.
                      Midtones: Purely unoccluded for garment/athlete texture. */}
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent sm:h-40"
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-64 bg-gradient-to-t from-black/90 via-black/55 to-transparent sm:h-72 lg:h-80"
                    aria-hidden="true"
                  />
                </div>

                {/* Top Taxonomy Strip */}
                <div className="relative z-20 flex items-start justify-between gap-4">
                  <span className="font-mono text-[11px] font-semibold tracking-[0.25em] text-white/90 uppercase">
                    {item.divisionNumber}
                  </span>
                  <Badge variant="volt" size="sm" dot>
                    {item.divisionBadge}
                  </Badge>
                </div>

                {/* Center / Bottom Content Overlay (Faithful to ASRV Reference) */}
                <div className="relative z-20 mt-16 flex flex-col items-center justify-end text-center sm:mt-24">
                  <h3 className="font-heading text-3xl font-bold tracking-widest text-white uppercase drop-shadow-[0_2px_15px_rgba(0,0,0,0.7)] transition-[letter-spacing,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:tracking-[0.2em] sm:text-4xl sm:group-hover:-translate-y-1 lg:text-5xl">
                    {item.title}
                  </h3>

                  {/* Mobile Tap Indicator */}
                  <div className="mt-2 flex items-center justify-center sm:hidden">
                    <span
                      className={`font-mono text-[10px] font-semibold tracking-[0.2em] transition-colors duration-200 ${
                        isMobileActive ? 'text-[var(--accent)]' : 'text-white/70'
                      }`}
                    >
                      {isMobileActive ? 'DIVISIONS ACTIVE ▴' : 'TAP TO EXPLORE ▾'}
                    </span>
                  </div>

                  {/* Hover-Revealed Content Container on Desktop; Tap-to-Reveal Animation on Mobile */}
                  {/* Immediate accessibility contract: opacity-100 max-h-none translate-y-0 */}
                  <div
                    className={`w-full overflow-hidden transition-[opacity,max-height,transform] delay-0 duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] sm:delay-100 ${
                      isMobileActive
                        ? 'pointer-events-auto max-h-56 translate-y-0 opacity-100'
                        : 'pointer-events-none max-h-0 translate-y-3 opacity-0'
                    } sm:pointer-events-none sm:max-h-0 sm:translate-y-3 sm:overflow-hidden sm:opacity-0 sm:group-focus-within:pointer-events-auto sm:group-focus-within:max-h-56 sm:group-focus-within:translate-y-0 sm:group-focus-within:overflow-visible sm:group-focus-within:opacity-100 sm:group-hover:pointer-events-auto sm:group-hover:max-h-56 sm:group-hover:translate-y-0 sm:group-hover:overflow-visible sm:group-hover:opacity-100`}
                  >
                    <p className="mx-auto mt-2 max-w-xs font-sans text-xs leading-relaxed text-zinc-200 sm:text-sm">
                      {item.subtitle}
                    </p>

                    {/* Dual Gender Action Buttons Group (Men / Women) */}
                    <div className="mt-3 flex w-full flex-col items-center justify-center gap-2.5 sm:mt-5 sm:flex-row">
                      <Link
                        href={item.actions.men.href}
                        onClick={(e) => e.stopPropagation()}
                        className="btn-tactile touch-target flex min-h-[48px] w-full min-w-[120px] items-center justify-center border border-transparent bg-white px-5 py-2.5 font-mono text-xs font-bold tracking-widest text-[#0a0a0a] uppercase shadow-md transition-[background-color,color,border-color,transform] delay-0 duration-200 hover:border-white hover:bg-[#0a0a0a] hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none active:scale-[0.97] sm:w-auto sm:min-w-[140px] sm:delay-100"
                      >
                        {item.actions.men.label}
                      </Link>
                      <Link
                        href={item.actions.women.href}
                        onClick={(e) => e.stopPropagation()}
                        className="btn-tactile touch-target flex min-h-[48px] w-full min-w-[120px] items-center justify-center border border-transparent bg-white px-5 py-2.5 font-mono text-xs font-bold tracking-widest text-[#0a0a0a] uppercase shadow-md transition-[background-color,color,border-color,transform] delay-0 duration-200 hover:border-white hover:bg-[#0a0a0a] hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none active:scale-[0.97] sm:w-auto sm:min-w-[140px] sm:delay-150"
                      >
                        {item.actions.women.label}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
