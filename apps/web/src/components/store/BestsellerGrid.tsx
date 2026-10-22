'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { useCartStore } from '@/store/cart';
import { formatPrice, getAvailableSizes, type SizeOption } from '@/lib/utils';
import { ShoppingBag, ArrowRight, Check, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { EMIL_EASE } from '@/lib/motion';
import { api } from '@/lib/api';
import type { Product, ProductVariant } from '@vertex/types';

const BESTSELLERS = [
  {
    id: 'prod_volt_tee_001',
    name: 'Volt Performance Tee',
    slug: 'volt-performance-tee',
    category: 'tops',
    price: 58.0,
    rating: '4.9 / 5.0 (342 reviews)',
    variants: [
      {
        id: 'var_vpt_blk_m',
        sku: 'VPT-BLK-M',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        image: '/products/image-4-1.jpg',
        hoverImage: '/products/image-5-2.jpg',
        gallery: [
          '/products/image-4-1.jpg',
          '/products/image-5-1.jpg',
          '/products/image-5-2.jpg',
          '/products/image-6-1.jpg',
        ],
      },
      {
        id: 'var_vpt_vlt_m',
        sku: 'VPT-VLT-M',
        colorName: 'Volt Stealth',
        colorHex: '#E8FF00',
        size: 'M',
        image: '/products/image-6-1.jpg',
        hoverImage: '/products/image-7-1.jpg',
        gallery: [
          '/products/image-6-1.jpg',
          '/products/image-7-1.jpg',
          '/products/image-10-1.jpg',
          '/products/image-10-3.jpg',
        ],
      },
    ],
  },
  {
    id: 'prod_apex_shorts_002',
    name: 'Apex Modular Training Shorts',
    slug: 'apex-modular-training-shorts',
    category: 'bottoms',
    price: 72.0,
    rating: '5.0 / 5.0 (289 reviews)',
    variants: [
      {
        id: 'var_ats_blk_m',
        sku: 'ATS-BLK-M',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        image: '/products/image-8-1.jpg',
        hoverImage: '/products/image-11-1.jpg',
        gallery: [
          '/products/image-8-1.jpg',
          '/products/image-11-1.jpg',
          '/products/image-11-2.jpg',
          '/products/image-14-1.jpg',
        ],
      },
      {
        id: 'var_ats_olv_m',
        sku: 'ATS-OLV-M',
        colorName: 'Tactical Olive',
        colorHex: '#4A5340',
        size: 'M',
        image: '/products/image-12-2.jpg',
        hoverImage: '/products/image-13-1.jpg',
        gallery: [
          '/products/image-12-2.jpg',
          '/products/image-13-1.jpg',
          '/products/image-13-2.jpg',
          '/products/image-14-2.jpg',
        ],
      },
    ],
  },
  {
    id: 'prod_stealth_hoodie_003',
    name: 'Stealth Tactical Tech Hoodie',
    slug: 'stealth-tactical-tech-hoodie',
    category: 'outerwear',
    price: 148.0,
    rating: '4.8 / 5.0 (178 reviews)',
    variants: [
      {
        id: 'var_sth_blk_m',
        sku: 'STH-BLK-M',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        image: '/products/image-9-1.jpg',
        hoverImage: '/products/image-15-3.jpg',
        gallery: [
          '/products/image-9-1.jpg',
          '/products/image-15-3.jpg',
          '/products/image-15-1.jpg',
          '/products/image-12-1.jpg',
        ],
      },
    ],
  },
  {
    id: 'prod_juni_wrap_top_005',
    name: 'Juni Wrap-Neck Top',
    slug: 'juni-wrap-neck-top',
    category: 'tops',
    price: 64.0,
    rating: '5.0 / 5.0 (194 reviews)',
    variants: [
      {
        id: 'var_jwt_blk_s',
        sku: 'JWT-BLK-S',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'S',
        image: '/products/image-25-1.jpg',
        hoverImage: '/products/image-25-2.jpg',
        gallery: [
          '/products/image-25-1.jpg',
          '/products/image-25-2.jpg',
          '/products/image-24-1.jpg',
          '/products/image-22-1.jpg',
        ],
      },
      {
        id: 'var_jwt_slv_s',
        sku: 'JWT-SLV-S',
        colorName: 'Muted Silver',
        colorHex: '#B0B0B0',
        size: 'S',
        image: '/products/image-22-1.jpg',
        hoverImage: '/products/image-23-1.jpg',
        gallery: [
          '/products/image-22-1.jpg',
          '/products/image-23-1.jpg',
          '/products/image-24-1.jpg',
          '/products/image-25-1.jpg',
        ],
      },
    ],
  },
  {
    id: 'prod_activewear_set_006',
    name: 'AeroFlex Women Activewear Set',
    slug: 'aeroflex-women-activewear-set',
    category: 'sets',
    price: 118.0,
    rating: '4.9 / 5.0 (215 reviews)',
    variants: [
      {
        id: 'var_was_olv_s',
        sku: 'WAS-OLV-S',
        colorName: 'Tactical Olive',
        colorHex: '#4A5340',
        size: 'S',
        image: '/products/image-30-1.jpg',
        hoverImage: '/products/image-31-1.jpg',
        gallery: [
          '/products/image-30-1.jpg',
          '/products/image-31-1.jpg',
          '/products/image-29-1.jpg',
          '/products/image-32-1.jpg',
        ],
      },
    ],
  },
  {
    id: 'prod_cargo_joggers_007',
    name: 'Tapered Cargo Joggers',
    slug: 'tapered-cargo-joggers',
    category: 'bottoms',
    price: 88.0,
    rating: '4.8 / 5.0 (162 reviews)',
    variants: [
      {
        id: 'var_tcj_blk_m',
        sku: 'TCJ-BLK-M',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        image: '/products/image-8-1.jpg',
        hoverImage: '/products/image-11-2.jpg',
        gallery: [
          '/products/image-8-1.jpg',
          '/products/image-11-2.jpg',
          '/products/image-11-1.jpg',
          '/products/image-28-1.jpg',
        ],
      },
    ],
  },
];

interface BestsellerMediaProps {
  product: (typeof BESTSELLERS)[0];
  activeVariant: (typeof BESTSELLERS)[0]['variants'][0];
  isAdded: boolean;
  onSelectSize: (size: string) => void;
  cardIndex: number;
}

function BestsellerMedia({
  product,
  activeVariant,
  isAdded,
  onSelectSize,
  cardIndex,
}: BestsellerMediaProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const gallery =
    activeVariant.gallery && activeVariant.gallery.length > 0
      ? activeVariant.gallery
      : [activeVariant.image, activeVariant.hoverImage].filter(Boolean);

  // Reset to slide 0 when variant color changes
  useEffect(() => {
    setActiveImageIdx(0);
    if (galleryRef.current) {
      galleryRef.current.scrollTo({ left: 0, behavior: 'instant' });
    }
  }, [activeVariant.sku, activeVariant.id]);

  // Auto-change image slideshow (pauses on hover, touch, or reduced motion)
  useEffect(() => {
    if (shouldReduceMotion || isHovered || isInteracting || gallery.length <= 1) return;

    const cadence = 4500 + (cardIndex % 3) * 700;
    const interval = setInterval(() => {
      if (!galleryRef.current) return;
      setActiveImageIdx((prev) => {
        const nextIdx = (prev + 1) % gallery.length;
        if (galleryRef.current) {
          const targetLeft = nextIdx * galleryRef.current.clientWidth;
          galleryRef.current.scrollTo({ left: targetLeft, behavior: 'smooth' });
        }
        return nextIdx;
      });
    }, cadence);

    return () => clearInterval(interval);
  }, [gallery.length, isHovered, isInteracting, shouldReduceMotion, cardIndex]);

  // Trackpad 2-finger and mobile 1-finger horizontal scroll listener
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el || el.clientWidth === 0) return;
    const newIdx = Math.round(el.scrollLeft / el.clientWidth);
    if (newIdx !== activeImageIdx && newIdx >= 0 && newIdx < gallery.length) {
      setActiveImageIdx(newIdx);
    }
  };

  const scrollToSlide = (idx: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!galleryRef.current) return;
    galleryRef.current.scrollTo({
      left: idx * galleryRef.current.clientWidth,
      behavior: 'smooth',
    });
    setActiveImageIdx(idx);
  };

  const sizes = getAvailableSizes(product.category, activeVariant.sku, product.variants);

  return (
    <div
      className="group/media relative aspect-[3/4] w-full bg-[var(--bg-elevated)] border-b border-[var(--border)] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsInteracting(true)}
      onTouchEnd={() => setTimeout(() => setIsInteracting(false), 2000)}
    >
      {/* Native CSS Scroll-Snap Gallery Track */}
      <div
        ref={galleryRef}
        onScroll={handleScroll}
        className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar select-none"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pan-y',
        }}
        tabIndex={-1}
        aria-label={`${product.name} gallery`}
      >
        {gallery.map((imgUrl, imgIdx) => (
          <div
            key={imgIdx}
            className="w-full h-full flex-shrink-0 snap-center relative overflow-hidden"
          >
            <Image
              src={imgUrl}
              alt={`${product.name} ${activeVariant.colorName} view ${imgIdx + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
              priority={imgIdx === 0}
            />
          </div>
        ))}
      </div>

      {/* Progress Dots Indicator */}
      {gallery.length > 1 && (
        <div
          className="absolute bottom-2.5 inset-x-0 z-10 flex items-center justify-center gap-1 px-4 pointer-events-none sm:group-hover/media:opacity-0 transition-opacity duration-200"
          role="group"
          aria-label="Slide indicators"
        >
          {gallery.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={(e) => scrollToSlide(dotIdx, e)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-0 bg-transparent border-0 cursor-pointer focus:outline-none pointer-events-auto"
              aria-label={`View slide ${dotIdx + 1}`}
            >
              <span
                className={`h-1 rounded-full transition-[width,background-color] duration-200 ${
                  dotIdx === activeImageIdx
                    ? 'w-5 bg-white shadow-sm'
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Desktop Chevrons on Hover */}
      {gallery.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              const prev = (activeImageIdx - 1 + gallery.length) % gallery.length;
              scrollToSlide(prev, e);
            }}
            className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 min-w-[44px] min-h-[44px] items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity duration-200 focus:outline-none"
            aria-label="Previous image"
          >
            <span className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/90 transition-colors active:scale-[0.97]">
              <CaretLeft size={14} weight="bold" />
            </span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              const next = (activeImageIdx + 1) % gallery.length;
              scrollToSlide(next, e);
            }}
            className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 min-w-[44px] min-h-[44px] items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity duration-200 focus:outline-none"
            aria-label="Next image"
          >
            <span className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/90 transition-colors active:scale-[0.97]">
              <CaretRight size={14} weight="bold" />
            </span>
          </button>
        </>
      )}

      {/* Rank Badge */}
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 pointer-events-none">
        <Badge variant="volt" size="sm" dot>
          TOP PERFORMER
        </Badge>
      </div>

      {/* Desktop Quick Size Selector Pill — Revealed on card hover / focus-within */}
      <div className="absolute inset-x-2 sm:inset-x-2.5 bottom-2 sm:bottom-2.5 z-20 hidden sm:flex flex-col items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-none bg-white/92 dark:bg-[#0a0a0a]/92 backdrop-blur-md border border-black/10 dark:border-white/15 px-2 py-1.5 shadow-lg dark:shadow-2xl">
        <div className="flex items-center justify-between w-full mb-1 px-0.5">
          <span className="text-[8.5px] font-mono font-medium tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase leading-none">
            QUICK ADD SIZE
          </span>
          {isAdded && (
            <span className="text-[8.5px] font-mono font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 leading-none">
              <Check size={10} weight="bold" />
              ADDED
            </span>
          )}
        </div>
        {sizes.length === 1 ? (
          <button
            type="button"
            disabled={!sizes[0].inStock}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelectSize(sizes[0].size);
            }}
            className={`w-full h-[26px] px-2 flex items-center justify-center font-mono text-[9.5px] font-bold tracking-widest uppercase transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white ${
              sizes[0].inStock
                ? 'bg-black/5 hover:bg-black hover:text-white text-black border border-black/10 hover:border-black dark:bg-white/10 dark:hover:bg-white dark:hover:text-[#0a0a0a] dark:text-white dark:border-white/15 dark:hover:border-white shadow-xs cursor-pointer'
                : 'bg-black/[0.02] text-zinc-400 border border-black/5 dark:bg-white/[0.02] dark:text-zinc-600 dark:border-white/10 line-through cursor-not-allowed select-none'
            }`}
            aria-label={sizes[0].inStock ? `Add size ${sizes[0].size} to bag` : `Size ${sizes[0].size} out of stock`}
            title={sizes[0].inStock ? `Add size ${sizes[0].size}` : `Size ${sizes[0].size} (Out of Stock)`}
          >
            QUICK ADD · ONE SIZE ({sizes[0].size})
          </button>
        ) : (
          <div
            className="flex items-center justify-between gap-1 w-full"
            role="group"
            aria-label={`Select size for ${product.name}`}
          >
            {sizes.map(({ size, inStock }) => (
              <button
                key={size}
                type="button"
                disabled={!inStock}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectSize(size);
                }}
                className={`flex-1 min-w-0 h-[26px] px-0.5 flex items-center justify-center font-mono text-[10px] font-bold tracking-tight transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white ${
                  inStock
                    ? 'bg-black/5 hover:bg-black hover:text-white text-black border border-black/10 hover:border-black dark:bg-white/10 dark:hover:bg-white dark:hover:text-[#0a0a0a] dark:text-white dark:border-white/15 dark:hover:border-white shadow-xs cursor-pointer'
                    : 'bg-black/[0.02] text-zinc-400 border border-black/5 dark:bg-white/[0.02] dark:text-zinc-600 dark:border-white/10 line-through cursor-not-allowed select-none'
                }`}
                aria-label={inStock ? `Add size ${size} to bag` : `Size ${size} out of stock`}
                title={inStock ? `Add size ${size}` : `Size ${size} (Out of Stock)`}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function BestsellerGrid() {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const shouldReduceMotion = useReducedMotion();
  const [products, setProducts] = useState(BESTSELLERS);

  useEffect(() => {
    let isMounted = true;
    api
      .get<{ data?: Product[]; products?: Product[] }>('/products?bestseller=true')
      .then((res) => {
        if (!isMounted) return;
        const raw = res?.data ?? res?.products;
        if (Array.isArray(raw) && raw.length > 0) {
          const staticMap = new Map(BESTSELLERS.map((p) => [p.slug, p]));
          const mapped = raw.slice(0, 3).map((item) => {
            const st = staticMap.get(item.slug);
            const dynamicRating =
              typeof item.averageRating === 'number' && item.averageRating > 0
                ? `${item.averageRating.toFixed(1)} / 5.0 (${item.reviewCount ?? 0} reviews)`
                : null;
            if (st) {
              return {
                ...st,
                price: typeof item.price === 'number' ? item.price : st.price,
                rating: dynamicRating || st.rating,
                variants:
                  Array.isArray(item.variants) && item.variants.length > 0
                    ? item.variants.map((v: ProductVariant, idx: number) => {
                        const staticVar = st.variants[idx] || st.variants[0];
                        return {
                          id: v._id || v.id || staticVar.id,
                          sku: v.sku || staticVar.sku,
                          colorName: v.colorName || v.color || staticVar.colorName,
                          colorHex: v.colorHex || staticVar.colorHex,
                          size: v.size || staticVar.size,
                          image: v.imageUrl || staticVar.image,
                          hoverImage: v.secondaryImageUrl || staticVar.hoverImage,
                          gallery: Array.isArray(v.images) && v.images.length > 0 ? v.images : staticVar.gallery,
                        };
                      })
                    : st.variants,
              };
            }
            const firstVar = item.variants?.[0];
            const primaryImg = firstVar?.imageUrl || firstVar?.images?.[0] || '/products/image-4-1.jpg';
            const secondaryImg = firstVar?.secondaryImageUrl || firstVar?.images?.[1] || primaryImg;
            return {
              id: item._id || item.id || `prod_${item.slug}`,
              name: item.name,
              slug: item.slug,
              category: typeof item.category === 'string' ? item.category : 'tops',
              price: item.price ?? 50,
              rating: dynamicRating || '4.9 / 5.0 (200+ reviews)',
              variants:
                Array.isArray(item.variants) && item.variants.length > 0
                  ? item.variants.map((v: ProductVariant, idx: number) => ({
                      id: v._id || v.id || `var_${item.slug}_${idx}`,
                      sku: v.sku || `SKU-${idx}`,
                      colorName: v.colorName || v.color || 'Void Obsidian',
                      colorHex: v.colorHex || '#0A0A0A',
                      size: v.size || 'M',
                      image: v.imageUrl || primaryImg,
                      hoverImage: v.secondaryImageUrl || secondaryImg,
                      gallery: Array.isArray(v.images) && v.images.length > 0 ? v.images : [primaryImg],
                    }))
                  : [
                      {
                        id: `var_${item.slug}_0`,
                        sku: `SKU-${item.slug}`,
                        colorName: 'Void Obsidian',
                        colorHex: '#0A0A0A',
                        size: 'M',
                        image: primaryImg,
                        hoverImage: secondaryImg,
                        gallery: [primaryImg],
                      },
                    ],
            };
          });
          setProducts(mapped);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const [activeVariants, setActiveVariants] = useState<Record<string, number>>({
    prod_volt_tee_001: 0,
    prod_apex_shorts_002: 0,
    prod_stealth_hoodie_003: 0,
  });

  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const handleSelectSize = (
    product: (typeof BESTSELLERS)[0],
    variant: (typeof BESTSELLERS)[0]['variants'][0],
    size: string,
  ) => {
    addItem({
      id: `${product.id}_${variant.sku}_${size}`,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      color: variant.colorName,
      colorHex: variant.colorHex,
      size: size,
      price: product.price,
      image: variant.image,
      sku: variant.sku,
    });

    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
      openCart();
    }, 400);
  };

  const handleQuickAdd = (product: (typeof BESTSELLERS)[0]) => {
    const variantIdx = activeVariants[product.id] || 0;
    const variant = product.variants[variantIdx];
    handleSelectSize(product, variant, variant.size);
  };

  return (
    <section aria-labelledby="bestseller-heading" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 border-b border-[var(--border)] pb-6">
        <div>
          <span className="text-[var(--text-secondary)] dark:text-[var(--accent)] text-xs font-mono font-semibold uppercase tracking-[0.25em]">
            PROVEN IN TRAINING
          </span>
          <h2
            id="bestseller-heading"
            className="text-[var(--text-primary)] text-3xl md:text-5xl font-bold uppercase tracking-tighter font-heading mt-2"
          >
            COMMUNITY BESTSELLERS
          </h2>
        </div>
        <Link
          href="/products?bestseller=true"
          className="inline-flex items-center gap-2 text-[var(--text-primary)] dark:text-[var(--accent)] text-xs font-mono font-semibold uppercase tracking-widest hover:text-[var(--text-secondary)] dark:hover:text-[var(--accent)] transition-colors mt-4 md:mt-0"
        >
          <span>VIEW LEADERBOARD</span>
          <ArrowRight size={14} weight="bold" />
        </Link>
      </div>

      {/* 2-Column Mobile / 3-Column Desktop Tactical Bestseller Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
        {products.map((product, idx) => {
          const activeIdx = activeVariants[product.id] || 0;
          const activeVar = product.variants[activeIdx];
          const isAdded = addedIds[product.id] || false;

          return (
            <motion.div
              key={product.id}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.28,
                delay: shouldReduceMotion ? 0 : idx * 0.08,
                ease: EMIL_EASE,
              }}
              className="group flex flex-col bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--text-primary)]/40 hover:shadow-lg transition-[border-color,box-shadow] duration-200"
            >
              {/* Product Media Tile with CSS Scroll-Snap Gallery & Quick-Size Selector */}
              <BestsellerMedia
                product={product}
                activeVariant={activeVar}
                isAdded={isAdded}
                onSelectSize={(size) => handleSelectSize(product, activeVar, size)}
                cardIndex={idx}
              />

              {/* Meta */}
              <div className="p-3 sm:p-5 flex flex-col flex-1 justify-between">
                <div>
                  {/* Swatches with Accessible Touch Targets */}
                  <div
                    className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 min-w-0 overflow-hidden"
                    role="group"
                    aria-label={`Colorways for ${product.name}`}
                  >
                    {product.variants.map((v, sIdx) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setActiveVariants((prev) => ({ ...prev, [product.id]: sIdx }))}
                        aria-label={`Select ${v.colorName}`}
                        className="touch-target relative p-2 -m-2 focus:outline-none flex-shrink-0"
                      >
                        <span
                          className={`block w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border transition-[transform,border-color] duration-150 active:scale-[0.97] ${
                            sIdx === activeIdx
                              ? 'border-[#000000] ring-1 ring-[#000000] ring-offset-1 ring-offset-[var(--bg-surface)] dark:border-[var(--accent)] dark:ring-0 scale-125 shadow-sm'
                              : 'border border-black/20 dark:border-white/20 hover:border-[var(--text-primary)]'
                          }`}
                          style={{ backgroundColor: v.colorHex }}
                        />
                      </button>
                    ))}
                    <span className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-mono uppercase ml-1 truncate min-w-0">
                      {activeVar.colorName}
                    </span>
                  </div>

                  {/* Title & Link */}
                  <Link
                    href={`/products/${product.slug}`}
                    className="hover:text-[var(--text-secondary)] dark:hover:text-zinc-300 transition-colors"
                  >
                    <h3 className="text-[var(--text-primary)] text-xs sm:text-base font-bold uppercase tracking-tight font-heading line-clamp-1">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Rating string */}
                  <p className="text-[var(--text-secondary)] text-[10px] sm:text-xs font-mono mt-1">
                    {product.rating}
                  </p>
                </div>

                {/* Price & Stock Hairline Divider */}
                <div className="mt-4 sm:mt-5 pt-2.5 sm:pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-[var(--text-primary)] text-xs sm:text-base font-mono font-bold">
                    {formatPrice(product.price)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Compact mobile quick add button */}
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(product)}
                      aria-label={`Quick add ${product.name} to bag`}
                      className="sm:hidden touch-target min-w-[48px] min-h-[48px] flex items-center justify-center bg-[var(--accent)] text-white dark:text-[#0a0a0a] hover:bg-[var(--accent-hover)] transition-colors active:scale-[0.97]"
                    >
                      {isAdded ? <Check size={14} weight="bold" /> : <ShoppingBag size={14} weight="bold" />}
                    </button>
                    <span className="hidden sm:inline-flex">
                      <Badge variant="volt" size="sm">
                        IN STOCK
                      </Badge>
                    </span>
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
