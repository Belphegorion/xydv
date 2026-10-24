'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  Plus,
  PencilSimple,
  X,
  CheckCircle,
  Warning,
  Sparkle,
  Percent,
  Receipt,
  ArrowsClockwise,
  Play,
  Pause,
  Stop,
  Eye,
  CalendarBlank,
  Tag,
  ShieldCheck,
  Funnel,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { ConfirmDialog } from '../../../components/admin/ConfirmDialog';
import type {
  Discount,
  DiscountScope,
  DiscountType,
  DiscountStatus,
  DiscountPreviewResponse,
} from '@vertex/types';

interface DiscountFormData {
  name: string;
  description: string;
  scope: DiscountScope;
  targetProductIds: string[];
  targetCategories: string[];
  type: DiscountType;
  valueRupeesOrPercent: string;
  priceFloorRupees: string;
  maxDiscountCapRupees: string;
  excludedProductIds: string[];
  excludedCategories: string[];
  startDate: string;
  endDate: string;
  status: DiscountStatus;
  priority: number;
  badgeLabel: string;
  allowCouponStacking: boolean;
}

const defaultFormData: DiscountFormData = {
  name: '',
  description: '',
  scope: 'product',
  targetProductIds: [],
  targetCategories: [],
  type: 'percentage',
  valueRupeesOrPercent: '20',
  priceFloorRupees: '299', // Default ₹299 floor
  maxDiscountCapRupees: '',
  excludedProductIds: [],
  excludedCategories: [],
  startDate: new Date().toISOString().slice(0, 16),
  endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
  status: 'active',
  priority: 0,
  badgeLabel: '20% OFF',
  allowCouponStacking: false,
};

interface AvailableProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    scheduled: 0,
    paused: 0,
    ended: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | DiscountStatus>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | DiscountScope>('all');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Available catalog products for target selection
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);

  // Modal / Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DiscountFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Live 5-Product Impact Preview State
  const [previewData, setPreviewData] = useState<DiscountPreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Actions Confirmation State
  const [actionDiscount, setActionDiscount] = useState<{
    id: string;
    name: string;
    action: 'pause' | 'resume' | 'end';
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const searchInputId = useId();

  // 1. Fetch Discounts and Available Products
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [discountsRes, analyticsRes, productsRes] = await Promise.all([
        api.get<{ success: boolean; data: Discount[] }>('/admin/discounts'),
        api.get<{
          success: boolean;
          data: { total: number; active: number; scheduled: number; paused: number; ended: number };
        }>('/admin/discounts/analytics'),
        api.get<{ success: boolean; data: AvailableProduct[] }>('/admin/products?limit=100'),
      ]);

      if (discountsRes?.data) {
        setDiscounts(discountsRes.data);
      }
      if (analyticsRes?.data) {
        setStats(analyticsRes.data);
      }
      if (productsRes?.data) {
        setAvailableProducts(productsRes.data);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load promotional discounts',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Real-time 5-Product Preview Fetcher
  const updatePreview = useCallback(async (currentForm: DiscountFormData) => {
    const val = parseFloat(currentForm.valueRupeesOrPercent);
    if (isNaN(val) || val <= 0) {
      setPreviewData(null);
      return;
    }

    setIsLoadingPreview(true);
    try {
      const valuePaise =
        currentForm.type === 'percentage' ? val : Math.round(val * 100);
      const floorPaise = currentForm.priceFloorRupees
        ? Math.round(parseFloat(currentForm.priceFloorRupees) * 100)
        : 29900;
      const capPaise = currentForm.maxDiscountCapRupees
        ? Math.round(parseFloat(currentForm.maxDiscountCapRupees) * 100)
        : undefined;

      const res = await api.post<{ success: boolean; data: DiscountPreviewResponse }>(
        '/admin/discounts/preview',
        {
          scope: currentForm.scope,
          targetProductIds: currentForm.targetProductIds,
          targetCategories: currentForm.targetCategories,
          type: currentForm.type,
          value: valuePaise,
          priceFloorPaise: floorPaise,
          maxDiscountCapPaise: capPaise,
          excludedProductIds: currentForm.excludedProductIds,
          excludedCategories: currentForm.excludedCategories,
          badgeLabel: currentForm.badgeLabel || undefined,
        },
      );

      if (res?.data) {
        setPreviewData(res.data);
      }
    } catch {
      // Non-blocking preview error
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  // Debounce preview updates when form values change
  useEffect(() => {
    if (!isModalOpen) return;
    const timer = setTimeout(() => {
      updatePreview(formData);
    }, 400);
    return () => clearTimeout(timer);
  }, [formData, isModalOpen, updatePreview]);

  // 3. Batch Recompute Product Prices
  const handleRecompute = async () => {
    setIsRecomputing(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/admin/discounts/recompute', {});
      setFeedback({
        type: 'success',
        message: res?.message || 'Catalog product prices recomputed successfully',
      });
      await fetchData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Recomputation failed',
      });
    } finally {
      setIsRecomputing(false);
    }
  };

  // 4. Modal Open Handlers
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData(defaultFormData);
    setPreviewData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (discount: Discount) => {
    setIsEditing(true);
    setEditId(discount._id);

    const valDisplay =
      discount.type === 'percentage'
        ? String(discount.value)
        : (discount.value / 100).toFixed(0);

    const floorDisplay = (discount.priceFloorPaise / 100).toFixed(0);
    const capDisplay = discount.maxDiscountCapPaise
      ? (discount.maxDiscountCapPaise / 100).toFixed(0)
      : '';

    setFormData({
      name: discount.name,
      description: discount.description || '',
      scope: discount.scope,
      targetProductIds: (discount.targetProductIds || []).map(String),
      targetCategories: discount.targetCategories || [],
      type: discount.type,
      valueRupeesOrPercent: valDisplay,
      priceFloorRupees: floorDisplay,
      maxDiscountCapRupees: capDisplay,
      excludedProductIds: (discount.excludedProductIds || []).map(String),
      excludedCategories: discount.excludedCategories || [],
      startDate: new Date(discount.startDate).toISOString().slice(0, 16),
      endDate: discount.endDate
        ? new Date(discount.endDate).toISOString().slice(0, 16)
        : '',
      status: discount.status,
      priority: discount.priority || 0,
      badgeLabel: discount.badgeLabel || '',
      allowCouponStacking: discount.allowCouponStacking ?? false,
    });
    setPreviewData(null);
    setIsModalOpen(true);
  };

  // 5. Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const val = parseFloat(formData.valueRupeesOrPercent);
      if (isNaN(val) || val <= 0) {
        throw new Error('Please enter a valid discount value greater than 0');
      }

      if (formData.type === 'percentage' && val > 70) {
        throw new Error('Percentage discounts cannot exceed 70% to protect store margins');
      }

      const valuePaise =
        formData.type === 'percentage' ? val : Math.round(val * 100);
      const floorPaise = formData.priceFloorRupees
        ? Math.round(parseFloat(formData.priceFloorRupees) * 100)
        : 29900;
      const capPaise = formData.maxDiscountCapRupees
        ? Math.round(parseFloat(formData.maxDiscountCapRupees) * 100)
        : undefined;

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        scope: formData.scope,
        targetProductIds:
          formData.scope === 'product' ? formData.targetProductIds : [],
        targetCategories:
          formData.scope === 'category' ? formData.targetCategories : [],
        type: formData.type,
        value: valuePaise,
        priceFloorPaise: floorPaise,
        maxDiscountCapPaise: capPaise,
        excludedProductIds: formData.excludedProductIds,
        excludedCategories: formData.excludedCategories,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        status: formData.status,
        priority: formData.priority,
        badgeLabel: formData.badgeLabel.trim() || undefined,
        allowCouponStacking: formData.allowCouponStacking,
      };

      if (isEditing && editId) {
        await api.patch(`/admin/discounts/${editId}`, payload);
        setFeedback({ type: 'success', message: 'Discount updated successfully' });
      } else {
        await api.post('/admin/discounts', payload);
        setFeedback({ type: 'success', message: 'Discount created successfully' });
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save discount',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 6. Action Handlers (Pause, Resume, End)
  const handleExecuteAction = async () => {
    if (!actionDiscount) return;
    setIsProcessingAction(true);
    try {
      if (actionDiscount.action === 'pause' || actionDiscount.action === 'resume') {
        await api.post(`/admin/discounts/${actionDiscount.id}/pause`, {});
        setFeedback({
          type: 'success',
          message: `Discount ${actionDiscount.action === 'pause' ? 'paused' : 'resumed'} successfully`,
        });
      } else if (actionDiscount.action === 'end') {
        await api.post(`/admin/discounts/${actionDiscount.id}/end`, {});
        setFeedback({ type: 'success', message: 'Discount ended permanently' });
      }
      setActionDiscount(null);
      await fetchData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Action failed',
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  // 7. Filtered Discounts
  const filteredDiscounts = discounts.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (scopeFilter !== 'all' && d.scope !== scopeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = d.name.toLowerCase().includes(q);
      const matchBadge = d.badgeLabel?.toLowerCase().includes(q);
      if (!matchName && !matchBadge) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Discounts & Promotional Pricing
            </h1>
            <span className="rounded bg-[var(--surface-hover)] px-2 py-0.5 text-xs font-mono text-[var(--text-secondary)] border border-[var(--border)]">
              Amazon & Flipkart Pattern
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Configure catalog, category, and product discounts with statutory MRP protection, price floors, and live impact previews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRecompute}
            disabled={isRecomputing}
            className="flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] disabled:opacity-50"
            title="Force immediate recalculation of all product effective prices"
          >
            <ArrowsClockwise className={`h-4 w-4 ${isRecomputing ? 'animate-spin text-[var(--accent)]' : ''}`} />
            <span>Recompute Prices</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--accent-foreground)] transition hover:opacity-90 shadow-sm"
          >
            <Plus className="h-4 w-4" weight="bold" />
            <span>Create Discount</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Toast */}
      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between rounded border p-4 ${
            feedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <Warning className="h-5 w-5 shrink-0" />
            )}
            <p className="text-sm font-medium">{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[var(--text-muted)]">Active Promos</span>
            <div className="rounded-full bg-emerald-500/10 p-1.5 text-emerald-400">
              <Play className="h-4 w-4" weight="fill" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {stats.active}
          </p>
          <span className="text-[11px] text-[var(--text-secondary)]">Live on storefront</span>
        </div>

        <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[var(--text-muted)]">Scheduled</span>
            <div className="rounded-full bg-amber-500/10 p-1.5 text-amber-400">
              <CalendarBlank className="h-4 w-4" weight="bold" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {stats.scheduled}
          </p>
          <span className="text-[11px] text-[var(--text-secondary)]">Upcoming launch dates</span>
        </div>

        <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[var(--text-muted)]">Paused</span>
            <div className="rounded-full bg-zinc-500/10 p-1.5 text-zinc-400">
              <Pause className="h-4 w-4" weight="fill" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {stats.paused}
          </p>
          <span className="text-[11px] text-[var(--text-secondary)]">Temporarily suppressed</span>
        </div>

        <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[var(--text-muted)]">Total Promos</span>
            <div className="rounded-full bg-[var(--accent)]/10 p-1.5 text-[var(--accent)]">
              <Percent className="h-4 w-4" weight="bold" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {stats.total}
          </p>
          <span className="text-[11px] text-[var(--text-secondary)]">All-time promotional rules</span>
        </div>
      </div>

      {/* Controls: Status Tabs, Scope Filter, Search */}
      <div className="flex flex-col gap-3 rounded border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          {(['all', 'active', 'scheduled', 'paused', 'ended'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                statusFilter === tab
                  ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Scope Filter & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Funnel className="h-4 w-4 text-[var(--text-muted)]" />
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as 'all' | DiscountScope)}
              className="rounded border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
              aria-label="Filter by Scope"
            >
              <option value="all">All Scopes</option>
              <option value="product">Product Scope</option>
              <option value="category">Category Scope</option>
              <option value="catalog">Catalog Scope</option>
            </select>
          </div>

          <div className="relative">
            <label htmlFor={searchInputId} className="sr-only">
              Search discounts
            </label>
            <input
              id={searchInputId}
              type="text"
              placeholder="Search by name or badge..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Discounts Table */}
      <div className="overflow-hidden rounded border border-[var(--border)] bg-[var(--surface)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text-secondary)] uppercase font-mono tracking-wider">
              <tr>
                <th className="px-4 py-3">Discount & Badge</th>
                <th className="px-4 py-3">Scope & Target</th>
                <th className="px-4 py-3">Type & Value</th>
                <th className="px-4 py-3">Safeguards</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                    <ArrowsClockwise className="mx-auto mb-2 h-6 w-6 animate-spin text-[var(--accent)]" />
                    Loading promotional discounts...
                  </td>
                </tr>
              ) : filteredDiscounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                    No discounts match your current filters.
                  </td>
                </tr>
              ) : (
                filteredDiscounts.map((discount) => {
                  const isPercentage = discount.type === 'percentage';
                  const displayValue = isPercentage
                    ? `${discount.value}% OFF`
                    : discount.type === 'fixed_amount'
                      ? `Flat ₹${(discount.value / 100).toFixed(0)} OFF`
                      : `Set to ₹${(discount.value / 100).toFixed(0)}`;

                  const targetSummary =
                    discount.scope === 'catalog'
                      ? 'Entire Catalog'
                      : discount.scope === 'category'
                        ? `Categories: ${(discount.targetCategories || []).join(', ')}`
                        : `${(discount.targetProductIds || []).length} Products`;

                  const isLiveActive =
                    discount.status === 'active' &&
                    new Date(discount.startDate) <= new Date() &&
                    (!discount.endDate || new Date(discount.endDate) >= new Date());

                  return (
                    <tr key={discount._id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      {/* Name & Badge */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-[var(--text-primary)]">{discount.name}</div>
                        {discount.badgeLabel ? (
                          <span className="mt-1 inline-block rounded bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-mono font-bold text-[var(--accent)] border border-[var(--accent)]/30">
                            {discount.badgeLabel}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--text-muted)]">No custom badge</span>
                        )}
                      </td>

                      {/* Scope & Target */}
                      <td className="px-4 py-3.5">
                        <span className="capitalize font-medium text-[var(--text-primary)]">
                          {discount.scope}
                        </span>
                        <div className="text-[11px] text-[var(--text-muted)] truncate max-w-[200px]" title={targetSummary}>
                          {targetSummary}
                        </div>
                      </td>

                      {/* Type & Value */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-emerald-400">{displayValue}</div>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase">{discount.type.replace('_', ' ')}</div>
                      </td>

                      {/* Safeguards */}
                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        <div>Floor: ₹{(discount.priceFloorPaise / 100).toFixed(0)}</div>
                        {discount.maxDiscountCapPaise ? (
                          <div className="text-amber-400">Cap: ₹{(discount.maxDiscountCapPaise / 100).toFixed(0)}</div>
                        ) : (
                          <div className="text-[var(--text-muted)]">No cap</div>
                        )}
                      </td>

                      {/* Schedule */}
                      <td className="px-4 py-3.5 text-[11px] text-[var(--text-secondary)]">
                        <div>From: {new Date(discount.startDate).toLocaleDateString()}</div>
                        <div>
                          To:{' '}
                          {discount.endDate
                            ? new Date(discount.endDate).toLocaleDateString()
                            : 'No expiry'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            isLiveActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : discount.status === 'scheduled'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : discount.status === 'paused'
                                  ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isLiveActive
                                ? 'bg-emerald-400'
                                : discount.status === 'scheduled'
                                  ? 'bg-amber-400'
                                  : discount.status === 'paused'
                                    ? 'bg-zinc-400'
                                    : 'bg-rose-400'
                            }`}
                          />
                          {discount.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {discount.status !== 'ended' && (
                            <button
                              type="button"
                              onClick={() =>
                                setActionDiscount({
                                  id: discount._id,
                                  name: discount.name,
                                  action: discount.status === 'paused' ? 'resume' : 'pause',
                                })
                              }
                              className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition"
                              title={discount.status === 'paused' ? 'Resume Promotion' : 'Pause Promotion'}
                              aria-label={discount.status === 'paused' ? 'Resume Promotion' : 'Pause Promotion'}
                            >
                              {discount.status === 'paused' ? (
                                <Play className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <Pause className="h-4 w-4 text-zinc-400" />
                              )}
                            </button>
                          )}

                          {discount.status !== 'ended' && (
                            <button
                              type="button"
                              onClick={() =>
                                setActionDiscount({
                                  id: discount._id,
                                  name: discount.name,
                                  action: 'end',
                                })
                              }
                              className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-rose-400 transition"
                              title="End Promotion Permanently"
                              aria-label="End Promotion Permanently"
                            >
                              <Stop className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(discount)}
                            className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition"
                            title="Edit Discount"
                            aria-label="Edit Discount"
                          >
                            <PencilSimple className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Drawer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-8 w-full max-w-3xl rounded border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {isEditing ? 'Edit Promotional Discount' : 'Create Promotional Discount'}
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Promotional discounts apply authoritatively on the server in integer paise.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* Promotion Name & Description */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Promotion Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Monsoon Tactical Drop 20%"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 20% OFF or LIMITED DROP"
                    value={formData.badgeLabel}
                    onChange={(e) => setFormData({ ...formData, badgeLabel: e.target.value })}
                    className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Appears directly on product cards and PDP.
                  </span>
                </div>
              </div>

              {/* Scope Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Discount Scope *
                </label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {[
                    { id: 'product', label: 'Single Product', desc: 'Applies to specific products' },
                    { id: 'category', label: 'Category', desc: 'Applies to an entire category' },
                    { id: 'catalog', label: 'Catalog-Wide', desc: 'Applies to all products' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          scope: s.id as DiscountScope,
                        })
                      }
                      className={`flex flex-col items-start rounded border p-3 text-left transition ${
                        formData.scope === s.id
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)]'
                          : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                      }`}
                    >
                      <span className="text-xs font-bold text-[var(--text-primary)]">{s.label}</span>
                      <span className="mt-1 text-[10px] text-[var(--text-muted)]">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Categories (If Scope === Category) */}
              {formData.scope === 'category' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Select Target Categories *
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['tops', 'bottoms', 'outerwear', 'accessories'].map((cat) => {
                      const isSelected = formData.targetCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            const next = isSelected
                              ? formData.targetCategories.filter((c) => c !== cat)
                              : [...formData.targetCategories, cat];
                            setFormData({ ...formData, targetCategories: next });
                          }}
                          className={`rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border transition ${
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]'
                              : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Target Products (If Scope === Product) */}
              {formData.scope === 'product' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Select Target Products *
                  </label>
                  <div className="mt-2 max-h-48 overflow-y-auto rounded border border-[var(--border)] bg-[var(--bg)] p-2 space-y-1">
                    {availableProducts.map((p) => {
                      const isSelected = formData.targetProductIds.includes(p._id);
                      return (
                        <label
                          key={p._id}
                          className="flex items-center justify-between rounded p-2 hover:bg-[var(--surface-hover)] cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const next = isSelected
                                  ? formData.targetProductIds.filter((id) => id !== p._id)
                                  : [...formData.targetProductIds, p._id];
                                setFormData({ ...formData, targetProductIds: next });
                              }}
                              className="rounded border-[var(--border)] text-[var(--accent)]"
                            />
                            <span className="font-medium text-[var(--text-primary)]">{p.name}</span>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase">
                              ({p.category})
                            </span>
                          </div>
                          <span className="font-mono text-[var(--text-secondary)]">₹{p.price}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Discount Type *
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      { id: 'percentage', label: 'Percent %' },
                      { id: 'fixed_amount', label: 'Flat ₹ Off' },
                      { id: 'set_price', label: 'Set Price ₹' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            type: t.id as DiscountType,
                          })
                        }
                        className={`rounded border py-2 text-center text-xs font-semibold transition ${
                          formData.type === t.id
                            ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]'
                            : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    {formData.type === 'percentage'
                      ? 'Discount Percentage (Max 70%) *'
                      : formData.type === 'fixed_amount'
                        ? 'Flat Discount Amount (₹) *'
                        : 'Fixed Target Price (₹) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={formData.type === 'percentage' ? 70 : undefined}
                    value={formData.valueRupeesOrPercent}
                    onChange={(e) =>
                      setFormData({ ...formData, valueRupeesOrPercent: e.target.value })
                    }
                    className="mt-2 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                  {formData.type === 'percentage' && (
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Statutory margin safeguard: capped at 70%.
                    </span>
                  )}
                </div>
              </div>

              {/* Margin Protection: Floor & Per-Item Cap */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Price Floor (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.priceFloorRupees}
                    onChange={(e) =>
                      setFormData({ ...formData, priceFloorRupees: e.target.value })
                    }
                    className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Store default ₹299. No item can sell below this price.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Per-Item Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional (e.g. ₹2000)"
                    value={formData.maxDiscountCapRupees}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDiscountCapRupees: e.target.value })
                    }
                    className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Caps maximum deduction per item on high-ticket goods.
                  </span>
                </div>
              </div>

              {/* Date Schedule */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    End Date & Time {formData.scope === 'catalog' ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="datetime-local"
                    required={formData.scope === 'catalog'}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  />
                  {formData.scope === 'catalog' && (
                    <span className="text-[10px] text-amber-400">
                      Catalog-wide discounts require an end date to prevent permanent sales.
                    </span>
                  )}
                </div>
              </div>

              {/* Coupon Stacking Policy */}
              <div className="rounded border border-[var(--border)] bg-[var(--bg)] p-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowCouponStacking}
                    onChange={(e) =>
                      setFormData({ ...formData, allowCouponStacking: e.target.checked })
                    }
                    className="rounded border-[var(--border)] text-[var(--accent)]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      Allow Coupon Stacking with this Promotion
                    </span>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      When disabled (recommended), checkout coupons cannot be combined with this discount.
                    </p>
                  </div>
                </label>
              </div>

              {/* Live 5-Product Price Impact Preview */}
              <div className="rounded border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-[var(--accent)]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      Live Storefront Price Impact Preview (5 Sample Products)
                    </span>
                  </div>
                  {isLoadingPreview && (
                    <span className="text-[10px] text-[var(--text-muted)] animate-pulse">
                      Updating preview...
                    </span>
                  )}
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="text-[var(--text-muted)] uppercase font-mono">
                      <tr>
                        <th className="py-1">Product</th>
                        <th className="py-1">MRP</th>
                        <th className="py-1">Regular</th>
                        <th className="py-1">Discounted</th>
                        <th className="py-1">Customer Saving</th>
                        <th className="py-1">Storefront Badge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
                      {previewData?.sampleProducts && previewData.sampleProducts.length > 0 ? (
                        previewData.sampleProducts.map((item) => (
                          <tr key={item.productId} className="py-1.5">
                            <td className="py-1.5 font-medium">{item.productName}</td>
                            <td className="py-1.5 line-through text-[var(--text-muted)]">
                              ₹{item.mrp}
                            </td>
                            <td className="py-1.5 text-[var(--text-secondary)]">
                              ₹{item.regularPrice}
                            </td>
                            <td className="py-1.5 font-bold font-mono text-emerald-400">
                              ₹{item.discountedPrice}
                            </td>
                            <td className="py-1.5 text-amber-400">
                              Save ₹{item.discountAmount} ({item.discountPercent}%)
                            </td>
                            <td className="py-1.5">
                              {item.badgeLabel ? (
                                <span className="rounded bg-[var(--accent)]/15 px-1.5 py-0.5 text-[9px] font-mono font-bold text-[var(--accent)] border border-[var(--accent)]/30">
                                  {item.badgeLabel}
                                </span>
                              ) : (
                                <span className="text-[var(--text-muted)]">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-[var(--text-muted)]">
                            Select products or categories above to see live price preview.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded bg-[var(--accent)] px-5 py-2 text-xs font-bold text-[var(--accent-foreground)] transition hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? 'Saving Promotion...' : isEditing ? 'Save Changes' : 'Create Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(actionDiscount)}
        title={
          actionDiscount?.action === 'pause'
            ? 'Pause Promotional Discount'
            : actionDiscount?.action === 'resume'
              ? 'Resume Promotional Discount'
              : 'End Promotional Discount Permanently'
        }
        description={
          actionDiscount?.action === 'pause'
            ? `Are you sure you want to pause "${actionDiscount?.name}"? Product prices will immediately revert to their regular selling price.`
            : actionDiscount?.action === 'resume'
              ? `Are you sure you want to resume "${actionDiscount?.name}"? Discounted prices will immediately apply on the storefront.`
              : `Are you sure you want to end "${actionDiscount?.name}"? This promotion will be marked as ended and cannot be re-activated.`
        }
        confirmText={
          actionDiscount?.action === 'pause'
            ? 'Pause Promotion'
            : actionDiscount?.action === 'resume'
              ? 'Resume Promotion'
              : 'End Promotion'
        }
        isDestructive={actionDiscount?.action === 'end'}
        isLoading={isProcessingAction}
        onConfirm={handleExecuteAction}
        onCancel={() => setActionDiscount(null)}
      />
    </div>
  );
}
