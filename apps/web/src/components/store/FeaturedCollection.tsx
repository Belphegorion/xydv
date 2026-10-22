'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { useCartStore } from '@/store/cart';
import { formatPrice, getAvailableSizes, type SizeOption } from '@/lib/utils';
import { ArrowRight, ShoppingBag, Check, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { EMIL_EASE } from '@/lib/motion';
import { api } from '@/lib/api';
import type { Product, ProductVariant } from '@vertex/types';

const FEATURED_PRODUCTS = [
  {
    id: 'prod_volt_tee_001',
    name: 'Volt Performance Tee',
    slug: 'volt-performance-tee',
    category: 'tops',
    price: 58.0,
    specs: 'SweatShield+ / 180 GSM / UPF 50+',
    variants: [
      {
        id: 'var_vpt_blk_m',
        sku: 'VPT-BLK-M',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        primaryImage: '/products/image-4-1.jpg',
        secondaryImage: '/products/image-5-2.jpg',
        gallery: [
          '/products/image-4-1.jpg',
          '/products/image-5-1.jpg',
          '/products/image-5-2.jpg',
          '/products/image-6-1.jpg',
        ],
        stock: 65,
      },
      {
        id: 'var_vpt_vlt_m',
        sku: 'VPT-VLT-M',
        colorName: 'Volt Stealth',
        colorHex: '#E8FF00',
        size: 'M',
        primaryImage: '/products/image-6-1.jpg',
        secondaryImage: '/products/image-7-1.jpg',
        gallery: [
          '/products/image-6-1.jpg',
          '/products/image-7-1.jpg',
          '/products/image-10-1.jpg',
          '/products/image-10-3.jpg',
        ],
        stock: 25,
      },
    ],
  },
  {
    id: 'prod_apex_shorts_002',
    name: 'Apex Modular Training Shorts',
    slug: 'apex-modular-training-shorts',
    category: 'bottoms',
    price: 72.0,
    specs: 'AeroFlex 5" / Compression Liner / YKK Aquaguard',
    variants: [
      {
        id: 'var_ats_blk_m',
        sku: 'ATS-BLK-M',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        primaryImage: '/products/image-8-1.jpg',
        secondaryImage: '/products/image-11-1.jpg',
        gallery: [
          '/products/image-8-1.jpg',
          '/products/image-11-1.jpg',
          '/products/image-11-2.jpg',
          '/products/image-14-1.jpg',
        ],
        stock: 50,
      },
      {
        id: 'var_ats_olv_m',
        sku: 'ATS-OLV-M',
        colorName: 'Tactical Olive',
        colorHex: '#4A5340',
        size: 'M',
        primaryImage: '/products/image-12-2.jpg',
        secondaryImage: '/products/image-13-1.jpg',
        gallery: [
          '/products/image-12-2.jpg',
          '/products/image-13-1.jpg',
          '/products/image-13-2.jpg',
          '/products/image-14-2.jpg',
        ],
        stock: 30,
      },
    ],
  },
  {
    id: 'prod_stealth_hoodie_003',
    name: 'Stealth Tactical Tech Hoodie',
    slug: 'stealth-tactical-tech-hoodie',
    category: 'outerwear',
    price: 148.0,
    specs: '420 GSM Thermal / Cordura 500D Ballistic Elbows',
    variants: [
      {
        id: 'var_sth_blk_m',
        sku: 'STH-BLK-M',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'M',
        primaryImage: '/products/image-9-1.jpg',
        secondaryImage: '/products/image-15-3.jpg',
        gallery: [
          '/products/image-9-1.jpg',
          '/products/image-15-3.jpg',
          '/products/image-15-1.jpg',
          '/products/image-12-1.jpg',
        ],
        stock: 20,
      },
    ],
  },
  {
    id: 'prod_tactical_cap_004',
    name: 'Modular Tactical Cap',
    slug: 'modular-tactical-cap',
    category: 'accessories',
    price: 38.0,
    specs: 'Laser-Cut Vent Matrix / Fidlock V-Buckle',
    variants: [
      {
        id: 'var_mtc_blk_os',
        sku: 'MTC-BLK-OS',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'OS',
        primaryImage: '/products/image-15-2.jpg',
        secondaryImage: '/products/image-16-1.jpg',
        gallery: [
          '/products/image-15-2.jpg',
          '/products/image-16-1.jpg',
          '/products/image-16-2.jpg',
          '/products/image-12-3.jpg',
        ],
        stock: 100,
      },
    ],
  },
  {
    id: 'prod_juni_wrap_top_005',
    name: 'Juni Wrap-Neck Top',
    slug: 'juni-wrap-neck-top',
    category: 'tops',
    price: 64.0,
    specs: 'Crossover Wrap Neckline / Asymmetric Split Hem',
    variants: [
      {
        id: 'var_jwt_blk_s',
        sku: 'JWT-BLK-S',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'S',
        primaryImage: '/products/image-25-1.jpg',
        secondaryImage: '/products/image-25-2.jpg',
        gallery: [
          '/products/image-25-1.jpg',
          '/products/image-25-2.jpg',
          '/products/image-24-1.jpg',
          '/products/image-22-1.jpg',
        ],
        stock: 45,
      },
      {
        id: 'var_jwt_slv_s',
        sku: 'JWT-SLV-S',
        colorName: 'Muted Silver',
        colorHex: '#B0B0B0',
        size: 'S',
        primaryImage: '/products/image-22-1.jpg',
        secondaryImage: '/products/image-23-1.jpg',
        gallery: [
          '/products/image-22-1.jpg',
          '/products/image-23-1.jpg',
          '/products/image-24-1.jpg',
          '/products/image-25-1.jpg',
        ],
        stock: 30,
      },
    ],
  },
  {
    id: 'prod_activewear_set_006',
    name: 'AeroFlex Women Activewear Set',
    slug: 'aeroflex-women-activewear-set',
    category: 'sets',
    price: 118.0,
    specs: 'Cropped Zip Jacket & High-Waisted Shorts / Compression Fit',
    variants: [
      {
        id: 'var_was_olv_s',
        sku: 'WAS-OLV-S',
        colorName: 'Tactical Olive',
        colorHex: '#4A5340',
        size: 'S',
        primaryImage: '/products/image-30-1.jpg',
        secondaryImage: '/products/image-31-1.jpg',
        gallery: [
          '/products/image-30-1.jpg',
          '/products/image-31-1.jpg',
          '/products/image-29-1.jpg',
          '/products/image-32-1.jpg',
        ],
        stock: 35,
      },
      {
        id: 'var_was_blk_s',
        sku: 'WAS-BLK-S',
        colorName: 'Void Obsidian',
        colorHex: '#0A0A0A',
        size: 'S',
        primaryImage: '/products/image-29-1.jpg',
        secondaryImage: '/products/image-32-1.jpg',
        gallery: [
          '/products/image-29-1.jpg',
          '/products/image-32-1.jpg',
          '/products/image-30-1.jpg',
          '/products/image-31-1.jpg',
        ],
        stock: 28,
      },
    ],
  },
];

interface ProductCardMediaProps {
  product: (typeof FEATURED_PRODUCTS)[0];
  activeVariant: (typeof FEATURED_PRODUCTS)[0]['variants'][0];
  isAdded: boolean;
  onSelectSize: (size: string) => void;
  cardIndex: number;
}

function ProductCardMedia({
  product,
  activeVariant,
  isAdded,
  onSelectSize,
  cardIndex,
}: ProductCardMediaProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const gallery =
    activeVariant.gallery && activeVariant.gallery.length > 0
      ? activeVariant.gallery
      : [activeVariant.primaryImage, activeVariant.secondaryImage].filter(Boolean);

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

    const cadence = 4200 + (cardIndex % 4) * 600;
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
      {/* Native CSS Scroll-Snap Gallery Track — 2-finger trackpad on laptop & 1-finger touch on mobile */}
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
        aria-label={`${product.name} image gallery`}
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
              className="object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
              priority={imgIdx === 0}
            />
          </div>
        ))}
      </div>

      {/* Contract 5.3: Secondary image crossfade presence */}
      {activeVariant.secondaryImage && (
        <Image
          src={activeVariant.secondaryImage}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="aspect-[3/4] secondaryImage opacity-0 group-hover:opacity-100 pointer-events-none object-cover object-center transition-opacity duration-300 z-10"
          aria-hidden="true"
        />
      )}

      {/* Progress Dots / Segment Indicators */}
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
              className="touch-target relative p-2 -m-2 flex items-center justify-center pointer-events-auto cursor-pointer focus:outline-none"
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
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white items-center justify-center opacity-0 group-hover/media:opacity-100 hover:bg-black/90 transition-opacity duration-200 active:scale-[0.97]"
            aria-label="Previous image"
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              const next = (activeImageIdx + 1) % gallery.length;
              scrollToSlide(next, e);
            }}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white items-center justify-center opacity-0 group-hover/media:opacity-100 hover:bg-black/90 transition-opacity duration-200 active:scale-[0.97]"
            aria-label="Next image"
          >
            <CaretRight size={14} weight="bold" />
          </button>
        </>
      )}

      {/* Category / Tech Badge */}
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 pointer-events-none">
        <Badge variant="subtle" size="sm">
          {product.category}
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

export function FeaturedCollection() {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const shouldReduceMotion = useReducedMotion();
  const [products, setProducts] = useState(FEATURED_PRODUCTS);

  useEffect(() => {
    let isMounted = true;
    api
      .get<{ data?: Product[]; products?: Product[] }>('/products?featured=true')
      .then((res) => {
        if (!isMounted) return;
        const raw = res?.data ?? res?.products;
        if (Array.isArray(raw) && raw.length > 0) {
          const staticMap = new Map(FEATURED_PRODUCTS.map((p) => [p.slug, p]));
          const mapped = raw.slice(0, 6).map((item) => {
            const st = staticMap.get(item.slug);
            if (st) {
              return {
                ...st,
                price: typeof item.price === 'number' ? item.price : st.price,
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
                          primaryImage: v.imageUrl || staticVar.primaryImage,
                          secondaryImage: v.secondaryImageUrl || staticVar.secondaryImage,
                          gallery: Array.isArray(v.images) && v.images.length > 0 ? v.images : staticVar.gallery,
                          stock: typeof v.stock === 'number' ? v.stock : staticVar.stock,
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
              specs: item.specsSummary || (item.specs ? item.specs.map((s) => s.value).join(' / ') : 'Engineered Activewear / High Performance'),
              variants:
                Array.isArray(item.variants) && item.variants.length > 0
                  ? item.variants.map((v: ProductVariant, idx: number) => ({
                      id: v._id || v.id || `var_${item.slug}_${idx}`,
                      sku: v.sku || `SKU-${idx}`,
                      colorName: v.colorName || v.color || 'Void Obsidian',
                      colorHex: v.colorHex || '#0A0A0A',
                      size: v.size || 'M',
                      primaryImage: v.imageUrl || primaryImg,
                      secondaryImage: v.secondaryImageUrl || secondaryImg,
                      gallery: Array.isArray(v.images) && v.images.length > 0 ? v.images : [primaryImg],
                      stock: typeof v.stock === 'number' ? v.stock : 50,
                    }))
                  : [
                      {
                        id: `var_${item.slug}_0`,
                        sku: `SKU-${item.slug}`,
                        colorName: 'Void Obsidian',
                        colorHex: '#0A0A0A',
                        size: 'M',
                        primaryImage: primaryImg,
                        secondaryImage: secondaryImg,
                        gallery: [primaryImg],
                        stock: 50,
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

  // Track active variant per product
  const [activeVariants, setActiveVariants] = useState<Record<string, number>>({
    prod_volt_tee_001: 0,
    prod_apex_shorts_002: 0,
    prod_stealth_hoodie_003: 0,
    prod_tactical_cap_004: 0,
    prod_juni_wrap_top_005: 0,
    prod_activewear_set_006: 0,
  });

  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const handleSelectSize = (
    product: (typeof FEATURED_PRODUCTS)[0],
    variant: (typeof FEATURED_PRODUCTS)[0]['variants'][0],
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
      image: variant.primaryImage,
      sku: variant.sku,
    });

    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
      openCart();
    }, 400);
  };

  const handleQuickAdd = (product: (typeof FEATURED_PRODUCTS)[0]) => {
    const variantIndex = activeVariants[product.id] || 0;
    const variant = product.variants[variantIndex];
    handleSelectSize(product, variant, variant.size);
  };

  return (
    <section aria-labelledby="featured-heading" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 border-b border-[var(--border)] pb-6">
        <div>
          <span className="text-[var(--text-secondary)] dark:text-[var(--accent)] text-xs font-mono font-semibold uppercase tracking-[0.25em]">
            CURATED / NEW ARRIVALS
          </span>
          <h2
            id="featured-heading"
            className="text-[var(--text-primary)] text-3xl md:text-5xl font-bold uppercase tracking-tighter font-heading mt-2"
          >
            THE TACTICAL SELECTION
          </h2>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-[var(--text-primary)] dark:text-zinc-200 text-xs font-mono font-semibold uppercase tracking-widest hover:text-[var(--text-secondary)] dark:hover:text-white transition-colors mt-4 md:mt-0"
        >
          <span>VIEW FULL CATALOG</span>
          <ArrowRight size={14} weight="bold" />
        </Link>
      </div>

      {/* Product Grid — Strictly aspect-[3/4] in 2-column mobile / 3-column desktop layout */}
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
                delay: shouldReduceMotion ? 0 : idx * 0.06,
                ease: EMIL_EASE,
              }}
              className="group flex flex-col bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--text-primary)]/40 hover:shadow-lg transition-[border-color,box-shadow] duration-200"
            >
              {/* Product Card Media Box with Auto-Change Gallery & Quick-Size Selector */}
              <ProductCardMedia
                product={product}
                activeVariant={activeVar}
                isAdded={isAdded}
                onSelectSize={(size) => handleSelectSize(product, activeVar, size)}
                cardIndex={idx}
              />

              {/* Product Meta */}
              <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
                <div>
                  {/* Swatches with Accessible Touch Targets */}
                  <div
                    className="flex items-center gap-1.5 sm:gap-2 mb-2 min-w-0 overflow-hidden"
                    role="group"
                    aria-label="Available colorways"
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
                    <h3 className="text-[var(--text-primary)] text-xs sm:text-sm font-bold uppercase tracking-tight font-heading line-clamp-1">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Micro Specs */}
                  <p className="text-[var(--text-muted)] text-[10px] sm:text-[11px] font-mono mt-0.5 line-clamp-1">
                    {product.specs}
                  </p>
                </div>

                {/* Price & Actions */}
                <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-[var(--text-primary)] text-xs sm:text-sm font-mono font-bold">
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
