import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'XYDV Operational Agreement & Commercial Terms. Conditions of purchase, specifications, and intellectual property.',
  openGraph: {
    title: 'Terms of Service | XYDV Technical Division',
    description: 'XYDV Operational Agreement & Commercial Terms. Conditions of purchase, specifications, and intellectual property.',
    type: 'website',
    url: 'https://xydv-performance.com/terms',
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] pt-24 sm:pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="border-b border-[var(--border)] pb-8 mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
              OPERATIONAL AGREEMENT & COMMERCIAL TERMS
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight font-heading text-[var(--text-primary)]">
            TERMS OF SERVICE
          </h1>
          <p className="text-[var(--text-secondary)] text-xs font-mono mt-2 uppercase">
            VERSION 3.1 // EFFECTIVE: OCTOBER 2026 // BINDING COMMERCIAL PROTOCOL
          </p>
        </div>

        {/* Terms Body */}
        <div className="space-y-10 text-xs sm:text-sm font-sans text-[var(--text-secondary)] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              01 // COMMERCIAL CONTRACT FORMATION
            </h2>
            <p>
              By accessing the XYDV Technical Division web storefront and transmitting purchase authorization, you agree to be bound by these Terms of Service. All orders represent an offer to purchase tactical apparel subject to inventory verification and fraud prevention screening.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              02 // PRODUCT SPECIFICATIONS & TECHNICAL CLAIMS
            </h2>
            <p>
              All textile metrics (including GSM fiber density, waterproof ratings, breathability indexes, and rebound elasticity) are determined in accredited third-party textile testing laboratories under controlled ambient conditions. Actual performance may vary slightly based on extreme atmospheric environments.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              03 // PRICING, CURRENCIES & BILLING ACCURACY
            </h2>
            <p>
              Prices displayed on the storefront are subject to revision prior to order confirmation. In the event of a typographical pricing anomaly, XYDV reserves the right to cancel affected orders and issue an immediate full refund to the original payment source.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              04 // INTELLECTUAL PROPERTY & TRADEMARKS
            </h2>
            <p>
              The XYDV brandmark, 3D emblem geometry, proprietary fabric names (SweatShield+, AeroFlex, ClimateSync), typography, and CAD deconstruction imagery are protected under international intellectual property conventions. Unauthorized reproduction or reverse engineering is strictly prohibited.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-16 pt-8 border-t border-[var(--border)] flex flex-wrap gap-4 text-xs font-mono">
          <Link href="/privacy" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">
            PRIVACY POLICY ↗
          </Link>
          <Link href="/security" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">
            SECURITY AUDIT ↗
          </Link>
          <Link href="/shipping" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">
            GLOBAL DISPATCH ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
