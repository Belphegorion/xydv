export interface ProductVariant {
  _id: string;
  sku: string;
  color: string;
  colorHex: string;
  size: string;
  price: number;
  compareAt?: number;
  stock: number;
  images: string[];
  video?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  category: 'tops' | 'bottoms' | 'outerwear' | 'accessories';
  tags: string[];
  variants: ProductVariant[];
  features: string[];
  materials: string[];
  sizeChart?: Record<string, Record<string, string>>;
  isPublished: boolean;
  isFeatured: boolean;
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  paymentIntentId?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Address {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  avatar?: string;
  loyaltyPoints: number;
  createdAt: string;
}

export interface Review {
  _id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  totalPages: number;
  total: number;
  limit: number;
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
