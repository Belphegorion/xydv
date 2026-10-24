import crypto from 'crypto';
import mongoose from 'mongoose';
import { Coupon, type ICouponDoc } from '../models/Coupon.model';
import { CouponRedemption, type ICouponRedemptionDoc } from '../models/CouponRedemption.model';
import { Product } from '../models/Product.model';
import { AuditLog } from '../models/AuditLog.model';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import type { ICouponValidationResult } from '@vertex/types';

async function recordAudit(
  adminId: string | undefined,
  action: string,
  targetId: string,
  details?: Record<string, unknown>,
) {
  if (!adminId) return;
  try {
    await AuditLog.create({
      adminId,
      action,
      targetType: 'Coupon',
      targetId,
      details,
    });
  } catch (err) {
    logger.error('[AuditLog] Failed to record coupon audit log:', { error: err });
  }
}

export class CouponService {
  /**
   * Generates a random alphanumeric coupon code without lookalike characters.
   */
  generateRandomCode(prefix = 'XYDV'): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Excludes 0, O, 1, I, L
    const randomPart = Array.from(crypto.randomBytes(6))
      .map((b) => chars[b % chars.length])
      .join('');
    return `${prefix}-${randomPart}`.toUpperCase();
  }

  /**
   * Validates a coupon code against cart items and returns authoritative financial preview.
   */
  async validateCoupon(params: {
    code: string;
    items: Array<{
      productId: string;
      sku?: string;
      variantId?: string;
      quantity: number;
      price: number;
    }>;
    userId?: string;
    guestEmail?: string;
  }): Promise<ICouponValidationResult> {
    const { code, items, userId, guestEmail } = params;

    if (!code || typeof code !== 'string') {
      throw new AppError('Coupon code is required', 400);
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('At least one item is required in the cart', 400);
    }

    const normalizedCode = code.trim().toUpperCase();
    const now = new Date();

    const coupon = await Coupon.findOne({ code: normalizedCode });
    if (!coupon) {
      throw new AppError('Invalid coupon code', 404);
    }

    if (coupon.status !== 'active') {
      throw new AppError(`Coupon code is ${coupon.status}`, 400);
    }

    if (now < coupon.startDate) {
      throw new AppError('This coupon promotion has not started yet', 400);
    }

    if (now > coupon.endDate) {
      throw new AppError('This coupon code has expired', 400);
    }

    if (coupon.redemptionCount >= coupon.maxRedemptions) {
      throw new AppError('Coupon usage limit has been reached', 400);
    }

    // Check per-user limit
    const userOrEmailConditions: mongoose.FilterQuery<ICouponRedemptionDoc>[] = [];
    if (userId && mongoose.isValidObjectId(userId)) {
      userOrEmailConditions.push({ userId: new mongoose.Types.ObjectId(userId) });
    }
    if (guestEmail) {
      userOrEmailConditions.push({ guestEmail: guestEmail.toLowerCase().trim() });
    }

    if (userOrEmailConditions.length > 0) {
      const priorCount = await CouponRedemption.countDocuments({
        couponId: coupon._id,
        $or: userOrEmailConditions,
        status: { $in: ['reserved', 'completed'] },
      });

      if (priorCount >= coupon.maxRedemptionsPerUser) {
        throw new AppError('You have already used this coupon code', 400);
      }
    }

    // Product lookup to verify sale item status, categories, and authoritative pricing
    const productIds = items
      .map((i) => i.productId)
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    let totalSubtotalPaise = 0;
    let eligibleSubtotalPaise = 0;

    interface ItemCalc {
      productId: string;
      variantId?: string;
      sku: string;
      itemPrice: number;
      quantity: number;
      itemTotalPaise: number;
      isEligible: boolean;
    }

    const itemCalculations: ItemCalc[] = [];

    for (const item of items) {
      const dbProduct = productMap.get(item.productId);
      const itemPrice = item.price;
      const itemTotalPaise = Math.round(itemPrice * item.quantity * 100);
      totalSubtotalPaise += itemTotalPaise;

      let isEligible = true;

      if (coupon.excludeSaleItems && dbProduct) {
        const variant = dbProduct.variants?.find(
          (v) =>
            (item.sku && v.sku === item.sku) ||
            (item.variantId && (v.id === item.variantId || v._id?.toString() === item.variantId)),
        );
        const compareAt = variant?.compareAt ?? dbProduct.compareAt ?? dbProduct.originalPrice;
        if (compareAt && compareAt > itemPrice) {
          isEligible = false;
        }
      }

      if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
        const isMatch = coupon.applicableProducts.some(
          (pId) => pId.toString() === item.productId,
        );
        if (!isMatch) isEligible = false;
      }

      if (coupon.applicableCategories && coupon.applicableCategories.length > 0 && dbProduct) {
        const catId = dbProduct.category?.toString();
        const isMatch = coupon.applicableCategories.some((cId) => cId.toString() === catId);
        if (!isMatch) isEligible = false;
      }

      if (isEligible) {
        eligibleSubtotalPaise += itemTotalPaise;
      }

      itemCalculations.push({
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku || '',
        itemPrice,
        quantity: item.quantity,
        itemTotalPaise,
        isEligible,
      });
    }

    if (eligibleSubtotalPaise <= 0) {
      throw new AppError(
        coupon.excludeSaleItems
          ? 'No items in your cart are eligible for this coupon (already discounted sale items are excluded)'
          : 'No items in your cart are eligible for this coupon',
        400,
      );
    }

    if (coupon.minOrderAmount && eligibleSubtotalPaise < coupon.minOrderAmount) {
      const minInRupees = (coupon.minOrderAmount / 100).toFixed(2);
      throw new AppError(
        `Minimum eligible order amount of ₹${minInRupees} required for this coupon`,
        400,
      );
    }

    // Compute gross discount in paise
    let grossDiscountPaise = 0;
    if (coupon.discountType === 'percentage') {
      grossDiscountPaise = Math.round(eligibleSubtotalPaise * (coupon.discountValue / 100));
    } else {
      grossDiscountPaise = coupon.discountValue; // in paise
    }

    // Apply Maximum Discount Cap in paise (margin protection)
    let finalDiscountPaise = grossDiscountPaise;
    if (typeof coupon.maxDiscountAmount === 'number' && coupon.maxDiscountAmount > 0) {
      finalDiscountPaise = Math.min(finalDiscountPaise, coupon.maxDiscountAmount);
    }
    finalDiscountPaise = Math.min(finalDiscountPaise, eligibleSubtotalPaise);

    // Proportional line-item distribution in paise
    let allocatedTotalPaise = 0;
    let highestEligibleIndex = -1;
    let highestItemPaise = -1;

    const lineItemAllocations = itemCalculations.map((item, index) => {
      if (!item.isEligible) {
        return {
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku,
          itemPrice: item.itemPrice,
          quantity: item.quantity,
          discountAllocation: 0,
          taxableAmount: item.itemTotalPaise,
        };
      }

      if (item.itemTotalPaise > highestItemPaise) {
        highestItemPaise = item.itemTotalPaise;
        highestEligibleIndex = index;
      }

      const itemAlloc = Math.floor(
        (finalDiscountPaise * item.itemTotalPaise) / eligibleSubtotalPaise,
      );
      allocatedTotalPaise += itemAlloc;

      return {
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        itemPrice: item.itemPrice,
        quantity: item.quantity,
        discountAllocation: itemAlloc,
        taxableAmount: item.itemTotalPaise - itemAlloc,
      };
    });

    // Remainder paise discrepancy reconciliation: allocate penny difference to highest item
    const remainderPaise = finalDiscountPaise - allocatedTotalPaise;
    if (remainderPaise > 0 && highestEligibleIndex >= 0) {
      lineItemAllocations[highestEligibleIndex].discountAllocation += remainderPaise;
      lineItemAllocations[highestEligibleIndex].taxableAmount -= remainderPaise;
    }

    const subtotalRupees = Number((totalSubtotalPaise / 100).toFixed(2));
    const eligibleSubtotalRupees = Number((eligibleSubtotalPaise / 100).toFixed(2));
    const discountAmountRupees = Number((finalDiscountPaise / 100).toFixed(2));
    const taxableSubtotalRupees = Number(((totalSubtotalPaise - finalDiscountPaise) / 100).toFixed(2));

    const estimatedTax = Number((taxableSubtotalRupees * 0.18).toFixed(2));
    const isFreeShipping = subtotalRupees >= 150;
    const shipping = isFreeShipping ? 0 : 15;
    const estimatedTotal = Number((taxableSubtotalRupees + shipping + estimatedTax).toFixed(2));

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: finalDiscountPaise,
      discountAmountRupees,
      maxDiscountCap: coupon.maxDiscountAmount,
      minOrderAmount: coupon.minOrderAmount,
      excludeSaleItems: coupon.excludeSaleItems,
      subtotal: subtotalRupees,
      eligibleSubtotal: eligibleSubtotalRupees,
      taxableSubtotal: taxableSubtotalRupees,
      estimatedTax,
      estimatedTotal,
      lineItemAllocations,
      message: `Coupon ${coupon.code} applied: You save ₹${discountAmountRupees}`,
    };
  }

  /**
   * Atomic coupon reservation with concurrency lock preventing overselling.
   */
  async reserveCoupon(params: {
    couponCode: string;
    razorpayOrderId: string;
    orderId: mongoose.Types.ObjectId;
    discountAmount: number; // in paise
    userId?: string;
    guestEmail?: string;
  }): Promise<{ coupon: ICouponDoc; redemption: ICouponRedemptionDoc }> {
    const normalizedCode = params.couponCode.trim().toUpperCase();
    const now = new Date();

    const coupon = await Coupon.findOneAndUpdate(
      {
        code: normalizedCode,
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now },
        $expr: { $lt: ['$redemptionCount', '$maxRedemptions'] },
      },
      {
        $inc: { redemptionCount: 1 },
      },
      { new: true },
    );

    if (!coupon) {
      throw new AppError('Coupon is no longer available or usage limit reached', 400);
    }

    // Auto-deplete if limit reached
    if (coupon.redemptionCount >= coupon.maxRedemptions) {
      await Coupon.updateOne({ _id: coupon._id }, { $set: { status: 'depleted' } });
    }

    // Check per-user limit with rollback if ceiling exceeded
    const userOrEmailConditions: mongoose.FilterQuery<ICouponRedemptionDoc>[] = [];
    if (params.userId && mongoose.isValidObjectId(params.userId)) {
      userOrEmailConditions.push({ userId: new mongoose.Types.ObjectId(params.userId) });
    }
    if (params.guestEmail) {
      userOrEmailConditions.push({ guestEmail: params.guestEmail.toLowerCase().trim() });
    }

    if (userOrEmailConditions.length > 0) {
      const priorCount = await CouponRedemption.countDocuments({
        couponId: coupon._id,
        $or: userOrEmailConditions,
        status: { $in: ['reserved', 'completed'] },
      });

      if (priorCount >= coupon.maxRedemptionsPerUser) {
        // Rollback coupon count increment
        await Coupon.findByIdAndUpdate(coupon._id, {
          $inc: { redemptionCount: -1 },
          $set: { status: 'active' },
        });
        throw new AppError('You have already used this coupon code', 400);
      }
    }

    try {
      const redemption = await CouponRedemption.create({
        couponId: coupon._id,
        couponCode: coupon.code,
        orderId: params.orderId,
        razorpayOrderId: params.razorpayOrderId,
        userId:
          params.userId && mongoose.isValidObjectId(params.userId)
            ? new mongoose.Types.ObjectId(params.userId)
            : undefined,
        guestEmail: params.guestEmail?.toLowerCase().trim(),
        discountAmount: params.discountAmount,
        status: 'reserved',
      });

      return { coupon, redemption };
    } catch (createErr) {
      await Coupon.findByIdAndUpdate(coupon._id, {
        $inc: { redemptionCount: -1 },
        $set: { status: 'active' },
      });
      throw createErr;
    }
  }

  /**
   * Finalize coupon redemption on successful payment capture.
   */
  async commitRedemption(razorpayOrderId: string): Promise<boolean> {
    const updated = await CouponRedemption.findOneAndUpdate(
      { razorpayOrderId, status: 'reserved' },
      { $set: { status: 'completed' } },
      { new: true },
    );
    return Boolean(updated);
  }

  /**
   * Release coupon redemption and restore redemptionCount on payment failure or cancellation.
   */
  async releaseRedemption(razorpayOrderId: string): Promise<boolean> {
    const redemption = await CouponRedemption.findOneAndUpdate(
      { razorpayOrderId, status: { $in: ['reserved', 'completed'] } },
      { $set: { status: 'released' } },
      { new: true },
    );

    if (redemption) {
      await Coupon.findByIdAndUpdate(redemption.couponId, {
        $inc: { redemptionCount: -1 },
        $set: { status: 'active' },
      });
      return true;
    }

    return false;
  }

  /**
   * Admin paginated coupons list.
   */
  async getCoupons(params: {
    page?: number;
    limit?: number;
    status?: string;
    tier?: string;
    search?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));

    const filter: Record<string, unknown> = {};

    if (params.status && ['active', 'inactive', 'expired', 'depleted'].includes(params.status)) {
      filter.status = params.status;
    }

    if (params.tier && ['10', '20', '50', 'custom'].includes(params.tier)) {
      filter.presetTier = params.tier;
    }

    if (params.search) {
      const regex = new RegExp(params.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.code = regex;
    }

    const [items, total] = await Promise.all([
      Coupon.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Coupon.countDocuments(filter),
    ]);

    // Calculate aggregated platform coupon stats
    const [totalActive, totalRedemptionsAgg] = await Promise.all([
      Coupon.countDocuments({ status: 'active' }),
      CouponRedemption.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalDiscount: { $sum: '$discountAmount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const stats = {
      totalActive,
      totalRedemptions: totalRedemptionsAgg[0]?.count ?? 0,
      totalDiscountIssuedRupees: Number(((totalRedemptionsAgg[0]?.totalDiscount ?? 0) / 100).toFixed(2)),
    };

    return {
      items,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single coupon by ID.
   */
  async getCouponById(id: string): Promise<ICouponDoc> {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Coupon not found', 404);
    }
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }
    return coupon;
  }

  /**
   * Create a new coupon.
   */
  async createCoupon(data: Partial<ICouponDoc>, adminId?: string): Promise<ICouponDoc> {
    const normalizedCode = (data.code ?? this.generateRandomCode()).trim().toUpperCase();

    const existing = await Coupon.findOne({ code: normalizedCode });
    if (existing) {
      throw new AppError(`Coupon with code "${normalizedCode}" already exists`, 409);
    }

    const doc = await Coupon.create({
      ...data,
      code: normalizedCode,
      createdBy: adminId ? new mongoose.Types.ObjectId(adminId) : undefined,
    });

    await recordAudit(adminId, 'CREATE_COUPON', doc._id.toString(), {
      code: doc.code,
      tier: doc.presetTier,
      discountValue: doc.discountValue,
    });

    return doc;
  }

  /**
   * Update an existing coupon.
   */
  async updateCoupon(
    id: string,
    data: Partial<ICouponDoc>,
    adminId?: string,
  ): Promise<ICouponDoc> {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Coupon not found', 404);
    }

    const existing = await Coupon.findById(id);
    if (!existing) {
      throw new AppError('Coupon not found', 404);
    }

    // Code is immutable once redemptions have taken place
    if (data.code && data.code.toUpperCase() !== existing.code && existing.redemptionCount > 0) {
      throw new AppError('Coupon code cannot be renamed after it has been redeemed', 400);
    }

    if (data.code) {
      data.code = data.code.trim().toUpperCase();
    }

    const updated = await Coupon.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!updated) {
      throw new AppError('Coupon not found', 404);
    }

    await recordAudit(adminId, 'UPDATE_COUPON', id, {
      code: updated.code,
      changes: Object.keys(data),
    });

    return updated;
  }

  /**
   * Delete or deactivate a coupon.
   */
  async deleteCoupon(id: string, adminId?: string): Promise<boolean> {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Coupon not found', 404);
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }

    if (coupon.redemptionCount > 0) {
      // Soft deactivate if historical orders depend on it
      coupon.status = 'inactive';
      await coupon.save();
    } else {
      await Coupon.deleteOne({ _id: id });
    }

    await recordAudit(adminId, 'DELETE_COUPON', id, {
      code: coupon.code,
      redemptions: coupon.redemptionCount,
    });

    return true;
  }

  /**
   * Get redemptions for a specific coupon.
   */
  async getCouponRedemptions(
    couponId: string,
    params: { page?: number; limit?: number },
  ) {
    if (!mongoose.isValidObjectId(couponId)) {
      throw new AppError('Coupon not found', 404);
    }

    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));

    const [redemptions, total] = await Promise.all([
      CouponRedemption.find({ couponId: new mongoose.Types.ObjectId(couponId) })
        .populate('orderId', 'total status createdAt paymentStatus')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CouponRedemption.countDocuments({ couponId: new mongoose.Types.ObjectId(couponId) }),
    ]);

    return {
      redemptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

export const couponService = new CouponService();
export default couponService;
