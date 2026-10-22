'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List, ArrowSquareOut } from '@phosphor-icons/react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAdminAuthStore } from '../../store/adminAuth';

interface AdminTopBarProps {
  onOpenMobile?: () => void;
}

export function AdminTopBar({ onOpenMobile }: AdminTopBarProps) {
  const pathname = usePathname();
  const { user } = useAdminAuthStore();

  const getPageTitle = (path: string): string => {
    if (path === '/admin') return 'Dashboard Overview';
    if (path.startsWith('/admin/products')) return 'Catalog & Products';
    if (path.startsWith('/admin/categories')) return 'Category Management';
    if (path.startsWith('/admin/orders')) return 'Order Fulfillment';
    if (path.startsWith('/admin/inventory')) return 'Inventory Control';
    if (path.startsWith('/admin/customers')) return 'Customer Management';
    return 'Admin Console';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#1f1f1f] bg-[#0a0a0a]/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {onOpenMobile && (
          <button
            type="button"
            onClick={onOpenMobile}
            className="p-2 text-[#a0a0a0] hover:text-[#f5f5f5] lg:hidden"
            aria-label="Open navigation menu"
          >
            <List size={22} />
          </button>
        )}

        <div>
          <h1 className="font-mono text-sm font-bold uppercase tracking-wider text-[#f5f5f5]">
            {getPageTitle(pathname)}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#71717a]">
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
          className="hidden sm:inline-flex items-center gap-1.5 rounded border border-[#1f1f1f] bg-[#111111] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#a0a0a0] hover:border-[#333333] hover:text-[#f5f5f5] transition-colors"
        >
          <span>Store</span>
          <ArrowSquareOut size={13} />
        </Link>

        <ThemeToggle />

        <div className="flex items-center gap-2 pl-2 border-l border-[#1f1f1f]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#181818] border border-[#262626] text-xs font-mono font-bold text-[#e8ff00]">
            {(user?.name || 'A')[0].toUpperCase()}
          </div>
          <span className="hidden md:inline-block font-mono text-xs uppercase tracking-wider text-[#f5f5f5]">
            {user?.name?.split(' ')[0] || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  );
}
