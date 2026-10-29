'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  MagnifyingGlass,
  X,
  SlidersHorizontal,
  Heart,
  ShoppingBag,
  Check,
  CaretLeft,
  CaretRight,
  ArrowsDownUp,
} from '@phosphor-icons/react';
import { CATALOG_PRODUCTS, CatalogProduct, ProductVariant } from '@/lib/catalog';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { Badge } from '@/components/ui/Badge';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { formatPrice, getAvailableSizes, formatCardTitle } from '@/lib/utils';
import { EMIL_EASE, SPRING_TACTILE } from '@/lib/motion';
import { api } from '@/lib/api';

interface ApiProductVariant {
  _id?: string;
  id?: string;
  sku?: string;
  color?: string;
  colorName?: string;
  colorHex?: string;
  size?: string;
  imageUrl?: string;
  secondaryImageUrl?: string;
  images?: string[];
  stock?: number;
}

interface ApiProductInput {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  category?: string;
  discipline?: string;
  gender?: string;
  price?: number;
  compareAt?: number;
  mrpPaise?: number;
  sellingPricePaise?: number;
  effectivePricePaise?: number;
  discountAmountPaise?: number;
  discountPercentRounded?: number;
  discountBadgeLabel?: string;
  specsSummary?: string;
  description?: string;
  features?: string[];
  variants?: ApiProductVariant[];
  averageRating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  bestseller?: boolean;
}

function parseCategory(val: unknown): CatalogProduct['category'] {
  if (val === 'bottoms' || val === 'outerwear' || val === 'accessories') return val;
  return 'tops';
}

function parseDiscipline(val: unknown): CatalogProduct['discipline'] {
  if (val === 'run' || val === 'rec') return val;
  return 'train';
}

function parseGender(val: unknown): CatalogProduct['gender'] {
  if (val === 'men' || val === 'women') return val;
  return 'unisex';
}

function mapApiProductToCatalog(
  apiProd: ApiProductInput,
  existingStatic?: CatalogProduct,
): CatalogProduct {
  if (existingStatic) {
    return {
      ...existingStatic,
      id: apiProd._id || apiProd.id || existingStatic.id,
      name: apiProd.name || existingStatic.name,
      slug: apiProd.slug || existingStatic.slug,
      description: apiProd.description || existingStatic.description,
      category: parseCategory(apiProd.category || existingStatic.category),
      discipline: parseDiscipline(apiProd.discipline || existingStatic.discipline),
      gender: parseGender(apiProd.gender || existingStatic.gender),
      price: typeof apiProd.price === 'number' ? apiProd.price : existingStatic.price,
      compareAtPrice:
        typeof apiProd.compareAt === 'number' ? apiProd.compareAt : existingStatic.compareAtPrice,
      specsSummary: apiProd.specsSummary || existingStatic.specsSummary,
      headline: apiProd.name || existingStatic.headline,
      features:
        Array.isArray(apiProd.features) && apiProd.features.length > 0
          ? apiProd.features
          : existingStatic.features,
      isFeatured:
        typeof apiProd.isFeatured === 'boolean' ? apiProd.isFeatured : existingStatic.isFeatured,
      isBestseller:
        typeof apiProd.bestseller === 'boolean'
          ? apiProd.bestseller
          : existingStatic.isBestseller,
      mrpPaise: apiProd.mrpPaise,
      sellingPricePaise: apiProd.sellingPricePaise,
      effectivePricePaise: apiProd.effectivePricePaise,
      discountAmountPaise: apiProd.discountAmountPaise,
      discountPercentRounded: apiProd.discountPercentRounded,
      discountBadgeLabel: apiProd.discountBadgeLabel,
      variants:
        Array.isArray(apiProd.variants) && apiProd.variants.length > 0
          ? apiProd.variants.map((v: ApiProductVariant, idx: number) => {
              const staticVar = existingStatic.variants[idx] ?? existingStatic.variants[0];
              return {
                id: v._id || v.id || staticVar?.id || `var_${idx}`,
                sku: v.sku || staticVar?.sku || '',
                colorName: v.colorName || v.color || staticVar?.colorName || '',
                colorHex: v.colorHex || staticVar?.colorHex || '#000000',
                size: v.size || staticVar?.size || '',
                primaryImage: v.imageUrl || staticVar?.primaryImage || '/lookbook/image-2-1.jpg',
                secondaryImage: v.secondaryImageUrl ?? staticVar?.secondaryImage,
                gallery:
                  Array.isArray(v.images) && v.images.length > 0
                    ? v.images
                    : staticVar?.gallery ?? [],
                stock: typeof v.stock === 'number' ? v.stock : staticVar?.stock ?? 0,
              };
            })
          : existingStatic.variants,
    };
  }

  const firstVariant = apiProd.variants?.[0];
  const primaryImg =
    firstVariant?.imageUrl || firstVariant?.images?.[0] || '/lookbook/image-2-1.jpg';
  const secondaryImg = firstVariant?.secondaryImageUrl || firstVariant?.images?.[1] || primaryImg;

  return {
    id: apiProd._id || apiProd.id || `prod_${apiProd.slug}`,
    name: apiProd.name,
    slug: apiProd.slug,
    category: parseCategory(apiProd.category),
    discipline: parseDiscipline(apiProd.discipline),
    gender: parseGender(apiProd.gender),
    price: typeof apiProd.price === 'number' ? apiProd.price : 50,
    compareAtPrice: apiProd.compareAt,
    mrpPaise: apiProd.mrpPaise,
    sellingPricePaise: apiProd.sellingPricePaise,
    effectivePricePaise: apiProd.effectivePricePaise,
    discountAmountPaise: apiProd.discountAmountPaise,
    discountPercentRounded: apiProd.discountPercentRounded,
    discountBadgeLabel: apiProd.discountBadgeLabel,
    specsSummary: apiProd.specsSummary || 'Engineered Activewear / High Performance',
    headline: apiProd.name,
    description: apiProd.description || 'XYDV Technical Apparel.',
    fabricDetails: {
      composition: 'Cordura® Ballistic Weave / 4-Way Stretch Nylon',
      weightGsm: 180,
      technology: 'SweatShield+',
      finish: 'Hydrophobic DWR Coating',
    },
    features: apiProd.features || ['Moisture-wicking', 'Ergonomic fit', 'Reinforced stitching'],
    careInstructions: ['Machine wash cold', 'Tumble dry low', 'Do not bleach'],
    biomechanics: 'Engineered for unrestrained range of motion under high thermal output.',
    variants:
      Array.isArray(apiProd.variants) && apiProd.variants.length > 0
        ? apiProd.variants.map((v: ApiProductVariant, idx: number) => ({
            id: v._id || v.id || `var_${apiProd.slug}_${idx}`,
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
              id: `var_${apiProd.slug}_0`,
              sku: `SKU-${apiProd.slug}`,
              colorName: 'Void Obsidian',
              colorHex: '#0A0A0A',
              size: 'M',
              primaryImage: primaryImg,
              secondaryImage: secondaryImg,
              gallery: [primaryImg],
              stock: 50,
            },
          ],
    rating: typeof apiProd.averageRating === 'number' ? apiProd.averageRating : 0,
    reviewCount: typeof apiProd.reviewCount === 'number' ? apiProd.reviewCount : 0,
    reviews: [],
    isFeatured: apiProd.isFeatured,
    isBestseller: apiProd.bestseller,
  };
}

const CATEGORIES = [
  { label: 'All gear', value: 'all' },
  { label: 'Tops', value: 'tops' },
  { label: 'Bottoms', value: 'bottoms' },
  { label: 'Outerwear', value: 'outerwear' },
  { label: 'Accessories', value: 'accessories' },
];

const DISCIPLINES = [
  { label: 'All disciplines', value: 'all' },
  { label: 'Run (div.01)', value: 'run' },
  { label: 'Train (div.02)', value: 'train' },
  { label: 'Rec (div.03)', value: 'rec' },
];

const GENDERS = [
  { label: 'All divisions', value: 'all' },
  { label: "Men's", value: 'men' },
  { label: "Women's", value: 'women' },
];

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Bestseller', value: 'bestseller' },
  { label: 'Price: low to high', value: 'price-asc' },
  { label: 'Price: high to low', value: 'price-desc' },
  { label: 'Newest', value: 'newest' },
];

function CatalogCard({
  product,
  onSelectSize,
  isAdded,
  priority = false,
}: {
  product: CatalogProduct;
  onSelectSize: (product: CatalogProduct, variant: ProductVariant, size: string) => void;
  isAdded: boolean;
  priority?: boolean;
}) {
  const [activeVariantIdx, setActiveVariantIdx] = useState(0);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const activeVariant = product.variants[activeVariantIdx] || product.variants[0];
  const gallery = activeVariant.gallery?.length
    ? activeVariant.gallery
    : [activeVariant.primaryImage, activeVariant.secondaryImage || activeVariant.primaryImage];

  const sizes = getAvailableSizes(product.category, activeVariant.sku, product.variants);

  // Reset image idx when variant changes
  useEffect(() => {
    setActiveImageIdx(0);
  }, [activeVariantIdx]);

  const scrollToSlide = (idx: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveImageIdx(idx);
    if (trackRef.current) {
      const targetLeft = idx * trackRef.current.clientWidth;
      trackRef.current.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(false);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX.current - touchEndX;
    if (Math.abs(deltaX) > 40) {
      setIsSwiping(true);
      if (deltaX > 0 && activeImageIdx < gallery.length - 1) {
        scrollToSlide(activeImageIdx + 1);
      } else if (deltaX < 0 && activeImageIdx > 0) {
        scrollToSlide(activeImageIdx - 1);
      }
    }
    touchStartX.current = null;
  };

  return (
    <div className="group relative flex flex-col border border-[var(--border)] bg-[var(--bg-surface)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--text-primary)] hover:shadow-lg">
      {/* Media Tile */}
      <div className="group/media relative aspect-[3/4] w-full overflow-hidden bg-black/5 dark:bg-black">
        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: activeVariant.primaryImage,
            });
          }}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from saved items`
              : `Save ${product.name} to wishlist`
          }
          className="touch-target absolute top-2 right-2 z-30 flex h-10 min-h-[40px] w-10 min-w-[40px] items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-[background-color,border-color,color,transform] duration-200 hover:border-white hover:bg-white hover:text-black active:scale-[0.97] sm:top-3 sm:right-3"
        >
          <Heart
            size={18}
            weight={isWishlisted ? 'fill' : 'bold'}
            className={isWishlisted ? 'text-[var(--accent)]' : ''}
          />
        </button>

        {/* Category & Discipline Badge */}
        <div className="pointer-events-none absolute top-2 left-2 z-20 flex flex-col gap-1 sm:top-3 sm:left-3">
          <Badge variant="subtle" size="sm">
            {product.category}
          </Badge>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="bg-[var(--accent)] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[var(--accent-foreground)] uppercase">
              SAVE{' '}
              {Math.round(
                ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100,
              )}
              %
            </span>
          )}
        </div>

        {/* Gallery Scroll Track */}
        <div
          ref={trackRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-hidden scroll-smooth"
        >
          {gallery.map((imgUrl, iIdx) => (
            <div key={imgUrl + iIdx} className="relative h-full w-full flex-shrink-0 snap-center">
              <Link
                href={`/products/${product.slug}`}
                onClick={(e) => {
                  if (isSwiping) e.preventDefault();
                }}
                className="relative block h-full w-full"
              >
                <Image
                  src={imgUrl}
                  alt={`${product.name} - ${activeVariant.colorName} view ${iIdx + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-center transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
                  priority={iIdx === 0 && (priority || product.isFeatured)}
                />
              </Link>
            </div>
          ))}
        </div>

        {/* Gallery Progress Dots */}
        {gallery.length > 1 && (
          <div className="absolute bottom-1 left-1/2 z-10 flex -translate-x-1/2 items-center transition-opacity duration-200 sm:group-hover/media:opacity-0">
            {gallery.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={(e) => scrollToSlide(dotIdx, e)}
                aria-label={`View image slide ${dotIdx + 1}`}
                className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center border-0 bg-transparent p-0"
              >
                <span
                  className={`block h-1.5 rounded-full transition-[width,background-color] duration-200 ${
                    dotIdx === activeImageIdx
                      ? 'w-4 bg-white shadow-xs'
                      : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        {/* Chevrons on Desktop Hover */}
        {gallery.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                const prev = (activeImageIdx - 1 + gallery.length) % gallery.length;
                scrollToSlide(prev, e);
              }}
              className="absolute top-1/2 left-1 z-20 hidden min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center opacity-0 transition-opacity duration-200 group-hover/media:opacity-100 focus:outline-none sm:flex"
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
              className="absolute top-1/2 right-1 z-20 hidden min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center opacity-0 transition-opacity duration-200 group-hover/media:opacity-100 focus:outline-none sm:flex"
              aria-label="Next image"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/90 active:scale-[0.97]">
                <CaretRight size={14} weight="bold" />
              </span>
            </button>
          </>
        )}

        {/* Desktop Quick Size Selector HUD */}
        <div className="pointer-events-none absolute inset-x-2 bottom-2 z-20 hidden translate-y-2 flex-col items-center justify-center border border-black/10 bg-white/95 px-2 py-1.5 opacity-0 shadow-lg backdrop-blur-md transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 sm:inset-x-2.5 sm:bottom-2.5 sm:flex dark:border-white/15 dark:bg-[#0a0a0a]/92 dark:shadow-2xl">
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
                onSelectSize(product, activeVariant, sizes[0].size);
              }}
              className={`flex h-[26px] w-full items-center justify-center px-2 font-mono text-[9.5px] font-bold tracking-widest uppercase transition-[background-color,border-color,color,transform] duration-150 focus-visible:ring-1 focus-visible:ring-black focus-visible:outline-none active:scale-[0.97] dark:focus-visible:ring-white ${
                sizes[0].inStock
                  ? 'cursor-pointer border border-black/10 bg-black/5 text-black shadow-xs hover:border-black hover:bg-black hover:text-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-[#0a0a0a]'
                  : 'cursor-not-allowed border border-black/5 bg-black/[0.02] text-zinc-400 line-through select-none dark:border-white/10 dark:bg-white/[0.02] dark:text-zinc-600'
              }`}
            >
              QUICK ADD · ONE SIZE (OS)
            </button>
          ) : (
            <div className="grid w-full grid-cols-6 gap-1">
              {sizes.map((s) => (
                <button
                  key={s.size}
                  type="button"
                  disabled={!s.inStock}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectSize(product, activeVariant, s.size);
                  }}
                  className={`flex h-[26px] items-center justify-center font-mono text-[10px] font-bold uppercase transition-[background-color,border-color,color,transform] duration-150 focus-visible:ring-1 focus-visible:ring-black focus-visible:outline-none active:scale-[0.97] dark:focus-visible:ring-white ${
                    s.inStock
                      ? 'cursor-pointer border border-black/10 bg-black/5 text-black shadow-xs hover:border-black hover:bg-black hover:text-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-[#0a0a0a]'
                      : 'cursor-not-allowed border border-black/5 bg-black/[0.02] text-zinc-400 line-through select-none dark:border-white/10 dark:bg-white/[0.02] dark:text-zinc-600'
                  }`}
                  aria-label={
                    s.inStock ? `Add size ${s.size} to bag` : `Size ${s.size} out of stock`
                  }
                >
                  {s.size}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Meta Area */}
      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
        <div>
          {/* Swatches */}
          <div
            className="mb-2 flex min-w-0 items-center gap-1.5 overflow-hidden"
            role="group"
            aria-label="Available colorways"
          >
            {product.variants.map((v, vIdx) => (
              <button
                key={v.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveVariantIdx(vIdx);
                }}
                aria-label={`Select ${v.colorName}`}
                className="touch-target relative -m-1.5 flex-shrink-0 p-1.5 focus:outline-none"
              >
                <span
                  className={`block h-3.5 w-3.5 rounded-full border transition-[transform,border-color] duration-150 ${
                    vIdx === activeVariantIdx
                      ? 'scale-125 border-black shadow-xs ring-1 ring-black ring-offset-1 ring-offset-[var(--bg-surface)] dark:border-[var(--accent)] dark:ring-0'
                      : 'border-black/20 hover:border-[var(--text-primary)] dark:border-white/20'
                  }`}
                  style={{ backgroundColor: v.colorHex }}
                />
              </button>
            ))}
            <span className="ml-1.5 truncate font-mono text-[10px] text-[var(--text-muted)] uppercase">
              {activeVariant.colorName}
            </span>
          </div>

          {/* Title */}
          <Link
            href={`/products/${product.slug}`}
            className="transition-colors hover:text-[var(--text-secondary)] dark:hover:text-zinc-300"
          >
            <h3 className="font-heading line-clamp-1 text-xs font-bold tracking-tight text-[var(--text-primary)] sm:text-sm">
              {formatCardTitle(product.name)}
            </h3>
          </Link>

          {/* Micro Specs */}
          <p className="mt-0.5 line-clamp-1 font-mono text-[10px] text-[var(--text-muted)] sm:text-[11px]">
            {product.specsSummary}
          </p>
        </div>

        {/* Price & Mobile Add Button */}
        <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5">
          <PriceDisplay
            price={
              product.effectivePricePaise !== undefined
                ? product.effectivePricePaise / 100
                : product.price
            }
            regularPrice={product.price}
            mrp={product.compareAtPrice}
            discountPercent={product.discountPercentRounded}
            badgeLabel={product.discountBadgeLabel}
            size="sm"
          />

          <div className="sm:hidden">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectSize(product, activeVariant, activeVariant.size);
              }}
              className="touch-target flex min-h-[40px] min-w-[40px] items-center justify-center bg-[var(--text-primary)] px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-[var(--bg)] uppercase active:scale-[0.97]"
              aria-label={`Add ${product.name} to bag`}
            >
              <ShoppingBag size={14} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlCategory = searchParams.get('category') || 'all';
  const urlDiscipline = searchParams.get('discipline') || 'all';
  const urlGender = searchParams.get('gender') || 'all';
  const urlSearch = searchParams.get('search') || '';

  const [category, setCategory] = useState(urlCategory);
  const [discipline, setDiscipline] = useState(urlDiscipline);
  const [gender, setGender] = useState(urlGender);
  const [search, setSearch] = useState(urlSearch === 'true' ? '' : urlSearch);
  const [sort, setSort] = useState('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [earlyAccessEmail, setEarlyAccessEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  // Dynamically load products from backend API
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    api
      .get<{ data?: ApiProductInput[]; products?: ApiProductInput[] }>('/products?limit=100')
      .then((res) => {
        if (!isMounted) return;
        const raw = res?.data ?? res?.products;
        if (Array.isArray(raw)) {
          const staticMap = new Map(CATALOG_PRODUCTS.map((p) => [p.slug, p]));
          const loaded: CatalogProduct[] = raw.map((item) =>
            mapApiProductToCatalog(item, staticMap.get(item.slug)),
          );
          setCatalogProducts(loaded);
        } else {
          setCatalogProducts([]);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setCatalogProducts([]);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync state with URL params
  useEffect(() => {
    if (urlCategory) setCategory(urlCategory);
    if (urlDiscipline) setDiscipline(urlDiscipline);
    if (urlGender) setGender(urlGender);
    if (urlSearch && urlSearch !== 'true') setSearch(urlSearch);
  }, [urlCategory, urlDiscipline, urlGender, urlSearch]);

  const handleSelectSize = (product: CatalogProduct, variant: ProductVariant, size: string) => {
    const finalPrice =
      product.effectivePricePaise !== undefined
        ? product.effectivePricePaise / 100
        : product.price;
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
      compareAt: product.compareAtPrice,
      discountBadgeLabel: product.discountBadgeLabel,
      image: variant.primaryImage,
      sku: variant.sku,
    });

    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
      openCart();
    }, 350);
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    let list = [...catalogProducts];

    // Exclude women's clothing from active general catalog listings
    if (gender === 'all') {
      list = list.filter((p) => p.gender !== 'women');
    } else if (gender === 'men') {
      list = list.filter((p) => p.gender === 'men' || p.gender === 'unisex');
    } else if (gender === 'women') {
      list = list.filter((p) => p.gender === 'women');
    }

    if (category !== 'all') {
      list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    if (discipline !== 'all') {
      list = list.filter((p) => p.discipline.toLowerCase() === discipline.toLowerCase());
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.specsSummary.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.discipline.toLowerCase().includes(q),
      );
    }

    if (inStockOnly) {
      list = list.filter((p) => p.variants.some((v) => v.stock > 0));
    }

    if (sort === 'price-asc') {
      list.sort((a, b) => {
        const pA = a.effectivePricePaise !== undefined ? a.effectivePricePaise / 100 : a.price;
        const pB = b.effectivePricePaise !== undefined ? b.effectivePricePaise / 100 : b.price;
        return pA - pB;
      });
    } else if (sort === 'price-desc') {
      list.sort((a, b) => {
        const pA = a.effectivePricePaise !== undefined ? a.effectivePricePaise / 100 : a.price;
        const pB = b.effectivePricePaise !== undefined ? b.effectivePricePaise / 100 : b.price;
        return pB - pA;
      });
    } else if (sort === 'bestseller') {
      list.sort(
        (a, b) =>
          (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0) || b.reviewCount - a.reviewCount,
      );
    } else if (sort === 'newest') {
      list.reverse();
    } else {
      list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return list;
  }, [category, discipline, gender, search, sort, inStockOnly, catalogProducts]);

  const hasActiveFilters =
    category !== 'all' ||
    discipline !== 'all' ||
    gender !== 'all' ||
    search.trim().length > 0 ||
    inStockOnly;

  const resetFilters = () => {
    setCategory('all');
    setDiscipline('all');
    setGender('all');
    setSearch('');
    setInStockOnly(false);
    setSort('featured');
    setEarlyAccessEmail('');
    setEmailSubmitted(false);
    router.push('/products');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-24 pb-24 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Page Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-8 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
              <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                ARCHIVE CATALOG
              </span>
            </div>
            <h1 className="font-heading text-2xl font-black tracking-tight text-balance text-[var(--text-primary)] uppercase sm:text-3xl md:text-5xl">
              TECHNICAL DIVISION
            </h1>
            <p className="mt-2 max-w-xl font-sans text-xs text-[var(--text-secondary)] sm:text-sm">
              Engineered garments designed for high kinetic output, friction resistance, and thermal
              equilibrium.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[var(--text-muted)] uppercase">
              SHOWING {filteredProducts.length} OF {catalogProducts.length} PIECES
            </span>
          </div>
        </div>

        {/* Primary Filter Bar: Category Tabs & Search */}
        <div className="mb-6 flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
          {/* Category Tabs */}
          <div
            className="flex no-scrollbar items-center gap-1 overflow-x-auto pb-2 sm:gap-2 lg:pb-0"
            role="tablist"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                role="tab"
                aria-selected={category === cat.value}
                onClick={() => setCategory(cat.value)}
                className={`touch-target px-3.5 py-2 font-mono text-xs font-bold tracking-wider whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] ${
                  category === cat.value
                    ? 'border border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg)] shadow-sm'
                    : 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative max-w-md flex-1">
            <MagnifyingGlass
              size={16}
              weight="bold"
              className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              id="catalog-search"
              name="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hardware..."
              className="min-h-[44px] h-11 w-full border border-[var(--border)] bg-[var(--bg-elevated)] pr-9 pl-10 font-mono text-base sm:text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)] focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Row: Disciplines, Genders, Sort, and In-Stock */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Discipline Dropdown / Pills */}
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="filter-discipline"
                className="hidden font-mono text-[10px] text-[var(--text-muted)] sm:inline"
              >
                Discipline:
              </label>
              <select
                id="filter-discipline"
                name="discipline"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="min-h-[44px] h-10 cursor-pointer border border-[var(--border)] bg-[var(--bg-elevated)] px-3 font-mono text-base sm:text-[11px] text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none sm:min-h-0 sm:h-8"
                aria-label="Filter by discipline"
              >
                {DISCIPLINES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender Division */}
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="filter-gender"
                className="hidden font-mono text-[10px] text-[var(--text-muted)] sm:inline"
              >
                Division:
              </label>
              <select
                id="filter-gender"
                name="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="min-h-[44px] h-10 cursor-pointer border border-[var(--border)] bg-[var(--bg-elevated)] px-3 font-mono text-base sm:text-[11px] text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none sm:min-h-0 sm:h-8"
                aria-label="Filter by gender division"
              >
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            {/* In-Stock Toggle */}
            <label htmlFor="filter-in-stock" className="flex min-h-[44px] cursor-pointer items-center gap-2 select-none py-1.5">
              <input
                id="filter-in-stock"
                name="inStockOnly"
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded-none border-[var(--border)] accent-[var(--accent)]"
              />
              <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                In stock only
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0">
            {/* Sort Dropdown */}
            <div className="flex flex-1 sm:flex-initial items-center gap-1.5 min-w-0">
              <ArrowsDownUp size={14} className="shrink-0 text-[var(--text-muted)]" />
              <select
                id="sort-products"
                name="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="min-h-[44px] h-10 w-full sm:w-auto min-w-0 max-w-full cursor-pointer border border-[var(--border)] bg-[var(--bg-elevated)] px-3 font-mono text-base sm:text-[11px] text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none sm:min-h-0 sm:h-8"
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters Pill */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="touch-target flex min-h-[44px] h-10 shrink-0 items-center gap-1 border border-rose-500/30 px-3 font-mono text-xs font-bold tracking-wider text-rose-600 transition-colors hover:bg-rose-500/10 sm:min-h-0 sm:h-8 dark:text-rose-400"
              >
                <X size={12} weight="bold" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Product Grid or Dedicated Women's Division Coming Soon */}
        <h2 className="sr-only">Catalog Inventory</h2>
        {gender === 'women' ? (
          <div className="my-8 mx-auto max-w-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center shadow-xl sm:p-14">
            <div className="mb-6 flex justify-center">
              <BrandLogo size="lg" showWordmark={true} />
            </div>
            <div className="mb-3 inline-flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
              <span className="font-mono text-xs font-bold tracking-[0.25em] text-[var(--accent)] uppercase">
                DIVISION 04 · IN PROTOTYPING
              </span>
            </div>
            <h3 className="font-heading text-2xl font-black tracking-tight text-[var(--text-primary)] uppercase sm:text-4xl md:text-5xl">
              WOMEN&apos;S ARCHIVE
            </h3>
            <p className="mt-2 font-mono text-xs font-semibold tracking-widest text-[var(--text-muted)] uppercase">
              COMING SOON · SPRING / SUMMER
            </p>
            <p className="mx-auto mt-4 max-w-lg font-sans text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
              Our women&apos;s technical activewear division is currently undergoing intensive biomechanical motion study and field wear testing with elite athletes. Register below for early allocation and priority access to drop 01.
            </p>

            {emailSubmitted ? (
              <div className="mt-8 border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
                <p className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  ✓ EARLY ACCESS REQUEST RECORDED
                </p>
                <p className="mt-1 font-mono text-[11px] text-[var(--text-secondary)]">
                  Your credentials have been added to the priority dispatch registry.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (earlyAccessEmail.trim()) {
                    setEmailSubmitted(true);
                  }
                }}
                className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  value={earlyAccessEmail}
                  onChange={(e) => setEarlyAccessEmail(e.target.value)}
                  placeholder="Enter athlete email..."
                  className="min-h-[44px] flex-1 border border-[var(--border)] bg-[var(--bg-elevated)] px-4 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--text-primary)] focus:outline-none"
                  aria-label="Early access email"
                />
                <button
                  type="submit"
                  className="min-h-[44px] bg-[var(--text-primary)] px-6 py-2.5 font-mono text-xs font-bold tracking-wider text-[var(--bg)] transition-opacity hover:opacity-90 active:scale-[0.97]"
                >
                  Request access
                </button>
              </form>
            )}

            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <button
                type="button"
                onClick={() => setGender('all')}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                <span>← Return to all gear</span>
              </button>
            </div>
          </div>
        ) : isLoading && catalogProducts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="animate-pulse font-mono text-xs tracking-widest text-[var(--text-muted)] uppercase">
              [ SYNCHRONIZING REAL-TIME INVENTORY STREAM... ]
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="border border-dashed border-[var(--border)] p-8 py-24 text-center">
            <p className="font-mono text-sm tracking-widest text-[var(--text-muted)] uppercase">
              [ NO MATCHING HARDWARE FOUND IN ARCHIVE ]
            </p>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              Try broadening your category filters or search query.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 bg-[var(--text-primary)] px-6 py-2.5 font-mono text-xs font-bold tracking-wider text-[var(--bg)] hover:opacity-90 active:scale-[0.97]"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((p, pIdx) => (
              <CatalogCard
                key={p.id}
                product={p}
                onSelectSize={handleSelectSize}
                isAdded={Boolean(addedIds[p.id])}
                priority={pIdx < 4}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] pt-32 pb-24">
          <p className="animate-pulse font-mono text-xs tracking-widest text-[var(--text-muted)] uppercase">
            LOADING TECHNICAL ARCHIVE...
          </p>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
