'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingBag, Trash, ArrowRight, Check } from '@phosphor-icons/react';
import { useWishlistStore } from '@/store/wishlist';
import { useCartStore } from '@/store/cart';
import { formatPrice, formatCardTitle } from '@/lib/utils';
import { getProductById } from '@/lib/catalog';
import { EMIL_EASE } from '@/lib/motion';
import { api } from '@/lib/api';

interface ApiProductVariant {
  _id?: string;
  id?: string;
  sku?: string;
  colorName?: string;
  colorHex?: string;
  size?: string;
  stock?: number;
}

interface ApiProductDetails {
  category?: string;
  variants?: ApiProductVariant[];
}

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [liveProducts, setLiveProducts] = useState<Record<string, ApiProductDetails>>({});

  useEffect(() => {
    setMounted(true);
    items.forEach((item) => {
      if (!getProductById(item.productId)) {
        api
          .get<{ data?: ApiProductDetails; product?: ApiProductDetails }>(
            `/products/${encodeURIComponent(item.slug || item.productId)}`,
          )
          .then((res) => {
            const prod = res?.data || res?.product;
            if (prod) {
              setLiveProducts((prev) => ({ ...prev, [item.productId]: prod }));
            }
          })
          .catch(() => {});
      }
    });
  }, [items]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] pt-32 pb-24">
        <p className="animate-pulse font-mono text-xs tracking-widest text-[var(--text-muted)] uppercase">
          SYNCHRONIZING SAVED HARDWARE...
        </p>
      </div>
    );
  }

  const handleMoveToBag = async (productId: string) => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;

    const catalogProduct = getProductById(productId);
    let liveProd = liveProducts[productId];

    if (!catalogProduct && !liveProd) {
      try {
        const res = await api.get<{ data?: ApiProductDetails; product?: ApiProductDetails }>(
          `/products/${encodeURIComponent(item.slug || productId)}`,
        );
        const fetched = res?.data || res?.product;
        if (fetched) {
          liveProd = fetched;
          setLiveProducts((prev) => ({ ...prev, [productId]: fetched }));
        }
      } catch {
        // Fallback gracefully if API is offline
      }
    }

    const category = catalogProduct?.category || liveProd?.category;
    const isAccessories = category === 'accessories';
    const variants = catalogProduct?.variants || liveProd?.variants;
    const defaultVariant = variants && variants.length > 0 ? variants[0] : undefined;

    const size = selectedSizes[productId] || (isAccessories ? 'OS' : defaultVariant?.size || 'M');

    const matchingVariant = variants?.find((v) => v.size === size) || defaultVariant;

    addItem({
      id: `${productId}_${matchingVariant?.sku || 'SKU'}_${size}`,
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      color: matchingVariant?.colorName || 'Void Obsidian',
      colorHex: matchingVariant?.colorHex || '#0A0A0A',
      size: size,
      price: item.price,
      image: item.image,
      sku: matchingVariant?.sku || `${item.productId}-${size}`,
    });

    setAddedIds((prev) => ({ ...prev, [productId]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [productId]: false }));
      openCart();
    }, 350);
  };

  const handleClearAll = () => {
    items.forEach((item) => remove(item.productId));
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-24 pb-24 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
              <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                SAVED HARDWARE ARCHIVE
              </span>
            </div>
            <h1 className="font-heading text-2xl font-black tracking-tight text-balance text-[var(--text-primary)] uppercase sm:text-3xl md:text-4xl">
              PERSONAL LOCKER
            </h1>
            <p className="mt-2 font-sans text-xs text-[var(--text-secondary)] sm:text-sm">
              Persistent storage for reserved high-performance garments and mission gear.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-[var(--text-muted)] uppercase">
              {items.length} {items.length === 1 ? 'ITEM' : 'ITEMS'} RESERVED
            </span>
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-rose-500 uppercase transition-colors hover:text-rose-600"
              >
                <Trash size={14} weight="bold" />
                <span>Purge archive</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="mx-auto max-w-xl border border-dashed border-[var(--border)] p-8 py-24 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)]">
              <Heart size={28} weight="light" />
            </div>
            <h2 className="font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase">
              YOUR SAVED LOCKER IS EMPTY
            </h2>
            <p className="mx-auto mt-2 max-w-sm font-sans text-xs text-[var(--text-secondary)]">
              Explore the technical division catalog and save garments to evaluate specs, compare
              weights, or quick-transfer to bag.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 bg-[var(--text-primary)] px-6 py-3 font-mono text-xs font-bold tracking-wider text-[var(--bg)] transition-[background-color,border-color,opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]"
            >
              <span>Explore all gear</span>
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
              {items.map((item) => {
                const catalogProduct = getProductById(item.productId);
                const liveProd = liveProducts[item.productId];
                const isAccessories =
                  (catalogProduct?.category || liveProd?.category) === 'accessories';
                const variants: Array<{ size?: string }> | undefined =
                  liveProd?.variants || catalogProduct?.variants;
                const derivedSizes: string[] =
                  variants && variants.length > 0
                    ? Array.from(
                        new Set(
                          variants
                            .map((v) => v.size)
                            .filter((s): s is string => typeof s === 'string' && s.length > 0),
                        ),
                      )
                    : [];
                const availableSizes: string[] = isAccessories
                  ? ['OS']
                  : derivedSizes.length > 0
                    ? derivedSizes
                    : ['OS'];
                const curSize: string =
                  selectedSizes[item.productId] ||
                  (isAccessories ? 'OS' : availableSizes[0] || 'OS');
                const isAdded = Boolean(addedIds[item.productId]);

                return (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: EMIL_EASE }}
                    className="group relative flex flex-col border border-[var(--border)] bg-[var(--bg-surface)] transition-colors hover:border-[var(--text-primary)]"
                  >
                    {/* Media */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 dark:bg-black">
                      <Link
                        href={`/products/${item.slug}`}
                        className="relative block h-full w-full"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 25vw"
                          className="object-cover transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
                        />
                      </Link>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => remove(item.productId)}
                        aria-label={`Remove ${item.name} from locker`}
                        className="touch-target absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-colors hover:border-rose-600 hover:bg-rose-600 active:scale-[0.97]"
                      >
                        <Trash size={16} weight="bold" />
                      </button>
                    </div>

                    {/* Meta & Actions */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <Link href={`/products/${item.slug}`}>
                          <h3 className="font-heading truncate text-xs font-bold tracking-tight text-[var(--text-primary)] transition-colors hover:text-[var(--text-secondary)] sm:text-sm">
                            {formatCardTitle(item.name)}
                          </h3>
                        </Link>
                        <span className="mt-1 block font-mono text-xs font-bold text-[var(--text-primary)]">
                          {formatPrice(item.price)}
                        </span>

                        {/* Size Picker */}
                        <div className="mt-3">
                          <span className="mb-1 block font-mono text-[9px] tracking-wider text-[var(--text-muted)] uppercase">
                            SELECT SIZE FOR BAG:
                          </span>
                          <div
                            className={`grid ${isAccessories ? 'grid-cols-1' : 'grid-cols-6'} gap-1`}
                          >
                            {availableSizes.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() =>
                                  setSelectedSizes((prev) => ({ ...prev, [item.productId]: s }))
                                }
                                className={`flex h-7 items-center justify-center font-mono text-[10px] font-bold uppercase transition-colors ${
                                  curSize === s
                                    ? 'border border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg)]'
                                    : 'border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Button: Move to Bag */}
                      <button
                        type="button"
                        onClick={() => handleMoveToBag(item.productId)}
                        className="touch-target mt-4 flex h-10 w-full items-center justify-center gap-1.5 bg-[var(--text-primary)] font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase transition-[background-color,border-color,opacity,transform] duration-150 active:scale-[0.97]"
                      >
                        {isAdded ? (
                          <>
                            <Check size={14} weight="bold" />
                            <span>ADDED TO BAG</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={14} weight="bold" />
                            <span>MOVE TO BAG · {curSize}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
