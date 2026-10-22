import mongoose from 'mongoose';
import { Product, type IProduct } from '../models/Product.model';
import { Category } from '../models/Category.model';
import { Review } from '../models/Review.model';
import { AppError } from '../middleware/errorHandler';

export interface ProductQueryFilters {
  category?: string;
  search?: string;
  featured?: string;
  bestseller?: string;
  inStock?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

export class ProductService {
  /**
   * Aggregate catalog categories dynamically from DB (Category & Product collections).
   */
  async getCategories() {
    const [rawCategories, dbCategories] = await Promise.all([
      Product.aggregate([
        { $match: { isPublished: true } },
        {
          $group: {
            _id: { $toLower: '$category' },
            count: { $sum: 1 },
            minPrice: { $min: { $ifNull: ['$price', { $min: '$variants.price' }] } },
            maxPrice: { $max: { $ifNull: ['$price', { $max: '$variants.price' }] } },
            featuredProduct: { $first: '$$ROOT' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Category.find({ isActive: { $ne: false } })
        .sort({ name: 1 })
        .lean()
        .catch(() => []),
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

    const categoriesMap = new Map(
      rawCategories.map((c) => [c._id ? String(c._id).toLowerCase() : '', c]),
    );
    const dbCategoriesMap = new Map(
      dbCategories.map((c) => [c.slug ? String(c.slug).toLowerCase() : '', c]),
    );

    // Dynamically derive all active categories from DB Category collection and active Products
    const slugSet = new Set<string>();
    for (const c of dbCategories) {
      if (c.slug) slugSet.add(c.slug.toLowerCase());
    }
    for (const rc of rawCategories) {
      if (rc._id) slugSet.add(String(rc._id).toLowerCase());
    }

    // Default fallback categories if database is completely empty
    if (slugSet.size === 0) {
      ['tops', 'bottoms', 'outerwear', 'accessories'].forEach((s) => slugSet.add(s));
    }

    return Array.from(slugSet).map((slug) => {
      const cat = categoriesMap.get(slug);
      const dbCat = dbCategoriesMap.get(slug);
      const meta = categoryMetadata[slug] ?? {
        name: dbCat?.name || slug.charAt(0).toUpperCase() + slug.slice(1),
        description: dbCat?.description || `${slug} collection`,
      };
      const p = cat?.featuredProduct;
      const imageUrl =
        dbCat?.image ||
        p?.images?.[0]?.url ||
        (typeof p?.images?.[0] === 'string' ? p?.images?.[0] : null) ||
        p?.variants?.[0]?.imageUrl ||
        p?.variants?.[0]?.images?.[0] ||
        '';

      return {
        id: slug,
        slug,
        name: dbCat?.name || meta.name,
        description: dbCat?.description || meta.description,
        count: cat ? cat.count : 0,
        minPrice: cat ? cat.minPrice : 0,
        maxPrice: cat ? cat.maxPrice : 0,
        imageUrl,
      };
    });
  }

  /**
   * Query catalog with 10-parameter filtering engine.
   */
  async getProducts(filters: ProductQueryFilters) {
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
    } = filters;

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
      andConditions.push({ inStock: true });
    } else if (inStock === 'false' || inStock === '0') {
      andConditions.push({ inStock: false });
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

    return {
      data,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total,
      limit: limitNum,
    };
  }

  /**
   * Slug or ObjectId lookup with 404 handling.
   */
  async getProductBySlug(slug: string): Promise<IProduct> {
    if (!slug) {
      throw new AppError('Product slug is required', 400);
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = isObjectId
      ? { $or: [{ slug }, { _id: slug }], isPublished: true }
      : { slug, isPublished: true };

    const product = await Product.findOne(query).lean();
    if (!product) {
      throw new AppError(`Product not found: ${slug}`, 404);
    }

    return product as unknown as IProduct;
  }

  /**
   * Fetch reviews for a product by slug or id.
   */
  async getProductReviews(slug: string) {
    const product = await this.getProductBySlug(slug);
    const reviews = await Review.find({ productId: product._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return reviews;
  }

  /**
   * Create customer review and update product rating telemetry.
   */
  async createReview(
    slug: string,
    userId: string,
    userName: string,
    data: { rating: number; title: string; body: string },
  ) {
    const product = await this.getProductBySlug(slug);

    const review = await Review.create({
      productId: product._id,
      userId: new mongoose.Types.ObjectId(userId),
      userName: userName || 'Anonymous',
      rating: Math.min(5, Math.max(1, Number(data.rating))),
      title: data.title,
      body: data.body,
    });

    const [stats] = await Review.aggregate<{ averageRating: number; reviewCount: number }>([
      { $match: { productId: product._id } },
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    await Product.findByIdAndUpdate(product._id, {
      averageRating: stats ? Math.round(stats.averageRating * 10) / 10 : 0,
      reviewCount: stats ? stats.reviewCount : 0,
    });

    return review;
  }
}

export const productService = new ProductService();
export default productService;
