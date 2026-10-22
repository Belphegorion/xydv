'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { BentoSpotlightCard } from '@/components/ui/BentoSpotlightCard';
import { EMIL_EASE } from '@/lib/motion';
import { api } from '@/lib/api';

const BENTO_CATEGORIES = [
  {
    id: 'cat-tops',
    name: 'TOPS & BASELAYERS',
    slug: 'tops',
    ratio: '16:10',
    count: 4,
    description: 'SweatShield+ compression & heavyweight technical tees',
    image: '/lookbook/image-4-1.jpg',
    gridSpan: 'lg:col-span-8 lg:row-span-1',
  },
  {
    id: 'cat-bottoms',
    name: 'BOTTOMS & SHORTS',
    slug: 'bottoms',
    ratio: '3:4',
    count: 3,
    description: 'AeroFlex 5" training shorts with liner & cargo joggers',
    image: '/lookbook/image-8-1.jpg',
    gridSpan: 'lg:col-span-4 lg:row-span-2',
  },
  {
    id: 'cat-outerwear',
    name: 'TECHNICAL OUTERWEAR',
    slug: 'outerwear',
    ratio: '16:9',
    count: 3,
    description: 'Weatherproof ripstop shells & 420 GSM thermal hoodies',
    image: '/lookbook/image-9-1.jpg',
    gridSpan: 'lg:col-span-4 lg:row-span-1',
  },
  {
    id: 'cat-accessories',
    name: 'ACCESSORIES & EDC',
    slug: 'accessories',
    ratio: '1:1',
    count: 2,
    description: 'Fidlock tactical caps, ballistic bags & lifting straps',
    image: '/lookbook/image-12-1.jpg',
    gridSpan: 'lg:col-span-4 lg:row-span-1',
  },
  {
    id: 'cat-all',
    name: 'COMPLETE ARCHIVE',
    slug: 'all',
    ratio: 'full-width',
    count: 12,
    description: 'Explore the full spectrum of technical performance apparel',
    image: '/lookbook/image-2-1.jpg',
    gridSpan: 'md:col-span-2 lg:col-span-12 lg:row-span-1',
  },
];

export function CategoryGrid() {
  const shouldReduceMotion = useReducedMotion();
  const [categories, setCategories] = useState(BENTO_CATEGORIES);

  useEffect(() => {
    let isMounted = true;
    api
      .get<{ data?: Array<{ id: string; count?: number }> }>('/products/categories')
      .then((res) => {
        if (!isMounted) return;
        const data = res?.data;
        if (Array.isArray(data) && data.length > 0) {
          const countMap = new Map(data.map((c) => [c.id, c.count || 0]));
          const totalCount = data.reduce((sum, c) => sum + (c.count || 0), 0);
          setCategories((prev) =>
            prev.map((cat) => ({
              ...cat,
              count:
                cat.slug === 'all'
                  ? totalCount || cat.count
                  : (countMap.get(cat.slug) ?? cat.count),
            })),
          );
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section aria-labelledby="category-grid-heading" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 border-b border-[var(--border)] pb-6">
        <div>
          <span className="text-[var(--text-secondary)] dark:text-zinc-400 text-xs font-mono font-semibold uppercase tracking-[0.25em]">
            TAXONOMY / ARCHIVE
          </span>
          <h2
            id="category-grid-heading"
            className="text-[var(--text-primary)] text-3xl md:text-5xl font-bold uppercase tracking-tighter font-heading mt-2"
          >
            DISCIPLINE BY CATEGORY
          </h2>
        </div>
        <p className="text-[var(--text-secondary)] text-xs font-mono uppercase tracking-widest mt-4 md:mt-0">
          5 ARCHIVES / {categories.find((c) => c.slug === 'all')?.count || 12} ACTIVE GEAR STYLES
        </p>
      </div>

      {/* Asymmetric 5-Cell Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">
        {categories.map((cat, idx) => (
          <motion.div
            key={cat.id}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{
              duration: 0.28,
              delay: shouldReduceMotion ? 0 : idx * 0.04,
              ease: EMIL_EASE,
            }}
            className={`${cat.gridSpan} w-full h-[260px] sm:h-[280px] lg:h-full min-h-[260px] sm:min-h-[280px]`}
          >
            <BentoSpotlightCard className="w-full h-full">
              <Link
                href={cat.slug === 'all' ? '/products' : `/products?category=${cat.slug}`}
                aria-label={`Explore ${cat.name} (${cat.count} pieces)`}
                className="group dark relative overflow-hidden bg-black border border-zinc-800/80 hover:border-white/50 dark:border-white/15 dark:hover:border-white/50 flex flex-col justify-between p-5 sm:p-6 md:p-8 w-full h-full transition-[border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset"
              >
                {/* Background Image with Calibrated Dual Scrims and Smooth Scale */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Top scrim protecting header taxonomy badge and tactile arrow */}
                  <div
                    className="absolute inset-x-0 top-0 h-28 sm:h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-10"
                    aria-hidden="true"
                  />
                  {/* Bottom scrim protecting category title and technical description */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-36 sm:h-44 bg-gradient-to-t from-black/90 via-black/55 to-transparent pointer-events-none z-10"
                    aria-hidden="true"
                  />
                </div>

                {/* Top Taxonomy & Action Strip (Symmetrically Aligned Across All Cards) */}
                <div className="relative z-20 flex items-center justify-between w-full">
                  <Badge variant="volt" size="sm">
                    {cat.count} PIECES
                  </Badge>
                  <span
                    className="touch-target w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white group-hover:bg-white group-hover:text-black group-hover:border-white shadow-xl transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
                    aria-hidden="true"
                  >
                    <ArrowUpRight
                      size={18}
                      weight="bold"
                      className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
                    />
                  </span>
                </div>

                {/* Bottom Content Metadata (Anchored Consistently Across All Cards) */}
                <div className="relative z-20 flex flex-col justify-end w-full">
                  <h3 className="text-white group-hover:text-white text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-tight font-heading group-hover:translate-x-1.5 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]">
                    {cat.name}
                  </h3>
                  <p className="text-zinc-300 text-xs font-mono mt-1 max-w-md line-clamp-2">
                    {cat.description}
                  </p>
                </div>
              </Link>
            </BentoSpotlightCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
