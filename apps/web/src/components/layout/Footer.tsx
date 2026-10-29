'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, GlobeHemisphereWest, ArrowUpRight } from '@phosphor-icons/react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  return (
    <footer
      role="contentinfo"
      aria-label="XYDV Division Footer"
      className="mt-14 border-t border-[var(--border)] bg-[var(--bg)] pt-14 pb-10 sm:mt-20 sm:pt-20 sm:pb-12"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 md:px-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 border-b border-[var(--border)] pb-12 sm:gap-x-8 sm:gap-y-12 sm:pb-16 lg:grid-cols-5">
          {/* Column 1: Brand & Mission */}
          <div className="col-span-2 flex flex-col justify-between lg:col-span-2">
            <div>
              <Link
                href="/"
                className="inline-block text-[var(--text-primary)] transition-colors hover:text-[var(--text-secondary)] dark:hover:text-[var(--accent)]"
                aria-label="XYDV Home"
              >
                <BrandLogo size="lg" showWordmark={false} />
              </Link>
              <p className="mt-2 font-mono text-[11px] font-semibold tracking-widest text-[var(--text-primary)] uppercase dark:text-[var(--accent)]">
                TECHNICAL ACTIVEWEAR DIVISION
              </p>
              <p className="mt-4 max-w-sm font-sans text-xs leading-relaxed text-[var(--text-secondary)]">
                Engineered for the relentless pursuit. Every garment is constructed with
                high-tenacity fibers, bonded seams, and athletic biomechanics to elevate human
                physical performance.
              </p>
            </div>

            {/* Guarantees */}
            <div className="mt-8 flex flex-wrap gap-4 border-t border-[var(--border)] pt-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-secondary)]">
                <ShieldCheck
                  size={18}
                  className="text-[#15803d] dark:text-[#22c55e]"
                  weight="bold"
                />
                <span>RAZORPAY SECURE GATEWAY</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-secondary)]">
                <GlobeHemisphereWest size={18} className="text-[var(--accent)]" weight="bold" />
                <span>GLOBAL PRIORITY DISPATCH</span>
              </div>
            </div>
          </div>

          {/* Column 2: Collections */}
          <div>
            <h3 className="font-heading mb-4 text-xs font-bold tracking-[0.2em] text-[var(--text-primary)] uppercase">
              COLLECTIONS
            </h3>
            <ul
              className="space-y-1 font-mono text-xs text-[var(--text-secondary)] sm:space-y-2"
              role="list"
            >
              <li>
                <Link
                  href="/products?category=tops"
                  className="inline-block py-2 transition-colors hover:text-[var(--text-primary)] sm:py-1.5"
                >
                  TOPS & BASELAYERS
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=bottoms"
                  className="inline-block py-2 transition-colors hover:text-[var(--text-primary)] sm:py-1.5"
                >
                  BOTTOMS & SHORTS
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=outerwear"
                  className="inline-block py-2 transition-colors hover:text-[var(--text-primary)] sm:py-1.5"
                >
                  TECHNICAL OUTERWEAR
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=accessories"
                  className="inline-block py-2 transition-colors hover:text-[var(--text-primary)] sm:py-1.5"
                >
                  BALLISTIC ACCESSORIES
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1 py-2 text-[var(--text-primary)] transition-colors hover:text-[var(--text-secondary)] sm:py-1.5 dark:text-zinc-200 dark:hover:text-white"
                >
                  <span>FULL ARCHIVE</span>
                  <ArrowUpRight size={12} weight="bold" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Social & Community */}
          <div>
            <h3 className="font-heading mb-4 text-xs font-bold tracking-[0.2em] text-[var(--text-primary)] uppercase">
              COMMUNITY / SOCIAL
            </h3>
            <ul className="space-y-2 font-mono text-xs text-[var(--text-secondary)]" role="list">
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 py-1.5 transition-colors hover:text-[var(--text-primary)] dark:hover:text-[var(--accent)]"
                  aria-label="XYDV on Instagram (opens in new tab)"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                  <span>INSTAGRAM</span>
                </a>
              </li>
              <li>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 py-1.5 transition-colors hover:text-[var(--text-primary)] dark:hover:text-[var(--accent)]"
                  aria-label="XYDV on Facebook (opens in new tab)"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>FACEBOOK</span>
                </a>
              </li>
              <li>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 py-1.5 transition-colors hover:text-[var(--text-primary)] dark:hover:text-[var(--accent)]"
                  aria-label="XYDV on X (opens in new tab)"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>X / TWITTER</span>
                </a>
              </li>
              <li>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 py-1.5 transition-colors hover:text-[var(--text-primary)] dark:hover:text-[var(--accent)]"
                  aria-label="XYDV on YouTube (opens in new tab)"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span>YOUTUBE</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Client Operations */}
          <div className="col-span-2 sm:col-span-1">
            <h3 className="font-heading mb-4 text-xs font-bold tracking-[0.2em] text-[var(--text-primary)] uppercase">
              CLIENT SERVICES
            </h3>
            <ul
              className="space-y-1 font-mono text-xs text-[var(--text-secondary)] sm:space-y-2"
              role="list"
            >
              <li>
                <Link
                  href="/sizing"
                  className="inline-block py-2 transition-colors hover:text-[var(--text-primary)] sm:py-1.5"
                >
                  SIZE & FIT CALCULATOR
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="inline-block py-2 transition-colors hover:text-[var(--text-primary)] sm:py-1.5"
                >
                  GLOBAL DISPATCH & LOGISTICS
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="inline-block py-2 transition-colors hover:text-[var(--text-primary)] sm:py-1.5"
                >
                  30-DAY EXCHANGE PORTAL
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="inline-block py-2 transition-colors hover:text-[var(--text-primary)] sm:py-1.5"
                >
                  TECHNICAL FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="inline-block py-2 transition-colors hover:text-[var(--text-primary)] sm:py-1.5"
                >
                  ATHLETE SUPPORT DESK
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-center font-mono text-[11px] text-[var(--text-muted)] md:flex-row md:text-left">
          <p>© {new Date().getFullYear()} XYDV TECHNICAL DIVISION. ALL RIGHTS RESERVED.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link
              href="/privacy"
              className="inline-block py-2 transition-colors hover:text-[var(--text-primary)] sm:py-1.5"
            >
              PRIVACY POLICY
            </Link>
            <Link
              href="/terms"
              className="inline-block py-2 transition-colors hover:text-[var(--text-primary)] sm:py-1.5"
            >
              TERMS OF SERVICE
            </Link>
            <Link
              href="/security"
              className="inline-block py-2 transition-colors hover:text-[var(--text-primary)] sm:py-1.5"
            >
              SECURITY AUDIT
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
