/**
 * Discount Domain Types (Amazon/Flipkart Style Tiered Promotional System)
 */

export type DiscountScope = 'product' | 'category' | 'catalog';
export type DiscountType = 'percentage' | 'fixed_amount' | 'set_price';
export type DiscountStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'ended';

export interface Discount {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  scope: DiscountScope;
  targetProductIds: string[];
  targetCategories: string[];
  type: DiscountType;
  value: number; // Percentage (e.g. 20) or Paise amount (e.g. 30000 for ₹300)
  priceFloorPaise: number; // Minimum price floor in paise (default 29900 = ₹299)
  maxDiscountCapPaise?: number; // Maximum discount cap per item in paise
  excludedProductIds: string[];
  excludedCategories: string[];
  startDate: string;
  endDate?: string;
  status: DiscountStatus;
  priority: number;
  badgeLabel?: string;
  allowCouponStacking: boolean;
  maxCombinedDiscountPercent: number;
  affectedProductCount?: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResolvedPrice {
  mrpPaise: number; // Statutory Maximum Retail Price in paise
  sellingPricePaise: number; // Regular catalog selling price in paise
  effectivePricePaise: number; // Current payable price in paise
  discountAmountPaise: number; // Difference in paise
  discountPercent: number; // e.g. 20 for 20%
  activeDiscountId: string | null;
  activeDiscountName: string | null;
  badgeLabel: string | null;
  ruleApplied: DiscountScope | 'none';
}

export interface DiscountPreviewItem {
  productId: string;
  productName: string;
  category: string;
  mrp: number;
  regularPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountPercent: number;
  badgeLabel?: string;
}

export interface DiscountPreviewResponse {
  affectedCount: number;
  sampleProducts: DiscountPreviewItem[];
}
