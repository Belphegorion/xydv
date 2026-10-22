import { Router } from 'express';
import { Setting } from '../models/Setting.model';
import { COMMERCE_CONSTANTS } from '../constants/commerce';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const setting = await Setting.findOne({ key: 'global_store_settings' }).lean();
    res.json({
      success: true,
      data: {
        freeShippingThreshold:
          typeof setting?.freeShippingThreshold === 'number'
            ? setting.freeShippingThreshold
            : COMMERCE_CONSTANTS.FREE_SHIPPING_THRESHOLD,
        standardShippingFee:
          typeof (setting as any)?.shippingFee === 'number'
            ? (setting as any).shippingFee
            : typeof setting?.standardShippingFee === 'number'
            ? setting.standardShippingFee
            : COMMERCE_CONSTANTS.STANDARD_SHIPPING_FEE,
        taxRate:
          typeof setting?.taxRate === 'number'
            ? setting.taxRate
            : COMMERCE_CONSTANTS.TAX_RATE,
        currency: setting?.currency || COMMERCE_CONSTANTS.CURRENCY,
        currencySymbol: setting?.currencySymbol || '₹',
        storeName: setting?.storeName || 'XYDV',
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
