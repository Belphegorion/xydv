import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import {
  createReviewSchema,
  productQuerySchema,
  slugParamSchema,
} from '../validators/product.schema';

const router = Router();

// GET /api/products/categories — category aggregation with counts and sample imagery
// CRITICAL ORDERING: Must be defined BEFORE /:slug to prevent Express matching 'categories' as a slug!
router.get('/categories', productController.getCategories.bind(productController));

// GET /api/products — list with full 10-parameter query filtering
router.get(
  '/',
  validateRequest(productQuerySchema),
  productController.getProducts.bind(productController),
);

// GET /api/products/:slug — slug or ObjectId lookup
router.get(
  '/:slug',
  validateRequest(slugParamSchema),
  productController.getProductBySlug.bind(productController),
);

// GET /api/products/:slug/reviews
router.get(
  '/:slug/reviews',
  validateRequest(slugParamSchema),
  productController.getProductReviews.bind(productController),
);

// POST /api/products/:slug/reviews — authenticated review submission
router.post(
  '/:slug/reviews',
  requireAuth,
  validateRequest(createReviewSchema),
  productController.createReview.bind(productController),
);

export default router;
