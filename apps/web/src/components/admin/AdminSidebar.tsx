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
} from '@phosphor-icons/react';
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
    { label: 'Settings', href: '/admin/settings', icon: Gear },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between border-r border-[#1f1f1f] bg-[#0a0a0a] text-[#f5f5f5]">
      {/* Brand Header */}
      <div>
        <div className="flex h-16 items-center justify-between border-b border-[#1f1f1f] px-6">
          <Link href="/admin" className="group flex items-center gap-2.5">
            <span className="font-mono text-sm font-bold tracking-widest text-[#e8ff00]">XYDV</span>
            <span className="h-3 w-[1px] bg-[#333333]" />
            <span className="font-mono text-[10px] tracking-wider text-[#a0a0a0] uppercase transition-colors group-hover:text-[#f5f5f5]">
              ADMIN CONTROL
            </span>
          </Link>

          {mobileOpen && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 text-[#a0a0a0] hover:text-[#f5f5f5] lg:hidden"
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
                    ? 'border-l-2 border-[#e8ff00] bg-[#181818] text-[#f5f5f5]'
                    : 'text-[#a0a0a0] hover:bg-[#141414] hover:text-[#f5f5f5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={
                      isActive ? 'text-[#e8ff00]' : 'text-[#71717a] group-hover:text-[#f5f5f5]'
                    }
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="rounded bg-[#ff3b3b]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#ff3b3b]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User / Storefront */}
      <div className="space-y-3 border-t border-[#1f1f1f] p-4">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 font-mono text-[11px] tracking-wider text-[#71717a] uppercase transition-colors hover:text-[#f5f5f5]"
        >
          <span>View Live Storefront</span>
          <ArrowSquareOut size={14} />
        </Link>

        <div className="rounded border border-[#1f1f1f] bg-[#111111] p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="truncate text-xs font-medium text-[#f5f5f5]">
                {user?.name || 'Administrator'}
              </p>
              <p className="truncate font-mono text-[10px] text-[#71717a]">
                {user?.email || 'admin@xydv.com'}
              </p>
            </div>
            <span className="flex-shrink-0 rounded bg-[#e8ff00]/10 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-[#e8ff00] uppercase">
              ADMIN
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded border border-[#1f1f1f] bg-transparent py-1.5 font-mono text-[10px] tracking-wider text-[#a0a0a0] uppercase transition-colors hover:border-[#ff3b3b]/40 hover:bg-[#ff3b3b]/10 hover:text-[#ff3b3b] active:scale-[0.97]"
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
