import mongoose from 'mongoose';
import { Discount, type IDiscount } from '../models/Discount.model';
import { Product } from '../models/Product.model';
import { AuditLog } from '../models/AuditLog.model';
import { AppError } from '../middleware/errorHandler';
import { resolvePrice, type DiscountRuleInput } from './pricing.engine';
import type { DiscountPreviewResponse, DiscountPreviewItem } from '@vertex/types';

let cachedActiveDiscounts: IDiscount[] | null = null;
let lastDiscountsFetch = 0;
const DISCOUNTS_CACHE_TTL_MS = 10_000;

export class DiscountService {
  /**
   * Invalidate memory cache of active discounts.
   */
  invalidateCache(): void {
    cachedActiveDiscounts = null;
    lastDiscountsFetch = 0;
  }

  /**
   * Fetch currently valid, active discounts from MongoDB.
   */
  async getActiveDiscounts(now: Date = new Date()): Promise<IDiscount[]> {
    const time = now.getTime();
    if (cachedActiveDiscounts && time - lastDiscountsFetch < DISCOUNTS_CACHE_TTL_MS) {
      return cachedActiveDiscounts;
    }

    const discounts = await Discount.find({
      status: 'active',
      startDate: { $lte: now },
      $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }],
    }).sort({ priority: -1, createdAt: -1 });

    cachedActiveDiscounts = discounts;
    lastDiscountsFetch = time;
    return cachedActiveDiscounts;
  }

  /**
   * Create a new discount and trigger recomputation if active.
   */
  async createDiscount(
    data: {
      name: string;
      description?: string;
      scope: 'product' | 'category' | 'catalog';
      targetProductIds?: string[];
      targetCategories?: string[];
      type: 'percentage' | 'fixed_amount' | 'set_price';
      value: number;
      priceFloorPaise?: number;
      maxDiscountCapPaise?: number;
      excludedProductIds?: string[];
      excludedCategories?: string[];
      startDate: string | Date;
      endDate?: string | Date;
      status?: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended';
      priority?: number;
      badgeLabel?: string;
      allowCouponStacking?: boolean;
      maxCombinedDiscountPercent?: number;
    },
    adminId?: string,
    ip?: string,
  ): Promise<IDiscount> {
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : undefined;
    const now = new Date();

    let initialStatus = data.status || 'draft';
    if (initialStatus === 'active' && startDate > now) {
      initialStatus = 'scheduled';
    }

    const discount = await Discount.create({
      ...data,
      startDate,
      endDate,
      status: initialStatus,
      targetProductIds: (data.targetProductIds || []).map((id) => new mongoose.Types.ObjectId(id)),
      excludedProductIds: (data.excludedProductIds || []).map((id) => new mongoose.Types.ObjectId(id)),
      targetCategories: (data.targetCategories || []).map((c) => c.toLowerCase().trim()),
      excludedCategories: (data.excludedCategories || []).map((c) => c.toLowerCase().trim()),
      createdBy: adminId,
      updatedBy: adminId,
    });

    this.invalidateCache();

    // If active, recompute effective prices on affected products
    if (discount.status === 'active') {
      await this.recomputeAllProductPrices();
    }

    // Write to audit log
    if (adminId) {
      await AuditLog.create({
        adminId,
        action: 'DISCOUNT_CREATE',
        targetType: 'Discount',
        targetId: discount._id.toString(),
        details: { name: discount.name, scope: discount.scope, type: discount.type, value: discount.value },
        ip,
      }).catch(() => {});
    }

    return discount;
  }

  /**
   * Update an existing discount.
   */
  async updateDiscount(
    id: string,
    data: Partial<{
      name: string;
      description?: string;
      scope: 'product' | 'category' | 'catalog';
      targetProductIds?: string[];
      targetCategories?: string[];
      type: 'percentage' | 'fixed_amount' | 'set_price';
      value: number;
      priceFloorPaise?: number;
      maxDiscountCapPaise?: number;
      excludedProductIds?: string[];
      excludedCategories?: string[];
      startDate?: string | Date;
      endDate?: string | Date;
      status?: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended';
      priority?: number;
      badgeLabel?: string;
      allowCouponStacking?: boolean;
      maxCombinedDiscountPercent?: number;
    }>,
    adminId?: string,
    ip?: string,
  ): Promise<IDiscount> {
    const existing = await Discount.findById(id);
    if (!existing) {
      throw new AppError('Discount not found', 404);
    }

    const updatePayload: Record<string, unknown> = { ...data, updatedBy: adminId };
    if (data.startDate) updatePayload.startDate = new Date(data.startDate);
    if (data.endDate) updatePayload.endDate = new Date(data.endDate);
    if (data.targetProductIds) {
      updatePayload.targetProductIds = data.targetProductIds.map((tid) => new mongoose.Types.ObjectId(tid));
    }
    if (data.excludedProductIds) {
      updatePayload.excludedProductIds = data.excludedProductIds.map((xid) => new mongoose.Types.ObjectId(xid));
    }
    if (data.targetCategories) {
      updatePayload.targetCategories = data.targetCategories.map((c) => c.toLowerCase().trim());
    }
    if (data.excludedCategories) {
      updatePayload.excludedCategories = data.excludedCategories.map((c) => c.toLowerCase().trim());
    }

    const updated = await Discount.findByIdAndUpdate(id, updatePayload, { new: true });
    if (!updated) {
      throw new AppError('Failed to update discount', 500);
    }

    this.invalidateCache();
    await this.recomputeAllProductPrices();

    if (adminId) {
      await AuditLog.create({
        adminId,
        action: 'DISCOUNT_UPDATE',
        targetType: 'Discount',
        targetId: updated._id.toString(),
        details: { oldStatus: existing.status, newStatus: updated.status, changes: Object.keys(data) },
        ip,
      }).catch(() => {});
    }

    return updated;
  }

  /**
   * Toggle pause/resume on a discount.
   */
  async togglePause(id: string, adminId?: string, ip?: string): Promise<IDiscount> {
    const discount = await Discount.findById(id);
    if (!discount) {
      throw new AppError('Discount not found', 404);
    }

    const newStatus = discount.status === 'paused' ? 'active' : 'paused';
    discount.status = newStatus;
    discount.updatedBy = adminId;
    await discount.save();

    this.invalidateCache();
    await this.recomputeAllProductPrices();

    if (adminId) {
      await AuditLog.create({
        adminId,
        action: newStatus === 'paused' ? 'DISCOUNT_PAUSE' : 'DISCOUNT_RESUME',
        targetType: 'Discount',
        targetId: discount._id.toString(),
        details: { status: newStatus },
        ip,
      }).catch(() => {});
    }

    return discount;
  }

  /**
   * Prematurely end an active discount.
   */
  async endDiscount(id: string, adminId?: string, ip?: string): Promise<IDiscount> {
    const discount = await Discount.findById(id);
    if (!discount) {
      throw new AppError('Discount not found', 404);
    }

    discount.status = 'ended';
    discount.endDate = new Date();
    discount.updatedBy = adminId;
    await discount.save();

    this.invalidateCache();
    await this.recomputeAllProductPrices();

    if (adminId) {
      await AuditLog.create({
        adminId,
        action: 'DISCOUNT_END',
        targetType: 'Discount',
        targetId: discount._id.toString(),
        details: { endedAt: discount.endDate },
        ip,
      }).catch(() => {});
    }

    return discount;
  }

  /**
   * Preview discount impact on 5 sample products and compute affected count.
   */
  async previewDiscount(data: {
    scope: 'product' | 'category' | 'catalog';
    targetProductIds?: string[];
    targetCategories?: string[];
    type: 'percentage' | 'fixed_amount' | 'set_price';
    value: number;
    priceFloorPaise?: number;
    maxDiscountCapPaise?: number;
    excludedProductIds?: string[];
    excludedCategories?: string[];
    badgeLabel?: string;
  }): Promise<DiscountPreviewResponse> {
    const query: Record<string, unknown> = { isPublished: true };

    if (data.scope === 'product') {
      const ids = (data.targetProductIds || []).map((id) => new mongoose.Types.ObjectId(id));
      query._id = { $in: ids };
    } else if (data.scope === 'category') {
      const cats = (data.targetCategories || []).map((c) => c.toLowerCase().trim());
      query.category = { $in: cats };
    }

    if (data.excludedProductIds && data.excludedProductIds.length > 0) {
      const exIds = data.excludedProductIds.map((id) => new mongoose.Types.ObjectId(id));
      query._id = query._id ? { $in: (query._id as { $in: unknown[] }).$in, $nin: exIds } : { $nin: exIds };
    }
    if (data.excludedCategories && data.excludedCategories.length > 0) {
      const exCats = data.excludedCategories.map((c) => c.toLowerCase().trim());
      query.category = query.category ? { $in: (query.category as { $in: unknown[] }).$in, $nin: exCats } : { $nin: exCats };
    }

    const [totalAffected, sampleProducts] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query).limit(5).lean(),
    ]);

    // Create a temporary mock discount object to pass into resolvePrice()
    const mockDiscount: DiscountRuleInput = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Preview',
      scope: data.scope,
      type: data.type,
      value: data.value,
      priceFloorPaise: data.priceFloorPaise ?? 29900,
      maxDiscountCapPaise: data.maxDiscountCapPaise,
      status: 'active',
      startDate: new Date(Date.now() - 1000),
      endDate: new Date(Date.now() + 86400000),
      targetProductIds: (data.targetProductIds || []).map((id) => new mongoose.Types.ObjectId(id)),
      targetCategories: (data.targetCategories || []).map((c) => c.toLowerCase().trim()),
      excludedProductIds: (data.excludedProductIds || []).map((id) => new mongoose.Types.ObjectId(id)),
      excludedCategories: (data.excludedCategories || []).map((c) => c.toLowerCase().trim()),
      priority: 999,
      badgeLabel: data.badgeLabel,
    };

    const previewItems: DiscountPreviewItem[] = sampleProducts.map((p) => {
      const res = resolvePrice(p, null, [mockDiscount], new Date());
      return {
        productId: p._id.toString(),
        productName: p.name,
        category: p.category,
        mrp: Math.round(res.mrpPaise / 100),
        regularPrice: Math.round(res.sellingPricePaise / 100),
        discountedPrice: Math.round(res.effectivePricePaise / 100),
        discountAmount: Math.round(res.discountAmountPaise / 100),
        discountPercent: res.discountPercent,
        badgeLabel: res.badgeLabel ?? undefined,
      };
    });

    return {
      affectedCount: totalAffected,
      sampleProducts: previewItems,
    };
  }

  /**
   * Recompute effective prices across all published products using current active discounts.
   * Runs in batches of 100 products to prevent event-loop starvation.
   */
  async recomputeAllProductPrices(): Promise<{ updated: number }> {
    const activeDiscounts = await this.getActiveDiscounts(new Date());

    let skip = 0;
    const batchSize = 100;
    let totalUpdated = 0;

    while (true) {
      const products = await Product.find({})
        .skip(skip)
        .limit(batchSize);

      if (!products || products.length === 0) break;

      const bulkOps = products.map((p) => {
        const res = resolvePrice(p, null, activeDiscounts, new Date());
        return {
          updateOne: {
            filter: { _id: p._id },
            update: {
              $set: {
                effectivePricePaise: res.effectivePricePaise,
                discountAmountPaise: res.discountAmountPaise,
                discountPercentRounded: res.discountPercent,
                activeDiscountId: res.activeDiscountId ? new mongoose.Types.ObjectId(res.activeDiscountId) : null,
                activeDiscountName: res.activeDiscountName || undefined,
                discountBadgeLabel: res.badgeLabel || undefined,
                effectivePriceUpdatedAt: new Date(),
              },
            },
          },
        };
      });

      if (bulkOps.length > 0) {
        await Product.bulkWrite(bulkOps);
        totalUpdated += bulkOps.length;
      }

      skip += batchSize;
    }

    // Update affected product counts on active discounts
    for (const d of activeDiscounts) {
      const count = await Product.countDocuments({ activeDiscountId: d._id });
      await Discount.findByIdAndUpdate(d._id, { affectedProductCount: count });
    }

    return { updated: totalUpdated };
  }

  /**
   * Query discounts with filters and pagination.
   */
  async getDiscounts(query: {
    status?: string;
    scope?: string;
    search?: string;
    page?: string;
    limit?: string;
  }) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.scope) filter.scope = query.scope;
    if (query.search && query.search.trim()) {
      filter.name = { $regex: query.search.trim(), $options: 'i' };
    }

    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const [discounts, total] = await Promise.all([
      Discount.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Discount.countDocuments(filter),
    ]);

    return {
      data: discounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get discount by id.
   */
  async getDiscountById(id: string): Promise<IDiscount> {
    const discount = await Discount.findById(id);
    if (!discount) {
      throw new AppError('Discount not found', 404);
    }
    return discount;
  }

  /**
   * Analytics summary for admin dashboard.
   */
  async getAnalytics() {
    const [total, active, scheduled, paused, ended] = await Promise.all([
      Discount.countDocuments({}),
      Discount.countDocuments({ status: 'active' }),
      Discount.countDocuments({ status: 'scheduled' }),
      Discount.countDocuments({ status: 'paused' }),
      Discount.countDocuments({ status: 'ended' }),
    ]);

    const activeDiscountDocs = await Discount.find({ status: 'active' }).select('_id');
    const activeIds = activeDiscountDocs.map((d) => d._id);
    const discountedProductsCount = await Product.countDocuments({
      activeDiscountId: { $in: activeIds },
      isPublished: true,
    });

    return {
      total,
      active,
      scheduled,
      paused,
      ended,
      discountedProductsCount,
    };
  }
}

export const discountService = new DiscountService();
export default discountService;
