'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  House,
  ChartLineUp,
  ShoppingBag,
  Tag,
  Receipt,
  Warehouse,
  Users,
  SignOut,
  ArrowSquareOut,
  X,
  Gear,
  ChatText,
  Bell,
  Ticket,
  Percent,
} from '@phosphor-icons/react';
import { BrandLogo } from '../ui/BrandLogo';
import { useAdminAuthStore } from '../../store/adminAuth';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  lowStockCount?: number;
}

export function AdminSidebar({
  mobileOpen = false,
  onCloseMobile,
  lowStockCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuthStore();

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: House, exact: true },
    { label: 'Analytics', href: '/admin#analytics', icon: ChartLineUp },
    { label: 'Products', href: '/admin/products', icon: ShoppingBag },
    { label: 'Categories', href: '/admin/categories', icon: Tag },
    { label: 'Orders', href: '/admin/orders', icon: Receipt },
    {
      label: 'Inventory',
      href: '/admin/inventory',
      icon: Warehouse,
      badge: lowStockCount > 0 ? String(lowStockCount) : undefined,
    },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Notifications', href: '/admin/notifications', icon: Bell },
    { label: 'Discounts', href: '/admin/discounts', icon: Percent },
    { label: 'Coupons', href: '/admin/coupons', icon: Ticket },
    { label: 'Support Tickets', href: '/admin/tickets', icon: ChatText },
    { label: 'Settings', href: '/admin/settings', icon: Gear },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between border-r border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)]">
      {/* Brand Header */}
      <div>
        <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-5">
          <Link
            href="/admin"
            className="group flex items-center gap-2.5"
            aria-label="XYDV Admin Control"
          >
            <BrandLogo size={28} showWordmark={false} />
            <span className="font-mono text-sm font-bold tracking-widest text-[var(--text-primary)] dark:text-[#e8ff00]">
              XYDV
            </span>
            <span className="h-3 w-[1px] bg-[var(--border)]" />
            <span className="font-mono text-[10px] tracking-wider text-[var(--text-muted)] uppercase transition-colors group-hover:text-[var(--text-primary)]">
              ADMIN CONTROL
            </span>
          </Link>

          {mobileOpen && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="touch-target btn-tactile p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] lg:hidden"
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 p-3" aria-label="Admin Navigation">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : item.href.includes('#')
                ? false
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`group flex items-center justify-between px-3 py-2.5 font-mono text-xs tracking-wider uppercase transition-[background-color,color] duration-150 ${
                  isActive
                    ? 'border-l-2 border-[var(--text-primary)] bg-[var(--bg-elevated)] font-bold text-[var(--text-primary)] dark:border-[#e8ff00]'
                    : 'border-l-2 border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={
                      isActive
                        ? 'text-[var(--text-primary)] dark:text-[#e8ff00]'
                        : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                    }
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="rounded-none border border-[#b91c1c]/30 bg-[#b91c1c]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#b91c1c] dark:border-[#ff3b3b]/30 dark:bg-[#ff3b3b]/10 dark:text-[#ff3b3b]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User / Storefront */}
      <div className="space-y-3 border-t border-[var(--border)] p-4">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 font-mono text-[11px] tracking-wider text-[var(--text-muted)] uppercase transition-colors hover:text-[var(--text-primary)]"
        >
          <span>View Live Storefront</span>
          <ArrowSquareOut size={14} />
        </Link>

        <div className="rounded-none border border-[var(--border)] bg-[var(--bg-surface)] p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                {user?.name || 'Administrator'}
              </p>
              <p className="truncate font-mono text-[10px] text-[var(--text-muted)]">
                {user?.email || 'admin@xydv.com'}
              </p>
            </div>
            <span className="flex-shrink-0 rounded-none border border-[var(--border)] bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-[var(--text-secondary)] uppercase dark:border-[#e8ff00]/40 dark:bg-[#e8ff00]/10 dark:text-[#e8ff00]">
              ADMIN
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="btn-tactile flex w-full items-center justify-center gap-2 rounded-none border border-[var(--border)] bg-transparent py-1.5 font-mono text-[10px] tracking-wider text-[var(--text-secondary)] uppercase transition-colors hover:border-[#b91c1c]/40 hover:bg-[#b91c1c]/10 hover:text-[#b91c1c] active:scale-[0.97] dark:hover:border-[#ff3b3b]/40 dark:hover:bg-[#ff3b3b]/10 dark:hover:text-[#ff3b3b]"
          >
            <SignOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-shrink-0 lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
