'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuthStore } from '../../store/adminAuth';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, initialize } = useAdminAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      await initialize();
      if (active) {
        setMounted(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [initialize]);

  useEffect(() => {
    if (!mounted) return;

    const isLoginPage = pathname === '/admin/login';

    if (!isAuthenticated && !isLoginPage) {
      router.replace('/admin/login');
    } else if (isAuthenticated && isLoginPage) {
      router.replace('/admin');
    }
  }, [mounted, isAuthenticated, pathname, router]);

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg)] text-[var(--text-primary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--text-primary)] border-t-transparent dark:border-[#e8ff00] dark:border-t-transparent" />
          <span className="font-mono text-xs tracking-widest text-[var(--text-muted)] uppercase">
            Initializing XYDV Control...
          </span>
        </div>
      </div>
    );
  }

  const isLoginPage = pathname === '/admin/login';
  if (!isAuthenticated && !isLoginPage) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg)] text-[var(--text-primary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--text-primary)] border-t-transparent dark:border-[#e8ff00] dark:border-t-transparent" />
          <span className="font-mono text-xs tracking-widest text-[var(--text-muted)] uppercase">
            Redirecting to Admin Portal...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
