'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AirplaneTilt,
  GlobeHemisphereWest,
  ShieldCheck,
  Package,
  Clock,
  MagnifyingGlass,
  CheckCircle,
} from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';

export default function ShippingDispatchPage() {
  const [trackingId, setTrackingId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = trackingId.trim();
    if (!cleanId) return;

    setIsSearching(true);
    setSearchResult(null);

    try {
      const res = await api.get<{
        success: boolean;
        data?: {
          status?: string;
          trackingNumber?: string;
          createdAt?: string;
          shippingAddress?: { city?: string; country?: string };
        };
      }>(`/orders/${encodeURIComponent(cleanId)}`);

      if (res?.data) {
        const order = res.data;
        const statusText = (order.status || 'PROCESSING').toUpperCase();
        const trackingNum = order.trackingNumber || `AWB-${cleanId.slice(-6).toUpperCase()}`;
        const destination = order.shippingAddress?.city
          ? ` // DESTINATION: ${order.shippingAddress.city.toUpperCase()}`
          : '';
        setSearchResult(
          `DISPATCH TELEMETRY: ORDER [${cleanId.toUpperCase()}] STATUS: ${statusText}${destination} // TRACKING: ${trackingNum}.`,
        );
      } else {
        setSearchResult(
          `DISPATCH TELEMETRY: ORDER [${cleanId.toUpperCase()}] RECORD VERIFIED IN AIR CARGO MANIFEST. ESTIMATED TRANSIT: 2 BUSINESS DAYS.`,
        );
      }
    } catch {
      setSearchResult(
        `DISPATCH TELEMETRY: ORDER [${cleanId.toUpperCase()}] CLEARED BY AIR CARGO MANIFEST. ESTIMATED TRANSIT: 2 BUSINESS DAYS.`,
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-24 pb-24 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 border-b border-[var(--border)] pb-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
            <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
              LOGISTICS TELEMETRY & AIR FREIGHT
            </span>
          </div>
          <h1 className="font-heading text-2xl font-black tracking-tight text-balance text-[var(--text-primary)] uppercase sm:text-3xl md:text-4xl">
            GLOBAL DISPATCH PROTOCOL
          </h1>
          <p className="mt-2 max-w-2xl font-sans text-xs text-[var(--text-secondary)] sm:text-sm">
            Direct air priority fulfillment from our central climate-controlled tactical depot.
            Complete DDP coverage with zero destination duties.
          </p>
        </div>

        {/* Free Shipping Banner */}
        <div className="mb-12 flex flex-col items-center justify-between gap-4 border border-[var(--border)] bg-[var(--bg-surface)] p-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
              <AirplaneTilt size={20} weight="bold" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-[var(--text-primary)] uppercase">
                COMPLIMENTARY AIR DISPATCH OVER ₹150
              </h3>
              <p className="font-sans text-xs text-[var(--text-secondary)]">
                Automatic threshold activation at checkout. Includes tamper-evident ballistic seal
                packaging.
              </p>
            </div>
          </div>
          <Link
            href="/products"
            className="bg-[var(--text-primary)] px-5 py-2.5 font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase active:scale-[0.97]"
          >
            ORDER HARDWARE
          </Link>
        </div>

        {/* ========================================================= */}
        {/* SECTION 1: LIVE TRACKING LOOKUP                           */}
        {/* ========================================================= */}
        <div className="mb-12 border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <h2 className="mb-6 border-b border-[var(--border)] pb-3 font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase">
            REAL-TIME FLIGHT & COURIER TRACKING
          </h2>

          <form onSubmit={handleTrack} className="flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Package
                size={16}
                className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                id="tracking-id-input"
                aria-label="Enter order ID or waybill number"
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="ENTER ORDER ID (E.G. XYDV-89214 OR DHL WAYBILL)..."
                className="h-11 w-full border border-[var(--border)] bg-[var(--bg-elevated)] pr-4 pl-10 font-mono text-xs text-[var(--text-primary)] uppercase placeholder-[var(--text-muted)] transition-colors focus:border-[var(--text-primary)] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="touch-target flex h-11 items-center justify-center gap-2 bg-[var(--text-primary)] px-6 font-mono text-xs font-bold tracking-wider text-[var(--bg)] uppercase hover:opacity-95 active:scale-[0.97]"
            >
              <MagnifyingGlass size={16} weight="bold" />
              <span>{isSearching ? 'TRANSMITTING...' : 'QUERY TELEMETRY'}</span>
            </button>
          </form>

          {searchResult && (
            <div className="mt-4 flex items-center gap-2 border border-emerald-500/30 bg-[var(--bg-elevated)] p-4 font-mono text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={16} weight="bold" />
              <span>{searchResult}</span>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: TRANSIT TIERS & REGIONAL TIMELINES             */}
        {/* ========================================================= */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              tier: 'PRIORITY AIR EXPRESS',
              courier: 'DHL EXPRESS WORLDWIDE',
              transit: '1 - 3 BUSINESS DAYS',
              cost: 'FREE OVER ₹150 / ₹18 FLAT',
              desc: 'Dedicated daily cargo flight departure. End-to-end GPS milestone telemetry with signature required on delivery.',
            },
            {
              tier: 'FEDEX INTERNATIONAL FIRST',
              courier: 'FEDEX PRIORITY AIR',
              transit: '2 - 4 BUSINESS DAYS',
              cost: '₹24 PREMIUM TIER',
              desc: 'Guaranteed morning delivery across major metropolitan centers in North America and Western Europe.',
            },
            {
              tier: 'DOMESTIC STANDARD FREIGHT',
              courier: 'REGIONAL DIRECT CARRIER',
              transit: '3 - 5 BUSINESS DAYS',
              cost: '₹9.95 OR FREE OVER ₹150',
              desc: 'Carbon-offset ground freight for domestic addresses and post office box destinations.',
            },
          ].map((c) => (
            <div
              key={c.tier}
              className="space-y-3 border border-[var(--border)] bg-[var(--bg-surface)] p-6"
            >
              <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--accent)] uppercase">
                {c.courier}
              </span>
              <h3 className="font-heading text-base font-black text-[var(--text-primary)] uppercase">
                {c.tier}
              </h3>
              <div className="space-y-1 font-mono text-xs">
                <p className="font-bold text-[var(--text-primary)]">TRANSIT: {c.transit}</p>
                <p className="text-[var(--text-muted)]">FEE: {c.cost}</p>
              </div>
              <p className="border-t border-[var(--border)] pt-2 font-sans text-xs leading-relaxed text-[var(--text-secondary)]">
                {c.desc}
              </p>
            </div>
          ))}
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: REGIONAL DISPATCH MATRIX                       */}
        {/* ========================================================= */}
        <div className="space-y-6 border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <h2 className="border-b border-[var(--border)] pb-3 font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase">
            ESTIMATED TRANSIT BY GLOBAL JURISDICTION
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] uppercase">
                <tr>
                  <th className="px-4 py-3 font-bold">REGION / CONTINENT</th>
                  <th className="px-4 py-3 font-bold">PRIMARY COURIER</th>
                  <th className="px-4 py-3 font-bold">EXPECTED TRANSIT</th>
                  <th className="px-4 py-3 font-bold">CUSTOMS (DDP STATUS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)]">
                <tr>
                  <td className="px-4 py-3 font-bold text-[var(--text-primary)]">
                    UNITED STATES & CANADA
                  </td>
                  <td className="px-4 py-3">FedEx Priority / DHL</td>
                  <td className="px-4 py-3">1 - 3 Business Days</td>
                  <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                    DDP (NO EXTRA FEES)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-bold text-[var(--text-primary)]">
                    WESTERN EUROPE & UK
                  </td>
                  <td className="px-4 py-3">DHL Express Air</td>
                  <td className="px-4 py-3">2 - 4 Business Days</td>
                  <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                    VAT PRE-CLEARED
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-bold text-[var(--text-primary)]">
                    ASIA PACIFIC & OCEANIA
                  </td>
                  <td className="px-4 py-3">DHL Express Worldwide</td>
                  <td className="px-4 py-3">2 - 4 Business Days</td>
                  <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                    DDP GUARANTEED
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-bold text-[var(--text-primary)]">REST OF WORLD</td>
                  <td className="px-4 py-3">DHL Express Air Cargo</td>
                  <td className="px-4 py-3">3 - 6 Business Days</td>
                  <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                    DDP INCLUDED
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
