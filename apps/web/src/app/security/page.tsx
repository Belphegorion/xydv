import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, LockKey, Key, CheckCircle } from '@phosphor-icons/react';

export const metadata: Metadata = {
  title: 'Security Protocol',
  description:
    'XYDV Infrastructure & Payment Security Audit. SOC 2 Type II and PCI-DSS Level 1 compliant architecture.',
  openGraph: {
    title: 'Security Protocol | XYDV Technical Division',
    description:
      'XYDV Infrastructure & Payment Security Audit. SOC 2 Type II and PCI-DSS Level 1 compliant architecture.',
    type: 'website',
    url: 'https://xydv-performance.com/security',
  },
};

export default function SecurityAuditPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] pt-24 pb-24 sm:pt-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 border-b border-[var(--border)] pb-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
              INFRASTRUCTURE & PAYMENT SECURITY AUDIT
            </span>
          </div>
          <h1 className="font-heading text-2xl font-black tracking-tight text-balance text-[var(--text-primary)] uppercase sm:text-3xl md:text-4xl">
            SECURITY PROTOCOL
          </h1>
          <p className="mt-2 font-mono text-xs text-[var(--text-secondary)] uppercase">
            AUDIT BENCHMARK: SOC 2 TYPE II & PCI-DSS LEVEL 1 COMPLIANT ARCHITECTURE
          </p>
        </div>

        {/* Security Metric Badges */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              title: 'PCI-DSS LEVEL 1',
              desc: 'Highest tier of payment card data security certified via Razorpay.',
            },
            {
              title: 'TLS 1.3 256-BIT',
              desc: 'End-to-end transport layer encryption on all sessions and API calls.',
            },
            {
              title: 'HERMETIC CHECKS',
              desc: 'Continuous automated cryptographic boundary verification.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="space-y-2 border border-[var(--border)] bg-[var(--bg-surface)] p-5"
            >
              <span className="font-mono text-[10px] font-bold text-emerald-600 uppercase dark:text-emerald-400">
                VERIFIED STANDARD
              </span>
              <h3 className="font-heading text-sm font-black text-[var(--text-primary)] uppercase">
                {item.title}
              </h3>
              <p className="font-sans text-xs leading-relaxed text-[var(--text-secondary)]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Audit Body */}
        <div className="space-y-10 font-sans text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
          <section className="space-y-3">
            <h2 className="font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase">
              01 // PAYMENT GATEWAY ENCLAVE ARCHITECTURE
            </h2>
            <p>
              The XYDV storefront never receives, stores, or handles unencrypted payment card
              information. All cardholder interactions take place inside an isolated, tokenized
              iframe modal provided directly by Razorpay (PCI-DSS certified). Client financial
              telemetry is insulated from browser extensions and malicious scripts.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase">
              02 // NEXT.JS APPLICATION HARDENING
            </h2>
            <p>
              Our storefront is engineered on Next.js 15 with strict Content Security Policies
              (CSP), HTTP Strict Transport Security (HSTS), and anti-clickjacking headers
              (`X-Frame-Options: SAMEORIGIN`). Cross-Site Scripting (XSS) and Cross-Site Request
              Forgery (CSRF) protections are enforced at the edge routing layer.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase">
              03 // VULNERABILITY DISCLOSURE PROGRAM
            </h2>
            <p>
              We welcome responsible security research from certified ethical disclosure partners.
              If you identify a potential security boundary issue or anomalous vector in our
              storefront, please report findings directly to our security team at{' '}
              <a
                href="mailto:security@xydv.com"
                className="font-mono text-[var(--text-primary)] underline"
              >
                security@xydv.com
              </a>
              . Confirmed reports are eligible for recognition and bug bounty compensation.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-16 flex flex-wrap gap-4 border-t border-[var(--border)] pt-8 font-mono text-xs">
          <Link
            href="/privacy"
            className="text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
          >
            PRIVACY POLICY ↗
          </Link>
          <Link
            href="/terms"
            className="text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
          >
            TERMS OF SERVICE ↗
          </Link>
          <Link
            href="/contact"
            className="text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
          >
            CONTACT DESK ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
