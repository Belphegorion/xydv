'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { useCartStore } from '@/store/cart';
import { formatPrice, getAvailableSizes, type SizeOption } from '@/lib/utils';
import { ShoppingBag, ArrowRight, Check, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
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

export type BestsellerItem = (typeof BESTSELLERS)[0] & {
  compareAt?: number;
  effectivePrice?: number;
  effectivePricePaise?: number;
  mrpPaise?: number;
  sellingPricePaise?: number;
  discountPercentRounded?: number;
  discountBadgeLabel?: string;
};

interface BestsellerMediaProps {
  product: BestsellerItem;
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
      className="group/media relative aspect-[3/4] w-full overflow-hidden border-b border-[var(--border)] bg-[var(--bg-elevated)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsInteracting(true)}
      onTouchEnd={() => setTimeout(() => setIsInteracting(false), 2000)}
    >
      {/* Native CSS Scroll-Snap Gallery Track */}
      <div
        ref={galleryRef}
        onScroll={handleScroll}
        className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto select-none"
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
            className="relative h-full w-full flex-shrink-0 snap-center overflow-hidden"
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
          className="pointer-events-none absolute inset-x-0 bottom-2.5 z-10 flex items-center justify-center gap-1 px-4 transition-opacity duration-200 sm:group-hover/media:opacity-0"
          role="group"
          aria-label="Slide indicators"
        >
          {gallery.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={(e) => scrollToSlide(dotIdx, e)}
              className="pointer-events-auto flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center border-0 bg-transparent p-0 focus:outline-none"
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
            className="absolute top-1/2 left-1 z-10 hidden min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center opacity-0 transition-opacity duration-200 group-hover/media:opacity-100 focus:outline-none sm:flex"
            aria-label="Previous image"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/90 active:scale-[0.97]">
              <CaretLeft size={14} weight="bold" />
            </span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              const next = (activeImageIdx + 1) % gallery.length;
              scrollToSlide(next, e);
            }}
            className="absolute top-1/2 right-1 z-10 hidden min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center opacity-0 transition-opacity duration-200 group-hover/media:opacity-100 focus:outline-none sm:flex"
            aria-label="Next image"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/90 active:scale-[0.97]">
              <CaretRight size={14} weight="bold" />
            </span>
          </button>
        </>
      )}

      {/* Rank Badge */}
      <div className="pointer-events-none absolute top-2 left-2 z-10 sm:top-3 sm:left-3">
        <Badge variant="volt" size="sm" dot>
          TOP PERFORMER
        </Badge>
      </div>

      {/* Desktop Quick Size Selector Pill — Revealed on card hover / focus-within */}
      <div className="pointer-events-none absolute inset-x-2 bottom-2 z-20 hidden translate-y-2 flex-col items-center justify-center border border-black/10 bg-white/92 px-2 py-1.5 opacity-0 shadow-lg backdrop-blur-md transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 sm:inset-x-2.5 sm:bottom-2.5 sm:flex dark:border-white/15 dark:bg-[#0a0a0a]/92 dark:shadow-2xl">
        <div className="mb-1 flex w-full items-center justify-between px-0.5">
          <span className="font-mono text-[8.5px] leading-none font-medium tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
            QUICK ADD SIZE
          </span>
          {isAdded && (
            <span className="flex items-center gap-1 font-mono text-[8.5px] leading-none font-bold text-emerald-700 dark:text-emerald-400">
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
            className={`flex h-[26px] w-full items-center justify-center px-2 font-mono text-[9.5px] font-bold tracking-widest uppercase transition-[background-color,border-color,color,transform] duration-150 focus-visible:ring-1 focus-visible:ring-black focus-visible:outline-none active:scale-[0.97] dark:focus-visible:ring-white ${
              sizes[0].inStock
                ? 'cursor-pointer border border-black/10 bg-black/5 text-black shadow-xs hover:border-black hover:bg-black hover:text-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-[#0a0a0a]'
                : 'cursor-not-allowed border border-black/5 bg-black/[0.02] text-zinc-400 line-through select-none dark:border-white/10 dark:bg-white/[0.02] dark:text-zinc-600'
            }`}
            aria-label={
              sizes[0].inStock
                ? `Add size ${sizes[0].size} to bag`
                : `Size ${sizes[0].size} out of stock`
            }
            title={
              sizes[0].inStock
                ? `Add size ${sizes[0].size}`
                : `Size ${sizes[0].size} (Out of Stock)`
            }
          >
            QUICK ADD · ONE SIZE ({sizes[0].size})
          </button>
        ) : (
          <div
            className="flex w-full items-center justify-between gap-1"
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
                className={`flex h-[26px] min-w-0 flex-1 items-center justify-center px-0.5 font-mono text-[10px] font-bold tracking-tight transition-[background-color,border-color,color,transform] duration-150 focus-visible:ring-1 focus-visible:ring-black focus-visible:outline-none active:scale-[0.97] dark:focus-visible:ring-white ${
                  inStock
                    ? 'cursor-pointer border border-black/10 bg-black/5 text-black shadow-xs hover:border-black hover:bg-black hover:text-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-[#0a0a0a]'
                    : 'cursor-not-allowed border border-black/5 bg-black/[0.02] text-zinc-400 line-through select-none dark:border-white/10 dark:bg-white/[0.02] dark:text-zinc-600'
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

export function computeDynamicRating(product: {
  averageRating?: number;
  reviewCount?: number;
  ratings?: number[];
  reviews?: Array<{ rating: number }>;
  rating?: string | number;
}): string | null {
  if (Array.isArray(product.reviews) && product.reviews.length > 0) {
    const sum = product.reviews.reduce(
      (acc, r) => acc + (typeof r.rating === 'number' ? r.rating : 5),
      0,
    );
    const avg = sum / product.reviews.length;
    return `${avg.toFixed(1)} / 5.0 (${product.reviews.length} reviews)`;
  }
  if (Array.isArray(product.ratings) && product.ratings.length > 0) {
    const sum = product.ratings.reduce((acc, r) => acc + (typeof r === 'number' ? r : 5), 0);
    const avg = sum / product.ratings.length;
    return `${avg.toFixed(1)} / 5.0 (${product.ratings.length} reviews)`;
  }
  if (typeof product.averageRating === 'number' && product.averageRating > 0) {
    return `${product.averageRating.toFixed(1)} / 5.0 (${product.reviewCount ?? 0} reviews)`;
  }
  if (typeof product.rating === 'number' && product.rating > 0) {
    return `${product.rating.toFixed(1)} / 5.0 (${product.reviewCount ?? 0} reviews)`;
  }
  return null;
}

export function BestsellerGrid() {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const shouldReduceMotion = useReducedMotion();
  const [products, setProducts] = useState<BestsellerItem[]>(BESTSELLERS);

  useEffect(() => {
    let isMounted = true;
    api
      .get<{ data?: Product[]; products?: Product[] }>('/products?bestseller=true')
      .then((res) => {
        if (!isMounted) return;
        const raw = res?.data ?? res?.products;
        if (Array.isArray(raw) && raw.length > 0) {
          const staticMap = new Map(BESTSELLERS.map((p) => [p.slug, p]));
          const mapped: BestsellerItem[] = raw.slice(0, 3).map((item) => {
            const st = staticMap.get(item.slug);
            const dynamicRating = computeDynamicRating(item);
            const effectivePrice =
              typeof item.effectivePricePaise === 'number'
                ? item.effectivePricePaise / 100
                : item.price;
            if (st) {
              return {
                ...st,
                price: typeof item.price === 'number' ? item.price : st.price,
                effectivePrice: typeof effectivePrice === 'number' ? effectivePrice : st.price,
                effectivePricePaise: item.effectivePricePaise,
                mrpPaise: item.mrpPaise,
                sellingPricePaise: item.sellingPricePaise,
                discountPercentRounded: item.discountPercentRounded,
                discountBadgeLabel: item.discountBadgeLabel,
                compareAt: item.compareAt,
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
                          gallery:
                            Array.isArray(v.images) && v.images.length > 0
                              ? v.images
                              : staticVar.gallery,
                        };
                      })
                    : st.variants,
              };
            }
            const firstVar = item.variants?.[0];
            const primaryImg =
              firstVar?.imageUrl || firstVar?.images?.[0] || '/products/image-4-1.jpg';
            const secondaryImg = firstVar?.secondaryImageUrl || firstVar?.images?.[1] || primaryImg;
            return {
              id: item._id || item.id || `prod_${item.slug}`,
              name: item.name,
              slug: item.slug,
              category: typeof item.category === 'string' ? item.category : 'tops',
              price: item.price ?? 50,
              effectivePrice:
                typeof effectivePrice === 'number' ? effectivePrice : (item.price ?? 50),
              effectivePricePaise: item.effectivePricePaise,
              mrpPaise: item.mrpPaise,
              sellingPricePaise: item.sellingPricePaise,
              discountPercentRounded: item.discountPercentRounded,
              discountBadgeLabel: item.discountBadgeLabel,
              compareAt: item.compareAt,
              rating: dynamicRating || 'No reviews yet',
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
                      gallery:
                        Array.isArray(v.images) && v.images.length > 0 ? v.images : [primaryImg],
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
    product: BestsellerItem,
    variant: (typeof BESTSELLERS)[0]['variants'][0],
    size: string,
  ) => {
    const finalPrice =
      product.effectivePrice !== undefined ? product.effectivePrice : product.price;
    addItem({
      id: `${product.id}_${variant.sku}_${size}`,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      color: variant.colorName,
      colorHex: variant.colorHex,
      size: size,
      price: finalPrice,
      regularPrice: product.price,
      compareAt: product.compareAt,
      discountBadgeLabel: product.discountBadgeLabel,
      image: variant.image,
      sku: variant.sku,
    });

    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
      openCart();
    }, 400);
  };

  const handleQuickAdd = (product: BestsellerItem) => {
    const variantIdx = activeVariants[product.id] || 0;
    const variant = product.variants[variantIdx];
    handleSelectSize(product, variant, variant.size);
  };

  return (
    <section
      aria-labelledby="bestseller-heading"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24"
    >
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between border-b border-[var(--border)] pb-6 sm:mb-12 md:flex-row md:items-end">
        <div>
          <span className="font-mono text-xs font-semibold tracking-[0.25em] text-[var(--text-secondary)] uppercase dark:text-[var(--accent)]">
            PROVEN IN TRAINING
          </span>
          <h2
            id="bestseller-heading"
            className="font-heading mt-2 text-2xl font-bold tracking-tighter text-balance text-[var(--text-primary)] uppercase sm:text-3xl md:text-5xl"
          >
            COMMUNITY BESTSELLERS
          </h2>
        </div>
        <Link
          href="/products?bestseller=true"
          className="mt-4 inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-widest text-[var(--text-primary)] uppercase transition-colors hover:text-[var(--text-secondary)] md:mt-0 dark:text-[var(--accent)] dark:hover:text-[var(--accent)]"
        >
          <span>VIEW LEADERBOARD</span>
          <ArrowRight size={14} weight="bold" />
        </Link>
      </div>

      {/* 2-Column Mobile / 3-Column Desktop Tactical Bestseller Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-6 lg:grid-cols-3">
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
              className="group flex flex-col border border-[var(--border)] bg-[var(--bg-surface)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--text-primary)]/40 hover:shadow-lg"
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
              <div className="flex flex-1 flex-col justify-between p-3 sm:p-5">
                <div>
                  {/* Swatches with Accessible Touch Targets */}
                  <div
                    className="mb-2 flex min-w-0 items-center gap-1.5 overflow-hidden sm:mb-3 sm:gap-2"
                    role="group"
                    aria-label={`Colorways for ${product.name}`}
                  >
                    {product.variants.map((v, sIdx) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() =>
                          setActiveVariants((prev) => ({ ...prev, [product.id]: sIdx }))
                        }
                        aria-label={`Select ${v.colorName}`}
                        className="touch-target relative -m-2 flex-shrink-0 p-2 focus:outline-none"
                      >
                        <span
                          className={`block h-3.5 w-3.5 rounded-full border transition-[transform,border-color] duration-150 active:scale-[0.97] sm:h-4 sm:w-4 ${
                            sIdx === activeIdx
                              ? 'scale-125 border-[#000000] shadow-sm ring-1 ring-[#000000] ring-offset-1 ring-offset-[var(--bg-surface)] dark:border-[var(--accent)] dark:ring-0'
                              : 'border border-black/20 hover:border-[var(--text-primary)] dark:border-white/20'
                          }`}
                          style={{ backgroundColor: v.colorHex }}
                        />
                      </button>
                    ))}
                    <span className="ml-1 min-w-0 truncate font-mono text-[9px] text-[var(--text-muted)] uppercase sm:text-[10px]">
                      {activeVar.colorName}
                    </span>
                  </div>

                  {/* Title & Link */}
                  <Link
                    href={`/products/${product.slug}`}
                    className="transition-colors hover:text-[var(--text-secondary)] dark:hover:text-zinc-300"
                  >
                    <h3 className="font-heading line-clamp-1 text-xs font-bold tracking-tight text-[var(--text-primary)] uppercase sm:text-base">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Rating string */}
                  <p className="mt-1 font-mono text-[10px] text-[var(--text-secondary)] sm:text-xs">
                    {product.rating}
                  </p>
                </div>

                {/* Price & Stock Hairline Divider */}
                <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-2.5 sm:mt-5 sm:pt-3">
                  <PriceDisplay
                    price={
                      product.effectivePrice !== undefined ? product.effectivePrice : product.price
                    }
                    regularPrice={product.price}
                    mrp={product.compareAt}
                    discountPercent={product.discountPercentRounded}
                    badgeLabel={product.discountBadgeLabel}
                    size="md"
                  />
                  <div className="flex items-center gap-1.5">
                    {/* Compact mobile quick add button */}
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(product)}
                      aria-label={`Quick add ${product.name} to bag`}
                      className="touch-target flex min-h-[48px] min-w-[48px] items-center justify-center bg-[var(--accent)] text-white transition-colors hover:bg-[var(--accent-hover)] active:scale-[0.97] sm:hidden dark:text-[#0a0a0a]"
                    >
                      {isAdded ? (
                        <Check size={14} weight="bold" />
                      ) : (
                        <ShoppingBag size={14} weight="bold" />
                      )}
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
