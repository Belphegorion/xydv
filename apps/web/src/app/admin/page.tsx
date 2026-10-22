'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CurrencyInr,
  Receipt,
  Users,
  Warning,
  Eye,
  Percent,
  ArrowClockwise,
  Plus,
  ArrowRight,
} from '@phosphor-icons/react';
import { api } from '../../lib/api';
import {
  RevenueTimelineChart,
  OrderStatusDonutChart,
  TopProductsChart,
} from '../../components/admin/AdminCharts';

interface AnalyticsPayload {
  period: string;
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

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d');
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: AnalyticsPayload }>(`/admin/analytics?period=${period}`);
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load system analytics');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="space-y-8">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-mono text-xl font-bold uppercase tracking-wider text-[#f5f5f5]">
            Commerce Analytics & Telemetry
          </h2>
          <p className="font-mono text-xs text-[#71717a] mt-0.5">
            Real-time financial performance, inventory health, and conversion metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector Tabs */}
          <div className="inline-flex rounded border border-[#1f1f1f] bg-[#111111] p-1 font-mono text-xs">
            {(['7d', '30d', 'all'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 uppercase tracking-wider transition-colors active:scale-[0.97] ${
                  period === p
                    ? 'bg-[#1f1f1f] text-[#e8ff00] font-bold'
                    : 'text-[#71717a] hover:text-[#f5f5f5]'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded border border-[#1f1f1f] bg-[#111111] text-[#a0a0a0] hover:text-[#f5f5f5] hover:border-[#333333] transition-colors active:scale-[0.97]"
            aria-label="Refresh analytics data"
          >
            <ArrowClockwise size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Low-stock Warning Banner */}
      {data && data.lowStockCount > 0 && (
        <div className="flex items-center justify-between rounded border border-[#ff3b3b]/30 bg-[#ff3b3b]/10 p-4 text-[#ff3b3b]">
          <div className="flex items-center gap-3">
            <Warning size={20} weight="bold" />
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-wider">
                Critical Inventory Alert
              </p>
              <p className="font-sans text-xs text-[#ff3b3b]/80 mt-0.5">
                {data.lowStockCount} product variants are currently below the safety threshold (5 units).
              </p>
            </div>
          </div>
          <Link
            href="/admin/inventory?lowStock=true"
            className="inline-flex items-center gap-1.5 rounded border border-[#ff3b3b]/40 bg-[#ff3b3b]/20 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#ffffff] hover:bg-[#ff3b3b] transition-colors active:scale-[0.97]"
          >
            <span>Resolve</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {error && (
        <div className="rounded border border-[#ff3b3b]/30 bg-[#ff3b3b]/10 p-4 font-mono text-xs text-[#ff3b3b]">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Revenue */}
        <div className="rounded border border-[#1f1f1f] bg-[#111111] p-4">
          <div className="flex items-center justify-between text-[#71717a] mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Total Revenue</span>
            <CurrencyInr size={18} className="text-[#e8ff00]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#f5f5f5]">
            ₹{data ? data.totalRevenue.toLocaleString('en-IN') : '—'}
          </div>
          <span className="font-mono text-[9px] text-[#52525b] mt-1 block">
            Net settled transactions
          </span>
        </div>

        {/* Total Orders */}
        <div className="rounded border border-[#1f1f1f] bg-[#111111] p-4">
          <div className="flex items-center justify-between text-[#71717a] mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Total Orders</span>
            <Receipt size={18} className="text-[#38bdf8]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#f5f5f5]">
            {data ? data.totalOrders.toLocaleString() : '—'}
          </div>
          <span className="font-mono text-[9px] text-[#52525b] mt-1 block">
            In selected period
          </span>
        </div>

        {/* Total Customers */}
        <div className="rounded border border-[#1f1f1f] bg-[#111111] p-4">
          <div className="flex items-center justify-between text-[#71717a] mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Active Customers</span>
            <Users size={18} className="text-[#a0a0a0]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#f5f5f5]">
            {data ? data.totalCustomers.toLocaleString() : '—'}
          </div>
          <span className="font-mono text-[9px] text-[#52525b] mt-1 block">
            Registered customer accounts
          </span>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded border border-[#1f1f1f] bg-[#111111] p-4">
          <div className="flex items-center justify-between text-[#71717a] mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Low Stock SKUs</span>
            <Warning size={18} className={data && data.lowStockCount > 0 ? 'text-[#ff3b3b]' : 'text-[#22c55e]'} />
          </div>
          <div className="font-mono text-2xl font-bold text-[#f5f5f5]">
            {data ? data.lowStockCount : '—'}
          </div>
          <span className="font-mono text-[9px] text-[#52525b] mt-1 block">
            &le; 5 units remaining
          </span>
        </div>

        {/* Storefront Traffic / Page Views */}
        <div className="rounded border border-[#1f1f1f] bg-[#111111] p-4">
          <div className="flex items-center justify-between text-[#71717a] mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Page Views</span>
            <Eye size={18} className="text-[#a0a0a0]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#f5f5f5]">
            {data ? data.pageViews.toLocaleString() : '—'}
          </div>
          <span className="font-mono text-[9px] text-[#52525b] mt-1 block">
            Telemetry visits logged
          </span>
        </div>

        {/* Conversion Rate */}
        <div className="rounded border border-[#1f1f1f] bg-[#111111] p-4">
          <div className="flex items-center justify-between text-[#71717a] mb-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">Conversion Rate</span>
            <Percent size={18} className="text-[#22c55e]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#e8ff00]">
            {data ? `${data.conversionRate}%` : '—'}
          </div>
          <span className="font-mono text-[9px] text-[#52525b] mt-1 block">
            Orders per visit ratio
          </span>
        </div>
      </div>

      {/* Primary Analytics Charts Row */}
      <div id="analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-6 scroll-mt-6">
        <div className="lg:col-span-2">
          <RevenueTimelineChart data={data?.revenueByDate || []} />
        </div>
        <div>
          <OrderStatusDonutChart data={data?.orderStatusDistribution || []} />
        </div>
      </div>

      {/* Secondary Row: Top Products & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopProductsChart data={data?.topSellingProducts || []} />
        </div>

        {/* Quick Operations Module */}
        <div className="rounded border border-[#1f1f1f] bg-[#111111] p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5f5f5] mb-2">
              Fast Console Operations
            </h3>
            <p className="font-sans text-xs text-[#71717a] mb-5">
              Direct access to critical administrative tasks.
            </p>

            <div className="space-y-2.5">
              <Link
                href="/admin/products?action=new"
                className="flex items-center justify-between rounded border border-[#1f1f1f] bg-[#141414] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[#f5f5f5] hover:border-[#e8ff00]/40 hover:bg-[#181818] transition-colors active:scale-[0.97]"
              >
                <div className="flex items-center gap-2.5">
                  <Plus size={16} className="text-[#e8ff00]" />
                  <span>Publish New Product</span>
                </div>
                <ArrowRight size={14} className="text-[#71717a]" />
              </Link>

              <Link
                href="/admin/orders?status=pending"
                className="flex items-center justify-between rounded border border-[#1f1f1f] bg-[#141414] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[#f5f5f5] hover:border-[#333333] hover:bg-[#181818] transition-colors active:scale-[0.97]"
              >
                <span>Fulfill Pending Orders</span>
                <ArrowRight size={14} className="text-[#71717a]" />
              </Link>

              <Link
                href="/admin/inventory"
                className="flex items-center justify-between rounded border border-[#1f1f1f] bg-[#141414] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[#f5f5f5] hover:border-[#333333] hover:bg-[#181818] transition-colors active:scale-[0.97]"
              >
                <span>Audit Stock Thresholds</span>
                <ArrowRight size={14} className="text-[#71717a]" />
              </Link>

              <Link
                href="/admin/customers"
                className="flex items-center justify-between rounded border border-[#1f1f1f] bg-[#141414] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[#f5f5f5] hover:border-[#333333] hover:bg-[#181818] transition-colors active:scale-[0.97]"
              >
                <span>Manage Customer Accounts</span>
                <ArrowRight size={14} className="text-[#71717a]" />
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1f1f1f]">
            <span className="font-mono text-[10px] text-[#52525b] uppercase">
              XYDV Commerce Engine • v1.0.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
