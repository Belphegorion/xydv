import type { ResolvedPrice, DiscountScope, DiscountType, DiscountStatus } from '@vertex/types';

export interface PricingEngineProductInput {
  _id: string | { toString(): string };
  price: number;
  compareAt?: number;
  mrpPaise?: number;
  sellingPricePaise?: number;
  category?: string;
  isDiscountExcluded?: boolean;
}

export interface PricingEngineVariantInput {
  price?: number;
  compareAt?: number;
  mrpPaise?: number;
  sellingPricePaise?: number;
  sku?: string;
}

export interface DiscountRuleInput {
  _id?: string | { toString(): string } | null;
  name: string;
  scope: DiscountScope;
  targetProductIds?: Array<string | { toString(): string }>;
  targetCategories?: string[];
  type: DiscountType;
  value: number;
  priceFloorPaise?: number;
  maxDiscountCapPaise?: number;
  excludedProductIds?: Array<string | { toString(): string }>;
  excludedCategories?: string[];
  startDate?: Date | string;
  endDate?: Date | string | null;
  status: DiscountStatus;
  priority?: number;
  badgeLabel?: string;
  allowCouponStacking?: boolean;
}

/**
 * Pure, deterministic pricing engine.
 * Calculates authoritative payable price, savings, discount allocations, and badges.
 * Evaluates scope precedence: Product > Category > Catalog.
 * Enforces safety price floors (default ₹299 = 29,900 paise) and maximum 70% discount clamp.
 */
export function resolvePrice(
  product: PricingEngineProductInput,
  variant?: PricingEngineVariantInput | null,
  activeDiscounts: DiscountRuleInput[] = [],
  now: Date = new Date(),
): ResolvedPrice {
  // 1. Calculate baseline prices in integer paise
  const regularRupees =
    variant?.price !== undefined && variant?.price !== null
      ? variant.price
      : product.price ?? 0;

  const regularSellingPaise =
    variant?.sellingPricePaise ??
    product.sellingPricePaise ??
    Math.round(regularRupees * 100);

  const rawMrpPaise =
    variant?.mrpPaise ??
    product.mrpPaise ??
    (variant?.compareAt && variant.compareAt > 0
      ? Math.round(variant.compareAt * 100)
      : product.compareAt && product.compareAt > 0
        ? Math.round(product.compareAt * 100)
        : regularSellingPaise);

  const mrpPaise = Math.max(rawMrpPaise, regularSellingPaise);

  // If discounts are excluded or no active discounts are passed, return baseline immediately
  if (product.isDiscountExcluded || !activeDiscounts || activeDiscounts.length === 0) {
    return {
      mrpPaise,
      sellingPricePaise: regularSellingPaise,
      effectivePricePaise: regularSellingPaise,
      discountAmountPaise: 0,
      discountPercent: 0,
      activeDiscountId: null,
      activeDiscountName: null,
      badgeLabel: null,
      ruleApplied: 'none',
    };
  }

  // 2. Filter eligible active discounts
  const prodIdStr = product._id.toString();
  const catSlug = (product.category || '').toLowerCase().trim();

  const eligible = activeDiscounts.filter((d) => {
    if (d.status !== 'active') return false;
    if (d.startDate && now < new Date(d.startDate)) return false;
    if (d.endDate && now > new Date(d.endDate)) return false;

    // Check exclusions
    if (
      d.excludedProductIds &&
      d.excludedProductIds.some((id) => id.toString() === prodIdStr)
    ) {
      return false;
    }
    if (
      d.excludedCategories &&
      d.excludedCategories.map((c) => c.toLowerCase().trim()).includes(catSlug)
    ) {
      return false;
    }

    // Check scope match
    if (d.scope === 'product') {
      return (
        d.targetProductIds &&
        d.targetProductIds.some((id) => id.toString() === prodIdStr)
      );
    }
    if (d.scope === 'category') {
      return (
        d.targetCategories &&
        d.targetCategories.map((c) => c.toLowerCase().trim()).includes(catSlug)
      );
    }
    if (d.scope === 'catalog') {
      return true;
    }
    return false;
  });

  if (eligible.length === 0) {
    return {
      mrpPaise,
      sellingPricePaise: regularSellingPaise,
      effectivePricePaise: regularSellingPaise,
      discountAmountPaise: 0,
      discountPercent: 0,
      activeDiscountId: null,
      activeDiscountName: null,
      badgeLabel: null,
      ruleApplied: 'none',
    };
  }

  // 3. Conflict Resolution: "Most Specific Wins" (Product > Category > Catalog)
  eligible.sort((a, b) => {
    const scopeWeight: Record<DiscountScope, number> = {
      product: 3,
      category: 2,
      catalog: 1,
    };
    const diff = scopeWeight[b.scope] - scopeWeight[a.scope];
    if (diff !== 0) return diff;
    return (b.priority ?? 0) - (a.priority ?? 0);
  });

  const winner = eligible[0];

  // 4. Calculate raw discount amount
  let calculatedDiscountPaise = 0;
  if (winner.type === 'percentage') {
    calculatedDiscountPaise = Math.round((regularSellingPaise * winner.value) / 100);
  } else if (winner.type === 'fixed_amount') {
    calculatedDiscountPaise = Math.round(winner.value);
  } else if (winner.type === 'set_price') {
    calculatedDiscountPaise = Math.max(0, regularSellingPaise - Math.round(winner.value));
  }

  // 5. Apply Safeguards: Per-Item Cap and Absolute Price Floor
  if (winner.maxDiscountCapPaise !== undefined && winner.maxDiscountCapPaise > 0) {
    calculatedDiscountPaise = Math.min(calculatedDiscountPaise, winner.maxDiscountCapPaise);
  }

  const floorPaise = winner.priceFloorPaise ?? 29900; // Default ₹299
  const maxPossibleDiscount = Math.max(0, regularSellingPaise - floorPaise);
  calculatedDiscountPaise = Math.min(calculatedDiscountPaise, maxPossibleDiscount);

  // Maximum 70% discount clamp
  const max70PercentPaise = Math.round(regularSellingPaise * 0.7);
  calculatedDiscountPaise = Math.min(calculatedDiscountPaise, max70PercentPaise);

  const effectivePricePaise = regularSellingPaise - calculatedDiscountPaise;
  const discountPercent =
    regularSellingPaise > 0
      ? Math.round((calculatedDiscountPaise / regularSellingPaise) * 100)
      : 0;

  return {
    mrpPaise,
    sellingPricePaise: regularSellingPaise,
    effectivePricePaise,
    discountAmountPaise: calculatedDiscountPaise,
    discountPercent,
    activeDiscountId: winner._id ? winner._id.toString() : null,
    activeDiscountName: winner.name,
    badgeLabel: winner.badgeLabel || (discountPercent > 0 ? `${discountPercent}% OFF` : null),
    ruleApplied: winner.scope,
  };
}
