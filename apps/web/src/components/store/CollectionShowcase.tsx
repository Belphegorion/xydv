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
      fallback: 'https://asrv.com/cdn/shop/files/ASRV-WOMENS-133.jpg?v=1750881906&width=1500',
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
      className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 border-b border-[var(--border)] pb-6">
        <div>
          <span className="text-[var(--text-secondary)] dark:text-zinc-400 text-xs font-mono font-semibold uppercase tracking-[0.25em]">
            DISCIPLINE ARCHIVE // CAMPAIGN SS26
          </span>
          <h2
            id="collection-showcase-heading"
            className="text-[var(--text-primary)] text-3xl md:text-5xl font-bold uppercase tracking-tighter font-heading mt-2"
          >
            TECHNICAL DISCIPLINE SHOWCASE
          </h2>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0 text-[var(--text-secondary)] text-xs font-mono uppercase tracking-widest">
          <span>03 DISCIPLINES</span>
          <span aria-hidden="true">•</span>
          <span>LAB TESTED</span>
        </div>
      </div>

      {/* Split 3-Column Editorial Showcase Grid */}
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
                className={`group dark relative flex flex-col justify-between overflow-hidden bg-[#0a0a0a] border ${
                  isMobileActive ? 'border-white/40 shadow-2xl' : 'border-[#1f1f1f]'
                } min-h-[480px] sm:min-h-[560px] lg:min-h-[640px] p-6 sm:p-8 hover:border-white/40 hover:shadow-2xl transition-[border-color,box-shadow] duration-300 cursor-pointer sm:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
              >
                {/* Media Container with Semantic <picture> & Responsive Art Direction */}
                <div className="absolute inset-0 z-0 overflow-hidden bg-[#0a0a0a]">
                  <picture className="w-full h-full block">
                    <source media="(min-width: 1024px)" srcSet={item.images.desktop} />
                    <source media="(min-width: 640px)" srcSet={item.images.tablet} />
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
                    className="absolute inset-x-0 top-0 h-32 sm:h-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-10"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 h-64 sm:h-72 lg:h-80 bg-gradient-to-t from-black/90 via-black/55 to-transparent pointer-events-none z-10"
                    aria-hidden="true"
                  />
                </div>

                {/* Top Taxonomy Strip */}
                <div className="relative z-20 flex items-start justify-between gap-4">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-white/90">
                    {item.divisionNumber}
                  </span>
                  <Badge variant="volt" size="sm" dot>
                    {item.divisionBadge}
                  </Badge>
                </div>

                {/* Center / Bottom Content Overlay (Faithful to ASRV Reference) */}
                <div className="relative z-20 flex flex-col items-center justify-end text-center mt-16 sm:mt-24">
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-widest font-heading text-white drop-shadow-[0_2px_15px_rgba(0,0,0,0.7)] group-hover:tracking-[0.2em] sm:group-hover:-translate-y-1 transition-[letter-spacing,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]">
                    {item.title}
                  </h3>

                  {/* Mobile Tap Indicator */}
                  <div className="sm:hidden mt-2 flex items-center justify-center">
                    <span
                      className={`text-[10px] font-mono font-semibold tracking-[0.2em] transition-colors duration-200 ${
                        isMobileActive ? 'text-[var(--accent)]' : 'text-white/70'
                      }`}
                    >
                      {isMobileActive ? 'DIVISIONS ACTIVE ▴' : 'TAP TO EXPLORE ▾'}
                    </span>
                  </div>

                  {/* Hover-Revealed Content Container on Desktop; Tap-to-Reveal Animation on Mobile */}
                  {/* Immediate accessibility contract: opacity-100 max-h-none translate-y-0 */}
                  <div
                    className={`w-full overflow-hidden transition-[opacity,max-height,transform] duration-300 delay-0 sm:delay-100 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                      isMobileActive
                        ? 'opacity-100 max-h-56 translate-y-0 pointer-events-auto'
                        : 'opacity-0 max-h-0 translate-y-3 pointer-events-none'
                    } sm:opacity-0 sm:max-h-0 sm:overflow-hidden sm:translate-y-3 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:max-h-56 sm:group-hover:translate-y-0 sm:group-hover:pointer-events-auto sm:group-hover:overflow-visible sm:group-focus-within:opacity-100 sm:group-focus-within:max-h-56 sm:group-focus-within:translate-y-0 sm:group-focus-within:pointer-events-auto sm:group-focus-within:overflow-visible`}
                  >
                    <p className="text-xs sm:text-sm text-zinc-200 font-sans mt-2 max-w-xs mx-auto leading-relaxed">
                      {item.subtitle}
                    </p>

                    {/* Dual Gender Action Buttons Group (Men / Women) */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-3 sm:mt-5 w-full">
                      <Link
                        href={item.actions.men.href}
                        onClick={(e) => e.stopPropagation()}
                        className="btn-tactile touch-target w-full sm:w-auto min-w-[120px] sm:min-w-[140px] min-h-[48px] px-5 py-2.5 bg-white text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white hover:border-white border border-transparent font-mono text-xs font-bold uppercase tracking-widest transition-[background-color,color,border-color,transform] duration-200 delay-0 sm:delay-100 shadow-md active:scale-[0.97] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                      >
                        {item.actions.men.label}
                      </Link>
                      <Link
                        href={item.actions.women.href}
                        onClick={(e) => e.stopPropagation()}
                        className="btn-tactile touch-target w-full sm:w-auto min-w-[120px] sm:min-w-[140px] min-h-[48px] px-5 py-2.5 bg-white text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white hover:border-white border border-transparent font-mono text-xs font-bold uppercase tracking-widest transition-[background-color,color,border-color,transform] duration-200 delay-0 sm:delay-150 shadow-md active:scale-[0.97] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
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
