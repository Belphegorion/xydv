'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { ShoppingBag, MagnifyingGlass, Heart, List, X, User } from '@phosphor-icons/react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { EMIL_EASE, SPRING_TACTILE } from '@/lib/motion';

import { AnnouncementBar } from '@/components/layout/AnnouncementBar';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { useCustomerAuthStore } from '@/store/customerAuth';

const NAV_LINKS = [
  { label: 'ALL GEAR', href: '/products' },
  { label: 'TOPS', href: '/products?category=tops' },
  { label: 'BOTTOMS', href: '/products?category=bottoms' },
  { label: 'OUTERWEAR', href: '/products?category=outerwear' },
  { label: 'ACCESSORIES', href: '/products?category=accessories' },
];

const CANONICAL_LABELS: Record<string, string> = {
  tops: 'TOPS',
  bottoms: 'BOTTOMS',
  outerwear: 'OUTERWEAR',
  accessories: 'ACCESSORIES',
};
const CATEGORY_ORDER = ['tops', 'bottoms', 'outerwear', 'accessories'];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [navLinks, setNavLinks] = useState(NAV_LINKS);

  const itemCount = useCartStore((s) => s.itemCount());
  const openCart = useCartStore((s) => s.openCart);
  const closeCart = useCartStore((s) => s.closeCart);
  const isCartOpen = useCartStore((s) => s.isOpen);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const shouldReduceMotion = useReducedMotion();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const openAuthModal = useCustomerAuthStore((s) => s.openModal);
  const customerUser = useCustomerAuthStore((s) => s.user);
  const isCustomerAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);
  const initCustomerAuth = useCustomerAuthStore((s) => s.initialize);

  useEffect(() => {
    setMounted(true);
    initCustomerAuth();
  }, [initCustomerAuth]);

  // Fetch dynamic categories from DB / API
  useEffect(() => {
    let isMounted = true;
    fetch('/api/categories')
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        const categories = json.data || json.categories || (Array.isArray(json) ? json : []);
        if (Array.isArray(categories) && categories.length > 0) {
          const dynamicLinks = [
            { label: 'ALL GEAR', href: '/products' },
            ...categories
              .sort((a: string | { name?: string; slug?: string }, b: string | { name?: string; slug?: string }) => {
                const slugA = (typeof a === 'string' ? a : (a.slug || a.name || '')).toLowerCase();
                const slugB = (typeof b === 'string' ? b : (b.slug || b.name || '')).toLowerCase();
                const iA = CATEGORY_ORDER.indexOf(slugA);
                const iB = CATEGORY_ORDER.indexOf(slugB);
                return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB);
              })
              .map((c: string | { name?: string; slug?: string }) => {
                const slug = typeof c === 'string' ? c : (c.slug || c.name || '');
                const slugKey = slug.toLowerCase();
                const rawName = typeof c === 'string' ? c : (c.name || c.slug || '');
                const label = CANONICAL_LABELS[slugKey] || rawName.toUpperCase().split(/ [&/]/)[0];
                return {
                  label,
                  href: `/products?category=${slug}`,
                };
              }),
          ];
          setNavLinks(dynamicLinks);
        }
      })
      .catch(() => {
        // Fallback to NAV_LINKS default categories
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const displayItemCount = mounted ? itemCount : 0;
  const displayWishlistCount = mounted ? wishlistCount : 0;

  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '';
  const [heroActive, setHeroActive] = useState(isHome && !shouldReduceMotion);

  // Manage navbar elevation and transparency during scroll-linked hero animation
  useEffect(() => {
    if (!isHome || shouldReduceMotion) {
      setHeroActive(false);
      return;
    }

    let isFinishedLocally = false;

    const checkHeroScroll = () => {
      const heroEl = document.getElementById('hero-section');
      if (!heroEl) {
        setHeroActive(false);
        return;
      }
      const rect = heroEl.getBoundingClientRect();
      // If user has scrolled completely past the hero section, navbar is elevated
      if (rect.bottom <= window.innerHeight + 20) {
        setHeroActive(false);
        return;
      }
      // If user is inside the hero track, respect the sequence completion state
      if (isFinishedLocally) {
        setHeroActive(false);
      } else {
        setHeroActive(true);
      }
    };

    const onHeroStatus = (e: Event) => {
      const customEvent = e as CustomEvent<{ isFinished: boolean; progress: number }>;
      if (customEvent.detail) {
        const progress =
          typeof customEvent.detail.progress === 'number'
            ? customEvent.detail.progress
            : customEvent.detail.isFinished
            ? 1
            : 0;
        isFinishedLocally = progress >= 0.99;
        checkHeroScroll();
      }
    };

    checkHeroScroll();
    window.addEventListener('scroll', checkHeroScroll, { passive: true });
    window.addEventListener('resize', checkHeroScroll, { passive: true });
    window.addEventListener('xydv:hero-animation-status', onHeroStatus as EventListener);
    return () => {
      window.removeEventListener('scroll', checkHeroScroll);
      window.removeEventListener('resize', checkHeroScroll);
      window.removeEventListener('xydv:hero-animation-status', onHeroStatus as EventListener);
    };
  }, [isHome, shouldReduceMotion]);

  const isElevated = !isHome || (!heroActive && scrolled) || mobileOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Mutual exclusivity: Close mobile navigation automatically when cart opens
  useEffect(() => {
    if (isCartOpen && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isCartOpen, mobileOpen]);

  // Close drawer automatically if viewport is resized to desktop breakpoint (>= 768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileOpen]);

  // Close drawer on Escape key, restore focus to trigger, and cycle Tab key focus trap within drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!mobileOpen) return;

      if (e.key === 'Escape') {
        setMobileOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const drawerFocusables = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null || el.offsetWidth > 0);

        const allFocusables = [triggerRef.current, ...drawerFocusables].filter(Boolean) as HTMLElement[];

        if (allFocusables.length === 0) return;

        const first = allFocusables[0];
        const last = allFocusables[allFocusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !drawerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  // Drawer & Cart mutual exclusivity handlers
  const handleOpenCart = () => {
    if (mobileOpen) setMobileOpen(false);
    openCart();
  };

  const toggleMobileOpen = () => {
    setMobileOpen((prev) => {
      const next = !prev;
      if (next && isCartOpen) closeCart();
      return next;
    });
  };

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <header
        role="banner"
        className={`fixed top-0 left-0 right-0 z-40 transition-[transform,opacity,background-color,border-color,box-shadow] duration-300 translate-y-0 opacity-100 pointer-events-auto ${
          mobileOpen
            ? 'bg-[var(--bg)] border-b border-[var(--border)] shadow-sm'
            : isElevated
            ? 'bg-[var(--bg)]/98 backdrop-blur-md border-b border-[var(--border)] shadow-sm'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <AnnouncementBar />

        <nav
          aria-label="Main Navigation"
          className="relative z-50 max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between"
        >
          {/* ============================================================ */}
          {/* LEFT CONTAINER:                                              */}
          {/* - Mobile: 3-lines hamburger menu button                      */}
          {/* - Desktop: Navigation links with kinetic hover indicator     */}
          {/* ============================================================ */}
          <div className="flex items-center">
            {/* Mobile Hamburger Toggle */}
            <div className="lg:hidden flex items-center">
              <button
                ref={triggerRef}
                onClick={toggleMobileOpen}
                aria-label={mobileOpen ? 'Close mobile menu' : 'Open mobile menu'}
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation-drawer"
                className={`touch-target min-w-[48px] min-h-[48px] btn-tactile flex items-center justify-center -ml-2 ${
                  isElevated ? 'text-[var(--text-primary)]' : 'text-white'
                }`}
              >
                {mobileOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav
              aria-label="Main navigation"
              className="hidden lg:flex items-center gap-1.5 md:gap-2 lg:gap-6 relative"
              onMouseLeave={() => setHoveredLink(null)}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onMouseEnter={() => setHoveredLink(link.label)}
                  className={`text-[10px] md:text-[10.5px] lg:text-xs font-mono font-semibold uppercase tracking-[0.08em] md:tracking-[0.10em] lg:tracking-[0.18em] transition-colors relative py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${
                    isElevated
                      ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  <span className="relative z-10">{link.label}</span>
                  {hoveredLink === link.label && (
                    <motion.span
                      layoutId="nav-hover-line"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                        isElevated ? 'bg-[var(--text-primary)] dark:bg-[var(--accent)]' : 'bg-white'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* ============================================================ */}
          {/* CENTER CONTAINER: Brand Emblem + "XYDV" in Montserrat Bold   */}
          {/* Perfectly horizontally centered on both Mobile and Desktop   */}
          {/* ============================================================ */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center pointer-events-auto">
            <Link
              href="/"
              className={`group flex items-center gap-2 sm:gap-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] py-1.5 px-2 ${
                isElevated
                  ? 'text-[var(--text-primary)] hover:text-[var(--text-secondary)] dark:hover:text-[var(--accent)]'
                  : 'text-white hover:text-zinc-200 dark:hover:text-white'
              }`}
              aria-label="XYDV Home"
            >
              <BrandLogo
                size="lg"
                forceWhite={!isElevated}
                showWordmark={false}
                priority
              />
            </Link>
          </div>

          {/* ============================================================ */}
          {/* RIGHT CONTAINER: Action Cluster                              */}
          {/* - Mobile: Search, Cart button with spring bounce badge       */}
          {/* - Desktop: Search, Wishlist, ThemeToggle, Cart button        */}
          {/* ============================================================ */}
          <div className="flex items-center gap-1 sm:gap-2 relative z-10">
            {/* Quick Search - visible on all viewports */}
            <Link
              href="/products?search=true"
              aria-label="Search catalog"
              className={`touch-target min-w-[48px] min-h-[48px] btn-tactile transition-colors ${
                isElevated
                  ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              <MagnifyingGlass size={20} weight="bold" />
            </Link>

            {/* Wishlist - hidden on mobile header, visible on desktop */}
            <div className="hidden md:flex items-center">
              <Link
                href="/wishlist"
                aria-label="Wishlist saved items"
                className={`touch-target min-w-[48px] min-h-[48px] btn-tactile transition-colors ${
                  isElevated
                    ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <Heart size={20} weight="bold" />
              </Link>
            </div>

            {/* Customer Account Button - desktop */}
            <div className="hidden md:flex items-center">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                aria-label={isCustomerAuthenticated ? `Account: ${customerUser?.name || 'Athlete'}` : 'Sign in to account'}
                className={`touch-target min-w-[48px] min-h-[48px] btn-tactile transition-colors relative ${
                  isElevated
                    ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <User size={20} weight={isCustomerAuthenticated ? 'fill' : 'bold'} />
                {isCustomerAuthenticated && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--accent)]" />
                )}
              </button>
            </div>

            {/* Light / Dark Mode Toggle - hidden on mobile header, visible on desktop */}
            <div className="hidden md:flex items-center">
              <ThemeToggle />
            </div>

            {/* Cart Trigger with Spring Bounce Badge - visible on all viewports */}
            <button
              onClick={handleOpenCart}
              aria-label={`Open shopping cart — ${displayItemCount} items`}
              className={`touch-target min-w-[48px] min-h-[48px] btn-tactile transition-colors relative ${
                isElevated
                  ? 'text-[var(--text-primary)] hover:text-[var(--text-secondary)] dark:hover:text-[var(--accent)]'
                  : 'text-white hover:text-zinc-200 dark:hover:text-white'
              }`}
            >
              <ShoppingBag size={20} weight="bold" />
              <AnimatePresence>
                {displayItemCount > 0 && (
                  <motion.span
                    key={displayItemCount}
                    initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
                    transition={SPRING_TACTILE}
                    className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 bg-[var(--accent)] text-white dark:text-[#0a0a0a] border border-black/20 dark:border-transparent text-[10px] font-mono font-bold shadow-sm"
                  >
                    {displayItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </nav>

      {/* Mobile Navigation Drawer Dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={drawerRef}
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: EMIL_EASE }}
            className="md:hidden absolute inset-x-0 top-full bg-[var(--bg)] border-b border-[var(--border)] p-4 sm:p-6 shadow-2xl z-50 max-h-[calc(100dvh-6rem)] overflow-y-auto pb-[max(2.5rem,env(safe-area-inset-bottom))]"
          >
              <nav aria-label="Mobile navigation" className="flex flex-col space-y-1">
                {navLinks.map((link, idx) => (
                  <motion.div
                    key={link.label}
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.15,
                      delay: shouldReduceMotion ? 0 : idx * 0.04,
                      ease: EMIL_EASE,
                    }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="min-h-[48px] flex items-center justify-between text-[var(--text-primary)] text-sm sm:text-base font-heading font-bold uppercase tracking-wider py-3.5 px-3 border-b border-[var(--border)]/40 hover:text-[var(--accent)] transition-colors active:scale-[0.98]"
                    >
                      <span>{link.label}</span>
                      <span className="text-xs font-mono text-[var(--text-muted)]">→</span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Utility / Extra Links in Drawer (Account + Wishlist + Theme Toggle) */}
              <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-2">
                {/* Customer Account Trigger in Drawer */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full min-h-[48px] flex items-center justify-between p-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2.5">
                    <User size={18} weight={isCustomerAuthenticated ? 'fill' : 'bold'} />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">
                      {isCustomerAuthenticated ? (customerUser?.name || 'ATHLETE ACCOUNT').toUpperCase() : 'ATHLETE ACCESS / SIGN IN'}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[var(--text-muted)]">↗</span>
                </button>

                {/* Wishlist Link with Live Badge */}
                <Link
                  href="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="min-h-[48px] flex items-center justify-between p-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2.5">
                    <Heart size={18} weight="bold" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">SAVED WISHLIST</span>
                  </div>
                  {displayWishlistCount > 0 ? (
                    <span className="px-2 py-0.5 bg-[var(--accent)] text-white dark:text-[#0a0a0a] text-[10px] font-mono font-bold">
                      {displayWishlistCount}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">0 ITEMS</span>
                  )}
                </Link>

                {/* Appearance / Theme Toggle Row */}
                <div className="min-h-[48px] flex items-center justify-between p-3 bg-[var(--bg-elevated)] border border-[var(--border)]">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    APPEARANCE / THEME
                  </span>
                  <ThemeToggle />
                </div>
              </div>

              {/* Secondary Utility Links */}
              <div className="mt-4 pt-3 border-t border-[var(--border)] grid grid-cols-1 gap-2 text-xs font-mono">
                <Link
                  href="/sizing"
                  onClick={() => setMobileOpen(false)}
                  className="min-h-[48px] flex items-center justify-between px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors active:scale-[0.98]"
                >
                  <span>SIZING & FIT CALCULATOR</span>
                  <span className="text-[var(--text-muted)]">↗</span>
                </Link>
                <Link
                  href="/shipping"
                  onClick={() => setMobileOpen(false)}
                  className="min-h-[48px] flex items-center justify-between px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors active:scale-[0.98]"
                >
                  <span>GLOBAL DISPATCH</span>
                  <span className="text-[var(--text-muted)]">↗</span>
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="min-h-[48px] flex items-center justify-between px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors active:scale-[0.98]"
                >
                  <span>CLIENT SUPPORT</span>
                  <span className="text-[var(--text-muted)]">↗</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Backdrop Overlay — Rendered OUTSIDE <header> to cover the whole viewport at z-30 */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EMIL_EASE }}
            className="md:hidden fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm z-30"
            onClick={() => {
              setMobileOpen(false);
              triggerRef.current?.focus();
            }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
}
