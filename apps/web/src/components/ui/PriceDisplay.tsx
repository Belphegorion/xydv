'use client';

import React from 'react';

export interface PriceDisplayProps {
  /**
   * Current authoritative payable price in Rupees (or paise if isPaise=true)
   */
  price: number;
  /**
   * Optional regular catalog selling price if discounted (in Rupees, or paise if isPaise=true)
   */
  regularPrice?: number;
  /**
   * Optional statutory Maximum Retail Price (MRP / compareAt) in Rupees (or paise if isPaise=true)
   */
  mrp?: number;
  /**
   * If true, prices are provided in integer paise (e.g. 99900 = ₹999)
   */
  isPaise?: boolean;
  /**
   * Optional discount percentage (e.g. 20 for 20%)
   */
  discountPercent?: number;
  /**
   * Optional promotional badge label (e.g. "20% OFF", "LIMITED DROP")
   */
  badgeLabel?: string | null;
  /**
   * Visual size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to show the savings text ("Save ₹...")
   */
  showSavings?: boolean;
  /**
   * Optional extra container classes
   */
  className?: string;
}

export function PriceDisplay({
  price,
  regularPrice,
  mrp,
  isPaise = false,
  discountPercent,
  badgeLabel,
  size = 'md',
  showSavings = false,
  className = '',
}: PriceDisplayProps) {
  // Convert paise to Rupees if required
  const payableRupees = isPaise ? price / 100 : price;
  const regularRupees =
    regularPrice !== undefined ? (isPaise ? regularPrice / 100 : regularPrice) : payableRupees;
  const mrpRupees = mrp !== undefined ? (isPaise ? mrp / 100 : mrp) : undefined;

  // Struck-through reference price is MRP if higher, otherwise regular price
  const strikeThroughRupees =
    mrpRupees && mrpRupees > payableRupees
      ? mrpRupees
      : regularRupees > payableRupees
        ? regularRupees
        : undefined;

  const hasDiscount = strikeThroughRupees !== undefined && strikeThroughRupees > payableRupees;
  const savingsRupees = hasDiscount ? Math.round(strikeThroughRupees - payableRupees) : 0;
  const calculatedPercent =
    discountPercent ||
    (hasDiscount && strikeThroughRupees > 0
      ? Math.round(((strikeThroughRupees - payableRupees) / strikeThroughRupees) * 100)
      : 0);

  // Size styling tokens
  const sizeClasses = {
    sm: {
      payable: 'text-xs font-bold font-mono',
      struck: 'text-[10px] font-mono',
      badge: 'text-[9px] px-1 py-0.2',
      savings: 'text-[10px]',
    },
    md: {
      payable: 'text-sm font-bold font-mono',
      struck: 'text-xs font-mono',
      badge: 'text-[10px] px-1.5 py-0.5',
      savings: 'text-xs',
    },
    lg: {
      payable: 'text-2xl font-black font-mono tracking-tight',
      struck: 'text-base font-mono',
      badge: 'text-xs px-2 py-0.5 font-bold',
      savings: 'text-sm',
    },
  }[size];

  if (!hasDiscount) {
    return (
      <div className={`flex items-center gap-1.5 tabular-nums ${className}`}>
        <span className="sr-only">Price: </span>
        <span className={`text-[var(--text-primary)] ${sizeClasses.payable}`}>
          ₹{payableRupees.toLocaleString('en-IN')}
        </span>
      </div>
    );
  }

  const effectiveBadgeLabel =
    badgeLabel || (calculatedPercent > 0 ? `${calculatedPercent}% OFF` : null);

  return (
    <div className={`flex flex-wrap items-center gap-2 tabular-nums ${className}`}>
      {/* Current Payable Price */}
      <span className="sr-only">Discounted price: </span>
      <ins
        className={`no-underline text-emerald-400 dark:text-[#E8FF00] ${sizeClasses.payable}`}
      >
        ₹{payableRupees.toLocaleString('en-IN')}
      </ins>

      {/* Struck-through Reference Price */}
      <span className="sr-only">Original price: </span>
      <del className={`line-through text-[var(--text-muted)] ${sizeClasses.struck}`}>
        ₹{strikeThroughRupees.toLocaleString('en-IN')}
      </del>

      {/* Savings Badge */}
      {effectiveBadgeLabel && (
        <span
          className={`rounded font-mono font-bold uppercase tracking-wider bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 ${sizeClasses.badge}`}
          aria-label={`Discount badge: ${effectiveBadgeLabel}`}
        >
          {effectiveBadgeLabel}
        </span>
      )}

      {/* Optional Explicit Savings Line */}
      {showSavings && savingsRupees > 0 && (
        <div className={`w-full text-emerald-500 dark:text-emerald-400 font-medium ${sizeClasses.savings}`}>
          <span className="sr-only">You save: </span>
          <span>
            Save ₹{savingsRupees.toLocaleString('en-IN')}{' '}
            {calculatedPercent > 0 && `(${calculatedPercent}% off)`}
          </span>
        </div>
      )}
    </div>
  );
}
