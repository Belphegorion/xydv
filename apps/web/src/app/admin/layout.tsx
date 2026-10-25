'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AdminGuard } from '../../components/admin/AdminGuard';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminTopBar } from '../../components/admin/AdminTopBar';
import { api } from '../../lib/api';
import { useAdminAuthStore } from '../../store/adminAuth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const { isAuthenticated } = useAdminAuthStore();

  const isLoginPage = pathname === '/admin/login';

  // Fetch low stock count for sidebar notification badge
  useEffect(() => {
    if (!isAuthenticated || isLoginPage) return;

    let isMounted = true;
    api
      .get<{ count: number }>('/admin/inventory/low-stock?threshold=5')
      .then((res) => {
        if (isMounted && typeof res?.count === 'number') {
          setLowStockCount(res.count);
        }
      })
      .catch(() => {
        // Silently catch in case of offline / initial setup
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isLoginPage]);

  return (
    <AdminGuard>
      {isLoginPage ? (
        <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-4 text-[var(--text-primary)]">
          {children}
        </main>
      ) : (
        <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
          <AdminSidebar
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
            lowStockCount={lowStockCount}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <AdminTopBar onOpenMobile={() => setMobileOpen(true)} mobileOpen={mobileOpen} />
            <main className="flex-1 overflow-y-auto bg-[var(--bg)] p-4 sm:p-6 lg:p-8">
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}
