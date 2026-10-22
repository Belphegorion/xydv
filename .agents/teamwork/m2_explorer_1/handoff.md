# Handoff Report — Product Catalog API Investigation & Worker Plan

**Agent**: `m2_explorer_1`  
**Milestone**: Milestone 2: Backend API & Razorpay Payment Engine  
**Working Directory**: `c:\Users\atlas\OneDrive\ドキュメント\project-v1\.agents\teamwork\m2_explorer_1`  
**Target Files**: 
- `apps/api/src/models/Product.model.ts`
- `apps/api/src/routes/products.routes.ts`
- `packages/types/src/product.ts`

---

## 1. Observation

### 1.1 `Product.model.ts` Schema vs `@vertex/types` and `PROJECT.md`
In `apps/api/src/models/Product.model.ts`:
- **Root Price Missing**: `IProduct` (lines 15-32) and `productSchema` (lines 46-78) do not define `price: number` or `originalPrice?: number` / `compareAt?: number` at the root document level. They only define `price` inside individual variants (`variants[].price`). However:
  - `PROJECT.md` line 78-93: `export interface Product { _id: string; name: string; slug: string; description: string; price: number; originalPrice?: number; ... }`
  - `packages/types/src/product.ts` line 48-75: `export interface Product { _id: string; price: number; originalPrice?: number; compareAt?: number; ... }`
  Without a root `price`, sorting by price (`{ price: 1 }`), filtering by price, and direct product card price rendering will fail or require expensive array lookups.
- **`specs` Missing**: Neither `IProduct` nor `productSchema` define `specs`.
  - `packages/types/src/product.ts` lines 12-15 & 60: `specs?: ProductSpec[];` where `ProductSpec` is `{ label: string; value: string }`.
  - `PROJECT.md` line 87: `specs: { label: string; value: string }[];`
- **`images` Root Array Missing**: `productSchema` lacks top-level `images`. It only has `variants[].images: string[]`.
  - `PROJECT.md` line 89: `images: { url: string; alt: string; isPrimary: boolean; isSecondary: boolean }[];`
  - `packages/types/src/product.ts` line 64: `images?: Array<ProductImage | string>;`
- **`variants` Swatch and Hover Crossfade Fields Missing**:
  - `IProductVariant` (lines 3-13) and `variantSchema` (lines 34-44) lack `colorName`, `imageUrl`, and `secondaryImageUrl`.
  - In `PROJECT.md` lines 95-104: `ProductVariant` includes `colorName: string`, `colorHex: string`, `imageUrl: string`, `secondaryImageUrl?: string`. These fields are strictly required for M4 Feature 18 ("Secondary-Image Crossfade on Hover") and Feature 19 ("Real-Time Color Swatch Live Swap").
  - `variantSchema` line 35 has `sku: { type: String, required: true, unique: true }`. In Mongoose, putting `unique: true` on an embedded array schema creates an unintentional multikey index that can cause Mongo duplicate key errors on array updates. Sku indexing should be at the collection level or sparse.
- **`inStock` Flag Missing**: `inStock` is missing from `IProduct` and `productSchema`. Required by `PROJECT.md` line 90 and query parameter filtering `?inStock=true`.
- **`featured` and `bestseller` Flags**: `Product.model.ts` line 27 has `isFeatured: boolean`, but does NOT have `bestseller: boolean`, and lacks an alias/field for `featured`. `PROJECT.md` lines 91-92 explicitly require `featured?: boolean; bestseller?: boolean;`.

### 1.2 `products.routes.ts` Query Parameters
In `apps/api/src/routes/products.routes.ts` lines 10-59:
- Current extracted query parameters (lines 12-20):
  ```typescript
  const {
    category,
    sort = 'newest',
    page = '1',
    limit = '20',
    search,
    minPrice,
    maxPrice,
  } = req.query as Record<string, string>;
  ```
- **Missing Query Parameters**:
  - `featured`: Not parsed or filtered.
  - `bestseller`: Not parsed or filtered.
  - `inStock`: Not parsed or filtered.
- **Search Logic**: Currently uses only MongoDB `$text: { $search: search }` (line 25). If search terms are partial words (e.g. "tact" for "tactical") or if text index is not yet built, `$text` fails to match. A combination or regex `$or` across `name`, `description`, `tags`, `brand`, and variant color names provides far superior search coverage.
- **Price Range Query**: Lines 26-31 currently only check `filter['variants.price']`. With root `price` introduced, price filtering must check root `price` OR `variants.price`.
- **Filter Composition**: Multiple conditions using `$or` (e.g. search + inStock + featured) will overwrite `filter.$or` if assigned directly. An `$and` array of conditions is required to prevent query collision.

### 1.3 Endpoints: Category Aggregation & Slug Lookup
- **Missing `/api/products/categories`**: There is NO route for category aggregation in `products.routes.ts`.
- **Route Precedence Danger**: In Express, route handlers are matched in registration order. If `GET /api/products/:slug` is registered before `GET /api/products/categories`, any request to `/api/products/categories` will match `:slug` with `slug = "categories"` and return 404 "Product not found". The categories endpoint MUST be registered BEFORE `/:slug`.
- **`GET /api/products/:slug`**: Currently lines 62-70 query strictly by `{ slug: req.params.slug, isPublished: true }`. If an internal component or test queries by MongoDB `_id` instead of slug, it returns 404. It should support both `slug` and valid `_id`.

### 1.4 Baseline Build Status
Executed commands:
- `npm --prefix apps/api run type-check`: Exited with code 0.
- `npm --prefix packages/types run build`: Exited with code 0.

---

## 2. Logic Chain

1. **Schema Consistency (Observation 1.1 → Logic)**:
   The frontend `ProductCard` (M4), `HeroSection` / `CategoryGrid` (M3), and `CartStore` (M5) rely on `@vertex/types`. If `Product.model.ts` does not store root `price`, `specs`, `images`, `inStock`, `bestseller`, `colorName`, `imageUrl`, and `secondaryImageUrl`, then:
   - Data stored in MongoDB will not match `@vertex/types`.
   - The seed script being crafted by `m2_explorer_2` will fail Mongoose validation if it seeds these fields.
   - Frontend components attempting to render technical specs, swatch names, or hover crossfade images will receive `undefined`.
   - Therefore, `Product.model.ts` must be updated to include all these fields with proper types, defaults, and indexes.

2. **Query Filtering Robustness (Observation 1.2 → Logic)**:
   The user specification requires catalog filtering across 10 parameters: `category`, `search`, `featured`, `bestseller`, `inStock`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`.
   - Combining these filters naively with top-level assignments creates conflicting `$or` keys in MongoDB query objects.
   - Using an `andConditions: Record<string, unknown>[]` array that is assigned to `filter.$and` guarantees that every active filter is evaluated conjunctively without property overwrites.
   - For `sort`, adding `'bestseller'` and `'rating'` alongside `'newest'`, `'price-asc'`, `'price-desc'`, and `'popular'` provides complete support for all catalog sorting requirements.

3. **Routing Order & Express Dispatch (Observation 1.3 → Logic)**:
   Express route path `/:slug` matches any path segment not containing a slash.
   - A request to `/api/products/categories` will match `/:slug` if `/:slug` is registered earlier.
   - Placing `router.get('/categories', ...)` before `router.get('/:slug', ...)` guarantees deterministic dispatch.
   - Computing category aggregation using a MongoDB aggregation pipeline (`$match` -> `$group` -> `$sort` -> `$project`) ensures category counts and sample images reflect the actual active database inventory in real time.

4. **Slug and ObjectId Resilience (Observation 1.3 → Logic)**:
   Using `mongoose.Types.ObjectId.isValid(slug)` allows the handler to search `{ $or: [{ slug }, { _id: slug }], isPublished: true }`, ensuring backward compatibility for administrative links, cart references, and test suites.

---

## 3. Caveats

1. **Seed Script Content Ownership**: The actual seed data content (product names, lore, images, technical fabric specs) is being designed by `m2_explorer_2` in `apps/api/src/scripts/seed.ts`. Our model updates define the schema contracts that `m2_explorer_2` will seed into.
2. **Razorpay Security Hardening**: Payment routes (`orders.routes.ts` and `webhooks.routes.ts`) are being investigated by `m2_explorer_3`. Our scope is strictly the Product Catalog model and API.
3. **Database Pre-existing Data**: When `Product.model.ts` adds root `price` and `inStock`, re-running the seed script (`npm run seed` or `npx tsx scripts/seed.ts`) will be required to populate existing documents with root fields.

---

## 4. Conclusion

The Product Catalog API requires three synchronized updates:
1. **`apps/api/src/models/Product.model.ts`**:
   - Add `IProductSpec`, `IProductImage`, and update `IProductVariant` with `colorName`, `imageUrl`, `secondaryImageUrl`.
   - Add root fields to `IProduct` and `productSchema`: `price`, `originalPrice`, `compareAt`, `specs`, `images`, `inStock`, `featured`, `bestseller`.
   - Add pre-save hook to ensure root `price` and `inStock` default sensibly from `variants` if omitted.
   - Add indexes for `slug`, `category`, `isFeatured`, `featured`, `bestseller`, `inStock`, and `price`.
2. **`apps/api/src/routes/products.routes.ts`**:
   - Add `GET /api/products/categories` aggregation endpoint **BEFORE** `/:slug`.
   - Support all 10 query parameters in `GET /api/products`: `category`, `search`, `featured`, `bestseller`, `inStock`, `minPrice`, `maxPrice`, `sort`, `page`, `limit` using composable `$and` filtering.
   - Support both slug and ObjectId in `GET /api/products/:slug`.
3. **`packages/types/src/product.ts`**:
   - Update `ProductFilters` to include `featured?: boolean | string`, `bestseller?: boolean | string`, `inStock?: boolean | string`, and expanded `sort` union.
   - Add `CategoryAggregate` interface.

---

## 5. Verification Method

### 5.1 Type Check & Compilation Verification
Run these commands from project root:
```bash
npm --prefix packages/types run build
npm --prefix apps/api run type-check
```
*Pass criterion*: Exit code 0, zero TypeScript errors.

### 5.2 API Behavior Verification (Local Server & cURL)
When API server is running on `http://localhost:5000`:
1. **Category Aggregation**:
   ```bash
   curl -s http://localhost:5000/api/products/categories
   ```
   *Expected*: JSON response with `success: true` and an array of 4 category aggregates (`tops`, `bottoms`, `outerwear`, `accessories`) with `count`, `name`, `slug`, and `imageUrl`. Must NOT return 404 "Product not found".
2. **Filter Combinations**:
   ```bash
   curl -s "http://localhost:5000/api/products?featured=true&category=tops&sort=price-asc"
   curl -s "http://localhost:5000/api/products?bestseller=true"
   curl -s "http://localhost:5000/api/products?inStock=true&minPrice=50&maxPrice=150"
   curl -s "http://localhost:5000/api/products?search=volt"
   ```
   *Expected*: Correctly filtered products with pagination metadata (`page`, `totalPages`, `total`, `limit`).
3. **Slug and ID Lookup**:
   ```bash
   curl -s http://localhost:5000/api/products/volt-performance-tee
   ```
   *Expected*: Full product document including `specs`, `variants` with swatches and crossfade images, root `price`, and `inStock`.

---

## 6. Concrete Implementation Plan for Worker

### Step 1: Update `packages/types/src/product.ts`
1. Export `CategoryAggregate`:
   ```typescript
   export interface CategoryAggregate {
     id: string;
     slug: string;
     name: string;
     description?: string;
     count: number;
     minPrice?: number;
     maxPrice?: number;
     imageUrl?: string;
   }
   ```
2. Update `ProductFilters` to include missing filters:
   ```typescript
   export interface ProductFilters {
     category?: string;
     sizes?: string[];
     colors?: string[];
     minPrice?: number;
     maxPrice?: number;
     sort?: 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'bestseller' | 'rating';
     page?: number;
     limit?: number;
     search?: string;
     featured?: boolean | string;
     bestseller?: boolean | string;
     inStock?: boolean | string;
   }
   ```
3. Rebuild types: `npm --prefix packages/types run build`.

---

### Step 2: Update `apps/api/src/models/Product.model.ts`
Replace `apps/api/src/models/Product.model.ts` with the fully aligned schema:

```typescript
import mongoose, { type Document, type Model } from 'mongoose';

export interface IProductSpec {
  label: string;
  value: string;
}

export interface IProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
  isSecondary?: boolean;
}

export interface IProductVariant {
  sku: string;
  color: string;
  colorName?: string;
  colorHex: string;
  size: string;
  price: number;
  compareAt?: number;
  stock: number;
  images: string[];
  imageUrl?: string;
  secondaryImageUrl?: string;
  video?: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  brand: string;
  description: string;
  price: number;
  originalPrice?: number;
  compareAt?: number;
  category: 'tops' | 'bottoms' | 'outerwear' | 'accessories';
  tags: string[];
  specs: IProductSpec[];
  variants: IProductVariant[];
  images: IProductImage[];
  features: string[];
  materials: string[];
  sizeChart?: Record<string, Record<string, string>>;
  inStock: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  featured: boolean;
  bestseller: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const specSchema = new mongoose.Schema<IProductSpec>(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const imageSchema = new mongoose.Schema<IProductImage>(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
    isSecondary: { type: Boolean, default: false },
  },
  { _id: false },
);

const variantSchema = new mongoose.Schema<IProductVariant>({
  sku: { type: String, required: true },
  color: { type: String, required: true },
  colorName: { type: String },
  colorHex: { type: String, required: true, default: '#000000' },
  size: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  compareAt: { type: Number, min: 0 },
  stock: { type: Number, required: true, default: 0, min: 0 },
  images: [{ type: String }],
  imageUrl: { type: String },
  secondaryImageUrl: { type: String },
  video: { type: String },
});

const productSchema = new mongoose.Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
    },
    brand: { type: String, required: true, default: 'VERTEX' },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    compareAt: { type: Number, min: 0 },
    category: {
      type: String,
      required: true,
      enum: ['tops', 'bottoms', 'outerwear', 'accessories'],
    },
    tags: [{ type: String, lowercase: true }],
    specs: [specSchema],
    variants: [variantSchema],
    images: [imageSchema],
    features: [{ type: String }],
    materials: [{ type: String }],
    sizeChart: { type: mongoose.Schema.Types.Mixed },
    inStock: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for id
productSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Auto-sync virtuals / pre-validate hook
productSchema.pre('validate', function (next) {
  if (this.variants && this.variants.length > 0) {
    if (this.price === undefined || this.price === null) {
      this.price = this.variants[0].price;
    }
    // Set inStock based on variant inventory
    this.inStock = this.variants.some((v) => v.stock > 0);
  }
  // Sync isFeatured and featured
  if (this.isFeatured && !this.featured) {
    this.featured = true;
  } else if (this.featured && !this.isFeatured) {
    this.isFeatured = true;
  }
  next();
});

// Indexes for common queries
productSchema.index({ slug: 1 });
productSchema.index({ category: 1, isPublished: 1 });
productSchema.index({ isFeatured: 1, isPublished: 1 });
productSchema.index({ featured: 1, isPublished: 1 });
productSchema.index({ bestseller: 1, isPublished: 1 });
productSchema.index({ inStock: 1, isPublished: 1 });
productSchema.index({ price: 1, isPublished: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ 'variants.sku': 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

export const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);
```

---

### Step 3: Update `apps/api/src/routes/products.routes.ts`
Implement the 10 query parameters, category aggregation route, and resilient slug lookup:

```typescript
import { Router, type Request, type Response, type NextFunction } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product.model';
import { Review } from '../models/Review.model';
import { AppError } from '../middleware/errorHandler';
import { requireAuth, type AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/products/categories — category aggregation with counts and hero imagery
// NOTE: Must be defined BEFORE /:slug to prevent Express matching 'categories' as a slug!
router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rawCategories = await Product.aggregate([
      { $match: { isPublished: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          minPrice: { $min: { $ifNull: ['$price', { $min: '$variants.price' }] } },
          maxPrice: { $max: { $ifNull: ['$price', { $max: '$variants.price' }] } },
          featuredProduct: { $first: '$$ROOT' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const categoryMetadata: Record<string, { name: string; description: string }> = {
      tops: {
        name: 'Tops & Engineered Layers',
        description: 'Next-to-skin moisture regulation & aerodynamic compression',
      },
      bottoms: {
        name: 'Pants & Training Shorts',
        description: 'Cordura reinforced modular utility with 4-way stretch',
      },
      outerwear: {
        name: 'Weatherproof Shells',
        description: 'Gore-Tex 3-layer tactical membranes & seam-sealed parkas',
      },
      accessories: {
        name: 'Tactical Gear & Accessories',
        description: 'MOLLE-compatible modular rigs, bags, and technical accessories',
      },
    };

    // Ensure all 4 core categories appear even if catalog is temporarily empty
    const allCategories = ['tops', 'bottoms', 'outerwear', 'accessories'];
    const categoriesMap = new Map(rawCategories.map((c) => [c._id, c]));

    const categories = allCategories.map((slug) => {
      const cat = categoriesMap.get(slug);
      const meta = categoryMetadata[slug] ?? {
        name: slug.charAt(0).toUpperCase() + slug.slice(1),
        description: `${slug} collection`,
      };
      const p = cat?.featuredProduct;
      const imageUrl =
        p?.images?.[0]?.url ||
        (typeof p?.images?.[0] === 'string' ? p?.images?.[0] : null) ||
        p?.variants?.[0]?.imageUrl ||
        p?.variants?.[0]?.images?.[0] ||
        '';

      return {
        id: slug,
        slug,
        name: meta.name,
        description: meta.description,
        count: cat ? cat.count : 0,
        minPrice: cat ? cat.minPrice : 0,
        maxPrice: cat ? cat.maxPrice : 0,
        imageUrl,
      };
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products — list with full 10-parameter query filtering
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      category,
      search,
      featured,
      bestseller,
      inStock,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = '1',
      limit = '20',
    } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { isPublished: true };
    const andConditions: Record<string, unknown>[] = [];

    // 1. category
    if (category && category.toLowerCase() !== 'all') {
      filter.category = category.toLowerCase().trim();
    }

    // 2. search (regex across name, description, tags, brand, colorName)
    if (search && search.trim()) {
      const term = search.trim();
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      andConditions.push({
        $or: [
          { name: regex },
          { description: regex },
          { tags: regex },
          { brand: regex },
          { 'variants.color': regex },
          { 'variants.colorName': regex },
        ],
      });
    }

    // 3. featured
    if (featured === 'true' || featured === '1') {
      andConditions.push({
        $or: [{ isFeatured: true }, { featured: true }],
      });
    }

    // 4. bestseller
    if (bestseller === 'true' || bestseller === '1') {
      andConditions.push({
        $or: [{ bestseller: true }, { tags: 'bestseller' }],
      });
    }

    // 5. inStock
    if (inStock === 'true' || inStock === '1') {
      andConditions.push({
        $or: [{ inStock: true }, { 'variants.stock': { $gt: 0 } }],
      });
    } else if (inStock === 'false' || inStock === '0') {
      andConditions.push({
        $or: [{ inStock: false }, { 'variants.stock': { $lte: 0 } }],
      });
    }

    // 6. minPrice
    if (minPrice !== undefined && minPrice !== '') {
      const min = Number(minPrice);
      if (!isNaN(min)) {
        andConditions.push({
          $or: [{ price: { $gte: min } }, { 'variants.price': { $gte: min } }],
        });
      }
    }

    // 7. maxPrice
    if (maxPrice !== undefined && maxPrice !== '') {
      const max = Number(maxPrice);
      if (!isNaN(max)) {
        andConditions.push({
          $or: [{ price: { $lte: max } }, { 'variants.price': { $lte: max } }],
        });
      }
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    // 8. sort
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      'price-asc': { price: 1, 'variants.0.price': 1 },
      'price-desc': { price: -1, 'variants.0.price': -1 },
      popular: { reviewCount: -1, averageRating: -1 },
      bestseller: { bestseller: -1, reviewCount: -1 },
      rating: { averageRating: -1, reviewCount: -1 },
    };

    // 9 & 10. page & limit
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      Product.find(filter)
        .sort(sortMap[sort] ?? sortMap.newest)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total,
      limit: limitNum,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:slug — slug or ObjectId lookup
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = isObjectId
      ? { $or: [{ slug }, { _id: slug }], isPublished: true }
      : { slug, isPublished: true };

    const product = await Product.findOne(query).lean();
    if (!product) {
      return next(new AppError(`Product not found: ${slug}`, 404));
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:slug/reviews
router.get('/:slug/reviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = isObjectId ? { $or: [{ slug }, { _id: slug }] } : { slug };

    const product = await Product.findOne(query).lean();
    if (!product) return next(new AppError('Product not found', 404));
    const reviews = await Review.find({ productId: product._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
});

// POST /api/products/:slug/reviews — authenticated
router.post(
  '/:slug/reviews',
  requireAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const isObjectId = mongoose.Types.ObjectId.isValid(slug);
      const query = isObjectId ? { $or: [{ slug }, { _id: slug }] } : { slug };

      const product = await Product.findOne(query);
      if (!product) return next(new AppError('Product not found', 404));

      const { rating, title, body } = req.body as {
        rating: number;
        title: string;
        body: string;
      };

      const review = await Review.create({
        productId: product._id,
        userId: req.user!._id,
        userName: req.body.userName ?? 'Anonymous',
        rating: Math.min(5, Math.max(1, Number(rating))),
        title,
        body,
      });

      // Update product rating
      const reviews = await Review.find({ productId: product._id });
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      await Product.findByIdAndUpdate(product._id, {
        averageRating: Math.round(avg * 10) / 10,
        reviewCount: reviews.length,
      });

      res.status(201).json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
```

---

### Step 4: Validate Changes
Run build and type check:
```bash
npm --prefix packages/types run build
npm --prefix apps/api run type-check
```
Verify zero errors.
