import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'XYDV Legal & Data Protection Protocol. Encryption, data collection minimalism, and compliance.',
  openGraph: {
    title: 'Privacy Policy | XYDV Technical Division',
    description: 'XYDV Legal & Data Protection Protocol. Encryption, data collection minimalism, and compliance.',
    type: 'website',
    url: 'https://xydv-performance.com/privacy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] pt-24 sm:pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="border-b border-[var(--border)] pb-8 mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
              LEGAL & DATA PROTECTION PROTOCOL
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight font-heading text-[var(--text-primary)]">
            PRIVACY POLICY
          </h1>
          <p className="text-[var(--text-secondary)] text-xs font-mono mt-2 uppercase">
            VERSION 2.4 // LAST AUDITED: OCTOBER 2026 // JURISDICTION: GLOBAL DDP
          </p>
        </div>

        {/* Policy Body */}
        <div className="space-y-10 text-xs sm:text-sm font-sans text-[var(--text-secondary)] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              01 // DATA ENCRYPTION & COLLECTION MINIMALISM
            </h2>
            <p>
              XYDV Division collects only the necessary telemetry required to process and dispatch high-performance apparel orders, facilitate sizing diagnostics, and secure authentic client accounts. We enforce zero data harvesting and zero sale of client data to third-party advertising brokers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              02 // TRANSACTION & PAYMENT PROCESSING
            </h2>
            <p>
              All financial transactions are tokenized and processed through our bank-grade partner, Razorpay. Sensitive payment card numbers, CVVs, and banking credentials never touch or reside on our application servers. Payment sessions are encrypted via 256-bit TLS 1.3 protocol.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              03 // LOGISTICS & COURIER TELEMETRY
            </h2>
            <p>
              To fulfill physical delivery, your encrypted shipping address and contact telephone number are transmitted strictly to licensed global freight handlers (DHL Express Worldwide and FedEx Corporation). This telemetry is utilized exclusively for transit notifications and DDP customs clearance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              04 // CLIENT RIGHTS & PURGE PROTOCOL
            </h2>
            <p>
              Under GDPR and CCPA directives, every client maintains the absolute right to request an encrypted export of their historical profile or initiate a permanent purge of all stored records. Inquiries can be transmitted directly to our compliance desk at{' '}
              <a href="mailto:privacy@xydv.com" className="text-[var(--text-primary)] underline font-mono">
                privacy@xydv.com
              </a>
              .
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-16 pt-8 border-t border-[var(--border)] flex flex-wrap gap-4 text-xs font-mono">
          <Link href="/terms" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">
            TERMS OF SERVICE ↗
          </Link>
          <Link href="/security" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">
            SECURITY AUDIT ↗
          </Link>
          <Link href="/contact" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">
            CLIENT SUPPORT ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
