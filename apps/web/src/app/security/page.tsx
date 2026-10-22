import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, LockKey, Key, CheckCircle } from '@phosphor-icons/react';

export const metadata: Metadata = {
  title: 'Security Protocol',
  description: 'XYDV Infrastructure & Payment Security Audit. SOC 2 Type II and PCI-DSS Level 1 compliant architecture.',
  openGraph: {
    title: 'Security Protocol | XYDV Technical Division',
    description: 'XYDV Infrastructure & Payment Security Audit. SOC 2 Type II and PCI-DSS Level 1 compliant architecture.',
    type: 'website',
    url: 'https://xydv-performance.com/security',
  },
};

export default function SecurityAuditPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] pt-24 sm:pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="border-b border-[var(--border)] pb-8 mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
              INFRASTRUCTURE & PAYMENT SECURITY AUDIT
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight font-heading text-[var(--text-primary)]">
            SECURITY PROTOCOL
          </h1>
          <p className="text-[var(--text-secondary)] text-xs font-mono mt-2 uppercase">
            AUDIT BENCHMARK: SOC 2 TYPE II & PCI-DSS LEVEL 1 COMPLIANT ARCHITECTURE
          </p>
        </div>

        {/* Security Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
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
            <div key={item.title} className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400">
                VERIFIED STANDARD
              </span>
              <h3 className="text-sm font-heading font-black uppercase text-[var(--text-primary)]">{item.title}</h3>
              <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Audit Body */}
        <div className="space-y-10 text-xs sm:text-sm font-sans text-[var(--text-secondary)] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              01 // PAYMENT GATEWAY ENCLAVE ARCHITECTURE
            </h2>
            <p>
              The XYDV storefront never receives, stores, or handles unencrypted payment card information. All cardholder interactions take place inside an isolated, tokenized iframe modal provided directly by Razorpay (PCI-DSS certified). Client financial telemetry is insulated from browser extensions and malicious scripts.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              02 // NEXT.JS APPLICATION HARDENING
            </h2>
            <p>
              Our storefront is engineered on Next.js 15 with strict Content Security Policies (CSP), HTTP Strict Transport Security (HSTS), and anti-clickjacking headers (`X-Frame-Options: SAMEORIGIN`). Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF) protections are enforced at the edge routing layer.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              03 // VULNERABILITY DISCLOSURE PROGRAM
            </h2>
            <p>
              We welcome responsible security research from certified ethical disclosure partners. If you identify a potential security boundary issue or anomalous vector in our storefront, please report findings directly to our security team at{' '}
              <a href="mailto:security@xydv.com" className="text-[var(--text-primary)] underline font-mono">
                security@xydv.com
              </a>
              . Confirmed reports are eligible for recognition and bug bounty compensation.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-16 pt-8 border-t border-[var(--border)] flex flex-wrap gap-4 text-xs font-mono">
          <Link href="/privacy" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">
            PRIVACY POLICY ↗
          </Link>
          <Link href="/terms" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">
            TERMS OF SERVICE ↗
          </Link>
          <Link href="/contact" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">
            CONTACT DESK ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
