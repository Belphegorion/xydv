'use client';

import { useState, use, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  ShoppingBag,
  ShieldCheck,
  GlobeHemisphereWest,
  Ruler,
  CaretDown,
  Check,
  Star,
  ArrowRight,
  ArrowsClockwise,
  MagnifyingGlassPlus,
  X,
  EyeSlash,
} from '@phosphor-icons/react';
import {
  getProductBySlug,
  getRelatedProducts,
  CatalogProduct,
  ProductVariant,
} from '@/lib/catalog';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { Badge } from '@/components/ui/Badge';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { formatPrice, formatCardTitle } from '@/lib/utils';
import { EMIL_EASE, SPRING_TACTILE } from '@/lib/motion';
import { api } from '@/lib/api';
import { useCustomerAuthStore } from '@/store/customerAuth';
import type { Review } from '@vertex/types';

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
  headline?: string;
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
      headline:
        apiProd.headline || existingStatic.headline || apiProd.description || apiProd.name,
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
    headline: apiProd.headline || apiProd.description || apiProd.name,
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

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const staticProduct = getProductBySlug(slug);
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  const customerUser = useCustomerAuthStore((s) => s.user);
  const isCustomerAuth = useCustomerAuthStore((s) => s.isAuthenticated);
  const openAuthModal = useCustomerAuthStore((s) => s.openModal);

  const [liveReviews, setLiveReviews] = useState<
    Array<{
      id: string;
      author: string;
      discipline: string;
      rating: number;
      title: string;
      content: string;
      date: string;
    }>
  >([]);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewAuthor, setReviewAuthor] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setIsNotFound(false);

    api
      .get<{ data?: ApiProductInput; product?: ApiProductInput }>(`/products/${slug}`)
      .then((res) => {
        if (!isMounted) return;
        const apiProd = res?.data || res?.product;
        if (apiProd) {
          setProduct(mapApiProductToCatalog(apiProd, staticProduct));
          setIsNotFound(false);

          // Fetch live reviews from database
          const reviewTarget = apiProd._id || apiProd.id || slug;
          api
            .get<{ data?: Review[]; reviews?: Review[] }>(`/products/${reviewTarget}/reviews`)
            .then((rRes) => {
              if (!isMounted) return;
              const rList = rRes?.data || rRes?.reviews;
              if (Array.isArray(rList) && rList.length > 0) {
                setLiveReviews(
                  rList.map((r: Review) => ({
                    id: r._id || String(Math.random()),
                    author: r.userName || 'Anonymous Athlete',
                    discipline: 'TRAINING',
                    rating: Number(r.rating) || 5,
                    title: r.title || 'Verified Performance',
                    content: r.body || '',
                    date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'RECENT',
                  })),
                );
              }
            })
            .catch(() => {});
        } else {
          setIsNotFound(true);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setIsNotFound(true);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug, staticProduct]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCustomerAuth) {
      openAuthModal('login');
      return;
    }
    if (!reviewTitle.trim() || !reviewBody.trim()) {
      setReviewError('Please provide both a title and review body.');
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);

    try {
      const reviewTarget = product?.id || product?.slug || slug;
      const res = await api.post<{ success: boolean; data?: Review }>(
        `/products/${reviewTarget}/reviews`,
        {
          rating: reviewRating,
          title: reviewTitle.trim(),
          body: reviewBody.trim(),
          userName: reviewAuthor.trim() || customerUser?.name || 'Verified Athlete',
        },
      );

      const rData = res?.data || {
        _id: `rev_${Date.now()}`,
        userName: reviewAuthor.trim() || customerUser?.name || 'Verified Athlete',
        rating: reviewRating,
        title: reviewTitle.trim(),
        body: reviewBody.trim(),
        createdAt: new Date().toISOString(),
      };

      setLiveReviews((prev) => [
        {
          id: rData._id || String(Date.now()),
          author: rData.userName,
          discipline: 'TRAINING',
          rating: rData.rating,
          title: rData.title,
          content: rData.body,
          date: 'JUST NOW',
        },
        ...(prev.length > 0 ? prev : product?.reviews || []),
      ]);

      setReviewSuccess(true);
      setReviewTitle('');
      setReviewBody('');
      setTimeout(() => {
        setIsReviewFormOpen(false);
        setReviewSuccess(false);
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review';
      setReviewError(msg);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const [activeVariantIdx, setActiveVariantIdx] = useState(0);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>('materials');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const isWishlisted = useWishlistStore((s) => (product ? s.isWishlisted(product.id) : false));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const related = useMemo(() => (product ? getRelatedProducts(product.id, 4) : []), [product]);

  const sizes = useMemo(() => {
    if (!product) return [];
    if (product.category === 'accessories') return ['OS'];
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const derived = Array.from(
        new Set(product.variants.map((v) => v.size).filter((s): s is string => Boolean(s))),
      );
      if (derived.length > 0) return derived;
    }
    return ['OS'];
  }, [product]);

  useEffect(() => {
    if (product) {
      if (product.category === 'accessories') {
        setSelectedSize('OS');
      } else if (sizes.length > 0 && !sizes.includes(selectedSize)) {
        setSelectedSize(sizes[0]);
      }
    }
  }, [product, sizes, selectedSize]);

  if (isNotFound) {
    notFound();
  }

  if (isLoading && !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] pt-32 pb-24 text-white">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#E8FF00] border-t-transparent" />
        <p className="font-mono text-xs tracking-widest text-[#a0a0a0] uppercase">
          Loading Product Specification...
        </p>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const activeVariant = product.variants[activeVariantIdx] || product.variants[0];
  const gallery = activeVariant.gallery?.length
    ? activeVariant.gallery
    : [activeVariant.primaryImage, activeVariant.secondaryImage || activeVariant.primaryImage];

  // Handle Size Selection dynamically derived from variant stock
  const isSizeDisabled = (size: string) => {
    if (!product || product.category === 'accessories') return false;
    const matchingVariant =
      product.variants.find(
        (v) =>
          v.size === size &&
          (v.colorName === activeVariant.colorName || v.colorHex === activeVariant.colorHex),
      ) ?? product.variants.find((v) => v.size === size);

    if (matchingVariant) {
      return typeof matchingVariant.stock === 'number' && matchingVariant.stock <= 0;
    }
    return false;
  };

  const handleAddToCart = () => {
    setIsAdding(true);

    const finalPrice =
      product.effectivePricePaise !== undefined
        ? product.effectivePricePaise / 100
        : product.price;

    addItem(
      {
        id: `${product.id}_${activeVariant.sku}_${selectedSize}`,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        color: activeVariant.colorName,
        colorHex: activeVariant.colorHex,
        size: selectedSize,
        price: finalPrice,
        regularPrice: product.price,
        compareAt: product.compareAtPrice,
        discountBadgeLabel: product.discountBadgeLabel,
        image: activeVariant.primaryImage,
        sku: activeVariant.sku,
        maxStock: activeVariant.stock,
      },
      quantity,
    );

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsAdding(false);
      openCart();
    }, 400);
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordion((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-24 pb-24 sm:pt-32">
      {/* Lightbox / Fullscreen Zoom Modal */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
            onClick={() => setIsZoomOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close fullscreen zoom"
            >
              <X size={24} weight="bold" />
            </button>
            <div className="relative h-[85vh] w-full max-w-5xl">
              <Image
                src={gallery[activeImageIdx]}
                alt={`${product.name} zoom view`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 font-mono text-[11px] text-[var(--text-muted)]"
        >
          <Link href="/" className="transition-colors hover:text-[var(--text-primary)]">
            HOME
          </Link>
          <span>/</span>
          <Link href="/products" className="transition-colors hover:text-[var(--text-primary)]">
            PRODUCTS
          </Link>
          <span>/</span>
          <Link
            href={`/products?category=${product.category}`}
            className="uppercase transition-colors hover:text-[var(--text-primary)]"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="max-w-[200px] truncate text-[var(--text-primary)]">
            {formatCardTitle(product.name)}
          </span>
        </nav>

        {/* Main Grid: Media Rail & Purchase Details */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-14">
          {/* ========================================================= */}
          {/* LEFT COLUMN: Sticky Media Gallery                         */}
          {/* ========================================================= */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            {/* Primary Main Viewport */}
            <div className="group relative aspect-[3/4] w-full overflow-hidden border border-[var(--border)] bg-black/5 dark:bg-black">
              {failedImages[gallery[activeImageIdx]] ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-[var(--bg-elevated)] p-6 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)]">
                    <EyeSlash size={22} weight="bold" />
                  </div>
                  <span className="font-mono text-xs font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                    Preview Unavailable
                  </span>
                  <span className="mt-1 font-mono text-[10px] text-[var(--text-muted)] uppercase">
                    Syncing Asset
                  </span>
                </div>
              ) : (
                <Image
                  src={gallery[activeImageIdx]}
                  alt={`${product.name} in ${activeVariant.colorName}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  priority
                  onError={() => {
                    const currentImg = gallery[activeImageIdx];
                    if (currentImg) {
                      setFailedImages((prev) => ({ ...prev, [currentImg]: true }));
                    }
                  }}
                  className="object-cover object-center transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                />
              )}

              {/* Taxonomy Badges */}
              <div className="pointer-events-none absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                <Badge variant="volt" size="sm">
                  {`${product.discipline.toUpperCase()} // DIV.0${product.discipline === 'run' ? '1' : product.discipline === 'train' ? '2' : '3'}`}
                </Badge>
                {product.discountBadgeLabel ? (
                  <span className="bg-[var(--accent)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--accent-foreground)] uppercase">
                    {product.discountBadgeLabel}
                  </span>
                ) : product.compareAtPrice && product.compareAtPrice > product.price ? (
                  <span className="bg-[var(--text-primary)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--bg)] uppercase">
                    SAVE{' '}
                    {Math.round(
                      ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100,
                    )}
                    %
                  </span>
                ) : null}
              </div>

              {/* Fullscreen Zoom Affordance */}
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                className="touch-target absolute right-4 bottom-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-[background-color,border-color,color,transform] duration-200 hover:border-white hover:bg-white hover:text-black active:scale-[0.97]"
                aria-label="Open full resolution inspection"
              >
                <MagnifyingGlassPlus size={20} weight="bold" />
              </button>
            </div>

            {/* Thumbnail Strip */}
            {gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3">
                {gallery.map((img, tIdx) => (
                  <button
                    key={img + tIdx}
                    type="button"
                    onClick={() => setActiveImageIdx(tIdx)}
                    aria-label={`View photo ${tIdx + 1} of ${product.name}`}
                    aria-current={tIdx === activeImageIdx ? 'true' : undefined}
                    className={`relative aspect-[3/4] overflow-hidden border transition-[border-color,opacity] duration-150 ${
                      tIdx === activeImageIdx
                        ? 'border-[var(--text-primary)] ring-1 ring-[var(--text-primary)]'
                        : 'border-[var(--border)] opacity-60 hover:opacity-100'
                    }`}
                  >
                    {failedImages[img] ? (
                      <div className="flex h-full w-full items-center justify-center bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                        <EyeSlash size={14} />
                      </div>
                    ) : (
                      <Image
                        src={img}
                        alt={`${product.name} angle ${tIdx + 1}`}
                        fill
                        sizes="16vw"
                        onError={() => setFailedImages((prev) => ({ ...prev, [img]: true }))}
                        className="object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Specifications & Purchasing Architecture    */}
          {/* ========================================================= */}
          <div className="flex flex-col justify-start lg:col-span-5">
            {/* Header / Taxonomy */}
            <div className="mb-6 border-b border-[var(--border)] pb-6">
              <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                {`${product.gender.toUpperCase()}'S DIVISION // ${product.specsSummary}`}
              </span>
              <h1 className="font-heading mt-1 text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-balance text-[var(--text-primary)]">
                {formatCardTitle(product.name)}
              </h1>

              {/* Description/Headline below product name */}
              <p className="mt-2 font-sans text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                {product.headline}
              </p>

              {/* Price & Rating Row */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div>
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
                    size="lg"
                    showSavings={true}
                  />
                  <p className="mt-1 font-mono text-[10px] md:text-xs text-[var(--text-muted)]">
                    MRP inclusive of all taxes
                  </p>
                </div>

                {product.reviewCount > 0 ? (
                  <div className="flex items-center gap-1.5 font-mono text-xs md:text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center text-amber-500">
                      <Star size={14} weight="fill" />
                    </div>
                    <span className="font-bold text-[var(--text-primary)]">
                      {typeof product.rating === 'number'
                        ? product.rating.toFixed(1)
                        : product.rating}
                    </span>
                    <span className="text-[var(--text-muted)]">({product.reviewCount})</span>
                  </div>
                ) : (
                  <span className="font-mono text-xs text-[var(--text-muted)]">No reviews yet</span>
                )}
              </div>

              {/* IN STOCK Availability Indicator */}
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  IN STOCK · READY FOR DISPATCH
                </span>
              </div>
            </div>

            {/* Colorway Selection */}
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
                  COLORWAY
                </span>
                <span className="font-mono text-xs text-[var(--text-secondary)] uppercase">
                  {activeVariant.colorName}
                </span>
              </div>
              <div
                className="flex items-center gap-2.5"
                role="group"
                aria-label="Available colorways"
              >
                {product.variants.map((v, idx) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setActiveVariantIdx(idx);
                      setActiveImageIdx(0);
                    }}
                    aria-label={`Select colorway ${v.colorName}`}
                    className="touch-target -m-1 p-1 focus:outline-none"
                  >
                    <span
                      className={`block h-6 w-6 rounded-full border transition-[transform,border-color] duration-150 active:scale-[0.95] ${
                        idx === activeVariantIdx
                          ? 'scale-110 border-[var(--text-primary)] shadow-sm ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--bg)]'
                          : 'border-black/20 hover:border-[var(--text-primary)] dark:border-white/20'
                      }`}
                      style={{ backgroundColor: v.colorHex }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector Matrix */}
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
                  SELECT SIZE
                </span>
                <Link
                  href="/sizing"
                  className="flex items-center gap-1 font-mono text-[11px] text-[var(--text-secondary)] underline transition-colors hover:text-[var(--text-primary)]"
                >
                  <Ruler size={13} weight="bold" />
                  <span>SIZE & FIT GUIDE ↗</span>
                </Link>
              </div>

              <div className={`grid ${sizes.length === 1 ? 'grid-cols-1' : 'grid-cols-3 sm:grid-cols-6'} gap-1.5`}>
                {sizes.map((s) => {
                  const disabled = isSizeDisabled(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedSize(s)}
                      aria-pressed={selectedSize === s}
                      aria-label={`Select size ${s}${selectedSize === s ? ', selected' : ''}${disabled ? ', out of stock' : ''}`}
                      className={`flex h-11 items-center justify-center font-mono text-xs font-bold uppercase transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] ${
                        selectedSize === s
                          ? 'border border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg)] shadow-sm'
                          : disabled
                            ? 'cursor-not-allowed border border-[var(--border)]/40 bg-[var(--bg-elevated)]/30 text-[var(--text-muted)] line-through'
                            : 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--text-primary)]'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector & Action Cluster */}
            <div className="mb-8 space-y-3">
              <div className="flex items-center gap-3">
                {/* Quantity */}
                <div className="flex h-12 items-center border border-[var(--border)] bg-[var(--bg-elevated)]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="touch-target flex h-full w-10 items-center justify-center font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-[0.97]"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-mono text-xs font-bold text-[var(--text-primary)]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    aria-label="Increase quantity"
                    className="touch-target flex h-full w-10 items-center justify-center font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-[0.97]"
                  >
                    +
                  </button>
                </div>

                {/* Primary Add to Bag CTA */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="touch-target flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 bg-[var(--text-primary)] font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase shadow-md transition-[opacity,transform] duration-150 hover:opacity-95 active:scale-[0.97] sm:text-sm"
                >
                  {isAdding ? (
                    <>
                      <ArrowsClockwise size={18} className="animate-spin" />
                      <span>ALLOCATING INVENTORY...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} weight="bold" />
                      <span>ADD TO BAG · {formatPrice(product.price * quantity)}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Wishlist Toggle Button */}
              <button
                type="button"
                onClick={() =>
                  toggleWishlist({
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    price: product.price,
                    image: activeVariant.primaryImage,
                  })
                }
                className="touch-target flex h-11 w-full items-center justify-center gap-2 border border-[var(--border)] bg-[var(--bg-elevated)] font-mono text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] active:scale-[0.97]"
              >
                <Heart
                  size={16}
                  weight={isWishlisted ? 'fill' : 'bold'}
                  className={isWishlisted ? 'text-[var(--accent)]' : ''}
                />
                <span>{isWishlisted ? 'RETIRE FROM SAVED ARCHIVE' : 'ADD TO SAVED ARCHIVE'}</span>
              </button>
            </div>

            {/* Guarantee Callout Banner */}
            <div className="mb-8 space-y-2 border border-[var(--border)] bg-[var(--bg-surface)] p-4">
              <div className="flex items-center gap-2.5 font-mono text-xs text-[var(--text-secondary)]">
                <GlobeHemisphereWest size={16} className="text-[var(--accent)]" weight="bold" />
                <span>COMPLIMENTARY EXPRESS DISPATCH OVER ₹150</span>
              </div>
              <div className="flex items-center gap-2.5 font-mono text-xs text-[var(--text-secondary)]">
                <ShieldCheck
                  size={16}
                  className="text-[#15803d] dark:text-[#22c55e]"
                  weight="bold"
                />
                <span>30-DAY EXCHANGE TRIAL & FULL WARRANTY</span>
              </div>
            </div>

            {/* Technical Specifications Accordion */}
            <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
              {/* Accordion 1: Fabric & Textile */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('materials')}
                  className="touch-target flex w-full items-center justify-between gap-2 py-4 text-left focus:outline-none"
                >
                  <span className="flex-1 min-w-0 font-mono text-[11px] sm:text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
                    01 // TEXTILE & MATERIAL ENGINEERING
                  </span>
                  <CaretDown
                    size={14}
                    weight="bold"
                    className={`shrink-0 text-[var(--text-secondary)] transition-transform duration-200 ${
                      openAccordion === 'materials' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openAccordion === 'materials' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: EMIL_EASE }}
                      className="space-y-2 overflow-hidden pb-4 font-mono text-xs text-[var(--text-secondary)]"
                    >
                      <p>
                        <span className="font-bold text-[var(--text-primary)]">COMPOSITION:</span>{' '}
                        {product.fabricDetails.composition}
                      </p>
                      <p>
                        <span className="font-bold text-[var(--text-primary)]">WEIGHT:</span>{' '}
                        {product.fabricDetails.weightGsm} GSM Heavyweight Technical Spec
                      </p>
                      <p>
                        <span className="font-bold text-[var(--text-primary)]">TECHNOLOGY:</span>{' '}
                        {product.fabricDetails.technology}
                      </p>
                      <p>
                        <span className="font-bold text-[var(--text-primary)]">
                          SURFACE FINISH:
                        </span>{' '}
                        {product.fabricDetails.finish}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 2: Athletic Biomechanics */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('biomechanics')}
                  className="touch-target flex w-full items-center justify-between gap-2 py-4 text-left focus:outline-none"
                >
                  <span className="flex-1 min-w-0 font-mono text-[11px] sm:text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
                    02 // ATHLETIC BIOMECHANICS & FIT
                  </span>
                  <CaretDown
                    size={14}
                    weight="bold"
                    className={`shrink-0 text-[var(--text-secondary)] transition-transform duration-200 ${
                      openAccordion === 'biomechanics' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openAccordion === 'biomechanics' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: EMIL_EASE }}
                      className="overflow-hidden pb-4 font-sans text-xs leading-relaxed text-[var(--text-secondary)]"
                    >
                      {product.biomechanics}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 3: Care Protocol */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('care')}
                  className="touch-target flex w-full items-center justify-between gap-2 py-4 text-left focus:outline-none"
                >
                  <span className="flex-1 min-w-0 font-mono text-[11px] sm:text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
                    03 // CARE & LONGEVITY PROTOCOL
                  </span>
                  <CaretDown
                    size={14}
                    weight="bold"
                    className={`shrink-0 text-[var(--text-secondary)] transition-transform duration-200 ${
                      openAccordion === 'care' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openAccordion === 'care' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: EMIL_EASE }}
                      className="overflow-hidden pb-4 font-mono text-xs text-[var(--text-secondary)]"
                    >
                      <ul className="list-disc space-y-1.5 pl-5">
                        {product.careInstructions.map((instruction, idx) => (
                          <li key={idx}>{instruction}</li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 4: Global Dispatch */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('shipping')}
                  className="touch-target flex w-full items-center justify-between py-4 text-left focus:outline-none"
                >
                  <span className="font-mono text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
                    04 // DISPATCH & WARRANTY GUARANTEE
                  </span>
                  <CaretDown
                    size={14}
                    weight="bold"
                    className={`text-[var(--text-secondary)] transition-transform duration-200 ${
                      openAccordion === 'shipping' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openAccordion === 'shipping' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: EMIL_EASE }}
                      className="space-y-2 overflow-hidden pb-4 font-sans text-xs leading-relaxed text-[var(--text-secondary)]"
                    >
                      <p>
                        All hardware is dispatched via air freight directly from our central
                        fulfillment depot. Orders before 14:00 EST depart same business day.
                      </p>
                      <p>
                        Complimentary exchanges and returns are supported for 30 calendar days
                        provided items are unworn and tags remain intact.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ATHLETE REVIEWS SECTION                                   */}
        {/* ========================================================= */}
        <section
          aria-labelledby="reviews-heading"
          className="mt-20 border-t border-[var(--border)] pt-12"
        >
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                FIELD REPORTS
              </span>
              <h2
                id="reviews-heading"
                className="font-heading text-2xl font-black text-balance text-[var(--text-primary)] uppercase sm:text-3xl"
              >
                VERIFIED ATHLETE REVIEWS (
                {liveReviews.length > 0 ? liveReviews.length : product.reviewCount})
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold text-[var(--text-primary)]">
                  {product.rating}
                </span>
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} weight="fill" />
                  ))}
                </div>
                <span className="font-mono text-xs text-[var(--text-muted)]">BENCHMARK</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isCustomerAuth) {
                    openAuthModal('login');
                  } else {
                    setIsReviewFormOpen(!isReviewFormOpen);
                  }
                }}
                className="min-h-[44px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--accent)]"
              >
                {isReviewFormOpen ? 'CANCEL REVIEW' : '+ WRITE REPORT'}
              </button>
            </div>
          </div>

          {/* Collapsible Review Submission Form */}
          {isReviewFormOpen && (
            <form
              onSubmit={handleReviewSubmit}
              className="mb-8 space-y-4 border border-[var(--border)] bg-[var(--bg-surface)] p-6"
            >
              <h3 className="font-heading text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
                SUBMIT FIELD PERFORMANCE REPORT
              </h3>
              {reviewError && (
                <div
                  role="alert"
                  className="border border-red-500/30 bg-red-500/10 p-2.5 font-mono text-xs text-red-500"
                >
                  {reviewError}
                </div>
              )}
              {reviewSuccess && (
                <div
                  role="status"
                  className="border border-emerald-500/30 bg-emerald-500/10 p-2.5 font-mono text-xs text-emerald-500"
                >
                  Report verified and logged to product telemetry.
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-1 block font-mono text-[10px] text-[var(--text-muted)] uppercase">
                    PERFORMANCE RATING (1-5 STARS)
                  </span>
                  <div className="flex items-center gap-1.5 py-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      /* prettier-ignore */
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="touch-target flex min-w-[44px] min-h-[44px] items-center justify-center text-amber-500 focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star size={20} weight={star <= reviewRating ? 'fill' : 'regular'} />
                        </button>
                      );
                    })}
                    <span className="ml-2 font-mono text-xs font-bold text-[var(--text-primary)]">
                      {reviewRating} / 5
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="review-author"
                    className="mb-1 block font-mono text-[10px] text-[var(--text-muted)] uppercase"
                  >
                    ATHLETE CALLSIGN / NAME
                  </label>
                  <input
                    id="review-author"
                    type="text"
                    placeholder={customerUser?.name || 'e.g. Kai N.'}
                    value={reviewAuthor}
                    onChange={(e) => setReviewAuthor(e.target.value)}
                    className="min-h-[44px] w-full border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="review-title"
                  className="mb-1 block font-mono text-[10px] text-[var(--text-muted)] uppercase"
                >
                  REPORT HEADLINE / TITLE *
                </label>
                <input
                  id="review-title"
                  type="text"
                  required
                  placeholder="e.g. Exceptional thermal regulation during 15K trail run"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="min-h-[44px] w-full border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                />
              </div>

              <div>
                <label
                  htmlFor="review-body"
                  className="mb-1 block font-mono text-[10px] text-[var(--text-muted)] uppercase"
                >
                  FIELD OBSERVATIONS / REVIEW CONTENT *
                </label>
                <textarea
                  id="review-body"
                  required
                  rows={4}
                  placeholder="Describe fit, abrasion resistance, moisture regulation, and biomechanics in the field..."
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  className="w-full border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="min-h-[48px] bg-[var(--accent)] px-6 py-3 font-mono text-xs font-bold tracking-wider text-[var(--accent-foreground)] uppercase transition-transform focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:outline-none active:scale-[0.97] disabled:opacity-50"
              >
                {reviewSubmitting ? 'DISPATCHING REPORT...' : 'TRANSMIT REVIEW TO ARCHIVE'}
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            {(liveReviews.length > 0 ? liveReviews : product.reviews).map((rev) => (
              <div
                key={rev.id}
                className="space-y-3 border border-[var(--border)] bg-[var(--bg-surface)] p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                      {rev.author}
                    </span>
                    <span className="ml-2 font-mono text-[10px] text-[var(--text-muted)]">
                      [{rev.discipline}]
                    </span>
                  </div>
                  <div className="flex text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={12} weight="fill" />
                    ))}
                  </div>
                </div>
                <h3 className="font-heading text-xs font-bold text-[var(--text-primary)] uppercase">
                  {rev.title}
                </h3>
                <p className="font-sans text-xs leading-relaxed text-[var(--text-secondary)]">
                  {rev.content}
                </p>
                <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 font-mono text-[10px] text-[var(--text-muted)]">
                  <span>VERIFIED ORDER</span>
                  <span>{rev.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* RELATED COMPANIONS SECTION                                */}
        {/* ========================================================= */}
        {related.length > 0 && (
          <section
            aria-labelledby="related-heading"
            className="mt-20 border-t border-[var(--border)] pt-12"
          >
            <div className="mb-8 flex items-center justify-between">
              <div>
                <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                  COMPLEMENTARY GEAR
                </span>
                <h2
                  id="related-heading"
                  className="font-heading text-2xl font-black text-balance text-[var(--text-primary)] uppercase sm:text-3xl"
                >
                  ENGINEERED COMPANIONS
                </h2>
              </div>
              <Link
                href="/products"
                className="flex items-center gap-1 font-mono text-xs font-bold text-[var(--text-primary)] uppercase hover:text-[var(--text-secondary)]"
              >
                <span>VIEW ARCHIVE</span>
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.slug}`}
                  className="group flex flex-col border border-[var(--border)] bg-[var(--bg-surface)] p-2 transition-colors hover:border-[var(--text-primary)] sm:p-3"
                >
                  <div className="relative mb-2 aspect-[3/4] w-full overflow-hidden bg-black/5 dark:bg-black">
                    <Image
                      src={item.variants[0]?.primaryImage || '/products/image-4-1.jpg'}
                      alt={item.name}
                      fill
                      sizes="25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-heading truncate text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                    {formatCardTitle(item.name)}
                  </h3>
                  <div className="mt-1.5 flex items-baseline">
                    <PriceDisplay
                      price={
                        item.effectivePricePaise !== undefined
                          ? item.effectivePricePaise / 100
                          : item.price
                      }
                      regularPrice={item.price}
                      mrp={item.compareAtPrice}
                      discountPercent={item.discountPercentRounded}
                      badgeLabel={item.discountBadgeLabel}
                      size="card"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
