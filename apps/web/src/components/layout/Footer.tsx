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
      className="bg-[var(--bg)] border-t border-[var(--border)] pt-14 sm:pt-20 pb-10 sm:pb-12 mt-14 sm:mt-20"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12 pb-12 sm:pb-16 border-b border-[var(--border)]">
          {/* Column 1: Brand & Mission */}
          <div className="col-span-2 lg:col-span-2 flex flex-col justify-between">
            <div>
              <Link
                href="/"
                className="text-[var(--text-primary)] hover:text-[var(--text-secondary)] dark:hover:text-[var(--accent)] transition-colors inline-block"
                aria-label="XYDV Home"
              >
                <BrandLogo size="lg" showWordmark={false} />
              </Link>
              <p className="text-[var(--text-primary)] dark:text-[var(--accent)] text-[11px] font-mono font-semibold tracking-widest uppercase mt-2">
                TECHNICAL ACTIVEWEAR DIVISION
              </p>
              <p className="text-[var(--text-secondary)] text-xs font-sans mt-4 max-w-sm leading-relaxed">
                Engineered for the relentless pursuit. Every garment is constructed with high-tenacity fibers, bonded seams, and athletic biomechanics to elevate human physical performance.
              </p>
            </div>

            {/* Guarantees */}
            <div className="mt-8 flex flex-wrap gap-4 pt-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                <ShieldCheck size={18} className="text-[#15803d] dark:text-[#22c55e]" weight="bold" />
                <span>RAZORPAY SECURE GATEWAY</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                <GlobeHemisphereWest size={18} className="text-[var(--accent)]" weight="bold" />
                <span>GLOBAL PRIORITY DISPATCH</span>
              </div>
            </div>
          </div>

          {/* Column 2: Collections */}
          <div>
            <h3 className="text-[var(--text-primary)] text-xs font-bold uppercase tracking-[0.2em] font-heading mb-4">
              COLLECTIONS
            </h3>
            <ul className="space-y-1 sm:space-y-2 text-xs font-mono text-[var(--text-secondary)]" role="list">
              <li>
                <Link href="/products?category=tops" className="hover:text-[var(--text-primary)] transition-colors py-2 sm:py-1.5 inline-block">
                  TOPS & BASELAYERS
                </Link>
              </li>
              <li>
                <Link href="/products?category=bottoms" className="hover:text-[var(--text-primary)] transition-colors py-2 sm:py-1.5 inline-block">
                  BOTTOMS & SHORTS
                </Link>
              </li>
              <li>
                <Link href="/products?category=outerwear" className="hover:text-[var(--text-primary)] transition-colors py-2 sm:py-1.5 inline-block">
                  TECHNICAL OUTERWEAR
                </Link>
              </li>
              <li>
                <Link href="/products?category=accessories" className="hover:text-[var(--text-primary)] transition-colors py-2 sm:py-1.5 inline-block">
                  BALLISTIC ACCESSORIES
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-[var(--text-primary)] dark:text-zinc-200 hover:text-[var(--text-secondary)] dark:hover:text-white transition-colors inline-flex items-center gap-1 py-2 sm:py-1.5"
                >
                  <span>FULL ARCHIVE</span>
                  <ArrowUpRight size={12} weight="bold" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Technical Science */}
          <div>
            <h3 className="text-[var(--text-primary)] text-xs font-bold uppercase tracking-[0.2em] font-heading mb-4">
              TEXTILE SCIENCE
            </h3>
            <ul className="space-y-2.5 text-xs font-mono text-[var(--text-secondary)]" role="list">
              <li>
                <span className="text-[var(--text-primary)] font-semibold">SWEATSHIELD+</span>
                <span className="block text-[10px] text-[var(--text-muted)]">MOISTURE REGULATION</span>
              </li>
              <li>
                <span className="text-[var(--text-primary)] font-semibold">AEROFLEX 4-WAY</span>
                <span className="block text-[10px] text-[var(--text-muted)]">BALLISTIC ELASTICITY</span>
              </li>
              <li>
                <span className="text-[var(--text-primary)] font-semibold">CLIMATESYNC</span>
                <span className="block text-[10px] text-[var(--text-muted)]">420 GSM THERMAL GRID</span>
              </li>
              <li>
                <span className="text-[var(--text-primary)] font-semibold">CORDURA® 500D</span>
                <span className="block text-[10px] text-[var(--text-muted)]">FRICTION REINFORCEMENT</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Client Operations */}
          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-[var(--text-primary)] text-xs font-bold uppercase tracking-[0.2em] font-heading mb-4">
              CLIENT SERVICES
            </h3>
            <ul className="space-y-1 sm:space-y-2 text-xs font-mono text-[var(--text-secondary)]" role="list">
              <li>
                <Link href="/sizing" className="hover:text-[var(--text-primary)] transition-colors py-2 sm:py-1.5 inline-block">
                  SIZE & FIT CALCULATOR
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-[var(--text-primary)] transition-colors py-2 sm:py-1.5 inline-block">
                  GLOBAL DISPATCH & LOGISTICS
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-[var(--text-primary)] transition-colors py-2 sm:py-1.5 inline-block">
                  30-DAY EXCHANGE PORTAL
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[var(--text-primary)] transition-colors py-2 sm:py-1.5 inline-block">
                  TECHNICAL FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[var(--text-primary)] transition-colors py-2 sm:py-1.5 inline-block">
                  ATHLETE SUPPORT DESK
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[var(--text-muted)] text-[11px] font-mono text-center md:text-left">
          <p>© {new Date().getFullYear()} XYDV TECHNICAL DIVISION. ALL RIGHTS RESERVED.</p>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
            <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors py-2 sm:py-1.5 inline-block">
              PRIVACY POLICY
            </Link>
            <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors py-2 sm:py-1.5 inline-block">
              TERMS OF SERVICE
            </Link>
            <Link href="/security" className="hover:text-[var(--text-primary)] transition-colors py-2 sm:py-1.5 inline-block">
              SECURITY AUDIT
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
