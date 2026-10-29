import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import slugify from 'slugify';
import {
  Product,
  type IProduct,
  type IProductVariant,
  type IProductImage,
} from '../models/Product.model';
import { Order, type OrderStatus } from '../models/Order.model';
import { User } from '../models/User.model';
import { Category } from '../models/Category.model';
import { PageView } from '../models/PageView.model';
import { AuditLog } from '../models/AuditLog.model';
import { Setting, type ISetting } from '../models/Setting.model';
import { RefreshToken } from '../models/RefreshToken.model';
import { razorpay } from '../config/razorpay';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { inventoryService } from './inventory.service';
import { invalidateStoreSettingsCache } from './order.service';
import { UPLOADS_DIR } from '../middleware/upload';
import { logger } from '../config/logger';
import { couponService } from './coupon.service';
import { OrderStatusEvent } from '../models/OrderStatusEvent.model';
import { orderTrackingEmitter } from './orderTracking.service';
import type { OrderStatusEvent as OrderStatusEventType } from '@vertex/types';

export interface AdminProductInput extends Partial<Omit<IProduct, 'variants' | 'images'>> {
  variants?: Array<Partial<IProductVariant>>;
  images?: Array<IProductImage | string>;
  [key: string]: unknown;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let cachedIsReplicaSet: boolean | null = null;

export async function isReplicaSetSupported(): Promise<boolean> {
  if (cachedIsReplicaSet !== null) return cachedIsReplicaSet;
  try {
    const adminDb = mongoose.connection.db?.admin();
    if (!adminDb) {
      cachedIsReplicaSet = false;
      return false;
    }
    const hello = await adminDb.command({ hello: 1 }).catch(() => null);
    if (!hello) {
      cachedIsReplicaSet = false;
      return false;
    }
    cachedIsReplicaSet = Boolean(hello.setName || hello.msg === 'isdbgrid');
    return cachedIsReplicaSet;
  } catch {
    cachedIsReplicaSet = false;
    return false;
  }
}

async function logAdminAction(data: {
  adminId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    if (!data.adminId) return;
    await AuditLog.create({
      adminId: data.adminId,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      details: data.details,
      ip: data.ip,
    });
  } catch (err) {
    logger.error('[AuditLog] Failed to record audit log:', { error: err });
  }
}

export class AdminService {
  // ==========================================================================
  // PRODUCTS CRUD
  // ==========================================================================

  async getProducts(params: {
    search?: string;
    category?: string;
    inStock?: string;
    lowStock?: string;
    sort?: string;
    page?: string;
    limit?: string;
  }) {
    const {
      search,
      category,
      inStock,
      lowStock,
      sort = 'newest',
      page = '1',
      limit = '20',
    } = params;
    const filter: Record<string, unknown> = {};

    if (category && category !== 'all') {
      filter.category = category.toLowerCase();
    }

    if (inStock !== undefined && inStock !== '') {
      filter.inStock = inStock === 'true';
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [
        { name: searchRegex },
        { slug: searchRegex },
        { brand: searchRegex },
        { tags: searchRegex },
        { 'variants.sku': searchRegex },
      ];
    }

    if (lowStock === 'true') {
      filter['variants.stock'] = { $lte: 5 };
    }

    const sortOptions: Record<string, 1 | -1> = {};
    if (sort === 'price-asc') sortOptions.price = 1;
    else if (sort === 'price-desc') sortOptions.price = -1;
    else if (sort === 'name-asc') sortOptions.name = 1;
    else sortOptions.createdAt = -1;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOptions).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(filter),
    ]);

    return {
      data: products,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    };
  }

  async getProductById(id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Product not found', 404);
    }
    const product = await Product.findById(id).lean();
    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

  async createProduct(data: AdminProductInput, adminId?: string, ip?: string) {
    const { name, slug: customSlug, ...rest } = data;
    if (!name) throw new AppError('Product name is required', 400);

    let slug = customSlug
      ? slugify(customSlug, { lower: true, strict: true })
      : slugify(name, { lower: true, strict: true });

    // Ensure unique slug
    let existing = await Product.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Determine initial inStock from variants
    const variants = Array.isArray(data.variants) ? data.variants : [];
    if (variants.length > 0) {
      const skus = variants.map((v) => v.sku?.trim().toUpperCase()).filter(Boolean);
      if (new Set(skus).size !== skus.length) {
        throw new AppError('Each variant must have a unique SKU code', 400);
      }
    }
    const inStock = variants.length > 0 ? variants.some((v) => (v.stock || 0) > 0) : true;

    // CN-002: Normalize images array so strings become { url: string, alt: '' }
    const normalizedImages = Array.isArray(rest.images)
      ? rest.images.map((img) => (typeof img === 'string' ? { url: img, alt: '' } : img))
      : rest.images;

    const product = await Product.create({
      name,
      slug,
      inStock,
      ...rest,
      images: normalizedImages,
    });

    await logAdminAction({
      adminId,
      action: 'CREATE_PRODUCT',
      targetType: 'Product',
      targetId: String(product._id),
      details: { name: product.name, slug: product.slug },
      ip,
    });

    return product;
  }

  async updateProduct(id: string, data: AdminProductInput, adminId?: string, ip?: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Product not found', 404);
    }

    const existingProduct = await Product.findById(id);
    if (!existingProduct) throw new AppError('Product not found', 404);

    if (data.name && !data.slug) {
      data.slug = slugify(data.name, { lower: true, strict: true });
    }

    // Synchronize variant prices if product price is changed
    if (data.price !== undefined) {
      if (Array.isArray(data.variants)) {
        data.variants = data.variants.map((v) => ({
          ...v,
          price:
            v.price === undefined || v.price === null || v.price === existingProduct.price
              ? data.price
              : v.price,
        }));
      } else if (existingProduct.variants && existingProduct.variants.length > 0) {
        const plainVariants = existingProduct.toObject().variants;
        data.variants = plainVariants.map((v) => ({
          ...v,
          price:
            v.price === undefined || v.price === null || v.price === existingProduct.price
              ? data.price
              : v.price,
        }));
      }
    }

    if (Array.isArray(data.variants)) {
      const skus = data.variants.map((v) => v.sku?.trim().toUpperCase()).filter(Boolean);
      if (new Set(skus).size !== skus.length) {
        throw new AppError('Each variant must have a unique SKU code', 400);
      }
      data.inStock = data.variants.some((v) => (v.stock || 0) > 0);
    }

    // Orphan asset cleanup on edit (PIPE-HIGH-04)
    if (data.images && Array.isArray(data.images)) {
      const newUrls = new Set(data.images.map((img) => (typeof img === 'string' ? img : img?.url)));
      if (existingProduct.images && Array.isArray(existingProduct.images)) {
        for (const oldImg of existingProduct.images) {
          const oldUrl =
            typeof oldImg === 'string'
              ? oldImg
              : typeof oldImg === 'object' && oldImg !== null
                ? (oldImg as IProductImage).url
                : undefined;
          if (oldUrl && oldUrl.includes('/uploads/') && !newUrls.has(oldUrl)) {
            const filename = path.basename(oldUrl);
            const localPath = path.join(UPLOADS_DIR, filename);
            if (fs.existsSync(localPath)) {
              try {
                fs.unlinkSync(localPath);
              } catch {}
            }
          }
        }
      }
    }

    // CN-002: Normalize images array so strings become { url: string, alt: '' }
    if (data.images && Array.isArray(data.images)) {
      data.images = data.images.map((img) =>
        typeof img === 'string' ? { url: img, alt: '' } : img,
      );
    }

    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!product) throw new AppError('Product not found', 404);

    await logAdminAction({
      adminId,
      action: 'UPDATE_PRODUCT',
      targetType: 'Product',
      targetId: id,
      details: { name: product.name, slug: product.slug },
      ip,
    });

    return product;
  }

  async deleteProduct(id: string, adminId?: string, ip?: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Product not found', 404);
    }

    const activeOrder = await Order.findOne({
      'items.productId': id,
      status: { $in: ['pending', 'confirmed', 'processing', 'shipped'] },
    });
    if (activeOrder) {
      throw new AppError(
        'Cannot delete product: active unfulfilled orders exist for this item. Archive product instead.',
        400,
      );
    }

    const product = await Product.findById(id);
    if (!product) throw new AppError('Product not found', 404);

    // Orphan asset cleanup (FS-01 & MED-06)
    const imageUrlsToClean = new Set<string>();
    if (product.images && Array.isArray(product.images)) {
      for (const img of product.images) {
        const imgUrl =
          typeof img === 'string'
            ? img
            : typeof img === 'object' && img !== null
              ? (img as IProductImage).url
              : undefined;
        if (imgUrl) imageUrlsToClean.add(imgUrl);
      }
    }
    if (product.variants && Array.isArray(product.variants)) {
      for (const variant of product.variants) {
        if (variant.imageUrl) imageUrlsToClean.add(variant.imageUrl);
        if (variant.secondaryImageUrl) imageUrlsToClean.add(variant.secondaryImageUrl);
        if (variant.images && Array.isArray(variant.images)) {
          for (const vImg of variant.images) {
            if (vImg) imageUrlsToClean.add(vImg);
          }
        }
      }
    }

    for (const imgUrl of imageUrlsToClean) {
      if (imgUrl.includes('/uploads/')) {
        const filename = path.basename(imgUrl);
        const localPath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(localPath)) {
          try {
            fs.unlinkSync(localPath);
          } catch (e) {
            logger.warn('[AdminService] Could not unlink local image:', { localPath, error: e });
          }
        }
      }
    }

    await Product.findByIdAndDelete(id);

    await logAdminAction({
      adminId,
      action: 'DELETE_PRODUCT',
      targetType: 'Product',
      targetId: id,
      details: { name: product.name, slug: product.slug },
      ip,
    });

    return { message: 'Product deleted successfully', id };
  }

  // ==========================================================================
  // CATEGORIES CRUD
  // ==========================================================================

  async getCategories(): Promise<
    Array<{
      _id: unknown;
      name: string;
      slug: string;
      description?: string;
      image?: string;
      productCount: number;
      createdAt?: Date;
      updatedAt?: Date;
    }>
  > {
    const [categories, productCounts] = await Promise.all([
      Category.find().sort({ name: 1 }).lean(),
      Product.aggregate([{ $group: { _id: { $toLower: '$category' }, count: { $sum: 1 } } }]),
    ]);

    const countMap = new Map<string, number>();
    for (const pc of productCounts) {
      if (pc._id) countMap.set(pc._id, pc.count);
    }

    return categories.map((cat) => ({
      ...cat,
      productCount: countMap.get(cat.slug.toLowerCase()) ?? 0,
    }));
  }

  async createCategory(
    data: { name: string; slug?: string; description?: string; image?: string },
    adminId?: string,
    ip?: string,
  ) {
    if (!data.name || !data.name.trim()) {
      throw new AppError('Category name is required', 400);
    }
    const slug = data.slug
      ? slugify(data.slug, { lower: true, strict: true })
      : slugify(data.name, { lower: true, strict: true });

    const existing = await Category.findOne({ $or: [{ name: data.name.trim() }, { slug }] });
    if (existing) {
      throw new AppError('Category with this name or slug already exists', 409);
    }

    const cat = await Category.create({
      name: data.name.trim(),
      slug,
      description: data.description ?? '',
      image: data.image ?? '',
    });

    await logAdminAction({
      adminId,
      action: 'CREATE_CATEGORY',
      targetType: 'Category',
      targetId: String(cat._id),
      details: { name: cat.name, slug: cat.slug },
      ip,
    });

    return cat;
  }

  async updateCategory(
    id: string,
    data: { name?: string; description?: string; image?: string },
    adminId?: string,
    ip?: string,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Category not found', 404);
    }

    const oldCat = await Category.findById(id);
    if (!oldCat) throw new AppError('Category not found', 404);
    const oldSlug = oldCat.slug;

    const update: Record<string, unknown> = {};
    if (data.name) {
      update.name = data.name.trim();
      update.slug = slugify(data.name, { lower: true, strict: true });
    }
    if (data.description !== undefined) update.description = data.description;
    if (data.image !== undefined) update.image = data.image;

    const cat = await Category.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!cat) throw new AppError('Category not found', 404);

    // Cascade category rename to existing products (PIPE-HIGH-03)
    if (update.slug && update.slug !== oldSlug) {
      await Product.updateMany(
        { category: { $in: [oldSlug, oldSlug.toLowerCase(), oldSlug.toUpperCase()] } },
        { $set: { category: update.slug } },
      );
    }

    await logAdminAction({
      adminId,
      action: 'UPDATE_CATEGORY',
      targetType: 'Category',
      targetId: id,
      details: { name: cat.name, slug: cat.slug, previousSlug: oldSlug },
      ip,
    });

    return cat;
  }

  async deleteCategory(id: string, adminId?: string, ip?: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Category not found', 404);
    }
    const cat = await Category.findById(id);
    if (!cat) throw new AppError('Category not found', 404);

    const productCount = await Product.countDocuments({ category: cat.slug });
    if (productCount > 0) {
      throw new AppError(
        `Cannot delete category "${cat.name}": ${productCount} active products are currently assigned to it. Reassign these products first.`,
        400,
      );
    }

    await Category.findByIdAndDelete(id);

    await logAdminAction({
      adminId,
      action: 'DELETE_CATEGORY',
      targetType: 'Category',
      targetId: id,
      details: { name: cat.name, slug: cat.slug },
      ip,
    });

    return { message: 'Category deleted successfully', id };
  }

  // ==========================================================================
  // ORDERS MANAGEMENT & FULFILLMENT
  // ==========================================================================

  async getOrders(params: {
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
  }) {
    const { status, search, startDate, endDate, page = '1', limit = '20' } = params;
    const filter: Record<string, unknown> = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          dateFilter.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          if (!endDate.includes('T')) {
            end.setUTCHours(23, 59, 59, 999);
          }
          dateFilter.$lte = end;
        }
      }
      if (Object.keys(dateFilter).length > 0) {
        filter.createdAt = dateFilter;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      if (mongoose.isValidObjectId(q)) {
        const objId = new mongoose.Types.ObjectId(q);
        filter.$or = [{ _id: objId }, { userId: objId }];
      } else {
        const escapedQ = escapeRegex(q);
        const qRegex = new RegExp(escapedQ, 'i');
        // Search by user name, user email, or razorpay payment id
        const matchedUsers = await User.find({
          $or: [{ name: qRegex }, { email: qRegex }],
        })
          .select('_id')
          .limit(100);
        const userIds = matchedUsers.map((u) => u._id);

        filter.$or = [
          { userId: { $in: userIds } },
          { razorpayOrderId: qRegex },
          { razorpayPaymentId: qRegex },
          { trackingNumber: qRegex },
          { 'shippingAddress.fullName': qRegex },
        ];
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select('-razorpaySignature')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'name email role')
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      data: orders,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    };
  }

  async getOrderById(id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Order not found', 404);
    }
    const order = await Order.findById(id)
      .select('-razorpaySignature')
      .populate('userId', 'name email role')
      .lean();
    if (!order) throw new AppError('Order not found', 404);
    return order;
  }

  async updateOrderStatus(
    id: string,
    status: string,
    trackingNumber?: string,
    adminId?: string,
    ip?: string,
    carrier?: string,
    trackingUrl?: string,
    estimatedDelivery?: Date | string,
    note?: string,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Order not found', 404);
    }

    const validStatuses = [
      'pending',
      'placed',
      'confirmed',
      'processing',
      'packed',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ];
    if (!status || !validStatuses.includes(status)) {
      throw new AppError(
        'Invalid order status. Must be pending, placed, confirmed, processing, packed, shipped, out_for_delivery, delivered, or cancelled.',
        400,
      );
    }

    const order = await Order.findById(id);
    if (!order) throw new AppError('Order not found', 404);

    const previousStatus = order.status;
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      placed: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'packed', 'cancelled'],
      processing: ['packed', 'shipped', 'cancelled'],
      packed: ['shipped', 'cancelled'],
      shipped: ['out_for_delivery', 'delivered', 'cancelled'],
      out_for_delivery: ['delivered', 'cancelled'],
      delivered: [], // Terminal
      cancelled: [], // Terminal
    };

    if (previousStatus === status) {
      if (trackingNumber !== undefined) {
        order.trackingNumber = trackingNumber;
        await order.save();
      }
      return order;
    }

    const allowed = ALLOWED_TRANSITIONS[previousStatus];
    if (!allowed || !allowed.includes(status)) {
      throw new AppError(`Cannot transition order from '${previousStatus}' to '${status}'.`, 400);
    }

    order.status = status as OrderStatus;
    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;
    }
    if (carrier !== undefined) {
      order.carrier = carrier;
    }
    if (trackingUrl !== undefined) {
      order.trackingUrl = trackingUrl;
    }
    if (estimatedDelivery !== undefined) {
      order.estimatedDelivery =
        typeof estimatedDelivery === 'string' ? new Date(estimatedDelivery) : estimatedDelivery;
    }

    // When transitioning to cancelled from a confirmed/processing/shipped state:
    // Restore variant inventory atomically!
    let session: mongoose.ClientSession | undefined;
    const canUseTxn = await isReplicaSetSupported();
    if (canUseTxn) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch {
        session = undefined;
      }
    }

    try {
      if (
        status === 'cancelled' &&
        previousStatus !== 'cancelled' &&
        order.paymentStatus !== 'refunded'
      ) {
        // C-1: If an active reservation exists, release it atomically (restores stock & marks released)
        let reservationReleased = false;
        if (order.razorpayOrderId) {
          reservationReleased = await inventoryService.releaseReservation(order.razorpayOrderId);
          await couponService.releaseRedemption(order.razorpayOrderId).catch(() => {});
        }

        // If no active reservation was released (e.g. reservation was already captured),
        // restore stock directly if the order had captured payment or was confirmed
        if (
          !reservationReleased &&
          (order.paymentStatus === 'captured' || previousStatus !== 'pending')
        ) {
          for (const item of order.items) {
            await Product.updateOne(
              { _id: item.productId, 'variants.sku': item.sku },
              { $inc: { 'variants.$.stock': item.quantity } },
              session ? { session } : {},
            );
            await inventoryService.syncProductInStock(item.productId, session);
          }
        }
      }

      await order.save(session ? { session } : {});
      if (session) {
        await session.commitTransaction();
      }
    } catch (err) {
      if (session) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      if (session) {
        session.endSession();
      }
    }

    await logAdminAction({
      adminId,
      action: 'UPDATE_ORDER_STATUS',
      targetType: 'Order',
      targetId: id,
      details: { fromStatus: previousStatus, toStatus: status, trackingNumber },
      ip,
    });

    try {
      const statusEvent = await OrderStatusEvent.create({
        orderId: order._id,
        status: order.status,
        previousStatus: previousStatus as OrderStatus,
        note,
        visibility: 'customer',
        actor: {
          userId:
            adminId && mongoose.isValidObjectId(adminId)
              ? new mongoose.Types.ObjectId(adminId)
              : undefined,
          name: 'Admin',
          role: 'admin',
        },
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        estimatedDelivery: order.estimatedDelivery,
        idempotencyKey: `evt_${id}_${status}_${Date.now()}`,
      });

      const ssePayload: OrderStatusEventType = {
        _id: statusEvent._id.toString(),
        orderId: order._id.toString(),
        status: statusEvent.status,
        previousStatus: statusEvent.previousStatus,
        note: statusEvent.note,
        visibility: statusEvent.visibility,
        carrier: statusEvent.carrier,
        trackingNumber: statusEvent.trackingNumber,
        trackingUrl: statusEvent.trackingUrl,
        estimatedDelivery: statusEvent.estimatedDelivery
          ? statusEvent.estimatedDelivery.toISOString()
          : undefined,
        etaDate: statusEvent.estimatedDelivery
          ? statusEvent.estimatedDelivery.toISOString()
          : undefined,
        createdAt: statusEvent.createdAt.toISOString(),
      };

      orderTrackingEmitter.emit(`order_update:${id}`, ssePayload);
    } catch (emitErr) {
      logger.warn('Failed to emit live order tracking event from admin.service', {
        error: emitErr instanceof Error ? emitErr.message : String(emitErr),
      });
    }

    return order;
  }

  async refundOrder(id: string, reason?: string, adminId?: string, ip?: string, amount?: number) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Order not found', 404);
    }

    const order = await Order.findById(id);
    if (!order) throw new AppError('Order not found', 404);

    if (order.paymentStatus === 'refunded') {
      throw new AppError('This order has already been refunded', 400);
    }

    if (order.paymentStatus === 'refunding') {
      throw new AppError('A refund is already in progress for this order', 409);
    }

    if (order.paymentStatus !== 'captured' && order.paymentStatus !== 'partially_refunded') {
      throw new AppError(
        `Cannot issue a refund for an order with payment status '${order.paymentStatus}'. Only captured or partially refunded payments can be refunded.`,
        400,
      );
    }

    const currentRefunded = order.refundAmount || 0;
    const remainingRefundable = Math.max(
      0,
      Math.round((order.total - currentRefunded) * 100) / 100,
    );

    if (remainingRefundable <= 0) {
      throw new AppError('This order has already been fully refunded', 400);
    }

    let refundAmountToIssue =
      amount !== undefined && amount !== null ? Number(amount) : remainingRefundable;
    if (isNaN(refundAmountToIssue) || refundAmountToIssue <= 0) {
      throw new AppError('Refund amount must be a positive number', 400);
    }
    // BE-006: Support both decimal rupee amounts (e.g. 122.71) and minor unit paise (e.g. 12271)
    if (
      refundAmountToIssue > remainingRefundable &&
      Math.round(refundAmountToIssue) / 100 <= remainingRefundable + 0.01
    ) {
      refundAmountToIssue = Math.round(refundAmountToIssue) / 100;
    }
    if (refundAmountToIssue > remainingRefundable) {
      throw new AppError(
        `Refund amount (₹${refundAmountToIssue}) exceeds remaining refundable balance (₹${remainingRefundable})`,
        400,
      );
    }

    const isFullRefund =
      Math.round((currentRefunded + refundAmountToIssue) * 100) >= Math.round(order.total * 100);

    // Atomic lock to prevent concurrent double-refunds (SEC-05)
    const locked = await Order.findOneAndUpdate(
      { _id: id, paymentStatus: { $in: ['captured', 'partially_refunded'] } },
      { $set: { paymentStatus: 'refunding' } },
      { new: true },
    );
    if (!locked) {
      throw new AppError('Refund could not be locked: order state changed concurrently', 409);
    }

    let refundId = `ref_${Date.now()}`;

    // Issue refund via Razorpay if payment ID exists
    if (order.razorpayPaymentId) {
      const isMockPayment =
        process.env.NODE_ENV !== 'production' &&
        (order.razorpayPaymentId.startsWith('pay_mock_') ||
          order.razorpayPaymentId.startsWith('pay_proof_') ||
          order.razorpayPaymentId.startsWith('order_mock_') ||
          env.RAZORPAY_KEY_ID === 'rzp_test_xydv_key' ||
          env.RAZORPAY_KEY_ID === 'rzp_test_vertex_key');

      if (!isMockPayment) {
        try {
          const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
            amount: Math.round(refundAmountToIssue * 100), // convert to paise
            notes: { reason: reason || 'Admin requested refund', orderId: String(order._id) },
          });
          if (refund && refund.id) {
            refundId = refund.id;
          }
        } catch (err) {
          const errObj =
            typeof err === 'object' && err !== null
              ? (err as { message?: string; statusCode?: number })
              : undefined;
          await Order.findByIdAndUpdate(id, {
            $set: { paymentStatus: currentRefunded > 0 ? 'partially_refunded' : 'captured' },
          });
          logger.error('[AdminService] Razorpay refund API failure:', {
            error: errObj?.message || err,
          });
          throw new AppError(
            `Failed to process refund with Razorpay: ${errObj?.message || 'Payment gateway refund failed'}`,
            errObj?.statusCode || 502,
          );
        }
      } else {
        refundId = `ref_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        logger.info('[AdminService] Dev-mode mock refund bypass (skipping Razorpay gateway)', {
          orderId: id,
          amount: refundAmountToIssue,
          refundId,
        });
      }
    }

    // Atomically restore inventory for items only on full refund (DB-01)
    let session: mongoose.ClientSession | undefined;
    const canUseTxn = await isReplicaSetSupported();
    if (canUseTxn) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch {
        session = undefined;
      }
    }

    try {
      if (isFullRefund) {
        if (order.status !== 'cancelled') {
          for (const item of order.items) {
            await Product.updateOne(
              { _id: item.productId, 'variants.sku': item.sku },
              { $inc: { 'variants.$.stock': item.quantity } },
              session ? { session } : {},
            );
            await inventoryService.syncProductInStock(item.productId, session);
          }
        }
        order.paymentStatus = 'refunded';
        order.status = 'cancelled';
        order.refundAmount = order.total;
        if (order.razorpayOrderId) {
          await couponService.releaseRedemption(order.razorpayOrderId).catch(() => {});
        }
      } else {
        order.paymentStatus = 'partially_refunded';
        order.refundAmount = Math.round((currentRefunded + refundAmountToIssue) * 100) / 100;
      }

      order.refundReason = reason || 'Admin issued refund';
      order.refundedAt = new Date();
      order.refundId = refundId;

      await order.save(session ? { session } : {});
      if (session) {
        await session.commitTransaction();
      }
    } catch (err) {
      if (session) {
        await session.abortTransaction();
      }
      await Order.findByIdAndUpdate(id, {
        $set: { paymentStatus: currentRefunded > 0 ? 'partially_refunded' : 'captured' },
      }).catch((rollbackErr) => {
        logger.error('[AdminService] Critical: failed to rollback refunding state after DB error', {
          orderId: id,
          rollbackErr,
        });
      });
      throw err;
    } finally {
      if (session) {
        session.endSession();
      }
    }

    await logAdminAction({
      adminId,
      action: 'REFUND_ORDER',
      targetType: 'Order',
      targetId: id,
      details: { amount: refundAmountToIssue, isFullRefund, reason, refundId },
      ip,
    });

    return order;
  }

  // ==========================================================================
  // INVENTORY CONTROL
  // ==========================================================================

  async getInventory(params: {
    search?: string;
    lowStock?: string;
    threshold?: string;
    page?: string;
    limit?: string;
  }) {
    const threshold = parseInt(params.threshold || '5', 10);
    const lowStockOnly = params.lowStock === 'true';
    const search = params.search?.toLowerCase().trim();
    const page = params.page ? Math.max(1, parseInt(params.page, 10)) : undefined;
    const limit = params.limit ? Math.max(1, Math.min(200, parseInt(params.limit, 10))) : undefined;

    const pipeline: mongoose.PipelineStage[] = [];
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: escaped, $options: 'i' } },
            { brand: { $regex: escaped, $options: 'i' } },
            { category: { $regex: escaped, $options: 'i' } },
            { 'variants.sku': { $regex: escaped, $options: 'i' } },
            { 'variants.color': { $regex: escaped, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push({ $unwind: '$variants' });

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: escaped, $options: 'i' } },
            { brand: { $regex: escaped, $options: 'i' } },
            { category: { $regex: escaped, $options: 'i' } },
            { 'variants.sku': { $regex: escaped, $options: 'i' } },
            { 'variants.color': { $regex: escaped, $options: 'i' } },
          ],
        },
      });
    }

    if (lowStockOnly) {
      pipeline.push({
        $match: { 'variants.stock': { $lte: threshold } },
      });
    }

    pipeline.push({
      $facet: {
        items: [
          { $sort: { 'variants.stock': 1, name: 1 } },
          ...(page && limit ? [{ $skip: (page - 1) * limit }, { $limit: limit }] : []),
          {
            $project: {
              productId: { $toString: '$_id' },
              productName: '$name',
              productSlug: '$slug',
              category: '$category',
              sku: '$variants.sku',
              color: { $ifNull: ['$variants.color', 'Standard'] },
              colorHex: { $ifNull: ['$variants.colorHex', '#000000'] },
              size: '$variants.size',
              price: '$variants.price',
              stock: '$variants.stock',
              reservedStock: { $ifNull: ['$variants.reservedStock', 0] },
              isLowStock: { $lte: ['$variants.stock', threshold] },
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
        lowStockCount: [{ $match: { 'variants.stock': { $lte: threshold } } }, { $count: 'count' }],
      },
    });

    const aggResult = await Product.aggregate(pipeline);
    const facetData = aggResult[0] || { items: [], totalCount: [], lowStockCount: [] };
    const items = facetData.items || [];
    const totalItems = facetData.totalCount[0]?.count ?? 0;
    const totalLowStock = facetData.lowStockCount[0]?.count ?? 0;

    return {
      data: items,
      totalItems,
      totalLowStock,
      threshold,
      ...(page && limit ? { page, limit, totalPages: Math.ceil(totalItems / limit) || 1 } : {}),
    };
  }

  async updateVariantStock(
    productId: string,
    sku: string,
    stock: number,
    adminId?: string,
    ip?: string,
  ) {
    if (!mongoose.isValidObjectId(productId)) {
      throw new AppError('Product not found', 404);
    }
    if (typeof stock !== 'number' || stock < 0 || !Number.isInteger(stock)) {
      throw new AppError('Stock must be a non-negative integer', 400);
    }

    const product = await Product.findOneAndUpdate(
      { _id: productId, 'variants.sku': sku },
      { $set: { 'variants.$.stock': stock } },
      { new: true },
    );

    if (!product) {
      throw new AppError('Product or variant SKU not found', 404);
    }

    // Sync product inStock boolean
    const hasStock = product.variants.some((v) => v.stock > 0);
    if (product.inStock !== hasStock) {
      product.inStock = hasStock;
      await product.save();
    }

    await logAdminAction({
      adminId,
      action: 'UPDATE_VARIANT_STOCK',
      targetType: 'Product',
      targetId: productId,
      details: { sku, stock },
      ip,
    });

    return {
      productId,
      sku,
      stock,
      inStock: product.inStock,
    };
  }

  async getLowStockAlerts(threshold = 5) {
    const products = await Product.find({
      'variants.stock': { $lte: threshold },
    })
      .select('name slug category variants')
      .lean();

    const lowStockVariants: Array<{
      productId: string;
      name: string;
      sku: string;
      size: string;
      color: string;
      stock: number;
    }> = [];

    for (const p of products) {
      for (const v of p.variants) {
        if (v.stock <= threshold) {
          lowStockVariants.push({
            productId: String(p._id),
            name: p.name,
            sku: v.sku,
            size: v.size,
            color: v.color,
            stock: v.stock,
          });
        }
      }
    }

    return {
      count: lowStockVariants.length,
      threshold,
      items: lowStockVariants,
    };
  }

  // ==========================================================================
  // CUSTOMER MANAGEMENT
  // ==========================================================================

  async getCustomers(params: {
    search?: string;
    role?: string;
    status?: string;
    page?: string;
    limit?: string;
  }) {
    const { search, role, status, page = '1', limit = '20' } = params;
    const filter: Record<string, unknown> = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status === 'blocked') {
      filter.isBlocked = true;
    } else if (status === 'active') {
      filter.isBlocked = false;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      User.countDocuments(filter),
    ]);

    // Aggregate spend and order count for these users (strictly captured payments)
    const userIds = users.map((u) => u._id);
    const orderStats = await Order.aggregate([
      {
        $match: {
          userId: { $in: userIds },
          paymentStatus: 'captured',
          status: { $nin: ['cancelled'] },
        },
      },
      {
        $group: {
          _id: '$userId',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$total' },
        },
      },
    ]);

    const statsMap = new Map<string, { orderCount: number; totalSpent: number }>();
    for (const stat of orderStats) {
      statsMap.set(String(stat._id), {
        orderCount: stat.orderCount,
        totalSpent: stat.totalSpent,
      });
    }

    const customerData = users.map((u) => {
      const stats = statsMap.get(String(u._id)) || { orderCount: 0, totalSpent: 0 };
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        isBlocked: Boolean(u.isBlocked),
        loyaltyPoints: u.loyaltyPoints || 0,
        orderCount: stats.orderCount,
        totalSpent: stats.totalSpent,
        createdAt: u.createdAt,
      };
    });

    return {
      data: customerData,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    };
  }

  async getCustomerById(id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Customer not found', 404);
    }

    const [user, orders] = await Promise.all([
      User.findById(id).lean(),
      Order.find({ userId: id }).select('-razorpaySignature').sort({ createdAt: -1 }).lean(),
    ]);

    if (!user) throw new AppError('Customer not found', 404);

    const capturedOrders = orders.filter(
      (o) => o.status !== 'cancelled' && o.paymentStatus === 'captured',
    );
    const totalSpent = capturedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: Boolean(user.isBlocked),
        loyaltyPoints: user.loyaltyPoints || 0,
        addresses: user.addresses || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      orders,
      orderCount: orders.length,
      totalSpent,
    };
  }

  async updateCustomerRole(
    id: string,
    role: 'customer' | 'admin',
    currentAdminId?: string,
    ip?: string,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Customer not found', 404);
    }

    if (id === currentAdminId && role !== 'admin') {
      throw new AppError('You cannot demote your own admin account', 400);
    }

    if (!['customer', 'admin'].includes(role)) {
      throw new AppError('Role must be either customer or admin', 400);
    }

    const targetUser = await User.findById(id);
    if (!targetUser) throw new AppError('Customer not found', 404);

    if (targetUser.role === 'admin' && role !== 'admin') {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isBlocked: false });
      if (activeAdminCount <= 1) {
        throw new AppError('Cannot demote the last remaining active administrator account.', 400);
      }
    }

    targetUser.role = role;
    await targetUser.save();

    await logAdminAction({
      adminId: currentAdminId,
      action: 'UPDATE_CUSTOMER_ROLE',
      targetType: 'User',
      targetId: id,
      details: { role },
      ip,
    });

    return {
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
    };
  }

  async toggleBlockCustomer(id: string, isBlocked: boolean, currentAdminId?: string, ip?: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Customer not found', 404);
    }

    if (id === currentAdminId && isBlocked) {
      throw new AppError('You cannot block your own admin account', 400);
    }

    const targetUser = await User.findById(id);
    if (!targetUser) throw new AppError('Customer not found', 404);

    if (targetUser.role === 'admin' && isBlocked) {
      throw new AppError('Administrator accounts cannot be suspended. Demote role first.', 400);
    }

    targetUser.isBlocked = isBlocked;
    await targetUser.save();

    if (isBlocked) {
      await RefreshToken.updateMany({ userId: targetUser._id }, { isRevoked: true });
    }

    await logAdminAction({
      adminId: currentAdminId,
      action: isBlocked ? 'BLOCK_CUSTOMER' : 'UNBLOCK_CUSTOMER',
      targetType: 'User',
      targetId: id,
      details: { isBlocked },
      ip,
    });

    return {
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      isBlocked: targetUser.isBlocked,
    };
  }

  // ==========================================================================
  // ANALYTICS & REPORTS
  // ==========================================================================

  async getAnalytics(period: '7d' | '30d' | 'all' = '30d') {
    let startDate: Date | null = null;
    const now = new Date();

    if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const orderDateMatch = startDate ? { createdAt: { $gte: startDate } } : {};
    const pageViewDateMatch = startDate ? { createdAt: { $gte: startDate } } : {};
    const revenueMatch = {
      ...orderDateMatch,
      paymentStatus: { $in: ['captured', 'partially_refunded'] },
      status: { $nin: ['cancelled'] },
    };

    const [
      totalOrders,
      totalCustomers,
      revenueAgg,
      lowStockProducts,
      orderStatusAgg,
      topProductsAgg,
      dailyRevenueAgg,
      pageViewsCount,
    ] = await Promise.all([
      // Total orders in period
      Order.countDocuments(orderDateMatch),
      // Total active customers
      User.countDocuments({ role: 'customer' }),
      // Total net revenue (captured and partially_refunded payments minus refunds, excluding cancelled)
      // Contract schema compatibility: { $group: { _id: null, total: { $sum: '$total' } } }
      Order.aggregate([
        { $match: revenueMatch },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $subtract: ['$total', { $ifNull: ['$refundAmount', 0] }],
              },
            },
          },
        },
      ]),
      // Low stock count (variants with stock <= 5)
      Product.aggregate([
        { $unwind: '$variants' },
        { $match: { 'variants.stock': { $lte: 5 } } },
        { $count: 'lowStock' },
      ]),
      // Order status breakdown
      Order.aggregate([
        { $match: orderDateMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Top selling products by revenue and quantity (captured payments only)
      Order.aggregate([
        { $match: revenueMatch },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.name' },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
      // Daily revenue timeline (IST timezone + captured/partially_refunded net revenue)
      Order.aggregate([
        { $match: revenueMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' } },
            revenue: {
              $sum: {
                $subtract: ['$total', { $ifNull: ['$refundAmount', 0] }],
              },
            },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Traffic page views
      PageView.countDocuments(pageViewDateMatch),
    ]);

    const totalRevenue = Math.round((revenueAgg[0]?.total ?? 0) * 100) / 100;
    const lowStockCount = lowStockProducts[0]?.lowStock ?? 0;

    // Conversion rate: (totalOrders / pageViews) * 100
    const conversionRate =
      pageViewsCount > 0 ? Number(((totalOrders / pageViewsCount) * 100).toFixed(2)) : 0;

    return {
      period,
      totalRevenue,
      totalOrders,
      totalCustomers,
      lowStockCount,
      pageViews: pageViewsCount,
      conversionRate,
      revenueByDate: dailyRevenueAgg.map((d) => ({
        date: d._id,
        revenue: d.revenue,
        orders: d.orders,
      })),
      orderStatusDistribution: orderStatusAgg.map((s) => ({
        status: s._id,
        count: s.count,
      })),
      topSellingProducts: topProductsAgg.map((p) => ({
        id: String(p._id),
        name: p.name,
        quantity: p.quantity,
        revenue: p.revenue,
      })),
    };
  }

  // ==========================================================================
  // TRAFFIC TRACKING
  // ==========================================================================

  async trackPageView(data: { path: string; ip?: string; userAgent?: string; referrer?: string }) {
    const today = new Date().toISOString().slice(0, 10);
    return PageView.create({
      path: data.path,
      date: today,
      ip: data.ip
        ? crypto
            .createHash('sha256')
            .update(data.ip + (process.env.IP_SALT || 'xydv-telemetry-salt'))
            .digest('hex')
            .substring(0, 16)
        : undefined,
      userAgent: data.userAgent,
      referrer: data.referrer,
    });
  }

  async recordPageView(data: { path: string; ip?: string; userAgent?: string; referrer?: string }) {
    return this.trackPageView(data);
  }

  // ==========================================================================
  // STORE SETTINGS
  // ==========================================================================

  async getSettings() {
    let settings = await Setting.findOne({ key: 'global_store_settings' });
    if (!settings) {
      settings = await Setting.create({
        key: 'global_store_settings',
        freeShippingThreshold: 150,
        standardShippingFee: 15,
        taxRate: 0.18,
        lowStockThreshold: 5,
        currency: 'INR',
        currencySymbol: '₹',
        storeName: 'XYDV',
        supportEmail: 'support@xydv.com',
      });
    }
    return settings;
  }

  async updateSettings(data: Partial<ISetting>, adminId?: string, ip?: string) {
    const settings = await Setting.findOneAndUpdate(
      { key: 'global_store_settings' },
      { $set: data },
      { new: true, upsert: true, runValidators: true },
    );

    await logAdminAction({
      adminId,
      action: 'UPDATE_SETTINGS',
      targetType: 'Setting',
      targetId: String(settings._id),
      details: data,
      ip,
    });

    invalidateStoreSettingsCache();

    return settings;
  }
}

export const adminService = new AdminService();
export default adminService;
