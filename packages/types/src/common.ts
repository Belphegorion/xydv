/**
 * Common System, User, and API Types
 */

export interface UserAddress {
  _id?: string;
  id?: string;
  fullName: string;
  street?: string;
  line1?: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  avatar?: string;
  loyaltyPoints: number;
  isBlocked?: boolean;
  addresses?: UserAddress[];
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
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  lowStockCount: number;
  pageViews: number;
  conversionRate: number;
  revenueByDate: Array<{ date: string; revenue: number; orders: number }>;
  orderStatusDistribution: Array<{ status: string; count: number }>;
  topSellingProducts: Array<{ id: string; name: string; quantity: number; revenue: number }>;
}
