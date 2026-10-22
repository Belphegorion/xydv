import mongoose from 'mongoose';
import { Product, type IProduct } from '../models/Product.model';
import { Reservation, type IReservationItem } from '../models/Reservation.model';
import { Order } from '../models/Order.model';
import { AppError } from '../middleware/errorHandler';
import { COMMERCE_CONSTANTS } from '../constants/commerce';
import { logger } from '../config/logger';

export class InventoryService {
  private cleanerTimer: NodeJS.Timeout | null = null;

  async syncProductInStock(
    productId: mongoose.Types.ObjectId | string,
    session?: mongoose.ClientSession,
  ): Promise<void> {
    if (!productId || !mongoose.isValidObjectId(productId)) return;
    try {
      const query = Product.findById(productId).select('variants inStock');
      if (session) query.session(session);
      const product = await query;
      if (product) {
        const hasStock = product.variants.some((v) => v.stock > 0);
        if (product.inStock !== hasStock) {
          await Product.updateOne(
            { _id: product._id },
            { inStock: hasStock },
            session ? { session } : {},
          );
        }
      }
    } catch (err) {
      logger.warn(`[InventoryService] Failed to sync inStock for product ${productId}:`, {
        error: err,
      });
    }
  }

  /**
   * Atomically reserve inventory for an order (stock -> reservedStock).
   * Rolls back partial reservations on failure.
   */
  async reserveStock(
    items: Array<{
      productId: mongoose.Types.ObjectId;
      sku?: string;
      variantId?: string | mongoose.Types.ObjectId;
      quantity: number;
    }>,
    razorpayOrderId: string,
    orderId?: mongoose.Types.ObjectId,
  ) {
    const reservedItems: Array<{
      productId: mongoose.Types.ObjectId;
      sku: string;
      variantId?: string;
      quantity: number;
    }> = [];

    for (const item of items) {
      const variantFilter: Record<string, unknown> = { stock: { $gte: item.quantity } };
      if (item.variantId && mongoose.isValidObjectId(item.variantId)) {
        variantFilter._id = new mongoose.Types.ObjectId(item.variantId);
      } else if (item.variantId) {
        variantFilter.id = item.variantId;
      }
      if (item.sku) {
        variantFilter.sku = item.sku;
      }

      const query: mongoose.FilterQuery<IProduct> = {
        _id: item.productId,
        variants: { $elemMatch: variantFilter },
      };

      const result = await Product.updateOne(query, {
        $inc: {
          'variants.$.stock': -item.quantity,
          'variants.$.reservedStock': item.quantity,
        },
      });

      if (
        result.matchedCount === 0 ||
        (result.modifiedCount !== undefined && result.modifiedCount === 0)
      ) {
        // Rollback already reserved items
        for (const rolled of reservedItems) {
          const rollbackFilter: Record<string, unknown> = {};
          if (rolled.variantId && mongoose.isValidObjectId(rolled.variantId)) {
            rollbackFilter._id = new mongoose.Types.ObjectId(rolled.variantId);
          } else if (rolled.variantId) {
            rollbackFilter.id = rolled.variantId;
          } else {
            rollbackFilter.sku = rolled.sku;
          }

          await Product.updateOne(
            { _id: rolled.productId, variants: { $elemMatch: rollbackFilter } },
            {
              $inc: {
                'variants.$.stock': rolled.quantity,
                'variants.$.reservedStock': -rolled.quantity,
              },
            },
          );
          await this.syncProductInStock(rolled.productId);
        }
        throw new AppError(
          `INSUFFICIENT_STOCK: Insufficient stock for item (${item.sku || item.variantId})`,
          400,
        );
      }

      reservedItems.push({
        productId: item.productId,
        sku: item.sku || '',
        variantId: item.variantId ? String(item.variantId) : undefined,
        quantity: item.quantity,
      });
      await this.syncProductInStock(item.productId);
    }

    const expiresAt = new Date(Date.now() + COMMERCE_CONSTANTS.RESERVATION_TTL_MS);
    const reservation = await Reservation.create({
      orderId,
      razorpayOrderId,
      items: reservedItems as IReservationItem[],
      status: 'active',
      expiresAt,
    });

    return reservation;
  }

  /**
   * Atomically deduct inventory for an order item directly (zero overselling guard).
   * Executes atomic update query matching:
   * `{ _id: productId, 'variants._id': variantId, 'variants.stock': { $gte: quantity } }` (or sku)
   * using `$inc: { 'variants.$.stock': -quantity }`.
   * Throws INSUFFICIENT_STOCK if 0 documents were modified.
   */
  async deductStock(
    productId: mongoose.Types.ObjectId | string,
    variantIdOrSku: string | mongoose.Types.ObjectId,
    quantity: number,
  ): Promise<void> {
    const prodId = mongoose.isValidObjectId(productId)
      ? new mongoose.Types.ObjectId(productId)
      : productId;
    const isObjectId = mongoose.isValidObjectId(variantIdOrSku);
    const variantMatch: Record<string, unknown> = {
      stock: { $gte: quantity },
    };
    if (isObjectId) {
      variantMatch.$or = [
        { _id: new mongoose.Types.ObjectId(variantIdOrSku) },
        { sku: String(variantIdOrSku) },
      ];
    } else {
      variantMatch.sku = String(variantIdOrSku);
    }

    const query: mongoose.FilterQuery<IProduct> = {
      _id: prodId,
      variants: { $elemMatch: variantMatch },
    };

    const result = await Product.updateOne(query, {
      $inc: { 'variants.$.stock': -quantity },
    });

    if (
      result.matchedCount === 0 ||
      (result.modifiedCount !== undefined && result.modifiedCount === 0)
    ) {
      throw new AppError(
        `INSUFFICIENT_STOCK: Insufficient stock for item (${variantIdOrSku})`,
        400,
      );
    }
    await this.syncProductInStock(prodId);
  }

  /**
   * Permanent capture: clear reservedStock hold after payment verification.
   */
  async captureReservation(razorpayOrderId: string): Promise<boolean> {
    const reservation = await Reservation.findOneAndUpdate(
      { razorpayOrderId, status: 'active' },
      { $set: { status: 'captured' } },
      { new: true },
    );

    if (!reservation) {
      return false;
    }

    for (const item of reservation.items) {
      await Product.updateOne(
        { _id: item.productId, 'variants.sku': item.sku },
        { $inc: { 'variants.$.reservedStock': -item.quantity } },
      );
    }

    return true;
  }

  /**
   * Release reservation: return reservedStock back to available stock.
   */
  async releaseReservation(razorpayOrderId: string): Promise<boolean> {
    const reservation = await Reservation.findOneAndUpdate(
      { razorpayOrderId, status: 'active' },
      { $set: { status: 'released' } },
      { new: true },
    );

    if (!reservation) {
      return false;
    }

    for (const item of reservation.items) {
      await Product.updateOne(
        { _id: item.productId, 'variants.sku': item.sku },
        {
          $inc: {
            'variants.$.stock': item.quantity,
            'variants.$.reservedStock': -item.quantity,
          },
        },
      );
      await this.syncProductInStock(item.productId);
    }

    return true;
  }

  /**
   * Reconciliation worker: garbage-collect expired reservations and cancel abandoned orders.
   */
  async cleanExpiredReservations(): Promise<number> {
    const now = new Date();
    const expiredReservations = await Reservation.find({
      status: 'active',
      expiresAt: { $lte: now },
    });

    if (expiredReservations.length === 0) return 0;

    let cleaned = 0;
    for (const res of expiredReservations) {
      const reservation = await Reservation.findOneAndUpdate(
        { _id: res._id, status: 'active' },
        { $set: { status: 'expired' } },
        { new: true },
      );

      if (!reservation) continue;

      // Return stock
      for (const item of reservation.items) {
        await Product.updateOne(
          { _id: item.productId, 'variants.sku': item.sku },
          {
            $inc: {
              'variants.$.stock': item.quantity,
              'variants.$.reservedStock': -item.quantity,
            },
          },
        );
        await this.syncProductInStock(item.productId);
      }

      // Cancel associated pending order
      if (reservation.razorpayOrderId) {
        await Order.updateOne(
          { razorpayOrderId: reservation.razorpayOrderId, status: 'pending' },
          { status: 'cancelled', paymentStatus: 'failed' },
        );
      }

      cleaned++;
    }

    logger.info(`[InventoryCleaner] Reclaimed ${cleaned} expired reservation holds`, { cleaned });
    return cleaned;
  }

  startReconciliationWorker(intervalMs = 60000): void {
    if (this.cleanerTimer) return;
    this.cleanerTimer = setInterval(() => {
      this.cleanExpiredReservations().catch((err) => {
        logger.error('[InventoryCleaner] Error during reconciliation:', {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }, intervalMs);
    this.cleanerTimer.unref(); // Do not block process exit
  }

  stopReconciliationWorker(): void {
    if (this.cleanerTimer) {
      clearInterval(this.cleanerTimer);
      this.cleanerTimer = null;
    }
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
