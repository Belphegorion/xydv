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
  _id?: mongoose.Types.ObjectId | string;
  id?: string;
  sku: string;
  color: string;
  colorName?: string;
  colorHex: string;
  size: string;
  price: number;
  compareAt?: number;
  stock: number;
  reservedStock?: number;
  images?: string[];
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
  category: string;
  tags: string[];
  specs: IProductSpec[];
  variants: IProductVariant[];
  images: (IProductImage | string)[];
  imageUrl?: string;
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
  lowStockThreshold?: number;
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
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
  id: { type: String },
  sku: { type: String, required: true },
  color: { type: String, required: true },
  colorName: { type: String },
  colorHex: { type: String, required: true, default: '#000000' },
  size: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  compareAt: { type: Number, min: 0 },
  stock: { type: Number, required: true, default: 0, min: 0 },
  reservedStock: { type: Number, default: 0, min: 0 },
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
    brand: { type: String, required: true, default: 'XYDV' },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    compareAt: { type: Number, min: 0 },
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    tags: [{ type: String, lowercase: true }],
    specs: [specSchema],
    variants: {
      type: [variantSchema],
      validate: {
        validator: function (variants: IProductVariant[]) {
          if (!variants || variants.length === 0) return true;
          const skus = variants.map((v) => v.sku?.trim().toUpperCase()).filter(Boolean);
          return new Set(skus).size === skus.length;
        },
        message: 'Each variant must have a unique SKU code within the product',
      },
    },
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
    lowStockThreshold: { type: Number, default: 5, min: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Auto-sync virtuals / pre-validate hook
productSchema.pre('validate', function (next) {
  if (this.variants && this.variants.length > 0) {
    this.variants.forEach((v) => {
      if (!v._id) {
        v._id = new mongoose.Types.ObjectId();
      }
      if (!v.id) {
        v.id = String(v._id);
      }
    });
    const skus = this.variants.map((v) => v.sku?.trim().toUpperCase()).filter(Boolean);
    if (new Set(skus).size !== skus.length) {
      return next(new Error('Each variant must have a unique SKU code within the product'));
    }
    if (this.price === undefined || this.price === null) {
      this.price = this.variants[0].price;
    }
    // Set inStock based on variant inventory if not explicitly set
    if (this.inStock === undefined || this.inStock === null) {
      this.inStock = this.variants.some((v) => v.stock > 0);
    }
  }
  // Sync isFeatured and featured
  if (this.isFeatured && !this.featured) {
    this.featured = true;
  } else if (this.featured && !this.isFeatured) {
    this.isFeatured = true;
  }
  // Sync imageUrl from primary or first image if not explicitly set
  if (this.images && this.images.length > 0 && !this.imageUrl) {
    const primaryImg =
      this.images.find(
        (img) => typeof img === 'object' && img !== null && 'isPrimary' in img && img.isPrimary,
      ) || this.images[0];
    const url = typeof primaryImg === 'string' ? primaryImg : primaryImg?.url;
    if (url) {
      this.imageUrl = url;
    }
  }
  next();
});

// Indexes for common queries
productSchema.index({ category: 1, isPublished: 1 });
productSchema.index({ isFeatured: 1, isPublished: 1 });
productSchema.index({ featured: 1, isPublished: 1 });
productSchema.index({ bestseller: 1, isPublished: 1 });
productSchema.index({ inStock: 1, isPublished: 1 });
productSchema.index({ price: 1, isPublished: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ 'variants.sku': 1 });
productSchema.index({ 'variants.stock': 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

export const Product: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct>) ||
  mongoose.model<IProduct>('Product', productSchema);
