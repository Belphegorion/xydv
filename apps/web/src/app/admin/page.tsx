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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load system analytics';
      setError(msg);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-mono text-xl font-bold tracking-wider text-[var(--text-primary)] uppercase sm:text-2xl">
            Commerce Analytics & Telemetry
          </h2>
          <p className="mt-0.5 font-mono text-xs text-[var(--text-muted)]">
            Real-time financial performance, inventory health, and conversion metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector Tabs */}
          <div className="inline-flex rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-1 font-mono text-xs">
            {(['7d', '30d', 'all'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`btn-tactile rounded-none px-3 py-1.5 tracking-wider uppercase transition-colors active:scale-[0.97] ${
                  period === p
                    ? 'bg-[var(--text-primary)] font-bold text-[var(--bg)] shadow-sm dark:bg-[#e8ff00] dark:text-[#0a0a0a]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
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
            className="btn-tactile flex h-9 w-9 items-center justify-center rounded-none border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] active:scale-[0.97]"
            aria-label="Refresh analytics data"
          >
            <ArrowClockwise size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Low-stock Warning Banner */}
      {data && data.lowStockCount > 0 && (
        <div className="flex items-center justify-between rounded-none border border-[#ff3b3b]/30 bg-[#ff3b3b]/10 p-4 text-[#ff3b3b]">
          <div className="flex items-center gap-3">
            <Warning size={20} weight="bold" />
            <div>
              <p className="font-mono text-xs font-bold tracking-wider uppercase">
                Critical Inventory Alert
              </p>
              <p className="mt-0.5 font-sans text-xs text-[#ff3b3b]/80">
                {data.lowStockCount} product variants are currently below the safety threshold (5
                units).
              </p>
            </div>
          </div>
          <Link
            href="/admin/inventory?lowStock=true"
            className="btn-tactile inline-flex items-center gap-1.5 rounded-none border border-[#ff3b3b]/40 bg-[#ff3b3b]/20 px-3 py-1.5 font-mono text-xs font-bold tracking-wider text-white uppercase transition-colors hover:bg-[#ff3b3b] active:scale-[0.97]"
          >
            <span>Resolve</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {error && (
        <div className="rounded-none border border-[#ff3b3b]/30 bg-[#ff3b3b]/10 p-4 font-mono text-xs text-[#ff3b3b]">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total Revenue */}
        <div className="rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm sm:p-5">
          <div className="mb-2 flex items-center justify-between text-[var(--text-muted)]">
            <span className="font-mono text-[10px] tracking-wider uppercase">Total Revenue</span>
            <CurrencyInr size={18} className="text-[#15803d] dark:text-[#e8ff00]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--text-primary)]">
            ₹{data ? data.totalRevenue.toLocaleString('en-IN') : '—'}
          </div>
          <span className="mt-1 block font-mono text-[9px] text-[var(--text-muted)]">
            Net settled transactions
          </span>
        </div>

        {/* Total Orders */}
        <div className="rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm sm:p-5">
          <div className="mb-2 flex items-center justify-between text-[var(--text-muted)]">
            <span className="font-mono text-[10px] tracking-wider uppercase">Total Orders</span>
            <Receipt size={18} className="text-[#0284c7] dark:text-[#38bdf8]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--text-primary)]">
            {data ? data.totalOrders.toLocaleString() : '—'}
          </div>
          <span className="mt-1 block font-mono text-[9px] text-[var(--text-muted)]">
            In selected period
          </span>
        </div>

        {/* Total Customers */}
        <div className="rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm sm:p-5">
          <div className="mb-2 flex items-center justify-between text-[var(--text-muted)]">
            <span className="font-mono text-[10px] tracking-wider uppercase">Active Customers</span>
            <Users size={18} className="text-[var(--text-secondary)]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--text-primary)]">
            {data ? data.totalCustomers.toLocaleString() : '—'}
          </div>
          <span className="mt-1 block font-mono text-[9px] text-[var(--text-muted)]">
            Registered customer accounts
          </span>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm sm:p-5">
          <div className="mb-2 flex items-center justify-between text-[var(--text-muted)]">
            <span className="font-mono text-[10px] tracking-wider uppercase">Low Stock SKUs</span>
            <Warning
              size={18}
              className={
                data && data.lowStockCount > 0
                  ? 'text-[#ff3b3b]'
                  : 'text-[#15803d] dark:text-[#22c55e]'
              }
            />
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--text-primary)]">
            {data ? data.lowStockCount : '—'}
          </div>
          <span className="mt-1 block font-mono text-[9px] text-[var(--text-muted)]">
            &le; 5 units remaining
          </span>
        </div>

        {/* Storefront Traffic / Page Views */}
        <div className="rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm sm:p-5">
          <div className="mb-2 flex items-center justify-between text-[var(--text-muted)]">
            <span className="font-mono text-[10px] tracking-wider uppercase">Page Views</span>
            <Eye size={18} className="text-[var(--text-secondary)]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--text-primary)]">
            {data ? data.pageViews.toLocaleString() : '—'}
          </div>
          <span className="mt-1 block font-mono text-[9px] text-[var(--text-muted)]">
            Telemetry visits logged
          </span>
        </div>

        {/* Conversion Rate */}
        <div className="rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm sm:p-5">
          <div className="mb-2 flex items-center justify-between text-[var(--text-muted)]">
            <span className="font-mono text-[10px] tracking-wider uppercase">Conversion Rate</span>
            <Percent size={18} className="text-[#15803d] dark:text-[#22c55e]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--text-primary)] dark:text-[#e8ff00]">
            {data ? `${data.conversionRate}%` : '—'}
          </div>
          <span className="mt-1 block font-mono text-[9px] text-[var(--text-muted)]">
            Orders per visit ratio
          </span>
        </div>
      </div>

      {/* Primary Analytics Charts Row */}
      <div id="analytics" className="grid scroll-mt-6 grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueTimelineChart data={data?.revenueByDate || []} />
        </div>
        <div>
          <OrderStatusDonutChart data={data?.orderStatusDistribution || []} />
        </div>
      </div>

      {/* Secondary Row: Top Products & Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopProductsChart data={data?.topSellingProducts || []} />
        </div>

        {/* Quick Operations Module */}
        <div className="flex flex-col justify-between rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <div>
            <h3 className="mb-2 font-mono text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
              Fast Console Operations
            </h3>
            <p className="mb-5 font-sans text-xs text-[var(--text-muted)]">
              Direct access to critical administrative tasks.
            </p>

            <div className="space-y-2.5">
              <Link
                href="/admin/products?action=new"
                className="btn-tactile flex items-center justify-between rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] active:scale-[0.97] dark:hover:border-[#e8ff00]/40"
              >
                <div className="flex items-center gap-2.5">
                  <Plus size={16} className="text-[var(--text-primary)] dark:text-[#e8ff00]" />
                  <span>Publish New Product</span>
                </div>
                <ArrowRight size={14} className="text-[var(--text-muted)]" />
              </Link>

              <Link
                href="/admin/orders?status=pending"
                className="btn-tactile flex items-center justify-between rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] active:scale-[0.97]"
              >
                <span>Fulfill Pending Orders</span>
                <ArrowRight size={14} className="text-[var(--text-muted)]" />
              </Link>

              <Link
                href="/admin/inventory"
                className="btn-tactile flex items-center justify-between rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] active:scale-[0.97]"
              >
                <span>Audit Stock Thresholds</span>
                <ArrowRight size={14} className="text-[var(--text-muted)]" />
              </Link>

              <Link
                href="/admin/customers"
                className="btn-tactile flex items-center justify-between rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] active:scale-[0.97]"
              >
                <span>Manage Customer Accounts</span>
                <ArrowRight size={14} className="text-[var(--text-muted)]" />
              </Link>
            </div>
          </div>

          <div className="mt-6 border-t border-[var(--border)] pt-4">
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase">
              XYDV Commerce Engine • v1.0.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
