import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'XYDV Legal & Data Protection Protocol. Encryption, data collection minimalism, and compliance.',
  openGraph: {
    title: 'Privacy Policy | XYDV Technical Division',
    description:
      'XYDV Legal & Data Protection Protocol. Encryption, data collection minimalism, and compliance.',
    type: 'website',
    url: 'https://xydv-performance.com/privacy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] pt-24 pb-24 sm:pt-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 border-b border-[var(--border)] pb-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
              LEGAL & DATA PROTECTION PROTOCOL
            </span>
          </div>
          <h1 className="font-heading text-2xl font-black tracking-tight text-balance text-[var(--text-primary)] uppercase sm:text-3xl md:text-4xl">
            PRIVACY POLICY
          </h1>
          <p className="mt-2 font-mono text-xs text-[var(--text-secondary)] uppercase">
            VERSION 2.4 // LAST AUDITED: OCTOBER 2026 // JURISDICTION: GLOBAL DDP
          </p>
        </div>

        {/* Policy Body */}
        <div className="space-y-10 font-sans text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
          <section className="space-y-3">
            <h2 className="font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase">
              01 // DATA ENCRYPTION & COLLECTION MINIMALISM
            </h2>
            <p>
              XYDV Division collects only the necessary telemetry required to process and dispatch
              high-performance apparel orders, facilitate sizing diagnostics, and secure authentic
              client accounts. We enforce zero data harvesting and zero sale of client data to
              third-party advertising brokers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase">
              02 // TRANSACTION & PAYMENT PROCESSING
            </h2>
            <p>
              All financial transactions are tokenized and processed through our bank-grade partner,
              Razorpay. Sensitive payment card numbers, CVVs, and banking credentials never touch or
              reside on our application servers. Payment sessions are encrypted via 256-bit TLS 1.3
              protocol.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase">
              03 // LOGISTICS & COURIER TELEMETRY
            </h2>
            <p>
              To fulfill physical delivery, your encrypted shipping address and contact telephone
              number are transmitted strictly to licensed global freight handlers (DHL Express
              Worldwide and FedEx Corporation). This telemetry is utilized exclusively for transit
              notifications and DDP customs clearance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase">
              04 // CLIENT RIGHTS & PURGE PROTOCOL
            </h2>
            <p>
              Under GDPR and CCPA directives, every client maintains the absolute right to request
              an encrypted export of their historical profile or initiate a permanent purge of all
              stored records. Inquiries can be transmitted directly to our compliance desk at{' '}
              <a
                href="mailto:privacy@xydv.com"
                className="font-mono text-[var(--text-primary)] underline"
              >
                privacy@xydv.com
              </a>
              .
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-16 flex flex-wrap gap-4 border-t border-[var(--border)] pt-8 font-mono text-xs">
          <Link
            href="/terms"
            className="text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
          >
            TERMS OF SERVICE ↗
          </Link>
          <Link
            href="/security"
            className="text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
          >
            SECURITY AUDIT ↗
          </Link>
          <Link
            href="/contact"
            className="text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
          >
            CLIENT SUPPORT ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
