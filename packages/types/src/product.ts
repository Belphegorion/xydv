/**
 * Product & Inventory Domain Types
 */

export const PRODUCT_CATEGORIES = ['tops', 'bottoms', 'outerwear', 'accessories'] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type Category = ProductCategory | string;

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export type Size = (typeof SIZES)[number];

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
  isSecondary?: boolean;
}

export interface ProductVariant {
  id?: string;
  _id?: string;
  sku: string;
  color?: string;
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

export interface InventorySpec {
  sku: string;
  stock: number;
  inStock: boolean;
  lowStock?: boolean;
}

export interface Product {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  brand?: string;
  description: string;
  price: number;
  originalPrice?: number;
  compareAt?: number;
  category: Category;
  tags: string[];
  specs?: ProductSpec[];
  specsSummary?: string;
  variants: ProductVariant[];
  features?: string[];
  materials?: string[];
  images?: Array<ProductImage | string>;
  imageUrl?: string;
  sizeChart?: Record<string, Record<string, string>>;
  inStock?: boolean;
  isPublished?: boolean;
  isFeatured?: boolean;
  featured?: boolean;
  bestseller?: boolean;
  averageRating?: number;
  reviewCount?: number;
  lowStockThreshold?: number;
  discipline?: string;
  gender?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFilters {
  category?: string;
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'popular';
  page?: number;
  limit?: number;
  search?: string;
}

export interface CategoryItem {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}
