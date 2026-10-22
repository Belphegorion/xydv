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
import {
  CATALOG_PRODUCTS,
  CatalogProduct,
  ProductVariant,
} from '@/lib/catalog';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, getAvailableSizes } from '@/lib/utils';
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
  specsSummary?: string;
  description?: string;
  features?: string[];
  variants?: ApiProductVariant[];
  averageRating?: number;
  reviewCount?: number;
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

function mapApiProductToCatalog(apiProd: ApiProductInput, existingStatic?: CatalogProduct): CatalogProduct {
  if (existingStatic) {
    return {
      ...existingStatic,
      price: typeof apiProd.price === 'number' ? apiProd.price : existingStatic.price,
      compareAtPrice: typeof apiProd.compareAt === 'number' ? apiProd.compareAt : existingStatic.compareAtPrice,
      category: parseCategory(apiProd.category || existingStatic.category),
      variants: Array.isArray(apiProd.variants) && apiProd.variants.length > 0
        ? apiProd.variants.map((v: ApiProductVariant, idx: number) => {
            const staticVar = existingStatic.variants[idx] || existingStatic.variants[0];
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
        : existingStatic.variants,
    };
  }

  const firstVariant = apiProd.variants?.[0];
  const primaryImg = firstVariant?.imageUrl || firstVariant?.images?.[0] || '/lookbook/image-2-1.jpg';
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
    variants: Array.isArray(apiProd.variants) && apiProd.variants.length > 0
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
    rating: typeof apiProd.averageRating === 'number' ? apiProd.averageRating : 4.8,
    reviewCount: typeof apiProd.reviewCount === 'number' ? apiProd.reviewCount : 42,
    reviews: [],
  };
}

const CATEGORIES = [
  { label: 'ALL GEAR', value: 'all' },
  { label: 'TOPS', value: 'tops' },
  { label: 'BOTTOMS', value: 'bottoms' },
  { label: 'OUTERWEAR', value: 'outerwear' },
  { label: 'ACCESSORIES', value: 'accessories' },
];

const DISCIPLINES = [
  { label: 'ALL DISCIPLINES', value: 'all' },
  { label: 'RUN (DIV.01)', value: 'run' },
  { label: 'TRAIN (DIV.02)', value: 'train' },
  { label: 'REC (DIV.03)', value: 'rec' },
];

const GENDERS = [
  { label: 'ALL DIVISIONS', value: 'all' },
  { label: "MEN'S", value: 'men' },
  { label: "WOMEN'S", value: 'women' },
];

const SORT_OPTIONS = [
  { label: 'FEATURED', value: 'featured' },
  { label: 'BESTSELLER', value: 'bestseller' },
  { label: 'PRICE: LOW TO HIGH', value: 'price-asc' },
  { label: 'PRICE: HIGH TO LOW', value: 'price-desc' },
  { label: 'NEWEST', value: 'newest' },
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
    <div className="group relative flex flex-col bg-[var(--bg-surface)] border border-[var(--border)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--text-primary)] hover:shadow-lg">
      {/* Media Tile */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 dark:bg-black group/media">
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
          aria-label={isWishlisted ? `Remove ${product.name} from saved items` : `Save ${product.name} to wishlist`}
          className="touch-target absolute top-2 right-2 sm:top-3 sm:right-3 z-30 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-black hover:border-white transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.97]"
        >
          <Heart size={18} weight={isWishlisted ? 'fill' : 'bold'} className={isWishlisted ? 'text-[var(--accent)]' : ''} />
        </button>

        {/* Category & Discipline Badge */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 pointer-events-none flex flex-col gap-1">
          <Badge variant="subtle" size="sm">
            {product.category}
          </Badge>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-[var(--accent)] text-black">
              SAVE {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Gallery Scroll Track */}
        <div
          ref={trackRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full flex overflow-x-hidden snap-x snap-mandatory scroll-smooth"
        >
          {gallery.map((imgUrl, iIdx) => (
            <div key={imgUrl + iIdx} className="w-full h-full flex-shrink-0 snap-center relative">
              <Link
                href={`/products/${product.slug}`}
                onClick={(e) => {
                  if (isSwiping) e.preventDefault();
                }}
                className="block w-full h-full relative"
              >
                <Image
                  src={imgUrl}
                  alt={`${product.name} - ${activeVariant.colorName} view ${iIdx + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                  priority={iIdx === 0 && (priority || product.isFeatured)}
                />
              </Link>
            </div>
          ))}
        </div>

        {/* Gallery Progress Dots */}
        {gallery.length > 1 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 flex items-center sm:group-hover/media:opacity-0 transition-opacity duration-200">
            {gallery.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={(e) => scrollToSlide(dotIdx, e)}
                aria-label={`View image slide ${dotIdx + 1}`}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-0 bg-transparent border-0 cursor-pointer"
              >
                <span
                  className={`block h-1.5 rounded-full transition-[width,background-color] duration-200 ${
                    dotIdx === activeImageIdx ? 'w-4 bg-white shadow-xs' : 'w-1.5 bg-white/40 hover:bg-white/70'
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
              className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 min-w-[44px] min-h-[44px] items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity duration-200 focus:outline-none"
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
              className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 min-w-[44px] min-h-[44px] items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity duration-200 focus:outline-none"
              aria-label="Next image"
            >
              <span className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/90 transition-colors active:scale-[0.97]">
                <CaretRight size={14} weight="bold" />
              </span>
            </button>
          </>
        )}

        {/* Desktop Quick Size Selector HUD */}
        <div className="absolute inset-x-2 sm:inset-x-2.5 bottom-2 sm:bottom-2.5 z-20 hidden sm:flex flex-col items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-none bg-white/95 dark:bg-[#0a0a0a]/92 backdrop-blur-md border border-black/10 dark:border-white/15 px-2 py-1.5 shadow-lg dark:shadow-2xl">
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
                onSelectSize(product, activeVariant, sizes[0].size);
              }}
              className={`w-full h-[26px] px-2 flex items-center justify-center font-mono text-[9.5px] font-bold tracking-widest uppercase transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white ${
                sizes[0].inStock
                  ? 'bg-black/5 hover:bg-black hover:text-white text-black border border-black/10 hover:border-black dark:bg-white/10 dark:hover:bg-white dark:hover:text-[#0a0a0a] dark:text-white dark:border-white/15 dark:hover:border-white shadow-xs cursor-pointer'
                  : 'bg-black/[0.02] text-zinc-400 border border-black/5 dark:bg-white/[0.02] dark:text-zinc-600 dark:border-white/10 line-through cursor-not-allowed select-none'
              }`}
            >
              QUICK ADD · ONE SIZE (OS)
            </button>
          ) : (
            <div className="grid grid-cols-6 gap-1 w-full">
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
                  className={`h-[26px] flex items-center justify-center font-mono text-[10px] font-bold uppercase transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white ${
                    s.inStock
                      ? 'bg-black/5 hover:bg-black hover:text-white text-black border border-black/10 hover:border-black dark:bg-white/10 dark:hover:bg-white dark:hover:text-[#0a0a0a] dark:text-white dark:border-white/15 dark:hover:border-white shadow-xs cursor-pointer'
                      : 'bg-black/[0.02] text-zinc-400 border border-black/5 dark:bg-white/[0.02] dark:text-zinc-600 dark:border-white/10 line-through cursor-not-allowed select-none'
                  }`}
                  aria-label={s.inStock ? `Add size ${s.size} to bag` : `Size ${s.size} out of stock`}
                >
                  {s.size}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Meta Area */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Swatches */}
          <div className="flex items-center gap-1.5 mb-2 min-w-0 overflow-hidden" role="group" aria-label="Available colorways">
            {product.variants.map((v, vIdx) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setActiveVariantIdx(vIdx)}
                aria-label={`Select ${v.colorName}`}
                className="touch-target relative p-1.5 -m-1.5 focus:outline-none flex-shrink-0"
              >
                <span
                  className={`block w-3.5 h-3.5 rounded-full border transition-[transform,border-color] duration-150 ${
                    vIdx === activeVariantIdx
                      ? 'border-black ring-1 ring-black ring-offset-1 ring-offset-[var(--bg-surface)] dark:border-[var(--accent)] dark:ring-0 scale-125 shadow-xs'
                      : 'border-black/20 dark:border-white/20 hover:border-[var(--text-primary)]'
                  }`}
                  style={{ backgroundColor: v.colorHex }}
                />
              </button>
            ))}
            <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase ml-1.5 truncate">
              {activeVariant.colorName}
            </span>
          </div>

          {/* Title */}
          <Link href={`/products/${product.slug}`} className="hover:text-[var(--text-secondary)] dark:hover:text-zinc-300 transition-colors">
            <h3 className="text-[var(--text-primary)] text-xs sm:text-sm font-bold uppercase tracking-tight font-heading line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Micro Specs */}
          <p className="text-[var(--text-muted)] text-[10px] sm:text-[11px] font-mono mt-0.5 line-clamp-1">
            {product.specsSummary}
          </p>
        </div>

        {/* Price & Mobile Add Button */}
        <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-[var(--text-primary)] text-xs sm:text-sm font-mono font-bold">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-[var(--text-muted)] text-[10px] sm:text-xs font-mono line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <div className="sm:hidden">
            <button
              type="button"
              onClick={() => onSelectSize(product, activeVariant, activeVariant.size)}
              className="touch-target min-w-[40px] min-h-[40px] flex items-center justify-center bg-[var(--text-primary)] text-[var(--bg)] px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider active:scale-[0.97]"
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
    }, 350);
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    let list = [...catalogProducts];

    if (category !== 'all') {
      list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    if (discipline !== 'all') {
      list = list.filter((p) => p.discipline.toLowerCase() === discipline.toLowerCase());
    }

    if (gender !== 'all') {
      list = list.filter((p) => p.gender.toLowerCase() === gender.toLowerCase() || p.gender === 'unisex');
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
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'bestseller') {
      list.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0) || b.reviewCount - a.reviewCount);
    } else if (sort === 'newest') {
      list.reverse();
    } else {
      list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return list;
  }, [category, discipline, gender, search, sort, inStockOnly, catalogProducts]);

  const hasActiveFilters =
    category !== 'all' || discipline !== 'all' || gender !== 'all' || search.trim().length > 0 || inStockOnly;

  const resetFilters = () => {
    setCategory('all');
    setDiscipline('all');
    setGender('all');
    setSearch('');
    setInStockOnly(false);
    setSort('featured');
    router.push('/products');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-24 sm:pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--border)] pb-8 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                ARCHIVE CATALOG
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight font-heading text-[var(--text-primary)]">
              TECHNICAL DIVISION
            </h1>
            <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-sans mt-2 max-w-xl">
              Engineered garments designed for high kinetic output, friction resistance, and thermal equilibrium.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase">
              SHOWING {filteredProducts.length} OF {catalogProducts.length} PIECES
            </span>
          </div>
        </div>

        {/* Primary Filter Bar: Category Tabs & Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none" role="tablist">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                role="tab"
                aria-selected={category === cat.value}
                onClick={() => setCategory(cat.value)}
                className={`touch-target px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] ${
                  category === cat.value
                    ? 'bg-[var(--text-primary)] text-[var(--bg)] border border-[var(--text-primary)] shadow-sm'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--text-primary)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass
              size={16}
              weight="bold"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH HARDWARE BY NAME, TECH, OR GSM..."
              className="w-full h-10 pl-10 pr-9 text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)] transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Row: Disciplines, Genders, Sort, and In-Stock */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 bg-[var(--bg-surface)] border border-[var(--border)] mb-8">
          <div className="flex flex-wrap items-center gap-2">
            {/* Discipline Dropdown / Pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase hidden sm:inline">DISCIPLINE:</span>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="h-8 px-2 text-[11px] font-mono uppercase bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] cursor-pointer"
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
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase hidden sm:inline">DIVISION:</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="h-8 px-2 text-[11px] font-mono uppercase bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] cursor-pointer"
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
            <label className="flex items-center gap-2 ml-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded-none accent-[var(--accent)] border-[var(--border)] cursor-pointer"
              />
              <span className="text-[11px] font-mono text-[var(--text-secondary)] uppercase">IN STOCK ONLY</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <ArrowsDownUp size={14} className="text-[var(--text-muted)]" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-8 px-2 text-[11px] font-mono uppercase bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] cursor-pointer"
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
                className="touch-target h-8 px-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors flex items-center gap-1"
              >
                <X size={12} weight="bold" />
                <span>RESET</span>
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <h2 className="sr-only">Catalog Inventory</h2>
        {isLoading && catalogProducts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest animate-pulse">
              [ SYNCHRONIZING REAL-TIME INVENTORY STREAM... ]
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-[var(--border)] p-8">
            <p className="text-sm font-mono text-[var(--text-muted)] uppercase tracking-widest">
              [ NO MATCHING HARDWARE FOUND IN ARCHIVE ]
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Try broadening your category filters or search query.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 px-6 py-2.5 bg-[var(--text-primary)] text-[var(--bg)] text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.97]"
            >
              CLEAR ALL FILTERS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
        <div className="min-h-screen bg-[var(--bg)] pt-32 pb-24 flex items-center justify-center">
          <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest animate-pulse">
            LOADING TECHNICAL ARCHIVE...
          </p>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
