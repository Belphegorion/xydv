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

export default function ShippingDispatchPage() {
  const [trackingId, setTrackingId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setIsSearching(true);
    setSearchResult(null);

    setTimeout(() => {
      setIsSearching(false);
      setSearchResult(
        `DISPATCH TELEMETRY: ORDER [${trackingId.toUpperCase()}] IS CLEARED BY AIR CARGO MANIFEST. ESTIMATED TRANSIT: 2 BUSINESS DAYS.`,
      );
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-24 sm:pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="border-b border-[var(--border)] pb-8 mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
              LOGISTICS TELEMETRY & AIR FREIGHT
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight font-heading text-[var(--text-primary)]">
            GLOBAL DISPATCH PROTOCOL
          </h1>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-sans mt-2 max-w-2xl">
            Direct air priority fulfillment from our central climate-controlled tactical depot. Complete DDP coverage with zero destination duties.
          </p>
        </div>

        {/* Free Shipping Banner */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
              <AirplaneTilt size={20} weight="bold" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold uppercase text-[var(--text-primary)]">
                COMPLIMENTARY AIR DISPATCH OVER ₹150
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-sans">
                Automatic threshold activation at checkout. Includes tamper-evident ballistic seal packaging.
              </p>
            </div>
          </div>
          <Link
            href="/products"
            className="px-5 py-2.5 bg-[var(--text-primary)] text-[var(--bg)] font-mono text-xs font-bold uppercase tracking-wider active:scale-[0.97]"
          >
            ORDER HARDWARE
          </Link>
        </div>

        {/* ========================================================= */}
        {/* SECTION 1: LIVE TRACKING LOOKUP                           */}
        {/* ========================================================= */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-6 sm:p-8 mb-12">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)] border-b border-[var(--border)] pb-3 mb-6">
            REAL-TIME FLIGHT & COURIER TRACKING
          </h2>

          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Package size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="tracking-id-input"
                aria-label="Enter order ID or waybill number"
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="ENTER ORDER ID (E.G. XYDV-89214 OR DHL WAYBILL)..."
                className="w-full h-11 pl-10 pr-4 text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--text-primary)] transition-colors uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="touch-target h-11 px-6 bg-[var(--text-primary)] text-[var(--bg)] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.97]"
            >
              <MagnifyingGlass size={16} weight="bold" />
              <span>{isSearching ? 'TRANSMITTING...' : 'QUERY TELEMETRY'}</span>
            </button>
          </form>

          {searchResult && (
            <div className="mt-4 p-4 bg-[var(--bg-elevated)] border border-emerald-500/30 text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle size={16} weight="bold" />
              <span>{searchResult}</span>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: TRANSIT TIERS & REGIONAL TIMELINES             */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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
            <div key={c.tier} className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase text-[var(--accent)] tracking-widest">
                {c.courier}
              </span>
              <h3 className="text-base font-heading font-black uppercase text-[var(--text-primary)]">{c.tier}</h3>
              <div className="space-y-1 text-xs font-mono">
                <p className="text-[var(--text-primary)] font-bold">TRANSIT: {c.transit}</p>
                <p className="text-[var(--text-muted)]">FEE: {c.cost}</p>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed pt-2 border-t border-[var(--border)]">
                {c.desc}
              </p>
            </div>
          ))}
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: REGIONAL DISPATCH MATRIX                       */}
        {/* ========================================================= */}
        <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)] border-b border-[var(--border)] pb-3">
            ESTIMATED TRANSIT BY GLOBAL JURISDICTION
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border)] text-[var(--text-primary)] uppercase">
                <tr>
                  <th className="py-3 px-4 font-bold">REGION / CONTINENT</th>
                  <th className="py-3 px-4 font-bold">PRIMARY COURIER</th>
                  <th className="py-3 px-4 font-bold">EXPECTED TRANSIT</th>
                  <th className="py-3 px-4 font-bold">CUSTOMS (DDP STATUS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)]">
                <tr>
                  <td className="py-3 px-4 font-bold text-[var(--text-primary)]">UNITED STATES & CANADA</td>
                  <td className="py-3 px-4">FedEx Priority / DHL</td>
                  <td className="py-3 px-4">1 - 3 Business Days</td>
                  <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">DDP (NO EXTRA FEES)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-[var(--text-primary)]">WESTERN EUROPE & UK</td>
                  <td className="py-3 px-4">DHL Express Air</td>
                  <td className="py-3 px-4">2 - 4 Business Days</td>
                  <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">VAT PRE-CLEARED</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-[var(--text-primary)]">ASIA PACIFIC & OCEANIA</td>
                  <td className="py-3 px-4">DHL Express Worldwide</td>
                  <td className="py-3 px-4">2 - 4 Business Days</td>
                  <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">DDP GUARANTEED</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-[var(--text-primary)]">REST OF WORLD</td>
                  <td className="py-3 px-4">DHL Express Air Cargo</td>
                  <td className="py-3 px-4">3 - 6 Business Days</td>
                  <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">DDP INCLUDED</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
