'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, ArrowRight, Tag } from '@phosphor-icons/react';
import type { INotification } from '@vertex/types';
import { api } from '@/lib/api';
import { useCustomerAuthStore } from '@/store/customerAuth';
import { EMIL_EASE } from '@/lib/motion';

export function NotificationManager() {
  const pathname = usePathname();
  const customerUser = useCustomerAuthStore((s) => s.user);

  const [activeNotification, setActiveNotification] = useState<INotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const impressionRecorded = useRef<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Fetch active notifications from backend
  useEffect(() => {
    // Skip on admin dashboard to avoid interfering with store administration
    if (pathname.startsWith('/admin')) {
      setActiveNotification(null);
      setIsVisible(false);
      return;
    }

    let isMounted = true;

    api
      .get<{ success: boolean; data: INotification[] }>('/notifications/active')
      .then((res) => {
        if (!isMounted || !res?.data || !Array.isArray(res.data) || res.data.length === 0) {
          return;
        }

        const now = new Date().getTime();

        // Filter eligible notifications
        const eligible = res.data.filter((notif) => {
          if (!notif.isActive) return false;

          // Date boundary check
          const start = new Date(notif.startDate).getTime();
          const end = new Date(notif.endDate).getTime();
          if (now < start || now > end) return false;

          // Audience check
          if (notif.targetAudience === 'authenticated' && !customerUser) return false;
          if (notif.targetAudience === 'guest' && customerUser) return false;

          // Target pages check
          if (
            notif.targetPages &&
            notif.targetPages.length > 0 &&
            !notif.targetPages.includes('all')
          ) {
            const matchesPage = notif.targetPages.some((p) => {
              if (p === pathname) return true;
              if (p.endsWith('*') && pathname.startsWith(p.slice(0, -1))) return true;
              return false;
            });
            if (!matchesPage) return false;
          }

          // Frequency cap check
          const capKey = `xydv_dismissed_notif_${notif._id}`;
          if (notif.frequencyCap === 'once_per_session') {
            try {
              if (sessionStorage.getItem(capKey)) return false;
            } catch {}
          } else if (notif.frequencyCap === 'once_per_week') {
            try {
              const dismissedAt = localStorage.getItem(capKey);
              if (dismissedAt) {
                const elapsed = now - Number(dismissedAt);
                const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
                if (elapsed < ONE_WEEK_MS) return false;
              }
            } catch {}
          }

          return true;
        });

        if (eligible.length === 0) return;

        // Sort by priority descending (highest priority first)
        eligible.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
        const selected = eligible[0];

        if (isMounted) {
          setActiveNotification(selected);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch active notifications:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [pathname, customerUser]);

  // Handle trigger evaluation (delay, scroll, immediate)
  useEffect(() => {
    if (!activeNotification) {
      setIsVisible(false);
      return;
    }

    let timerId: NodeJS.Timeout | null = null;
    let scrollHandler: (() => void) | null = null;

    const showModal = () => {
      setIsVisible(true);
    };

    if (activeNotification.triggerType === 'immediate') {
      timerId = setTimeout(showModal, 400);
    } else if (activeNotification.triggerType === 'delay') {
      const delaySeconds = activeNotification.triggerValue > 0 ? activeNotification.triggerValue : 3;
      timerId = setTimeout(showModal, delaySeconds * 1000);
    } else if (activeNotification.triggerType === 'scroll') {
      const targetPercent =
        activeNotification.triggerValue > 0 ? activeNotification.triggerValue : 30;

      scrollHandler = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight =
          document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (scrollHeight <= 0) return;

        const currentPercent = (scrollTop / scrollHeight) * 100;
        if (currentPercent >= targetPercent) {
          showModal();
          if (scrollHandler) {
            window.removeEventListener('scroll', scrollHandler);
            scrollHandler = null;
          }
        }
      };

      window.addEventListener('scroll', scrollHandler, { passive: true });
    }

    return () => {
      if (timerId) clearTimeout(timerId);
      if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
    };
  }, [activeNotification]);

  // Record impression beacon once visible
  useEffect(() => {
    if (isVisible && activeNotification && impressionRecorded.current !== activeNotification._id) {
      impressionRecorded.current = activeNotification._id;
      api
        .post(`/notifications/${activeNotification._id}/telemetry`, { event: 'impression' })
        .catch(() => {});
    }
  }, [isVisible, activeNotification]);

  const handleDismiss = useCallback(() => {
    if (!activeNotification) return;

    // Send fire-and-forget telemetry beacon
    api
      .post(`/notifications/${activeNotification._id}/telemetry`, { event: 'dismissal' })
      .catch(() => {});

    // Save frequency capping record
    const capKey = `xydv_dismissed_notif_${activeNotification._id}`;
    try {
      if (activeNotification.frequencyCap === 'once_per_session') {
        sessionStorage.setItem(capKey, '1');
      } else if (activeNotification.frequencyCap === 'once_per_week') {
        localStorage.setItem(capKey, String(Date.now()));
      }
    } catch {}

    setIsVisible(false);
  }, [activeNotification]);

  // Handle Escape key and focus management for Modal format
  useEffect(() => {
    if (!isVisible || !activeNotification || activeNotification.displayFormat !== 'modal') {
      return;
    }

    const previousActiveElement = document.activeElement as HTMLElement | null;

    // Shift initial focus into modal
    const focusTimer = setTimeout(() => {
      if (dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
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
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    };
  }, [isVisible, activeNotification, handleDismiss]);

  const handleCtaClick = useCallback(() => {
    if (!activeNotification) return;

    api
      .post(`/notifications/${activeNotification._id}/telemetry`, { event: 'click' })
      .catch(() => {});

    // Also cap so it does not annoy the user after taking action
    const capKey = `xydv_dismissed_notif_${activeNotification._id}`;
    try {
      if (activeNotification.frequencyCap === 'once_per_session') {
        sessionStorage.setItem(capKey, '1');
      } else if (activeNotification.frequencyCap === 'once_per_week') {
        localStorage.setItem(capKey, String(Date.now()));
      }
    } catch {}

    setIsVisible(false);
  }, [activeNotification]);

  const handleCopyCoupon = useCallback(
    (code: string) => {
      if (!activeNotification) return;

      navigator.clipboard.writeText(code).then(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
      });

      api
        .post(`/notifications/${activeNotification._id}/telemetry`, { event: 'click' })
        .catch(() => {});
    },
    [activeNotification],
  );

  return (
    <AnimatePresence>
      {isVisible && activeNotification && (
        activeNotification.displayFormat === 'modal' ? (
          <div
            key={`modal-${activeNotification._id}`}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-modal-title"
            onClick={handleDismiss}
          >
            <motion.div
              ref={dialogRef}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ ease: EMIL_EASE, duration: 0.25 }}
              className="w-full max-w-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Scoped photographic media plinth (.dark containment invariant) */}
              {activeNotification.imageUrl && (
                <div className="group dark relative aspect-[16/9] w-full overflow-hidden bg-black">
                  <Image
                    src={activeNotification.imageUrl}
                    alt={activeNotification.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 512px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)] dark:border-[#E8FF00]/40 dark:bg-[#E8FF00]/10 dark:text-[#E8FF00]">
                      <Tag size={16} weight="bold" />
                    </div>
                    <span className="font-mono text-[10px] tracking-widest text-[var(--text-muted)] uppercase">
                      PROMOTION // BULLETIN
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 inline-flex items-center justify-center text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                    aria-label="Close notification"
                  >
                    <X size={20} />
                  </button>
                </div>

                <h2
                  id="notification-modal-title"
                  className="mt-3 font-mono text-base font-bold tracking-tight text-[var(--text-primary)] uppercase sm:text-lg"
                >
                  {activeNotification.title}
                </h2>

                <p className="mt-2 font-sans text-xs leading-relaxed text-[var(--text-secondary)]">
                  {activeNotification.message}
                </p>

                {/* Promo Coupon Code Callout */}
                {activeNotification.couponCode && (
                  <div className="mt-4 flex items-center justify-between border border-dashed border-[var(--border)] bg-[var(--bg)] p-3">
                    <div className="flex flex-col">
                      <span className="font-mono text-[9px] tracking-wider text-[var(--text-muted)] uppercase">
                        PROMO CODE
                      </span>
                      <span className="font-mono text-sm font-bold tracking-widest text-[var(--text-primary)] dark:text-[#E8FF00]">
                        {activeNotification.couponCode}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCoupon(activeNotification.couponCode!)}
                      className="min-h-[44px] inline-flex items-center gap-1.5 border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 font-mono text-xs font-semibold tracking-wider text-[var(--text-primary)] uppercase transition-colors hover:border-[var(--text-primary)] active:scale-[0.97]"
                      aria-label={`Copy coupon code ${activeNotification.couponCode}`}
                    >
                      {copiedCode ? (
                        <>
                          <Check size={14} className="text-[#22c55e]" weight="bold" />
                          <span className="text-[#22c55e]">COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>COPY</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="min-h-[44px] inline-flex items-center justify-center border border-[var(--border)] bg-transparent px-5 py-2 font-mono text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] active:scale-[0.97]"
                  >
                    DISMISS
                  </button>

                  {activeNotification.ctaText && activeNotification.ctaUrl && (
                    <Link
                      href={activeNotification.ctaUrl}
                      onClick={handleCtaClick}
                      className="min-h-[44px] inline-flex items-center justify-center gap-2 border border-[#0A0A0A] bg-[#0A0A0A] px-5 py-2 font-mono text-xs font-bold tracking-wider text-white uppercase transition-colors hover:bg-black active:scale-[0.97] dark:border-[#E8FF00] dark:bg-[#E8FF00] dark:text-[#0A0A0A] dark:hover:bg-[#d6eb00]"
                    >
                      <span>{activeNotification.ctaText}</span>
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* FORMAT 2: Bottom-Right Corner Toast */
          <div
            key={`toast-${activeNotification._id}`}
            className="pointer-events-none fixed right-4 bottom-4 z-50 w-full max-w-sm sm:right-6 sm:bottom-6"
            role="status"
            aria-live="polite"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ ease: EMIL_EASE, duration: 0.3 }}
              className="pointer-events-auto border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-[var(--text-primary)] shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)] dark:border-[#E8FF00]/40 dark:bg-[#E8FF00]/10 dark:text-[#E8FF00]">
                    <Tag size={13} weight="bold" />
                  </div>
                  <span className="font-mono text-[9px] tracking-widest text-[var(--text-muted)] uppercase">
                    ALERT // PROMO
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="min-h-[44px] min-w-[44px] -mr-3 -mt-3 inline-flex items-center justify-center text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                  aria-label="Dismiss toast"
                >
                  <X size={16} />
                </button>
              </div>

              <h3 className="mt-2 font-mono text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
                {activeNotification.title}
              </h3>

              <p className="mt-1 font-sans text-xs leading-relaxed text-[var(--text-secondary)]">
                {activeNotification.message}
              </p>

              {/* Coupon Code Inline in Toast */}
              {activeNotification.couponCode && (
                <div className="mt-2.5 flex items-center justify-between border border-dashed border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5">
                  <span className="font-mono text-xs font-bold tracking-wider text-[var(--text-primary)] dark:text-[#E8FF00]">
                    {activeNotification.couponCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCoupon(activeNotification.couponCode!)}
                    className="min-h-[44px] min-w-[44px] px-2.5 inline-flex items-center justify-center gap-1 font-mono text-[10px] font-semibold tracking-wider text-[var(--text-primary)] uppercase hover:text-[var(--accent)] active:scale-[0.97]"
                    aria-label={`Copy code ${activeNotification.couponCode}`}
                  >
                    {copiedCode ? (
                      <span className="text-[#22c55e]">COPIED</span>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>COPY</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeNotification.ctaText && activeNotification.ctaUrl && (
                <div className="mt-3 flex justify-end">
                  <Link
                    href={activeNotification.ctaUrl}
                    onClick={handleCtaClick}
                    className="min-h-[44px] inline-flex items-center gap-1.5 border border-[#0A0A0A] bg-[#0A0A0A] px-3.5 py-1.5 font-mono text-[10px] font-bold tracking-wider text-white uppercase transition-colors hover:bg-black active:scale-[0.97] dark:border-[#E8FF00] dark:bg-[#E8FF00] dark:text-[#0A0A0A] dark:hover:bg-[#d6eb00]"
                  >
                    <span>{activeNotification.ctaText}</span>
                    <ArrowRight size={12} weight="bold" />
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        )
      )}
    </AnimatePresence>
  );
}
