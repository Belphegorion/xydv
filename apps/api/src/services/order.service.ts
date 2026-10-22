import crypto from 'crypto';
import mongoose from 'mongoose';
import { razorpay, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from '../config/razorpay';
import { Order, type IOrder } from '../models/Order.model';
import { Product, type IProduct } from '../models/Product.model';
import { User } from '../models/User.model';
import { Setting } from '../models/Setting.model';
import { AppError } from '../middleware/errorHandler';
import { inventoryService } from './inventory.service';
import { COMMERCE_CONSTANTS } from '../constants/commerce';
import { STATIC_CATALOG } from '../fixtures/catalog';

export interface StorePricingSettings {
  shippingFee: number;
  freeShippingThreshold: number;
  taxRate: number;
  currency: string;
}

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  amountInPaise: number;
  currency: string;
}

let cachedSettings: StorePricingSettings | null = null;
let lastSettingsFetch = 0;
const SETTINGS_CACHE_TTL_MS = 10_000;

export function invalidateStoreSettingsCache(): void {
  cachedSettings = null;
  lastSettingsFetch = 0;
}

export async function getLiveStoreSettings(): Promise<StorePricingSettings> {
  const now = Date.now();
  if (cachedSettings && now - lastSettingsFetch < SETTINGS_CACHE_TTL_MS) {
    return cachedSettings;
  }

  try {
    const setting = await Setting.findOne({ key: 'global_store_settings' }).lean();
    if (setting) {
      cachedSettings = {
        shippingFee:
          typeof setting.shippingFee === 'number'
            ? setting.shippingFee
            : typeof setting.standardShippingFee === 'number'
              ? setting.standardShippingFee
              : COMMERCE_CONSTANTS.STANDARD_SHIPPING_FEE,
        freeShippingThreshold:
          typeof setting.freeShippingThreshold === 'number'
            ? setting.freeShippingThreshold
            : COMMERCE_CONSTANTS.FREE_SHIPPING_THRESHOLD,
        taxRate:
          typeof setting.taxRate === 'number' ? setting.taxRate : COMMERCE_CONSTANTS.TAX_RATE,
        currency: setting.currency || COMMERCE_CONSTANTS.CURRENCY,
      };
      lastSettingsFetch = now;
      return cachedSettings;
    }
  } catch {
    // If DB is temporarily unavailable, fall back to safe INR defaults
  }

  return {
    shippingFee: COMMERCE_CONSTANTS.STANDARD_SHIPPING_FEE,
    freeShippingThreshold: COMMERCE_CONSTANTS.FREE_SHIPPING_THRESHOLD,
    taxRate: COMMERCE_CONSTANTS.TAX_RATE,
    currency: COMMERCE_CONSTANTS.CURRENCY,
  };
}

export interface CreateOrderItemInput {
  productId: string;
  sku?: string;
  slug?: string;
  variantId?: string;
  quantity: number;
}

export interface ShippingAddressInput {
  fullName?: string;
  name?: string;
  line1?: string;
  street?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  zip?: string;
  country?: string;
  phone?: string;
  email?: string;
  customerEmail?: string;
}

export class OrderService {
  /**
   * Authoritative server-side price calculation using live settings or safe INR fallbacks.
   */
  async calculateOrderTotals(
    subtotal: number,
    settingsOverride?: Partial<StorePricingSettings>,
  ): Promise<OrderTotals> {
    const settings = settingsOverride
      ? { ...(await getLiveStoreSettings()), ...settingsOverride }
      : await getLiveStoreSettings();

    const shipping = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
    const tax = Math.round(subtotal * settings.taxRate * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;
    const amountInPaise = Math.round(total * 100);

    return {
      subtotal,
      shipping,
      tax,
      total,
      amountInPaise,
      currency: settings.currency,
    };
  }

  /**
   * Authoritative server-side price calculation and Razorpay order creation.
   */
  async createRazorpayOrder(
    items: CreateOrderItemInput[],
    shippingAddress?: ShippingAddressInput,
    userId?: string,
  ) {
    if (userId && mongoose.isValidObjectId(userId)) {
      const user = await User.findById(userId);
      if (user?.isBlocked) {
        throw new AppError('Your account has been suspended. Please contact support.', 403);
      }
    }

    const guestEmail = shippingAddress?.email || shippingAddress?.customerEmail;
    if (guestEmail) {
      const normalizedEmail = String(guestEmail).toLowerCase().trim();
      const blockedCustomer = await User.findOne({
        email: normalizedEmail,
        isBlocked: true,
      });
      if (blockedCustomer) {
        throw new AppError('Your account has been suspended. Please contact support.', 403);
      }
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Order must contain at least one item', 400);
    }

    let subtotal = 0;
    const validatedItems: Array<{
      productId: mongoose.Types.ObjectId;
      name: string;
      sku: string;
      color: string;
      size: string;
      price: number;
      quantity: number;
      image: string;
    }> = [];
    const reservationItems: Array<{
      productId: mongoose.Types.ObjectId;
      sku?: string;
      variantId?: string;
      quantity: number;
    }> = [];

    for (const item of items) {
      // Strict quantity validation: must be a positive integer
      if (
        typeof item.quantity !== 'number' ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        throw new AppError(
          `Invalid quantity for item ${item.productId ?? 'unknown'}. Quantity must be a positive integer`,
          400,
        );
      }

      const orConditions: mongoose.FilterQuery<IProduct>[] = [{ slug: item.productId }];
      if (item.sku) {
        orConditions.push({ 'variants.sku': item.sku });
      }
      if (item.slug) {
        orConditions.push({ slug: item.slug });
      }
      if (item.variantId) {
        orConditions.push({ 'variants.id': item.variantId });
        if (mongoose.isValidObjectId(item.variantId)) {
          orConditions.push({ 'variants._id': item.variantId });
        }
      }

      let product = mongoose.isValidObjectId(item.productId)
        ? await Product.findById(item.productId)
        : null;

      if (!product && orConditions.length > 0) {
        product = await Product.findOne({ $or: orConditions });
      }

      if (!product) {
        // Resolve against static frontend catalog data
        const staticProd = STATIC_CATALOG.find(
          (p) =>
            p.id === item.productId ||
            p.slug === item.productId ||
            (item.slug && p.slug === item.slug) ||
            (item.sku && p.variants.some((v) => v.sku === item.sku)),
        );

        if (staticProd) {
          product = await Product.findOneAndUpdate(
            { slug: staticProd.slug },
            {
              $set: {
                name: staticProd.name,
                price: staticProd.price,
                brand: 'XYDV',
                category: staticProd.category,
                description: staticProd.description,
                inStock: true,
                isPublished: true,
                specs: (staticProd.specs || []).map((s) => ({ label: s.label, value: s.value })),
                features: staticProd.features || [],
              },
              $setOnInsert: {
                slug: staticProd.slug,
                variants: staticProd.variants.map((v) => ({
                  id: v.id,
                  sku: v.sku,
                  color: v.colorName || 'Void Obsidian',
                  colorName: v.colorName,
                  colorHex: v.colorHex || '#0A0A0A',
                  size: v.size,
                  price: staticProd.price,
                  stock: v.stock ?? 50,
                  imageUrl: v.primaryImage,
                  secondaryImageUrl: v.secondaryImage,
                  images: v.gallery || [v.primaryImage],
                })),
              },
            },
            { upsert: true, new: true },
          );
        }
      }

      if (!product) {
        throw new AppError(`Product not found: ${item.productId}`, 404);
      }

      // Find variant by sku or variantId if specified; only default to first variant if none specified
      const hasSpecificVariant = Boolean(item.sku || item.variantId);
      const variant = hasSpecificVariant
        ? product.variants.find(
            (v) =>
              (item.sku && v.sku === item.sku) ||
              (item.variantId && (v.id === item.variantId || v._id?.toString() === item.variantId)),
          )
        : product.variants[0];

      if (!variant) {
        throw new AppError(`Variant not found for product: ${product.name}`, 404);
      }

      if (variant.stock < item.quantity) {
        throw new AppError(
          `INSUFFICIENT_STOCK: Insufficient stock for ${product.name} (${variant.sku})`,
          400,
        );
      }

      const itemPrice =
        variant.price !== undefined && variant.price !== null ? variant.price : product.price;
      subtotal += itemPrice * item.quantity;

      const primaryProductImg =
        product.imageUrl ||
        (Array.isArray(product.images) && product.images.length > 0
          ? typeof product.images[0] === 'string'
            ? product.images[0]
            : typeof product.images[0] === 'object' && product.images[0] !== null
              ? product.images[0].url
              : undefined
          : undefined);

      const validatedItem = {
        productId: product._id as mongoose.Types.ObjectId,
        name: product.name,
        sku: variant.sku,
        color: variant.color ?? 'Standard',
        size: variant.size,
        price: itemPrice,
        quantity: item.quantity,
        image:
          variant.imageUrl || variant.images?.[0] || primaryProductImg || '/products/image-4-1.jpg',
      };

      validatedItems.push(validatedItem);
      reservationItems.push({
        productId: product._id as mongoose.Types.ObjectId,
        sku: variant.sku,
        variantId: variant._id?.toString() || variant.id,
        quantity: item.quantity,
      });
    }

    const { shipping, tax, total, amountInPaise, currency } =
      await this.calculateOrderTotals(subtotal);

    // Create Razorpay Order
    let razorpayOrder: { id: string; amount: number; currency: string };
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: currency || COMMERCE_CONSTANTS.CURRENCY,
        receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        notes: {
          userId: userId ? String(userId) : 'guest',
        },
      });
    } catch (rzpErr) {
      const errObj =
        typeof rzpErr === 'object' && rzpErr !== null
          ? (rzpErr as { statusCode?: number; error?: { code?: string } })
          : undefined;
      if (
        process.env.NODE_ENV !== 'production' &&
        (RAZORPAY_KEY_ID === 'rzp_test_xydv_key' ||
          RAZORPAY_KEY_ID === 'rzp_test_vertex_key' ||
          errObj?.statusCode === 401 ||
          errObj?.error?.code === 'BAD_REQUEST_ERROR')
      ) {
        razorpayOrder = {
          id: `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          amount: amountInPaise,
          currency: currency || COMMERCE_CONSTANTS.CURRENCY,
        };
      } else {
        throw rzpErr;
      }
    }

    const resolvedAddress = shippingAddress
      ? {
          fullName: shippingAddress.fullName || shippingAddress.name || 'Customer',
          line1: shippingAddress.line1 ?? shippingAddress.street ?? 'Standard Shipping',
          line2: shippingAddress.line2,
          city: shippingAddress.city || 'Standard City',
          state: shippingAddress.state || 'Standard State',
          postalCode: shippingAddress.postalCode || shippingAddress.zip || '000000',
          country: shippingAddress.country ?? 'IN',
          phone: shippingAddress.phone || '0000000000',
        }
      : {
          fullName: 'Customer',
          line1: 'Standard Shipping',
          city: 'Default City',
          state: 'Default State',
          postalCode: '000000',
          country: 'IN',
          phone: '0000000000',
        };

    const order = await Order.create({
      userId:
        userId && mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : null,
      items: validatedItems,
      subtotal,
      shipping,
      tax,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      shippingAddress: {
        fullName: resolvedAddress.fullName,
        line1: resolvedAddress.line1 ?? 'Standard Shipping',
        line2: resolvedAddress.line2,
        city: resolvedAddress.city,
        state: resolvedAddress.state || 'Standard State',
        postalCode: resolvedAddress.postalCode,
        country: resolvedAddress.country ?? 'IN',
        phone: resolvedAddress.phone,
        email: shippingAddress?.email,
      },
      razorpayOrderId: razorpayOrder.id,
    });

    // Hold inventory in reservation table atomically to eliminate overselling
    try {
      await inventoryService.reserveStock(
        reservationItems,
        razorpayOrder.id,
        order._id as mongoose.Types.ObjectId,
      );
    } catch (resErr) {
      await Order.deleteOne({ _id: order._id }).catch(() => {});
      throw resErr;
    }

    return {
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: RAZORPAY_KEY_ID,
      subtotal,
      shipping,
      tax,
      total,
    };
  }

  /**
   * Verify HMAC signature and settle order idempotently.
   */
  async verifyPayment(params: {
    orderId?: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new AppError('Missing payment verification parameters', 400);
    }

    if (typeof razorpaySignature !== 'string') {
      throw new AppError('Invalid payment signature format', 400);
    }

    // Verify HMAC-SHA256 signature using timing-safe comparison with length guard
    const hmacBody = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(hmacBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const signatureBuf = Buffer.from(razorpaySignature, 'utf8');

    // Buffer length check is mandatory before crypto.timingSafeEqual to prevent RangeError
    const isValid =
      expectedBuf.length === signatureBuf.length &&
      crypto.timingSafeEqual(expectedBuf, signatureBuf);

    if (!isValid) {
      throw new AppError('Invalid payment signature', 400);
    }

    // Update internal Order atomically
    const updateQuery =
      orderId && mongoose.isValidObjectId(orderId)
        ? { _id: orderId, paymentStatus: { $ne: 'captured' } }
        : { razorpayOrderId, paymentStatus: { $ne: 'captured' } };

    const updatedOrder = await Order.findOneAndUpdate(
      updateQuery,
      {
        $set: {
          razorpayPaymentId,
          razorpaySignature,
          paymentStatus: 'captured',
          status: 'confirmed',
        },
      },
      { new: true },
    );

    if (!updatedOrder) {
      // Check if order exists and is already captured
      const checkQuery =
        orderId && mongoose.isValidObjectId(orderId) ? { _id: orderId } : { razorpayOrderId };
      const existing = await Order.findOne(checkQuery);
      if (!existing) {
        throw new AppError('Order not found', 404);
      }
      return {
        orderId: existing._id,
        razorpayOrderId: existing.razorpayOrderId ?? razorpayOrderId,
        status: existing.paymentStatus,
        alreadyCaptured: true,
      };
    }

    // Settle dual-tier reservation (decrements reservedStock)
    await inventoryService.captureReservation(razorpayOrderId);

    return {
      orderId: updatedOrder._id,
      razorpayOrderId: updatedOrder.razorpayOrderId ?? razorpayOrderId,
      status: 'captured',
    };
  }

  /**
   * Direct authenticated order placement with transactional stock decrement and rollback.
   */
  async createDirectOrder(
    userId: string,
    data: {
      items: CreateOrderItemInput[];
      shippingAddress?: ShippingAddressInput;
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    },
  ) {
    const { items, shippingAddress, razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Order must contain at least one item', 400);
    }

    let calculatedSubtotal = 0;
    interface VerifiedOrderItem {
      productId: mongoose.Types.ObjectId;
      name: string;
      sku: string;
      variantId?: string;
      color: string;
      size: string;
      price: number;
      quantity: number;
      image: string;
    }
    const validatedItems: VerifiedOrderItem[] = [];

    // Recalculate line items against authoritative Product database
    for (const item of items) {
      if (
        typeof item.quantity !== 'number' ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        throw new AppError(
          `Invalid quantity for item ${item.productId ?? 'unknown'}. Quantity must be a positive integer`,
          400,
        );
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        throw new AppError(`Product not found: ${item.productId}`, 404);
      }

      const variant =
        product.variants.find(
          (v) =>
            (item.sku && v.sku === item.sku) ||
            (item.variantId && (v.id === item.variantId || v._id?.toString() === item.variantId)),
        ) ?? product.variants[0];

      if (!variant) {
        throw new AppError(`Variant not found for product: ${product.name}`, 404);
      }

      if (variant.stock < item.quantity) {
        throw new AppError(
          `INSUFFICIENT_STOCK: Insufficient stock for ${product.name} (${variant.sku})`,
          400,
        );
      }

      const itemPrice = variant.price;
      calculatedSubtotal += itemPrice * item.quantity;

      validatedItems.push({
        productId: product._id as mongoose.Types.ObjectId,
        name: product.name,
        sku: variant.sku,
        variantId: variant._id?.toString() || variant.id,
        color: variant.color ?? 'Standard',
        size: variant.size,
        price: itemPrice,
        quantity: item.quantity,
        image: variant.imageUrl ?? variant.images?.[0] ?? '',
      });
    }

    const {
      shipping: calculatedShipping,
      tax: calculatedTax,
      total: calculatedTotal,
    } = await this.calculateOrderTotals(calculatedSubtotal);

    let paymentStatus: 'pending' | 'captured' = 'pending';

    // Verify HMAC signature if setting payment status to 'captured'
    if (razorpayPaymentId) {
      if (!razorpayOrderId || !razorpaySignature) {
        throw new AppError(
          'Missing razorpayOrderId or razorpaySignature for captured payment',
          400,
        );
      }

      const hmacBody = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(hmacBody)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedSignature, 'utf8');
      const signatureBuf = Buffer.from(razorpaySignature, 'utf8');

      const isValid =
        expectedBuf.length === signatureBuf.length &&
        crypto.timingSafeEqual(expectedBuf, signatureBuf);

      if (!isValid) {
        throw new AppError('Invalid payment signature', 400);
      }

      paymentStatus = 'captured';
    }

    // Decrement stock with atomic concurrency guard: matching variantId/sku and stock >= quantity
    const decrementedItems: Array<{
      productId: mongoose.Types.ObjectId;
      sku: string;
      variantId?: string;
      quantity: number;
    }> = [];
    for (const item of validatedItems) {
      const vId = item.variantId;
      const variantFilter: Record<string, unknown> = { stock: { $gte: item.quantity } };
      if (vId && mongoose.isValidObjectId(vId)) {
        variantFilter._id = new mongoose.Types.ObjectId(vId);
      } else if (vId) {
        variantFilter.id = vId;
      }
      if (item.sku) {
        variantFilter.sku = item.sku;
      }

      const updateResult = await Product.updateOne(
        {
          _id: item.productId,
          variants: { $elemMatch: variantFilter },
        },
        { $inc: { 'variants.$.stock': -item.quantity } },
      );

      if (
        updateResult.matchedCount === 0 ||
        (updateResult.modifiedCount !== undefined && updateResult.modifiedCount === 0)
      ) {
        // Rollback previously decremented items to prevent partial stock exhaustion
        for (const dec of decrementedItems) {
          const rollbackFilter: Record<string, unknown> = {};
          if (dec.variantId && mongoose.isValidObjectId(dec.variantId)) {
            rollbackFilter._id = new mongoose.Types.ObjectId(dec.variantId);
          } else if (dec.variantId) {
            rollbackFilter.id = dec.variantId;
          } else {
            rollbackFilter.sku = dec.sku;
          }
          await Product.updateOne(
            { _id: dec.productId, variants: { $elemMatch: rollbackFilter } },
            { $inc: { 'variants.$.stock': dec.quantity } },
          );
          await inventoryService.syncProductInStock(dec.productId);
        }
        throw new AppError(
          `INSUFFICIENT_STOCK: Insufficient stock for ${item.name} (${item.sku})`,
          400,
        );
      }
      decrementedItems.push({
        productId: item.productId as mongoose.Types.ObjectId,
        sku: item.sku,
        variantId: vId,
        quantity: item.quantity,
      });
      await inventoryService.syncProductInStock(item.productId);
    }

    let order;
    try {
      order = await Order.create({
        userId: new mongoose.Types.ObjectId(userId),
        items: validatedItems,
        shippingAddress,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        paymentStatus,
        subtotal: calculatedSubtotal,
        shipping: calculatedShipping,
        tax: calculatedTax,
        total: calculatedTotal,
        status: paymentStatus === 'captured' ? 'confirmed' : 'pending',
      });
    } catch (createErr) {
      // Rollback stock decrements if document creation fails
      for (const dec of decrementedItems) {
        const rollbackFilter: Record<string, unknown> = {};
        if (dec.variantId && mongoose.isValidObjectId(dec.variantId)) {
          rollbackFilter._id = new mongoose.Types.ObjectId(dec.variantId);
        } else if (dec.variantId) {
          rollbackFilter.id = dec.variantId;
        } else {
          rollbackFilter.sku = dec.sku;
        }
        await Product.updateOne(
          { _id: dec.productId, variants: { $elemMatch: rollbackFilter } },
          { $inc: { 'variants.$.stock': dec.quantity } },
        );
        await inventoryService.syncProductInStock(dec.productId);
      }
      throw createErr;
    }

    return order;
  }

  async getUserOrders(userId: string) {
    return Order.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
  }

  async getOrderById(orderId: string, userId: string, isAdmin = false): Promise<IOrder> {
    if (!mongoose.isValidObjectId(orderId)) {
      throw new AppError('Order not found', 404);
    }

    const query = isAdmin
      ? { _id: orderId }
      : { _id: orderId, userId: new mongoose.Types.ObjectId(userId) };

    const order = await Order.findOne(query).lean();
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    return order as unknown as IOrder;
  }
}

export const orderService = new OrderService();
export default orderService;
