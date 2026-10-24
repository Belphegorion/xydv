'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import Image from 'next/image';
import {
  Plus,
  PencilSimple,
  Trash,
  X,
  CheckCircle,
  Warning,
  Eye,
  CursorClick,
  Copy,
  Clock,
  ArrowsInLineVertical,
  DeviceMobile,
  Desktop,
  UploadSimple,
  Check,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';
import { ConfirmDialog } from '../../../components/admin/ConfirmDialog';
import type { INotification, NotificationFormat, NotificationTrigger, NotificationAudience, NotificationFrequency } from '@vertex/types';

interface NotificationFormData {
  title: string;
  message: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
  couponCode: string;
  displayFormat: NotificationFormat;
  triggerType: NotificationTrigger;
  triggerValue: number;
  targetPages: string[];
  targetAudience: NotificationAudience;
  frequencyCap: NotificationFrequency;
  priority: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const defaultFormData: NotificationFormData = {
  title: '',
  message: '',
  imageUrl: '',
  ctaText: 'SHOP THE DROP',
  ctaUrl: '/products',
  couponCode: '',
  displayFormat: 'modal',
  triggerType: 'delay',
  triggerValue: 8,
  targetPages: ['all'],
  targetAudience: 'all',
  frequencyCap: 'once_per_week',
  priority: 10,
  startDate: new Date().toISOString().slice(0, 16),
  endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
  isActive: true,
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'expired' | 'inactive'>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | 'modal' | 'toast'>('all');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<NotificationFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedCode, setCopiedCode] = useState(false);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Active coupons for linking dropdown
  const [activeCoupons, setActiveCoupons] = useState<Array<{ code: string; discountValue: number; discountType: string }>>([]);

  const searchInputId = useId();
  const formatSelectId = useId();
  const triggerValueInputId = useId();
  const priorityInputId = useId();

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams: Record<string, string | number> = {};
      if (statusFilter !== 'all') queryParams.status = statusFilter;
      if (formatFilter !== 'all') queryParams.format = formatFilter;
      if (search.trim()) queryParams.search = search.trim();

      const res = await api.get<{ data: INotification[] }>('/admin/notifications', {
        params: queryParams,
      });
      setNotifications(res.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, formatFilter, search]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    // Fetch active coupons for dropdown
    api.get<{ data: Array<{ code: string; discountValue: number; discountType: string }> }>('/admin/coupons', {
      params: { status: 'active', limit: 50 },
    }).then((res) => {
      if (res?.data) setActiveCoupons(res.data);
    }).catch(() => {});
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({
      ...defaultFormData,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (notif: INotification) => {
    setIsEditing(true);
    setEditId(notif._id);
    setFormData({
      title: notif.title,
      message: notif.message,
      imageUrl: notif.imageUrl || '',
      ctaText: notif.ctaText || '',
      ctaUrl: notif.ctaUrl || '',
      couponCode: notif.couponCode || '',
      displayFormat: notif.displayFormat,
      triggerType: notif.triggerType,
      triggerValue: notif.triggerValue,
      targetPages: notif.targetPages,
      targetAudience: notif.targetAudience,
      frequencyCap: notif.frequencyCap,
      priority: notif.priority,
      startDate: notif.startDate ? new Date(notif.startDate).toISOString().slice(0, 16) : '',
      endDate: notif.endDate ? new Date(notif.endDate).toISOString().slice(0, 16) : '',
      isActive: notif.isActive,
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await api.patch(`/admin/notifications/${id}/toggle`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isActive: !current } : n)),
      );
      setFeedback({
        type: 'success',
        message: `Notification ${!current ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle status';
      setFeedback({ type: 'error', message: msg });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Image file size must be less than 5MB' });
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('images', file);

    try {
      const res = await api.post<{ success: boolean; data: string[] }>('/admin/upload', uploadFormData);
      if (res.data?.[0]) {
        setFormData((prev) => ({ ...prev, imageUrl: res.data[0] }));
        setFeedback({ type: 'success', message: 'Image uploaded successfully' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Image upload failed';
      setFeedback({ type: 'error', message: msg });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!formData.title.trim() || !formData.message.trim()) {
      setFeedback({ type: 'error', message: 'Title and message are required' });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      if (isEditing && editId) {
        await api.patch(`/admin/notifications/${editId}`, payload);
        setFeedback({ type: 'success', message: `Notification "${formData.title}" updated.` });
      } else {
        await api.post('/admin/notifications', payload);
        setFeedback({ type: 'success', message: `Notification "${formData.title}" created.` });
      }

      setIsModalOpen(false);
      fetchNotifications();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save notification';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/notifications/${itemToDelete.id}`);
      setFeedback({ type: 'success', message: `Notification deleted.` });
      setItemToDelete(null);
      fetchNotifications();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete notification';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold tracking-widest text-[var(--text-primary)] dark:text-[#e8ff00] uppercase">
              STOREFRONT MARKETING
            </span>
            <span className="text-xs text-[var(--text-muted)]">•</span>
            <span className="font-mono text-xs text-[var(--text-muted)] uppercase">
              CONVERSION ENGINE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Notification Popups & Announcements
          </h1>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Schedule promotional drop modals, banner toasts, and integrated discount announcements with live WYSIWYG preview.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-tactile flex items-center justify-center gap-2 rounded-none bg-[var(--text-primary)] px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase transition-all duration-150 active:scale-[0.97] dark:bg-[#e8ff00] dark:text-black"
        >
          <Plus size={16} weight="bold" />
          <span>New Notification</span>
        </button>
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

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 border-b border-[var(--border)] sm:border-b-0">
          {(['all', 'active', 'scheduled', 'expired', 'inactive'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 font-mono text-xs tracking-wider uppercase transition-colors ${
                statusFilter === tab
                  ? 'border-b-2 border-[#e8ff00] font-bold text-[var(--text-primary)] dark:text-[#e8ff00]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor={searchInputId} className="sr-only">Search notifications</label>
          <input
            id={searchInputId}
            type="text"
            placeholder="SEARCH NOTIFICATIONS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 font-mono text-xs tracking-wider text-[var(--text-primary)] placeholder-[var(--text-muted)] sm:w-56"
          />
          <label htmlFor={formatSelectId} className="sr-only">Filter by format</label>
          <select
            id={formatSelectId}
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value as 'all' | 'modal' | 'toast')}
            className="rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase"
          >
            <option value="all">ALL FORMATS</option>
            <option value="modal">MODAL DIALOG</option>
            <option value="toast">CORNER TOAST</option>
          </select>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="overflow-x-auto border border-[var(--border)] bg-[var(--bg-surface)]">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] uppercase">
              <th className="px-4 py-3 tracking-wider">Title & Preview</th>
              <th className="px-4 py-3 tracking-wider">Format</th>
              <th className="px-4 py-3 tracking-wider">Trigger Rule</th>
              <th className="px-4 py-3 tracking-wider">Schedule</th>
              <th className="px-4 py-3 tracking-wider">Engagement</th>
              <th className="px-4 py-3 tracking-wider">Active</th>
              <th className="px-4 py-3 text-right tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--text-muted)]">
                  LOADING NOTIFICATIONS...
                </td>
              </tr>
            ) : notifications.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--text-muted)]">
                  NO NOTIFICATIONS FOUND FOR CURRENT FILTERS.
                </td>
              </tr>
            ) : (
              notifications.map((notif) => {
                const now = Date.now();
                const start = new Date(notif.startDate).getTime();
                const end = new Date(notif.endDate).getTime();
                const isScheduled = now < start;
                const isExpired = now > end;

                const ctr =
                  notif.metrics?.impressions > 0
                    ? ((notif.metrics.clicks / notif.metrics.impressions) * 100).toFixed(1)
                    : '0.0';

                return (
                  <tr key={notif._id} className="transition-colors hover:bg-[var(--bg-elevated)]">
                    <td className="px-4 py-3 font-sans">
                      <div className="flex items-center gap-3">
                        {notif.imageUrl && (
                          <div className="relative h-10 w-14 flex-shrink-0 overflow-hidden border border-[var(--border)] bg-black">
                            <Image
                              src={notif.imageUrl}
                              alt=""
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-[var(--text-primary)]">{notif.title}</p>
                          <p className="line-clamp-1 text-xs text-[var(--text-secondary)]">
                            {notif.message}
                          </p>
                          {notif.couponCode && (
                            <span className="mt-0.5 inline-block font-mono text-[10px] font-bold text-[var(--text-primary)] dark:text-[#e8ff00]">
                              CODE: {notif.couponCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 uppercase">
                      <span className="rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-secondary)]">
                        {notif.displayFormat}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-[var(--text-secondary)] uppercase">
                      {notif.triggerType === 'delay' && `DELAY: ${notif.triggerValue}s`}
                      {notif.triggerType === 'scroll' && `SCROLL: ${notif.triggerValue}%`}
                      {notif.triggerType === 'immediate' && `IMMEDIATE`}
                    </td>

                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {isScheduled && (
                        <span className="mb-1 inline-block text-[10px] text-amber-400 uppercase">
                          SCHEDULED
                        </span>
                      )}
                      {isExpired && (
                        <span className="mb-1 inline-block text-[10px] text-[#ff3b3b] uppercase">
                          EXPIRED
                        </span>
                      )}
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {new Date(notif.startDate).toLocaleDateString()} –{' '}
                        {new Date(notif.endDate).toLocaleDateString()}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      <div className="flex items-center gap-3 text-[11px]">
                        <span title="Impressions" className="flex items-center gap-1">
                          <Eye size={12} className="text-[var(--text-muted)]" />
                          {notif.metrics?.impressions ?? 0}
                        </span>
                        <span title="Clicks" className="flex items-center gap-1">
                          <CursorClick size={12} className="text-[var(--text-muted)]" />
                          {notif.metrics?.clicks ?? 0}
                        </span>
                        <span title="CTR" className="font-bold text-[var(--text-primary)] dark:text-[#e8ff00]">
                          {ctr}%
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(notif._id, notif.isActive)}
                        className={`h-5 w-9 rounded-full transition-colors relative ${
                          notif.isActive ? 'bg-[#e8ff00]' : 'bg-[var(--border)]'
                        }`}
                        aria-label={`Toggle active status for ${notif.title}`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-black transition-transform ${
                            notif.isActive ? 'right-0.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(notif)}
                          className="btn-tactile p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          aria-label={`Edit ${notif.title}`}
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemToDelete({ id: notif._id, title: notif.title })}
                          className="btn-tactile p-1.5 text-[var(--text-muted)] hover:text-[#ff3b3b]"
                          aria-label={`Delete ${notif.title}`}
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

      {/* Create / Edit Modal with Live WYSIWYG Preview */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
        >
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col border border-[var(--border)] bg-[var(--bg)] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <div>
                <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--text-primary)] dark:text-[#e8ff00] uppercase">
                  STOREFRONT CAMPAIGN AUTHORING
                </span>
                <h2 id="notification-modal-title" className="text-lg font-bold text-[var(--text-primary)]">
                  {isEditing ? `Edit Notification` : `Create New Notification`}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Split Form & Live Preview */}
            <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border)]">
              {/* Left Column: Form Controls */}
              <form onSubmit={handleSave} className="col-span-1 lg:col-span-7 space-y-4 p-6">
                <div>
                  <label htmlFor="notif-title" className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                    Title *
                  </label>
                  <input
                    id="notif-title"
                    name="title"
                    type="text"
                    required
                    maxLength={120}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. VIP WINTER DROP // LIMITED EDITION"
                    className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[#e8ff00] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="notif-message" className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                    Message Description *
                  </label>
                  <textarea
                    id="notif-message"
                    name="message"
                    required
                    rows={3}
                    maxLength={500}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="High-performance thermal outerwear crafted from Japanese technical fleece. Enter code at checkout for 20% off."
                    className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-sans text-xs text-[var(--text-primary)] focus:border-[#e8ff00] focus:outline-none"
                  />
                </div>

                {/* Display Format & Trigger Rule */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                      Display Format
                    </span>
                    <div className="mt-1 flex border border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, displayFormat: 'modal' })}
                        className={`flex-1 py-2 font-mono text-xs uppercase transition-colors ${
                          formData.displayFormat === 'modal'
                            ? 'bg-[var(--text-primary)] font-bold text-[var(--bg)] dark:bg-[#e8ff00] dark:text-black'
                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        Modal Overlay
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, displayFormat: 'toast' })}
                        className={`flex-1 py-2 font-mono text-xs uppercase transition-colors ${
                          formData.displayFormat === 'toast'
                            ? 'bg-[var(--text-primary)] font-bold text-[var(--bg)] dark:bg-[#e8ff00] dark:text-black'
                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        Corner Toast
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notif-triggerType" className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                      Trigger Type
                    </label>
                    <select
                      id="notif-triggerType"
                      name="triggerType"
                      value={formData.triggerType}
                      onChange={(e) => setFormData({ ...formData, triggerType: e.target.value as NotificationTrigger })}
                      className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] uppercase focus:border-[#e8ff00] focus:outline-none"
                    >
                      <option value="delay">Time Delay (Seconds)</option>
                      <option value="scroll">Scroll Depth (%)</option>
                      <option value="immediate">Immediate Page Load</option>
                    </select>
                  </div>
                </div>

                {formData.triggerType !== 'immediate' && (
                  <div>
                    <label htmlFor={triggerValueInputId} className="flex justify-between font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                      <span>
                        {formData.triggerType === 'delay' ? 'Delay Seconds' : 'Scroll Depth %'}
                      </span>
                      <span className="text-[var(--text-primary)] dark:text-[#e8ff00] font-bold">
                        {formData.triggerValue}
                        {formData.triggerType === 'delay' ? 's' : '%'}
                      </span>
                    </label>
                    <input
                      id={triggerValueInputId}
                      type="range"
                      min={formData.triggerType === 'delay' ? 1 : 10}
                      max={formData.triggerType === 'delay' ? 30 : 90}
                      value={formData.triggerValue}
                      onChange={(e) =>
                        setFormData({ ...formData, triggerValue: parseInt(e.target.value, 10) })
                      }
                      className="mt-1 w-full accent-[#e8ff00]"
                    />
                  </div>
                )}

                {/* Attached Coupon Code & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="notif-couponCode" className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                      Attach Coupon Code
                    </label>
                    <input
                      id="notif-couponCode"
                      name="couponCode"
                      type="text"
                      value={formData.couponCode}
                      onChange={(e) =>
                        setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g. XYDV20 or select"
                      list="active-coupons-list"
                      className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] uppercase focus:border-[#e8ff00] focus:outline-none"
                    />
                    <datalist id="active-coupons-list">
                      {activeCoupons.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.discountValue}% OFF)
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label htmlFor={priorityInputId} className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                      Priority (1-100)
                    </label>
                    <input
                      id={priorityInputId}
                      name="priority"
                      type="number"
                      min={1}
                      max={100}
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: parseInt(e.target.value, 10) || 10 })
                      }
                      className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[#e8ff00] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Image Upload & URL */}
                <div>
                  <label htmlFor="notif-imageUrl" className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                    Promotional Image (Optional)
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      id="notif-imageUrl"
                      name="imageUrl"
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://... or upload file"
                      className="flex-1 rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[#e8ff00] focus:outline-none"
                    />
                    <label className="btn-tactile flex cursor-pointer items-center gap-1.5 border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] uppercase hover:border-[#e8ff00]">
                      <UploadSimple size={15} />
                      <span>Upload</span>
                      <input
                        id="notif-fileUpload"
                        name="fileUpload"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/avif"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* CTA Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="notif-ctaText" className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                      CTA Button Text
                    </label>
                    <input
                      id="notif-ctaText"
                      name="ctaText"
                      type="text"
                      value={formData.ctaText}
                      onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                      placeholder="SHOP THE DROP"
                      className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] uppercase focus:border-[#e8ff00] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="notif-ctaUrl" className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                      CTA Link URL
                    </label>
                    <input
                      id="notif-ctaUrl"
                      name="ctaUrl"
                      type="text"
                      value={formData.ctaUrl}
                      onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
                      placeholder="/products"
                      className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[#e8ff00] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Scheduling Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="notif-startDate" className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                      Start Date *
                    </label>
                    <input
                      id="notif-startDate"
                      name="startDate"
                      type="datetime-local"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[#e8ff00] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="notif-endDate" className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                      End Date *
                    </label>
                    <input
                      id="notif-endDate"
                      name="endDate"
                      type="datetime-local"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:border-[#e8ff00] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Frequency & Target Audience */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="notif-frequencyCap" className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                      Frequency Cap
                    </label>
                    <select
                      id="notif-frequencyCap"
                      name="frequencyCap"
                      value={formData.frequencyCap}
                      onChange={(e) => setFormData({ ...formData, frequencyCap: e.target.value as NotificationFrequency })}
                      className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] uppercase focus:border-[#e8ff00] focus:outline-none"
                    >
                      <option value="once_per_week">Once Every 7 Days</option>
                      <option value="once_per_session">Once Per Session</option>
                      <option value="always">Always Display</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="notif-targetAudience" className="block font-mono text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                      Target Audience
                    </label>
                    <select
                      id="notif-targetAudience"
                      name="targetAudience"
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as NotificationAudience })}
                      className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] uppercase focus:border-[#e8ff00] focus:outline-none"
                    >
                      <option value="all">All Visitors</option>
                      <option value="guest">Guest Visitors Only</option>
                      <option value="authenticated">Logged-in Athletes Only</option>
                    </select>
                  </div>
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 accent-[#e8ff00]"
                  />
                  <label htmlFor="isActiveCheck" className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase">
                    Publish Immediately (Active)
                  </label>
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-tactile rounded-none border border-[var(--border)] px-4 py-2 font-mono text-xs uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-tactile rounded-none bg-[var(--text-primary)] px-6 py-2 font-mono text-xs font-bold uppercase text-[var(--bg)] transition-all active:scale-[0.97] dark:bg-[#e8ff00] dark:text-black"
                  >
                    {isSaving ? 'Saving...' : isEditing ? 'Update Notification' : 'Create Notification'}
                  </button>
                </div>
              </form>

              {/* Right Column: Live Interactive WYSIWYG Preview */}
              <div className="col-span-1 lg:col-span-5 flex flex-col dark bg-[#050505] p-6 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="font-mono text-[10px] font-bold tracking-widest text-[#e8ff00] uppercase">
                    LIVE STOREFRONT PREVIEW
                  </span>
                  <div className="flex items-center gap-1 border border-white/10 p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-1 transition-colors ${
                        previewDevice === 'desktop' ? 'bg-[#e8ff00] text-black' : 'text-zinc-400 hover:text-white'
                      }`}
                      aria-label="Desktop preview"
                    >
                      <Desktop size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-1 transition-colors ${
                        previewDevice === 'mobile' ? 'bg-[#e8ff00] text-black' : 'text-zinc-400 hover:text-white'
                      }`}
                      aria-label="Mobile preview"
                    >
                      <DeviceMobile size={14} />
                    </button>
                  </div>
                </div>

                {/* Preview Canvas */}
                <div className="flex flex-1 items-center justify-center py-6">
                  <div
                    className={`transition-all duration-300 relative dark border border-white/15 bg-[#0a0a0a] shadow-2xl ${
                      previewDevice === 'mobile' ? 'w-[320px]' : 'w-full max-w-md'
                    }`}
                  >
                    {/* Centered Modal Format Preview */}
                    {formData.displayFormat === 'modal' ? (
                      <div>
                        {formData.imageUrl && (
                          <div className="relative h-44 w-full overflow-hidden border-b border-white/10 bg-black">
                            <Image
                              src={formData.imageUrl}
                              alt=""
                              fill
                              sizes="(max-width: 640px) 320px, 448px"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                          </div>
                        )}
                        <div className="p-5 space-y-3">
                          <span className="font-mono text-[9px] font-bold tracking-widest text-[#e8ff00] uppercase">
                            XYDV TECHNICAL DISPATCH
                          </span>
                          <h3 className="text-base font-bold text-white tracking-tight">
                            {formData.title || 'NOTIFICATION HEADLINE'}
                          </h3>
                          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                            {formData.message || 'Announcement description text will appear here.'}
                          </p>

                          {formData.couponCode && (
                            <div className="flex items-center justify-between border border-dashed border-[#e8ff00]/40 bg-[#e8ff00]/10 p-2.5">
                              <div>
                                <span className="block font-mono text-[9px] tracking-wider text-zinc-400 uppercase">
                                  PROMO CODE
                                </span>
                                <span className="font-mono text-xs font-bold text-[#e8ff00]">
                                  {formData.couponCode}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setCopiedCode(true);
                                  setTimeout(() => setCopiedCode(false), 2000);
                                }}
                                className="flex items-center gap-1 border border-[#e8ff00]/50 bg-black/50 px-2 py-1 font-mono text-[10px] font-bold text-[#e8ff00] uppercase transition-colors hover:bg-[#e8ff00] hover:text-black"
                              >
                                {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                                <span>{copiedCode ? 'COPIED' : 'COPY'}</span>
                              </button>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-2">
                            {formData.ctaText && (
                              <button
                                type="button"
                                className="flex-1 rounded-none bg-[#e8ff00] py-2 text-center font-mono text-xs font-bold text-black uppercase active:scale-[0.97]"
                              >
                                {formData.ctaText}
                              </button>
                            )}
                            <button
                              type="button"
                              className="rounded-none border border-white/20 py-2 px-3 font-mono text-xs uppercase text-zinc-400 hover:text-white"
                            >
                              DISMISS
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Corner Toast Format Preview */
                      <div className="p-4 space-y-2 border-l-2 border-[#e8ff00]">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] font-bold tracking-wider text-[#e8ff00] uppercase">
                            ANNOUNCEMENT
                          </span>
                          <span className="text-[10px] text-zinc-500">NOW</span>
                        </div>
                        <h4 className="text-xs font-bold text-white tracking-tight">
                          {formData.title || 'Corner Toast Headline'}
                        </h4>
                        <p className="text-[11px] text-zinc-300 font-sans leading-snug">
                          {formData.message || 'Toast description message will appear here.'}
                        </p>
                        {formData.couponCode && (
                          <div className="flex items-center justify-between border border-white/10 bg-white/5 px-2 py-1">
                            <span className="font-mono text-[10px] font-bold text-[#e8ff00]">
                              {formData.couponCode}
                            </span>
                            <span className="font-mono text-[9px] text-zinc-400">TAP TO COPY</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center font-mono text-[10px] text-zinc-500">
                  PREVIEW SIMULATES EXACT DESKTOP/MOBILE STOREFRONT VIEW
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        title="Delete Notification"
        description={`Are you sure you want to permanently delete "${itemToDelete?.title}"? Any uploaded campaign image will be removed.`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
