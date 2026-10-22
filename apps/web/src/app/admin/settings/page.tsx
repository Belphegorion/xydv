'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import {
  Gear,
  CheckCircle,
  Warning,
  FloppyDisk,
  CurrencyInr,
  Truck,
  Receipt,
  EnvelopeSimple,
  ShieldCheck,
} from '@phosphor-icons/react';

interface StoreSettings {
  freeShippingThreshold: number;
  standardShippingFee: number;
  taxRate: number;
  lowStockThreshold: number;
  currency: string;
  currencySymbol: string;
  storeName: string;
  supportEmail: string;
  updatedAt?: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>({
    freeShippingThreshold: 150,
    standardShippingFee: 15,
    taxRate: 0.18,
    lowStockThreshold: 5,
    currency: 'INR',
    currencySymbol: '₹',
    storeName: 'XYDV',
    supportEmail: 'support@xydv.com',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [isDirty, setIsDirty] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ data: StoreSettings }>('/admin/settings');
      if (res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load store settings';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await api.patch<{ data: StoreSettings; message: string }>('/admin/settings', {
        freeShippingThreshold: Number(settings.freeShippingThreshold),
        standardShippingFee: Number(settings.standardShippingFee),
        taxRate: Number(settings.taxRate),
        lowStockThreshold: Number(settings.lowStockThreshold),
        currency: settings.currency,
        currencySymbol: settings.currencySymbol,
        storeName: settings.storeName.trim(),
        supportEmail: settings.supportEmail.trim(),
      });

      if (res.data) {
        setSettings(res.data);
      }
      setIsDirty(false);
      setFeedback({
        type: 'success',
        message: 'Store settings successfully synchronized and saved.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save store settings';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center font-mono text-xs tracking-widest text-[var(--text-muted)] uppercase">
        <div className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-[var(--text-primary)] border-t-transparent dark:border-[#e8ff00]" />
        Loading System Settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Gear size={20} className="text-[var(--text-primary)] dark:text-[#e8ff00]" />
            <h2 className="font-mono text-xl font-bold tracking-wider text-[var(--text-primary)] uppercase">
              Store Settings
            </h2>
          </div>
          <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
            Authoritative parameters for checkout calculations, taxation, thresholds, and brand
            identity.
          </p>
        </div>

        {settings.updatedAt && (
          <div className="font-mono text-[11px] text-[var(--text-muted)]">
            Last Updated:{' '}
            {new Date(settings.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-none border p-3 font-mono text-xs ${
            feedback.type === 'success'
              ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#15803d] dark:text-[#22c55e]'
              : 'border-[#b91c1c]/30 bg-[#b91c1c]/10 text-[#b91c1c] dark:border-[#ff3b3b]/30 dark:bg-[#ff3b3b]/10 dark:text-[#ff3b3b]'
          }`}
          role="alert"
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle size={16} /> : <Warning size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-70"
            aria-label="Dismiss feedback"
          >
            &times;
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Shipping & Delivery */}
        <div className="rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Truck size={18} className="text-[var(--text-primary)] dark:text-[#e8ff00]" />
            <h2 className="font-mono text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
              Fulfillment & Shipping Rules
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                Free Shipping Threshold (₹)
              </label>
              <div className="relative">
                <span className="absolute top-2.5 left-3 font-mono text-xs text-[var(--text-muted)]">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={settings.freeShippingThreshold}
                  onChange={(e) => {
                    setIsDirty(true);
                    setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) });
                  }}
                  className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] py-2 pr-3 pl-8 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                />
              </div>
              <p className="mt-1.5 font-mono text-[10px] text-[var(--text-muted)]">
                Orders with subtotal at or above this amount automatically qualify for free
                shipping.
              </p>
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                Standard Shipping Fee (₹)
              </label>
              <div className="relative">
                <span className="absolute top-2.5 left-3 font-mono text-xs text-[var(--text-muted)]">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={settings.standardShippingFee}
                  onChange={(e) => {
                    setIsDirty(true);
                    setSettings({ ...settings, standardShippingFee: Number(e.target.value) });
                  }}
                  className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] py-2 pr-3 pl-8 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                />
              </div>
              <p className="mt-1.5 font-mono text-[10px] text-[var(--text-muted)]">
                Flat shipping fee applied when cart subtotal is below the free shipping threshold.
              </p>
            </div>
          </div>
        </div>

        {/* Taxes & Currency */}
        <div className="rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Receipt size={18} className="text-[var(--text-primary)] dark:text-[#e8ff00]" />
            <h2 className="font-mono text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
              Taxation & Currency Specification
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                Tax Rate (GST / Fraction)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                required
                value={settings.taxRate}
                onChange={(e) => {
                  setIsDirty(true);
                  setSettings({ ...settings, taxRate: Number(e.target.value) });
                }}
                className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
              />
              <p className="mt-1.5 font-mono text-[10px] text-[var(--text-muted)]">
                e.g. 0.18 represents 18% standard GST rate applied at checkout.
              </p>
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                Currency Code
              </label>
              <div className="relative">
                <CurrencyInr size={14} className="absolute top-3 left-3 text-[var(--text-muted)]" />
                <input
                  type="text"
                  required
                  value={settings.currency}
                  onChange={(e) => {
                    setIsDirty(true);
                    setSettings({ ...settings, currency: e.target.value.toUpperCase() });
                  }}
                  className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] py-2 pr-3 pl-8 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                Currency Symbol
              </label>
              <input
                type="text"
                required
                value={settings.currencySymbol}
                onChange={(e) => {
                  setIsDirty(true);
                  setSettings({ ...settings, currencySymbol: e.target.value });
                }}
                className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
              />
            </div>
          </div>
        </div>

        {/* Inventory Safety Alert Limit */}
        <div className="rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <ShieldCheck size={18} className="text-[var(--text-primary)] dark:text-[#e8ff00]" />
            <h2 className="font-mono text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
              Global Inventory Thresholds
            </h2>
          </div>

          <div className="max-w-md">
            <label className="mb-2 block font-mono text-xs text-[var(--text-secondary)] uppercase">
              Default Low Stock Alert Limit (Units)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={settings.lowStockThreshold}
              onChange={(e) => {
                setIsDirty(true);
                setSettings({ ...settings, lowStockThreshold: Number(e.target.value) });
              }}
              className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
            />
            <p className="mt-1.5 font-mono text-[10px] text-[var(--text-muted)]">
              Any SKU with stock at or below this limit will trigger low-stock badges and alerts in
              the admin console.
            </p>
          </div>
        </div>

        {/* Brand & Support Contact */}
        <div className="rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <EnvelopeSimple size={18} className="text-[var(--text-primary)] dark:text-[#e8ff00]" />
            <h2 className="font-mono text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
              Store Identity & Invoicing
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                Store Brand Name
              </label>
              <input
                type="text"
                required
                value={settings.storeName}
                onChange={(e) => {
                  setIsDirty(true);
                  setSettings({ ...settings, storeName: e.target.value });
                }}
                className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
              />
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[var(--text-secondary)] uppercase">
                Customer Support Email
              </label>
              <input
                type="email"
                required
                value={settings.supportEmail}
                onChange={(e) => {
                  setIsDirty(true);
                  setSettings({ ...settings, supportEmail: e.target.value });
                }}
                className="w-full rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] p-2 font-mono text-xs text-[var(--text-primary)] focus:border-[var(--text-primary)] focus:outline-none dark:focus:border-[#e8ff00]"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-5">
          <span
            className={`font-mono text-xs ${isDirty ? 'text-[#b45309] dark:text-[#f59e0b]' : 'text-[var(--text-muted)]'}`}
          >
            {isDirty ? '● Unsaved changes detected' : 'All parameters synchronized'}
          </span>

          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="btn-tactile inline-flex items-center gap-2 rounded-none border border-[var(--text-primary)] bg-[var(--text-primary)] px-6 py-2.5 font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase transition-colors hover:opacity-90 active:scale-[0.97] disabled:opacity-40 dark:border-[#e8ff00] dark:bg-[#e8ff00] dark:text-[#0a0a0a]"
          >
            <FloppyDisk size={16} />
            <span>{isSaving ? 'Synchronizing...' : 'Save Store Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
