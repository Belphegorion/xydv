/**
 * Common System, User, and API Types
 */

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  avatar?: string;
  loyaltyPoints: number;
  isBlocked?: boolean;
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

