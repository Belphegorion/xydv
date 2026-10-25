'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List, ArrowSquareOut } from '@phosphor-icons/react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAdminAuthStore } from '../../store/adminAuth';

interface AdminTopBarProps {
  onOpenMobile?: () => void;
  mobileOpen?: boolean;
}

export function AdminTopBar({ onOpenMobile, mobileOpen = false }: AdminTopBarProps) {
  const pathname = usePathname();
  const { user } = useAdminAuthStore();

  const getPageTitle = (path: string): string => {
    if (path === '/admin') return 'Dashboard Overview';
    if (path.startsWith('/admin/products')) return 'Catalog & Products';
    if (path.startsWith('/admin/categories')) return 'Category Management';
    if (path.startsWith('/admin/orders')) return 'Order Fulfillment';
    if (path.startsWith('/admin/inventory')) return 'Inventory Control';
    if (path.startsWith('/admin/customers')) return 'Customer Management';
    if (path.startsWith('/admin/discounts')) return 'Discounts & Promotional Pricing';
    if (path.startsWith('/admin/coupons')) return 'Coupons & Vouchers';
    if (path.startsWith('/admin/notifications')) return 'Announcement Popups';
    if (path.startsWith('/admin/tickets')) return 'Customer Support Tickets';
    if (path.startsWith('/admin/settings')) return 'Store Settings';
    return 'Admin Console';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        {onOpenMobile && (
          <button
            type="button"
            onClick={onOpenMobile}
            className="touch-target btn-tactile p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] lg:!hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="admin-mobile-drawer"
          >
            <List size={22} />
          </button>
        )}

        <div>
          <h1 className="font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] uppercase">
            {getPageTitle(pathname)}
          </h1>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#15803d] dark:bg-[#22c55e]" />
            <span className="font-mono text-[10px] tracking-widest text-[var(--text-muted)] uppercase">
              API Synchronized
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 font-mono text-[11px] tracking-wider text-[var(--text-secondary)] uppercase transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] sm:inline-flex"
        >
          <span>Store</span>
          <ArrowSquareOut size={13} />
        </Link>

        <ThemeToggle />

        <div className="flex items-center gap-2 border-l border-[var(--border)] pl-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] font-mono text-xs font-bold text-[var(--text-primary)] dark:text-[#e8ff00]">
            {(user?.name || 'A')[0].toUpperCase()}
          </div>
          <span className="hidden font-mono text-xs tracking-wider text-[var(--text-primary)] uppercase md:inline-block">
            {user?.name?.split(' ')[0] || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  );
}
