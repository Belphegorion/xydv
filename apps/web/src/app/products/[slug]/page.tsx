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
import { formatPrice } from '@/lib/utils';
import { EMIL_EASE, SPRING_TACTILE } from '@/lib/motion';
import { api } from '@/lib/api';
import { useCustomerAuthStore } from '@/store/customerAuth';

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

  const [liveReviews, setLiveReviews] = useState<Array<{
    id: string;
    author: string;
    discipline: string;
    rating: number;
    title: string;
    content: string;
    date: string;
  }>>([]);
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
            .get<{ data?: any[]; reviews?: any[] }>(`/products/${reviewTarget}/reviews`)
            .then((rRes) => {
              if (!isMounted) return;
              const rList = rRes?.data || rRes?.reviews || (Array.isArray(rRes) ? rRes : []);
              if (Array.isArray(rList) && rList.length > 0) {
                setLiveReviews(
                  rList.map((r: any) => ({
                    id: r._id || r.id || String(Math.random()),
                    author: r.userName || 'Anonymous Athlete',
                    discipline: 'TRAINING',
                    rating: Number(r.rating) || 5,
                    title: r.title || 'Verified Performance',
                    content: r.body || '',
                    date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'RECENT',
                  }))
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
      const res = await api.post<{ success: boolean; data?: any }>(
        `/products/${reviewTarget}/reviews`,
        {
          rating: reviewRating,
          title: reviewTitle.trim(),
          body: reviewBody.trim(),
          userName: reviewAuthor.trim() || customerUser?.name || 'Verified Athlete',
        }
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
        ...(prev.length > 0 ? prev : (product?.reviews || [])),
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

  const related = useMemo(
    () => (product ? getRelatedProducts(product.id, 4) : []),
    [product],
  );

  const sizes = useMemo(() => {
    if (!product) return [];
    if (product.category === 'accessories') return ['OS'];
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const derived = Array.from(
        new Set(
          product.variants
            .map((v) => v.size)
            .filter((s): s is string => Boolean(s)),
        ),
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
      <div className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 text-white flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8FF00] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-[#a0a0a0]">
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
    const matchingVariant = product.variants.find(
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

    addItem(
      {
        id: `${product.id}_${activeVariant.sku}_${selectedSize}`,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        color: activeVariant.colorName,
        colorHex: activeVariant.colorHex,
        size: selectedSize,
        price: product.price,
        image: activeVariant.primaryImage,
        sku: activeVariant.sku,
        maxStock: activeVariant.stock,
      },
      quantity
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
    <div className="min-h-screen bg-[var(--bg)] pt-24 sm:pt-32 pb-24">
      {/* Lightbox / Fullscreen Zoom Modal */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsZoomOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Close fullscreen zoom"
            >
              <X size={24} weight="bold" />
            </button>
            <div className="relative w-full max-w-5xl h-[85vh]">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-2">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
            HOME
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-[var(--text-primary)] transition-colors">
            PRODUCTS
          </Link>
          <span>/</span>
          <Link
            href={`/products?category=${product.category}`}
            className="hover:text-[var(--text-primary)] uppercase transition-colors"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-[var(--text-primary)] uppercase truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Main Grid: Media Rail & Purchase Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          {/* ========================================================= */}
          {/* LEFT COLUMN: Sticky Media Gallery                         */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Primary Main Viewport */}
            <div className="relative aspect-[3/4] w-full bg-black/5 dark:bg-black overflow-hidden border border-[var(--border)] group">
              <Image
                src={gallery[activeImageIdx]}
                alt={`${product.name} in ${activeVariant.colorName}`}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                priority
                className="object-cover object-center transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
              />

              {/* Taxonomy Badges */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
                <Badge variant="volt" size="sm">
                  {`${product.discipline.toUpperCase()} // DIV.0${product.discipline === 'run' ? '1' : product.discipline === 'train' ? '2' : '3'}`}
                </Badge>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-[var(--text-primary)] text-[var(--bg)]">
                    SAVE {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
                  </span>
                )}
              </div>

              {/* Fullscreen Zoom Affordance */}
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                className="touch-target absolute bottom-4 right-4 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-black hover:border-white transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.97]"
                aria-label="Open full resolution inspection"
              >
                <MagnifyingGlassPlus size={20} weight="bold" />
              </button>
            </div>

            {/* Thumbnail Strip */}
            {gallery.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
                {gallery.map((img, tIdx) => (
                  <button
                    key={img + tIdx}
                    type="button"
                    onClick={() => setActiveImageIdx(tIdx)}
                    className={`relative aspect-[3/4] overflow-hidden border transition-[border-color,opacity] duration-150 ${
                      tIdx === activeImageIdx
                        ? 'border-[var(--text-primary)] ring-1 ring-[var(--text-primary)]'
                        : 'border-[var(--border)] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} angle ${tIdx + 1}`}
                      fill
                      sizes="16vw"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Specifications & Purchasing Architecture    */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            {/* Header / Taxonomy */}
            <div className="border-b border-[var(--border)] pb-6 mb-6">
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
                {`${product.gender.toUpperCase()}'S DIVISION // ${product.specsSummary}`}
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight font-heading text-[var(--text-primary)] mt-1">
                {product.name}
              </h1>

              {/* Price & Rating Row */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-baseline gap-3">
                  <span className="text-xl sm:text-2xl font-mono font-bold text-[var(--text-primary)]">
                    {formatPrice(product.price)}
                  </span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-sm font-mono text-[var(--text-muted)] line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)]">
                  <div className="flex items-center text-amber-500">
                    <Star size={14} weight="fill" />
                  </div>
                  <span className="font-bold text-[var(--text-primary)]">{product.rating}</span>
                  <span className="text-[var(--text-muted)]">({product.reviewCount})</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-4 leading-relaxed font-sans">
                {product.headline}
              </p>
            </div>

            {/* Colorway Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  COLORWAY
                </span>
                <span className="text-xs font-mono text-[var(--text-secondary)] uppercase">
                  {activeVariant.colorName}
                </span>
              </div>
              <div className="flex items-center gap-2.5" role="group" aria-label="Available colorways">
                {product.variants.map((v, idx) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setActiveVariantIdx(idx);
                      setActiveImageIdx(0);
                    }}
                    aria-label={`Select colorway ${v.colorName}`}
                    className="touch-target p-1 -m-1 focus:outline-none"
                  >
                    <span
                      className={`block w-6 h-6 rounded-full border transition-[transform,border-color] duration-150 active:scale-[0.95] ${
                        idx === activeVariantIdx
                          ? 'border-[var(--text-primary)] ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--bg)] scale-110 shadow-sm'
                          : 'border-black/20 dark:border-white/20 hover:border-[var(--text-primary)]'
                      }`}
                      style={{ backgroundColor: v.colorHex }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector Matrix */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  SELECT SIZE
                </span>
                <Link
                  href="/sizing"
                  className="text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors underline"
                >
                  <Ruler size={13} weight="bold" />
                  <span>SIZE & FIT GUIDE ↗</span>
                </Link>
              </div>

              <div className={`grid ${sizes.length === 1 ? 'grid-cols-1' : 'grid-cols-6'} gap-1.5`}>
                {sizes.map((s) => {
                  const disabled = isSizeDisabled(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedSize(s)}
                      className={`h-11 flex items-center justify-center font-mono text-xs font-bold uppercase transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] ${
                        selectedSize === s
                          ? 'bg-[var(--text-primary)] text-[var(--bg)] border border-[var(--text-primary)] shadow-sm'
                          : disabled
                          ? 'bg-[var(--bg-elevated)]/30 text-[var(--text-muted)] border border-[var(--border)]/40 line-through cursor-not-allowed'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--text-primary)]'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector & Action Cluster */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                {/* Quantity */}
                <div className="flex items-center border border-[var(--border)] bg-[var(--bg-elevated)] h-12">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="touch-target w-10 h-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-mono active:scale-[0.97]"
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
                    className="touch-target w-10 h-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-mono active:scale-[0.97]"
                  >
                    +
                  </button>
                </div>

                {/* Primary Add to Bag CTA */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="touch-target flex-1 h-12 bg-[var(--text-primary)] text-[var(--bg)] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-[opacity,transform] duration-150 active:scale-[0.97] hover:opacity-95 shadow-md cursor-pointer"
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
                className="touch-target w-full h-11 border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:border-[var(--text-primary)] transition-colors active:scale-[0.97]"
              >
                <Heart size={16} weight={isWishlisted ? 'fill' : 'bold'} className={isWishlisted ? 'text-[var(--accent)]' : ''} />
                <span>{isWishlisted ? 'RETIRE FROM SAVED ARCHIVE' : 'ADD TO SAVED ARCHIVE'}</span>
              </button>
            </div>

            {/* Guarantee Callout Banner */}
            <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] space-y-2 mb-8">
              <div className="flex items-center gap-2.5 text-xs font-mono text-[var(--text-secondary)]">
                <GlobeHemisphereWest size={16} className="text-[var(--accent)]" weight="bold" />
                <span>COMPLIMENTARY EXPRESS DISPATCH OVER ₹150</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-mono text-[var(--text-secondary)]">
                <ShieldCheck size={16} className="text-[#15803d] dark:text-[#22c55e]" weight="bold" />
                <span>30-DAY EXCHANGE TRIAL & FULL WARRANTY</span>
              </div>
            </div>

            {/* Technical Specifications Accordion */}
            <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
              {/* Accordion 1: Fabric & Textile */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('materials')}
                  className="touch-target w-full py-4 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    01 // TEXTILE & MATERIAL ENGINEERING
                  </span>
                  <CaretDown
                    size={14}
                    weight="bold"
                    className={`transition-transform duration-200 text-[var(--text-secondary)] ${
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
                      className="overflow-hidden pb-4 text-xs font-mono text-[var(--text-secondary)] space-y-2"
                    >
                      <p>
                        <span className="text-[var(--text-primary)] font-bold">COMPOSITION:</span>{' '}
                        {product.fabricDetails.composition}
                      </p>
                      <p>
                        <span className="text-[var(--text-primary)] font-bold">WEIGHT:</span>{' '}
                        {product.fabricDetails.weightGsm} GSM Heavyweight Technical Spec
                      </p>
                      <p>
                        <span className="text-[var(--text-primary)] font-bold">TECHNOLOGY:</span>{' '}
                        {product.fabricDetails.technology}
                      </p>
                      <p>
                        <span className="text-[var(--text-primary)] font-bold">SURFACE FINISH:</span>{' '}
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
                  className="touch-target w-full py-4 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    02 // ATHLETIC BIOMECHANICS & FIT
                  </span>
                  <CaretDown
                    size={14}
                    weight="bold"
                    className={`transition-transform duration-200 text-[var(--text-secondary)] ${
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
                      className="overflow-hidden pb-4 text-xs font-sans text-[var(--text-secondary)] leading-relaxed"
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
                  className="touch-target w-full py-4 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    03 // CARE & LONGEVITY PROTOCOL
                  </span>
                  <CaretDown
                    size={14}
                    weight="bold"
                    className={`transition-transform duration-200 text-[var(--text-secondary)] ${
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
                      className="overflow-hidden pb-4 text-xs font-mono text-[var(--text-secondary)]"
                    >
                      <ul className="list-disc pl-5 space-y-1.5">
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
                  className="touch-target w-full py-4 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    04 // DISPATCH & WARRANTY GUARANTEE
                  </span>
                  <CaretDown
                    size={14}
                    weight="bold"
                    className={`transition-transform duration-200 text-[var(--text-secondary)] ${
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
                      className="overflow-hidden pb-4 text-xs font-sans text-[var(--text-secondary)] leading-relaxed space-y-2"
                    >
                      <p>
                        All hardware is dispatched via air freight directly from our central fulfillment depot. Orders before 14:00 EST depart same business day.
                      </p>
                      <p>
                        Complimentary exchanges and returns are supported for 30 calendar days provided items are unworn and tags remain intact.
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
        <section aria-labelledby="reviews-heading" className="mt-20 pt-12 border-t border-[var(--border)]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                FIELD REPORTS
              </span>
              <h2 id="reviews-heading" className="text-2xl sm:text-3xl font-black uppercase font-heading text-[var(--text-primary)]">
                VERIFIED ATHLETE REVIEWS ({liveReviews.length > 0 ? liveReviews.length : product.reviewCount})
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-mono font-bold text-[var(--text-primary)]">{product.rating}</span>
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} weight="fill" />
                  ))}
                </div>
                <span className="text-xs font-mono text-[var(--text-muted)]">BENCHMARK</span>
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
                className="py-2.5 px-4 bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] text-xs font-mono font-bold uppercase tracking-wider transition-colors min-h-[44px]"
              >
                {isReviewFormOpen ? 'CANCEL REVIEW' : '+ WRITE REPORT'}
              </button>
            </div>
          </div>

          {/* Collapsible Review Submission Form */}
          {isReviewFormOpen && (
            <form onSubmit={handleReviewSubmit} className="mb-8 p-6 bg-[var(--bg-surface)] border border-[var(--border)] space-y-4">
              <h3 className="text-xs font-heading font-bold uppercase text-[var(--text-primary)] tracking-wider">
                SUBMIT FIELD PERFORMANCE REPORT
              </h3>
              {reviewError && (
                <div role="alert" className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-mono">
                  {reviewError}
                </div>
              )}
              {reviewSuccess && (
                <div role="status" className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-mono">
                  Report verified and logged to product telemetry.
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">
                    PERFORMANCE RATING (1-5 STARS)
                  </span>
                  <div className="flex items-center gap-1.5 py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="touch-target min-w-[44px] min-h-[44px] flex items-center justify-center text-amber-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star size={20} weight={star <= reviewRating ? 'fill' : 'regular'} />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-mono font-bold text-[var(--text-primary)]">
                      {reviewRating} / 5
                    </span>
                  </div>
                </div>
                <div>
                  <label htmlFor="review-author" className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">
                    ATHLETE CALLSIGN / NAME
                  </label>
                  <input
                    id="review-author"
                    type="text"
                    placeholder={customerUser?.name || 'e.g. Kai N.'}
                    value={reviewAuthor}
                    onChange={(e) => setReviewAuthor(e.target.value)}
                    className="w-full p-2.5 text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)] min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="review-title" className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">
                  REPORT HEADLINE / TITLE *
                </label>
                <input
                  id="review-title"
                  type="text"
                  required
                  placeholder="e.g. Exceptional thermal regulation during 15K trail run"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full p-2.5 text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)] min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="review-body" className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">
                  FIELD OBSERVATIONS / REVIEW CONTENT *
                </label>
                <textarea
                  id="review-body"
                  required
                  rows={4}
                  placeholder="Describe fit, abrasion resistance, moisture regulation, and biomechanics in the field..."
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  className="w-full p-2.5 text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="py-3 px-6 bg-[var(--accent)] text-black dark:text-black font-mono font-bold text-xs uppercase tracking-wider transition-transform active:scale-[0.97] disabled:opacity-50 min-h-[48px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
              >
                {reviewSubmitting ? 'DISPATCHING REPORT...' : 'TRANSMIT REVIEW TO ARCHIVE'}
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {(liveReviews.length > 0 ? liveReviews : product.reviews).map((rev) => (
              <div key={rev.id} className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{rev.author}</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] ml-2">[{rev.discipline}]</span>
                  </div>
                  <div className="flex text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={12} weight="fill" />
                    ))}
                  </div>
                </div>
                <h3 className="text-xs font-heading font-bold uppercase text-[var(--text-primary)]">{rev.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">{rev.content}</p>
                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
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
          <section aria-labelledby="related-heading" className="mt-20 pt-12 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                  COMPLEMENTARY GEAR
                </span>
                <h2 id="related-heading" className="text-2xl sm:text-3xl font-black uppercase font-heading text-[var(--text-primary)]">
                  ENGINEERED COMPANIONS
                </h2>
              </div>
              <Link
                href="/products"
                className="text-xs font-mono font-bold uppercase text-[var(--text-primary)] hover:text-[var(--text-secondary)] flex items-center gap-1"
              >
                <span>VIEW ARCHIVE</span>
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.slug}`}
                  className="group flex flex-col bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--text-primary)] transition-colors p-2 sm:p-3"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 dark:bg-black mb-2">
                    <Image
                      src={item.variants[0]?.primaryImage || '/products/image-4-1.jpg'}
                      alt={item.name}
                      fill
                      sizes="25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-xs font-heading font-bold uppercase text-[var(--text-primary)] truncate">
                    {item.name}
                  </h3>
                  <span className="text-[11px] font-mono text-[var(--text-secondary)] mt-1">
                    {formatPrice(item.price)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
