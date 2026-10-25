'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  Plus,
  PencilSimple,
  Trash,
  X,
  CheckCircle,
  Warning,
  Sparkle,
  Ticket,
  Receipt,
  Users,
  Percent,
  CurrencyInr,
  ShieldWarning,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { ConfirmDialog } from '../../../components/admin/ConfirmDialog';
import type {
  ICoupon,
  CouponDiscountType,
  CouponPresetTier,
  CouponStatus,
} from '@vertex/types';

interface CouponFormData {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  presetTier: CouponPresetTier;
  maxDiscountCapRupees: string; // Stored in rupees in form, converted to paise on save
  minOrderAmountRupees: string; // Stored in rupees in form, converted to paise on save
  excludeSaleItems: boolean;
  startDate: string;
  endDate: string;
  maxRedemptions: number;
  maxRedemptionsPerUser: number;
  status: CouponStatus;
}

const defaultFormData: CouponFormData = {
  code: '',
  discountType: 'percentage',
  discountValue: 20,
  presetTier: '20',
  maxDiscountCapRupees: '',
  minOrderAmountRupees: '0',
  excludeSaleItems: false,
  startDate: new Date().toISOString().slice(0, 16),
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
  maxRedemptions: 100,
  maxRedemptionsPerUser: 1,
  status: 'active',
};

interface RedemptionRecord {
  _id: string;
  couponCode: string;
  orderId?: { _id: string; total: number; status: string; paymentStatus: string };
  userId?: { _id: string; name: string; email: string };
  guestEmail?: string;
  discountAmount: number; // in paise
  status: string;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [stats, setStats] = useState({
    totalActive: 0,
    totalRedemptions: 0,
    totalDiscountIssuedRupees: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState<'all' | '10' | '20' | '50' | 'custom'>('all');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [couponToDelete, setCouponToDelete] = useState<{ id: string; code: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redemptions Drawer State
  const [viewingRedemptionsCoupon, setViewingRedemptionsCoupon] = useState<ICoupon | null>(null);
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [isLoadingRedemptions, setIsLoadingRedemptions] = useState(false);

  const searchInputId = useId();
  const discountValueInputId = useId();
  const maxDiscountCapInputId = useId();
  const minOrderAmountInputId = useId();
  const maxRedemptionsInputId = useId();
  const maxRedemptionsPerUserInputId = useId();
  const startDateInputId = useId();
  const endDateInputId = useId();
  const excludeSaleItemsCheckboxId = useId();

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams: Record<string, string | number> = {};
      if (tierFilter !== 'all') queryParams.tier = tierFilter;
      if (search.trim()) queryParams.search = search.trim();

      const res = await api.get<{
        data: ICoupon[];
        stats: { totalActive: number; totalRedemptions: number; totalDiscountIssuedRupees: number };
      }>('/admin/coupons', {
        params: queryParams,
      });

      setCoupons(res.data);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch coupons';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [tierFilter, search]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleGenerateCode = async () => {
    try {
      const res = await api.get<{ data: { code: string } }>('/admin/coupons/generate-code');
      if (res.data?.code) {
        setFormData((prev) => ({ ...prev, code: res.data.code }));
      }
    } catch {
      // Client-side fallback
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      setFormData((prev) => ({ ...prev, code: `XYDV-${rand}` }));
    }
  };

  const handleSelectTier = (tier: CouponPresetTier, fixedRupees = false) => {
    if (fixedRupees) {
      setFormData((prev) => ({
        ...prev,
        presetTier: 'custom',
        discountType: 'fixed',
        discountValue: prev.discountType === 'fixed' ? prev.discountValue : 500,
      }));
      return;
    }

    if (tier === '50') {
      setFormData((prev) => ({
        ...prev,
        presetTier: '50',
        discountType: 'percentage',
        discountValue: 50,
        excludeSaleItems: true, // Auto-check for margin safety (Decision A4)
        maxDiscountCapRupees: prev.maxDiscountCapRupees || '1500', // Pre-fill sensible cap
      }));
    } else if (tier === '20') {
      setFormData((prev) => ({
        ...prev,
        presetTier: '20',
        discountType: 'percentage',
        discountValue: 20,
      }));
    } else if (tier === '10') {
      setFormData((prev) => ({
        ...prev,
        presetTier: '10',
        discountType: 'percentage',
        discountValue: 10,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        presetTier: 'custom',
        discountType: 'percentage',
        discountValue: 15,
      }));
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({
      ...defaultFormData,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon: ICoupon) => {
    setIsEditing(true);
    setEditId(coupon._id);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue:
        coupon.discountType === 'fixed'
          ? Math.round(coupon.discountValue / 100)
          : coupon.discountValue,
      presetTier: coupon.presetTier || 'custom',
      maxDiscountCapRupees: coupon.maxDiscountAmount
        ? String(Math.round(coupon.maxDiscountAmount / 100))
        : '',
      minOrderAmountRupees: coupon.minOrderAmount
        ? String(Math.round(coupon.minOrderAmount / 100))
        : '0',
      excludeSaleItems: coupon.excludeSaleItems,
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 16) : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().slice(0, 16) : '',
      maxRedemptions: coupon.maxRedemptions,
      maxRedemptionsPerUser: coupon.maxRedemptionsPerUser,
      status: coupon.status,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: CouponStatus) => {
    const nextStatus: CouponStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/admin/coupons/${id}`, { status: nextStatus });
      setCoupons((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: nextStatus } : c)),
      );
      setFeedback({
        type: 'success',
        message: `Coupon status updated to ${nextStatus}.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      setFeedback({ type: 'error', message: msg });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!formData.code.trim()) {
      setFeedback({ type: 'error', message: 'Coupon code is required' });
      return;
    }

    // Stakeholder Decision A2 validation: 50% discount strictly mandates a max discount cap
    if (formData.discountType === 'percentage' && formData.discountValue === 50) {
      const capNum = parseFloat(formData.maxDiscountCapRupees);
      if (!capNum || capNum <= 0) {
        setFeedback({
          type: 'error',
          message:
            'A Maximum Discount Cap (in ₹) is mandatory for 50% coupons to protect profit margins.',
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      const capPaise = formData.maxDiscountCapRupees
        ? Math.round(parseFloat(formData.maxDiscountCapRupees) * 100)
        : undefined;
      const minOrderPaise = formData.minOrderAmountRupees
        ? Math.round(parseFloat(formData.minOrderAmountRupees) * 100)
        : 0;

      const discountValPayload =
        formData.discountType === 'fixed'
          ? Math.round(Number(formData.discountValue) * 100) // Convert fixed rupees to paise
          : Number(formData.discountValue);

      const payload = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: discountValPayload,
        presetTier: formData.presetTier,
        maxDiscountAmount: capPaise,
        minOrderAmount: minOrderPaise,
        excludeSaleItems: formData.excludeSaleItems,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        maxRedemptions: Number(formData.maxRedemptions),
        maxRedemptionsPerUser: Number(formData.maxRedemptionsPerUser),
        status: formData.status,
      };

      if (isEditing && editId) {
        await api.patch(`/admin/coupons/${editId}`, payload);
        setFeedback({ type: 'success', message: `Coupon "${formData.code}" updated.` });
      } else {
        await api.post('/admin/coupons', payload);
        setFeedback({ type: 'success', message: `Coupon "${formData.code}" created.` });
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save coupon';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!couponToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/coupons/${couponToDelete.id}`);
      setFeedback({ type: 'success', message: `Coupon removed or deactivated.` });
      setCouponToDelete(null);
      fetchCoupons();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete coupon';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenRedemptions = async (coupon: ICoupon) => {
    setViewingRedemptionsCoupon(coupon);
    setIsLoadingRedemptions(true);
    try {
      const res = await api.get<{ data: RedemptionRecord[] }>(
        `/admin/coupons/${coupon._id}/redemptions`,
      );
      setRedemptions(res.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch redemptions';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoadingRedemptions(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold tracking-widest text-[var(--text-primary)] dark:text-[#e8ff00] uppercase">
              PROMOTIONS & DISCOUNTS
            </span>
            <span className="text-xs text-[var(--text-muted)]">•</span>
            <span className="font-mono text-xs text-[var(--text-muted)] uppercase">
              PRESET TIERS & MARGIN PROTECTION
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Preset-Tier Coupon Management
          </h1>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Enforce preset discounts (10%, 20%, 50%), mandatory margin safety caps, and zero-race atomic redemptions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-tactile flex items-center justify-center gap-2 rounded-none bg-[var(--text-primary)] px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase transition-all duration-150 active:scale-[0.97] dark:bg-[#e8ff00] dark:text-black"
        >
          <Plus size={16} weight="bold" />
          <span>New Coupon</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="font-mono text-[11px] tracking-wider uppercase">Active Campaigns</span>
            <Ticket size={18} className="text-[var(--text-primary)] dark:text-[#e8ff00]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {stats.totalActive}
          </p>
          <span className="font-mono text-[10px] text-[var(--text-muted)]">LIVE ON STOREFRONT</span>
        </div>

        <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="font-mono text-[11px] tracking-wider uppercase">Total Redemptions</span>
            <Receipt size={18} className="text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {stats.totalRedemptions}
          </p>
          <span className="font-mono text-[10px] text-[var(--text-muted)]">ORDERS PLACED</span>
        </div>

        <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="font-mono text-[11px] tracking-wider uppercase">Discount Value Issued</span>
            <CurrencyInr size={18} className="text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            ₹{stats.totalDiscountIssuedRupees.toLocaleString()}
          </p>
          <span className="font-mono text-[10px] text-[var(--text-muted)]">AUTHORITATIVE GST DEDUCTION</span>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          role="alert"
          className={`flex items-center justify-between border px-4 py-3 font-mono text-xs transition-all ${
            feedback.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-[#ff3b3b]/40 bg-[#ff3b3b]/10 text-[#ff3b3b]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle size={16} weight="fill" />
            ) : (
              <Warning size={16} weight="fill" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-75"
            aria-label="Dismiss message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tier Filter Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 border-b border-[var(--border)] sm:border-b-0">
          {(['all', '10', '20', '50', 'custom'] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setTierFilter(tier)}
              className={`px-3 py-1.5 font-mono text-xs tracking-wider uppercase transition-colors ${
                tierFilter === tier
                  ? 'border-b-2 border-[#e8ff00] font-bold text-[var(--text-primary)] dark:text-[#e8ff00]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tier === 'all' ? 'All Tiers' : tier === 'custom' ? 'Custom' : `${tier}% OFF`}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor={searchInputId} className="sr-only">Search promo codes</label>
          <input
            id={searchInputId}
            type="text"
            placeholder="SEARCH PROMO CODES..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 font-mono text-xs tracking-wider text-[var(--text-primary)] placeholder-[var(--text-muted)] sm:w-64"
          />
        </div>
      </div>

      {/* Coupons Table */}
      <div className="overflow-x-auto border border-[var(--border)] bg-[var(--bg-surface)]">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase">
              <th className="px-4 py-3 tracking-wider">Coupon Code</th>
              <th className="px-4 py-3 tracking-wider">Tier / Value</th>
              <th className="px-4 py-3 tracking-wider">Usage Progress</th>
              <th className="px-4 py-3 tracking-wider">Margin Cap</th>
              <th className="px-4 py-3 tracking-wider">Min Order</th>
              <th className="px-4 py-3 tracking-wider">Sale Items</th>
              <th className="px-4 py-3 tracking-wider">Status</th>
              <th className="px-4 py-3 text-right tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[var(--text-muted)]">
                  LOADING COUPONS...
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[var(--text-muted)]">
                  NO COUPONS FOUND. CLICK &quot;NEW COUPON&quot; TO GENERATE ONE.
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => {
                const percent = Math.min(
                  100,
                  Math.round((coupon.redemptionCount / coupon.maxRedemptions) * 100),
                );

                const is50Percent =
                  coupon.discountType === 'percentage' && coupon.discountValue === 50;

                return (
                  <tr key={coupon._id} className="transition-colors hover:bg-[var(--bg-elevated)]">
                    <td className="px-4 py-3 font-bold text-[var(--text-primary)]">
                      <div className="flex items-center gap-2">
                        <span className="rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 font-mono text-xs tracking-wider uppercase text-[var(--text-primary)]">
                          {coupon.code}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {is50Percent ? (
                        <span className="rounded-none border border-[var(--text-primary)] bg-[var(--text-primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--text-primary)] uppercase dark:border-[#e8ff00] dark:bg-[#e8ff00]/10 dark:text-[#e8ff00]">
                          50% OFF (HIGH RISK)
                        </span>
                      ) : coupon.discountType === 'percentage' ? (
                        <span className="rounded-none border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                          {coupon.discountValue}% OFF
                        </span>
                      ) : (
                        <span className="rounded-none border border-zinc-500/40 bg-zinc-500/10 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                          ₹{(coupon.discountValue / 100).toFixed(0)} OFF
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="w-32 space-y-1">
                        <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                          <span>
                            {coupon.redemptionCount} / {coupon.maxRedemptions}
                          </span>
                          <span>{percent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--border)] overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              percent >= 90
                                ? 'bg-[#ff3b3b]'
                                : is50Percent
                                  ? 'bg-[var(--text-primary)] dark:bg-[#e8ff00]'
                                  : 'bg-emerald-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {coupon.maxDiscountAmount ? (
                        <span className="font-bold text-[var(--text-primary)] dark:text-[#e8ff00]">
                          ₹{(coupon.maxDiscountAmount / 100).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">NO CAP</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {coupon.minOrderAmount ? (
                        <span>₹{(coupon.minOrderAmount / 100).toLocaleString()}</span>
                      ) : (
                        <span className="text-[var(--text-muted)]">₹0</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {coupon.excludeSaleItems ? (
                        <span className="text-[10px] text-amber-400 uppercase">EXCLUDED</span>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)] uppercase">APPLIES</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(coupon._id, coupon.status)}
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase transition-colors ${
                          coupon.status === 'active'
                            ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                            : 'border border-zinc-700 bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {coupon.status}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenRedemptions(coupon)}
                          title="View order redemptions"
                          className="btn-tactile p-1.5 text-[var(--text-muted)] hover:text-[#e8ff00]"
                          aria-label={`View redemptions for ${coupon.code}`}
                        >
                          <Receipt size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(coupon)}
                          className="btn-tactile p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          aria-label={`Edit ${coupon.code}`}
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCouponToDelete({ id: coupon._id, code: coupon.code })}
                          className="btn-tactile p-1.5 text-[var(--text-muted)] hover:text-[#ff3b3b]"
                          aria-label={`Delete ${coupon.code}`}
                        >
                          <Trash size={16} />
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

      {/* Create / Edit Dialog */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="coupon-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        >
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative flex max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] w-full max-w-2xl flex-col rounded-none border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4">
              <div>
                <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--text-primary)] dark:text-[#e8ff00] uppercase">
                  DISCOUNT CAMPAIGN RULES
                </span>
                <h2 id="coupon-modal-title" className="text-lg font-bold text-[var(--text-primary)]">
                  {isEditing ? `Edit Coupon: ${formData.code}` : `Create New Coupon`}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-tactile p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-[0.97]"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5">
                {/* Promo Code Input & Generator */}
                <div>
                  <label className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                    Coupon Code *
                  </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    required
                    maxLength={30}
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. VIP50, SUMMER20, FLASH10"
                    disabled={isEditing}
                    className="flex-1 rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-sm uppercase text-[var(--text-primary)] focus:border-[#e8ff00] focus:outline-none disabled:opacity-50"
                  />
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="btn-tactile flex items-center gap-1.5 border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-xs uppercase text-[var(--text-primary)] hover:border-[#e8ff00]"
                    >
                      <Sparkle size={14} className="text-[var(--text-primary)] dark:text-[#e8ff00]" />
                      <span>GENERATE CODE</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Preset Discount Tiers Selector */}
              <div>
                <label className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                  Preset Discount Tier * (Decision A1)
                </label>
                <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <button
                    type="button"
                    onClick={() => handleSelectTier('10')}
                    className={`border py-2 text-center font-mono text-xs font-bold uppercase transition-colors ${
                      formData.presetTier === '10' && formData.discountType === 'percentage'
                        ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg)] dark:border-[#e8ff00] dark:bg-[#e8ff00]/15 dark:text-[#e8ff00]'
                        : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    10% OFF
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTier('20')}
                    className={`border py-2 text-center font-mono text-xs font-bold uppercase transition-colors ${
                      formData.presetTier === '20' && formData.discountType === 'percentage'
                        ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg)] dark:border-[#e8ff00] dark:bg-[#e8ff00]/15 dark:text-[#e8ff00]'
                        : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    20% OFF
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTier('50')}
                    className={`border py-2 text-center font-mono text-xs font-bold uppercase transition-colors ${
                      formData.presetTier === '50' && formData.discountType === 'percentage'
                        ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg)] dark:border-[#e8ff00] dark:bg-[#e8ff00] dark:text-black'
                        : 'border-dashed border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] dark:border-[#e8ff00]/40 dark:bg-[#e8ff00]/10 dark:text-[#e8ff00]'
                    }`}
                  >
                    50% (HIGH RISK)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTier('custom')}
                    className={`border py-2 text-center font-mono text-xs font-bold uppercase transition-colors ${
                      formData.presetTier === 'custom' && formData.discountType === 'percentage'
                        ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg)] dark:border-[#e8ff00] dark:bg-[#e8ff00]/15 dark:text-[#e8ff00]'
                        : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    CUSTOM %
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTier('custom', true)}
                    className={`border py-2 text-center font-mono text-xs font-bold uppercase transition-colors ${
                      formData.discountType === 'fixed'
                        ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg)] dark:border-[#e8ff00] dark:bg-[#e8ff00]/15 dark:text-[#e8ff00]'
                        : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    FIXED ₹
                  </button>
                </div>
              </div>

              {/* 50% High-Risk Warning Box */}
              {formData.discountType === 'percentage' && formData.discountValue === 50 && (
                <div className="border border-amber-500/50 bg-amber-500/10 p-3.5 text-xs text-amber-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-400">
                    <ShieldWarning size={18} />
                    <span>Margin Protection Active (Stakeholder Decision A2 & A4)</span>
                  </div>
                  <p className="font-sans leading-relaxed text-[11px]">
                    A 50% discount presents significant margin loss risk. A Maximum Discount Cap in ₹ is mandatory, and sale items are automatically excluded by default.
                  </p>
                </div>
              )}

              {/* Custom Value & Maximum Discount Cap */}
              <div className="grid grid-cols-2 gap-4">
                {(formData.presetTier === 'custom' || formData.discountType === 'fixed') && (
                  <div>
                    <label htmlFor={discountValueInputId} className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                      {formData.discountType === 'percentage' ? 'Discount Percentage (%) *' : 'Fixed Rupee Amount (₹) *'}
                    </label>
                    <input
                      id={discountValueInputId}
                      type="number"
                      required
                      min={1}
                      max={formData.discountType === 'percentage' ? 90 : 50000}
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })
                      }
                      className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[#e8ff00] focus:outline-none"
                    />
                  </div>
                )}

                <div className={formData.presetTier === '50' ? 'col-span-2' : ''}>
                  <label htmlFor={maxDiscountCapInputId} className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                    Maximum Discount Cap (₹){' '}
                    {formData.discountValue === 50 && (
                      <span className="text-[var(--danger)] dark:text-[#e8ff00] font-bold">* MANDATORY FOR 50%</span>
                    )}
                  </label>
                  <input
                    id={maxDiscountCapInputId}
                    type="number"
                    min={1}
                    required={formData.discountValue === 50}
                    placeholder="e.g. 1500 (Max saving ₹1,500)"
                    value={formData.maxDiscountCapRupees}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDiscountCapRupees: e.target.value })
                    }
                    className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[#e8ff00] focus:outline-none"
                  />
                  <span className="mt-1 block text-[10px] text-[var(--text-muted)]">
                    Protects store margins regardless of total shopping cart size.
                  </span>
                </div>
              </div>

              {/* Minimum Order Amount & Sale Item Exclusion */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={minOrderAmountInputId} className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                    Minimum Order Amount (₹)
                  </label>
                  <input
                    id={minOrderAmountInputId}
                    type="number"
                    min={0}
                    placeholder="0"
                    value={formData.minOrderAmountRupees}
                    onChange={(e) =>
                      setFormData({ ...formData, minOrderAmountRupees: e.target.value })
                    }
                    className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[#e8ff00] focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <div className="flex items-center gap-2 pb-2">
                    <input
                      type="checkbox"
                      id={excludeSaleItemsCheckboxId}
                      checked={formData.excludeSaleItems}
                      onChange={(e) =>
                        setFormData({ ...formData, excludeSaleItems: e.target.checked })
                      }
                      className="h-4 w-4 accent-[#e8ff00]"
                    />
                    <label
                      htmlFor={excludeSaleItemsCheckboxId}
                      className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase"
                    >
                      Exclude Sale Items (Decision A4)
                    </label>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Products with compareAt prices will not receive additional discount.
                  </span>
                </div>
              </div>

              {/* Redemption Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={maxRedemptionsInputId} className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                    Total Platform Uses *
                  </label>
                  <input
                    id={maxRedemptionsInputId}
                    type="number"
                    required
                    min={1}
                    value={formData.maxRedemptions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxRedemptions: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[#e8ff00] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={maxRedemptionsPerUserInputId} className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                    Uses Per Customer *
                  </label>
                  <input
                    id={maxRedemptionsPerUserInputId}
                    type="number"
                    required
                    min={1}
                    value={formData.maxRedemptionsPerUser}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxRedemptionsPerUser: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[#e8ff00] focus:outline-none"
                  />
                </div>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={startDateInputId} className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                    Start Date *
                  </label>
                  <input
                    id={startDateInputId}
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[#e8ff00] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor={endDateInputId} className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                    End Date *
                  </label>
                  <input
                    id={endDateInputId}
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[#e8ff00] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Pinned Action Footer */}
              <div className="flex flex-shrink-0 items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-tactile rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 font-mono text-xs uppercase text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-tactile rounded-none border border-[var(--text-primary)] bg-[var(--text-primary)] px-6 py-2 font-mono text-xs font-bold uppercase text-[var(--bg)] transition-all active:scale-[0.97] dark:border-[#e8ff00] dark:bg-[#e8ff00] dark:text-black"
                >
                  {isSaving ? 'Saving...' : isEditing ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redemptions Drawer / Audit Modal */}
      {viewingRedemptionsCoupon && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="redemptions-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        >
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setViewingRedemptionsCoupon(null)}
            aria-hidden="true"
          />

          <div className="relative flex max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] w-full max-w-3xl flex-col rounded-none border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4">
              <div>
                <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--text-primary)] dark:text-[#e8ff00] uppercase">
                  REDEMPTION AUDIT TRAIL
                </span>
                <h3 id="redemptions-modal-title" className="text-base font-bold text-[var(--text-primary)]">
                  Orders using code: {viewingRedemptionsCoupon.code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingRedemptionsCoupon(null)}
                className="btn-tactile p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-[0.97]"
                aria-label="Close redemptions view"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              {isLoadingRedemptions ? (
                <p className="py-8 text-center font-mono text-xs text-[var(--text-muted)]">
                  LOADING REDEMPTIONS...
                </p>
              ) : redemptions.length === 0 ? (
                <p className="py-8 text-center font-mono text-xs text-[var(--text-muted)]">
                  NO REDEMPTIONS RECORDED YET FOR THIS COUPON.
                </p>
              ) : (
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--text-muted)] uppercase">
                      <th className="py-2">Date</th>
                      <th className="py-2">Customer / Email</th>
                      <th className="py-2">Discount Saved</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {redemptions.map((r) => (
                      <tr key={r._id}>
                        <td className="py-2.5 text-[var(--text-secondary)]">
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2.5">
                          {r.userId?.email || r.guestEmail || 'Guest Shopper'}
                        </td>
                        <td className="py-2.5 font-bold text-[var(--text-primary)] dark:text-[#e8ff00]">
                          ₹{(r.discountAmount / 100).toFixed(2)}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] uppercase ${
                              r.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : r.status === 'reserved'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex flex-shrink-0 items-center justify-end border-t border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-3">
              <button
                type="button"
                onClick={() => setViewingRedemptionsCoupon(null)}
                className="btn-tactile rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 font-mono text-xs uppercase text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] active:scale-[0.97]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(couponToDelete)}
        title="Delete Coupon"
        description={`Are you sure you want to deactivate or remove coupon "${couponToDelete?.code}"? If orders have already used this coupon, it will be marked inactive to preserve invoice integrity.`}
        confirmText={isDeleting ? 'Processing...' : 'Confirm'}
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setCouponToDelete(null)}
      />
    </div>
  );
}
