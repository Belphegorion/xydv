'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { EMIL_EASE } from '@/lib/motion';
import { api } from '@/lib/api';

const DEFAULT_MESSAGES = [
  'FREE COMPLIMENTARY DISPATCH ON ORDERS OVER ₹150',
  'RAZORPAY SECURED CHECKOUT — ZERO TRANSACTION FRICTION',
  'XYDV SS26 TACTICAL DIVISION — LIMITED BATCH ALLOCATIONS',
];

export function AnnouncementBar() {
  const [messages, setMessages] = useState<string[]>(DEFAULT_MESSAGES);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Check localStorage dismissal
    try {
      const dismissed =
        localStorage.getItem('xydv-announcement-dismissed') ||
        localStorage.getItem('vertex-announcement-dismissed');
      if (dismissed === 'true') {
        setVisible(false);
      }
    } catch {
      // LocalStorage unavailable
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    api
      .get<{
        success?: boolean;
        data?: {
          freeShippingThreshold?: number;
          currencySymbol?: string;
          announcementText?: string;
        };
      }>('/settings')
      .then((res) => {
        if (!isMounted) return;
        const d = res?.data;
        if (d) {
          const threshold = d.freeShippingThreshold ?? 150;
          const symbol = d.currencySymbol ?? '₹';
          const dynamicShippingMsg = `FREE COMPLIMENTARY DISPATCH ON ORDERS OVER ${symbol}${threshold}`;
          setMessages((prev) => {
            const next = [...prev];
            next[0] = dynamicShippingMsg;
            if (d.announcementText && !next.includes(d.announcementText)) {
              next.push(d.announcementText);
            }
            return next;
          });
        }
      })
      .catch(() => {
        // Retain default messages
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [visible, messages.length]);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem('xydv-announcement-dismissed', 'true');
      localStorage.removeItem('vertex-announcement-dismissed');
    } catch {
      // Ignore
    }
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Important store announcement"
      className="relative z-50 flex items-center justify-between overflow-hidden border-b border-black/30 bg-[#0a0a0a] px-2 py-1 font-mono text-[10px] font-bold tracking-[0.06em] text-[#f5f5f5] transition-colors select-none sm:px-4 sm:text-xs sm:tracking-[0.14em] dark:border-white/10"
    >
      {/* Mobile balance spacer (balances right dismiss button on mobile) */}
      <div className="pointer-events-none w-11 shrink-0 sm:hidden" aria-hidden="true" />

      {/* Prev button (desktop only) */}
      <button
        onClick={() => setIndex((prev) => (prev - 1 + messages.length) % messages.length)}
        aria-label="Previous announcement"
        className="touch-target btn-tactile relative z-10 hidden min-h-[44px] min-w-[44px] items-center justify-center text-zinc-400 transition-colors hover:text-white active:scale-[0.97] sm:flex"
      >
        <CaretLeft size={13} weight="bold" />
      </button>

      {/* Cycling Message with AnimatePresence and min-w-0 for flex truncation */}
      <div className="relative flex h-5 min-w-0 flex-1 items-center justify-center overflow-hidden px-1 text-center sm:px-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={shouldReduceMotion ? { opacity: 0 } : { y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: -10, opacity: 0 }}
            transition={{ duration: 0.22, ease: EMIL_EASE }}
            className="absolute inset-x-0 block truncate px-1 text-center text-[10px] leading-tight sm:text-xs"
          >
            {messages[index]}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Next and Close button */}
      <div className="relative z-10 flex shrink-0 items-center gap-0.5">
        <button
          onClick={() => setIndex((prev) => (prev + 1) % messages.length)}
          aria-label="Next announcement"
          className="touch-target btn-tactile hidden min-h-[44px] min-w-[44px] items-center justify-center text-zinc-400 transition-colors hover:text-white active:scale-[0.97] sm:flex"
        >
          <CaretRight size={13} weight="bold" />
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss announcement bar"
          className="touch-target btn-tactile flex min-h-[44px] min-w-[44px] items-center justify-center p-1.5 text-zinc-400 transition-colors hover:text-white active:scale-[0.97]"
        >
          <X size={13} weight="bold" />
        </button>
      </div>
    </div>
  );
}
