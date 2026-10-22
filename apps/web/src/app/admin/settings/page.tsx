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
      <div className="flex h-96 items-center justify-center font-mono text-xs tracking-widest text-[#71717a] uppercase">
        <div className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-[#e8ff00] border-t-transparent" />
        Loading System Settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[#1f1f1f] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Gear size={20} className="text-[#e8ff00]" />
            <h1 className="font-mono text-xl font-bold tracking-wider text-[#f5f5f5] uppercase">
              Store Settings
            </h1>
          </div>
          <p className="mt-1 font-mono text-xs text-[#a0a0a0]">
            Authoritative parameters for checkout calculations, taxation, thresholds, and brand
            identity.
          </p>
        </div>

        {settings.updatedAt && (
          <div className="font-mono text-[11px] text-[#71717a]">
            Last Updated:{' '}
            {new Date(settings.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded border p-3 font-mono text-xs ${
            feedback.type === 'success'
              ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]'
              : 'border-[#ff3b3b]/30 bg-[#ff3b3b]/10 text-[#ff3b3b]'
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
        <div className="rounded border border-[#1f1f1f] bg-[#111111] p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2 border-b border-[#1f1f1f] pb-3">
            <Truck size={18} className="text-[#e8ff00]" />
            <h2 className="font-mono text-xs font-bold tracking-wider text-[#f5f5f5] uppercase">
              Fulfillment & Shipping Rules
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-mono text-xs text-[#a0a0a0] uppercase">
                Free Shipping Threshold (₹)
              </label>
              <div className="relative">
                <span className="absolute top-2.5 left-3 font-mono text-xs text-[#71717a]">₹</span>
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
                  className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] py-2 pr-3 pl-8 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
                />
              </div>
              <p className="mt-1.5 font-mono text-[10px] text-[#71717a]">
                Orders with subtotal at or above this amount automatically qualify for free
                shipping.
              </p>
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[#a0a0a0] uppercase">
                Standard Shipping Fee (₹)
              </label>
              <div className="relative">
                <span className="absolute top-2.5 left-3 font-mono text-xs text-[#71717a]">₹</span>
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
                  className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] py-2 pr-3 pl-8 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
                />
              </div>
              <p className="mt-1.5 font-mono text-[10px] text-[#71717a]">
                Flat shipping fee applied when cart subtotal is below the free shipping threshold.
              </p>
            </div>
          </div>
        </div>

        {/* Taxes & Currency */}
        <div className="rounded border border-[#1f1f1f] bg-[#111111] p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2 border-b border-[#1f1f1f] pb-3">
            <Receipt size={18} className="text-[#e8ff00]" />
            <h2 className="font-mono text-xs font-bold tracking-wider text-[#f5f5f5] uppercase">
              Taxation & Currency Specification
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block font-mono text-xs text-[#a0a0a0] uppercase">
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
                className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] p-2 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
              />
              <p className="mt-1.5 font-mono text-[10px] text-[#71717a]">
                e.g. 0.18 represents 18% standard GST rate applied at checkout.
              </p>
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[#a0a0a0] uppercase">
                Currency Code
              </label>
              <div className="relative">
                <CurrencyInr size={14} className="absolute top-3 left-3 text-[#71717a]" />
                <input
                  type="text"
                  required
                  value={settings.currency}
                  onChange={(e) => {
                    setIsDirty(true);
                    setSettings({ ...settings, currency: e.target.value.toUpperCase() });
                  }}
                  className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] py-2 pr-3 pl-8 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[#a0a0a0] uppercase">
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
                className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] p-2 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Inventory Safety Alert Limit */}
        <div className="rounded border border-[#1f1f1f] bg-[#111111] p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2 border-b border-[#1f1f1f] pb-3">
            <ShieldCheck size={18} className="text-[#e8ff00]" />
            <h2 className="font-mono text-xs font-bold tracking-wider text-[#f5f5f5] uppercase">
              Global Inventory Thresholds
            </h2>
          </div>

          <div className="max-w-md">
            <label className="mb-2 block font-mono text-xs text-[#a0a0a0] uppercase">
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
              className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] p-2 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
            />
            <p className="mt-1.5 font-mono text-[10px] text-[#71717a]">
              Any SKU with stock at or below this limit will trigger low-stock badges and alerts in
              the admin console.
            </p>
          </div>
        </div>

        {/* Brand & Support Contact */}
        <div className="rounded border border-[#1f1f1f] bg-[#111111] p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2 border-b border-[#1f1f1f] pb-3">
            <EnvelopeSimple size={18} className="text-[#e8ff00]" />
            <h2 className="font-mono text-xs font-bold tracking-wider text-[#f5f5f5] uppercase">
              Store Identity & Invoicing
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-mono text-xs text-[#a0a0a0] uppercase">
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
                className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] p-2 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block font-mono text-xs text-[#a0a0a0] uppercase">
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
                className="w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] p-2 font-mono text-xs text-[#f5f5f5] focus:border-[#e8ff00] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between border-t border-[#1f1f1f] pt-5">
          <span className="font-mono text-xs text-[#71717a]">
            {isDirty ? '● Unsaved changes detected' : 'All parameters synchronized'}
          </span>

          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="inline-flex items-center gap-2 rounded border border-[#e8ff00] bg-[#e8ff00] px-6 py-2.5 font-mono text-xs font-bold text-[#0a0a0a] uppercase transition-transform hover:bg-[#e8ff00]/90 active:scale-[0.97] disabled:opacity-40"
          >
            <FloppyDisk size={16} />
            <span>{isSaving ? 'Synchronizing...' : 'Save Store Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
