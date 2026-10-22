'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  ShoppingBag,
  Trash,
  ArrowRight,
  Check,
} from '@phosphor-icons/react';
import { useWishlistStore } from '@/store/wishlist';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
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
      <div className="min-h-screen bg-[var(--bg)] pt-32 pb-24 flex items-center justify-center">
        <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest animate-pulse">
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

    const size =
      selectedSizes[productId] ||
      (isAccessories
        ? 'OS'
        : defaultVariant?.size || 'M');

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
    <div className="min-h-screen bg-[var(--bg)] pt-24 sm:pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[var(--border)] pb-8 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
                SAVED HARDWARE ARCHIVE
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight font-heading text-[var(--text-primary)]">
              PERSONAL LOCKER
            </h1>
            <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-sans mt-2">
              Persistent storage for reserved high-performance garments and mission gear.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase">
              {items.length} {items.length === 1 ? 'ITEM' : 'ITEMS'} RESERVED
            </span>
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-mono font-bold uppercase text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1.5"
              >
                <Trash size={14} weight="bold" />
                <span>PURGE ARCHIVE</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-[var(--border)] p-8 max-w-xl mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
              <Heart size={28} weight="light" />
            </div>
            <h2 className="text-sm font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
              YOUR SAVED LOCKER IS EMPTY
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-2 font-sans max-w-sm mx-auto">
              Explore the technical division catalog and save garments to evaluate specs, compare weights, or quick-transfer to bag.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[var(--text-primary)] text-[var(--bg)] text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.97] transition-[background-color,border-color,opacity,transform] duration-150"
            >
              <span>EXPLORE ALL GEAR</span>
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <AnimatePresence>
              {items.map((item) => {
                const catalogProduct = getProductById(item.productId);
                const liveProd = liveProducts[item.productId];
                const isAccessories = (catalogProduct?.category || liveProd?.category) === 'accessories';
                const availableSizes = isAccessories
                  ? ['OS']
                  : liveProd?.variants && liveProd.variants.length > 0
                  ? Array.from(
                      new Set(
                        liveProd.variants
                          .map((v) => v.size)
                          .filter((s): s is string => Boolean(s)),
                      ),
                    )
                  : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
                const curSize = selectedSizes[item.productId] || (isAccessories ? 'OS' : (availableSizes[0] || 'M'));
                const isAdded = Boolean(addedIds[item.productId]);

                return (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: EMIL_EASE }}
                    className="group relative flex flex-col bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--text-primary)] transition-colors"
                  >
                    {/* Media */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5 dark:bg-black">
                      <Link href={`/products/${item.slug}`} className="block w-full h-full relative">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                        />
                      </Link>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => remove(item.productId)}
                        aria-label={`Remove ${item.name} from locker`}
                        className="touch-target absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-rose-600 hover:border-rose-600 transition-colors flex items-center justify-center active:scale-[0.97]"
                      >
                        <Trash size={16} weight="bold" />
                      </button>
                    </div>

                    {/* Meta & Actions */}
                    <div className="p-4 flex flex-col flex-1 justify-between">
                      <div>
                        <Link href={`/products/${item.slug}`}>
                          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-tight font-heading text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors truncate">
                            {item.name}
                          </h3>
                        </Link>
                        <span className="text-xs font-mono font-bold text-[var(--text-primary)] mt-1 block">
                          {formatPrice(item.price)}
                        </span>

                        {/* Size Picker */}
                        <div className="mt-3">
                          <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                            SELECT SIZE FOR BAG:
                          </span>
                          <div className={`grid ${isAccessories ? 'grid-cols-1' : 'grid-cols-6'} gap-1`}>
                            {availableSizes.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setSelectedSizes((prev) => ({ ...prev, [item.productId]: s }))}
                                className={`h-7 flex items-center justify-center font-mono text-[10px] font-bold uppercase transition-colors ${
                                  curSize === s
                                    ? 'bg-[var(--text-primary)] text-[var(--bg)] border border-[var(--text-primary)]'
                                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--text-primary)]'
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
                        className="touch-target mt-4 w-full h-10 bg-[var(--text-primary)] text-[var(--bg)] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.97] transition-[background-color,border-color,opacity,transform] duration-150"
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
