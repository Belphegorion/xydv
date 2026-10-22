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

          {/* Column 3: Technical Science */}
          <div>
            <h3 className="font-heading mb-4 text-xs font-bold tracking-[0.2em] text-[var(--text-primary)] uppercase">
              TEXTILE SCIENCE
            </h3>
            <ul className="space-y-2.5 font-mono text-xs text-[var(--text-secondary)]" role="list">
              <li>
                <span className="font-semibold text-[var(--text-primary)]">SWEATSHIELD+</span>
                <span className="block text-[10px] text-[var(--text-muted)]">
                  MOISTURE REGULATION
                </span>
              </li>
              <li>
                <span className="font-semibold text-[var(--text-primary)]">AEROFLEX 4-WAY</span>
                <span className="block text-[10px] text-[var(--text-muted)]">
                  BALLISTIC ELASTICITY
                </span>
              </li>
              <li>
                <span className="font-semibold text-[var(--text-primary)]">CLIMATESYNC</span>
                <span className="block text-[10px] text-[var(--text-muted)]">
                  420 GSM THERMAL GRID
                </span>
              </li>
              <li>
                <span className="font-semibold text-[var(--text-primary)]">CORDURA® 500D</span>
                <span className="block text-[10px] text-[var(--text-muted)]">
                  FRICTION REINFORCEMENT
                </span>
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
