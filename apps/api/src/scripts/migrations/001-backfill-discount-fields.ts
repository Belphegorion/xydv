import { connectDB } from '../../config/database';
import { Product } from '../../models/Product.model';
import { discountService } from '../../services/discount.service';
import { logger } from '../../config/logger';

async function runMigration() {
  await connectDB();
  const isRollback = process.argv.includes('--rollback');

  if (isRollback) {
    logger.info('Rolling back migration: unsetting discount paise fields on products...');
    const result = await Product.updateMany(
      {},
      {
        $unset: {
          mrpPaise: 1,
          sellingPricePaise: 1,
          effectivePricePaise: 1,
          activeDiscountId: 1,
          activeDiscountName: 1,
          discountAmountPaise: 1,
          discountPercentRounded: 1,
          discountBadgeLabel: 1,
          isDiscountExcluded: 1,
          effectivePriceUpdatedAt: 1,
          'variants.$[].mrpPaise': 1,
          'variants.$[].sellingPricePaise': 1,
          'variants.$[].effectivePricePaise': 1,
        },
      },
    );
    logger.info(`Rollback complete: ${result.modifiedCount} products reverted.`);
    process.exit(0);
  }

  logger.info('Starting migration 001: Backfilling discount price fields on products...');
  const products = await Product.find({});
  let updatedCount = 0;

  for (const product of products) {
    const regularSellingPaise = Math.round(product.price * 100);
    const mrpPaise =
      product.compareAt && product.compareAt > 0
        ? Math.round(product.compareAt * 100)
        : regularSellingPaise;

    product.sellingPricePaise = regularSellingPaise;
    product.mrpPaise = mrpPaise;
    product.effectivePricePaise = regularSellingPaise;
    product.discountAmountPaise = 0;
    product.discountPercentRounded = 0;
    product.activeDiscountId = null;
    product.isDiscountExcluded = false;

    if (product.variants && product.variants.length > 0) {
      for (const v of product.variants) {
        const vSelling = Math.round((v.price ?? product.price) * 100);
        const vMrp =
          v.compareAt && v.compareAt > 0
            ? Math.round(v.compareAt * 100)
            : product.compareAt && product.compareAt > 0
              ? Math.round(product.compareAt * 100)
              : vSelling;
        v.sellingPricePaise = vSelling;
        v.mrpPaise = vMrp;
        v.effectivePricePaise = vSelling;
      }
    }

    await product.save();
    updatedCount++;
  }

  logger.info(`Backfilled ${updatedCount} products. Now computing active promotional discounts...`);
  await discountService.recomputeAllProductPrices();
  logger.info('Migration 001 completed successfully.');
  process.exit(0);
}

runMigration().catch((err) => {
  logger.error('Migration failed:', err);
  process.exit(1);
});
