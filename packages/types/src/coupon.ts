export type CouponDiscountType = 'percentage' | 'fixed';
export type CouponPresetTier = '10' | '20' | '50' | 'custom';
export type CouponStatus = 'active' | 'inactive' | 'expired' | 'depleted';

export interface ICoupon {
  _id: string;
  code: string; // Uppercase alphanumeric (e.g. 'XYDV50', 'SUMMER20')
  discountType: CouponDiscountType;
  discountValue: number; // e.g. 10, 20, 50 for %, or amount in paise for fixed
  presetTier?: CouponPresetTier;
  maxDiscountAmount?: number; // In paise (mandatory for 50% tier)
  minOrderAmount: number; // In paise (default 0)
  excludeSaleItems: boolean; // Default true for 50% tier
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  maxRedemptions: number; // Total platform uses allowed
  maxRedemptionsPerUser: number; // Uses per user/email (default 1)
  redemptionCount: number; // Current completed redemptions
  status: CouponStatus;
  applicableCategories?: string[]; // Empty array or undefined = sitewide
  applicableProducts?: string[]; // Empty array or undefined = sitewide
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICouponValidationResult {
  valid: boolean;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discountAmount: number; // In paise
  discountAmountRupees: number; // In rupees
  maxDiscountCap?: number; // In paise
  minOrderAmount: number; // In paise
  excludeSaleItems: boolean;
  subtotal: number; // In rupees
  eligibleSubtotal: number; // In rupees
  taxableSubtotal: number; // In rupees
  estimatedTax: number; // In rupees
  estimatedTotal: number; // In rupees
  lineItemAllocations: Array<{
    productId: string;
    variantId?: string;
    sku: string;
    itemPrice: number; // In rupees
    quantity: number;
    discountAllocation: number; // In paise
    taxableAmount: number; // In paise
  }>;
  message?: string;
}
