'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { EMIL_EASE } from '@/lib/motion';
import { LoadingSymbol } from './LoadingSymbol';

/**
 * InitialLoadingScreen
 * High-craft architectural preloader for XYDV technical division.
 * Features:
 * - Dynamic transition from hairline outline symbol to solid black/white symbol
 * - Sleek precision 2px progress bar with micro-percentage readout
 * - Architectural technical metadata crosshairs
 * - Seamless exit unmount powered by Emil Kowalski easing
 * - Light and dark mode support
 */
export function InitialLoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Lock body scrolling during initial system loading
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let animationFrameId: number;

    if (shouldReduceMotion) {
      setProgress(100);
      settleTimer = setTimeout(() => {
        setIsComplete(true);
      }, 150);
      return () => {
        if (settleTimer) clearTimeout(settleTimer);
        document.body.style.overflow = prevOverflow;
      };
    }

    const startTime = performance.now();
    const duration = 500; // Accelerated pacing for high-responsiveness and optimal LCP

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const ratio = Math.min(1, elapsed / duration);
      // Cubic deceleration curve for high-precision technical feel
      const eased = Math.min(100, Math.round((1 - Math.pow(1 - ratio, 3)) * 100));
      setProgress(eased);

      if (ratio < 1) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        // Brief 80ms settle at 100% so user perceives the solid symbol completion
        settleTimer = setTimeout(() => {
          setIsComplete(true);
        }, 80);
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    const onWindowLoad = () => {
      setProgress(100);
      if (!settleTimer) {
        settleTimer = setTimeout(() => {
          setIsComplete(true);
        }, 80);
      }
    };

    if (document.readyState === 'complete') {
      onWindowLoad();
    } else {
      window.addEventListener('load', onWindowLoad, { once: true });
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (settleTimer) {
        clearTimeout(settleTimer);
      }
      window.removeEventListener('load', onWindowLoad);
      document.body.style.overflow = prevOverflow;
    };
  }, [shouldReduceMotion]);

  if (!isMounted) return null;

  return (
    <AnimatePresence mode="wait" onExitComplete={() => setIsMounted(false)}>
      {!isComplete && (
        <motion.aside
          key="initial-loading-screen"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            y: shouldReduceMotion ? 0 : -8,
            transition: { duration: 0.3, ease: EMIL_EASE },
          }}
          role="status"
          aria-live="polite"
          aria-label="Loading XYDV Performance Systems"
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--text-primary)] select-none ${
            isComplete ? 'pointer-events-none' : 'pointer-events-auto'
          } [media(scripting:none)]:hidden`}
        >
          {/* Architectural Blueprint Crosshairs */}
          <div className="absolute top-6 left-6 font-mono text-[9px] tracking-[0.2em] text-[var(--text-muted)] opacity-60">
            + XYDV // DIV.01
          </div>
          <div className="absolute top-6 right-6 font-mono text-[9px] tracking-[0.2em] text-[var(--text-muted)] opacity-60">
            LOC // 37.7749°N
          </div>
          <div className="absolute bottom-6 left-6 font-mono text-[9px] tracking-[0.2em] text-[var(--text-muted)] opacity-60">
            SPEC // PERFORMANCE TEXTILE
          </div>
          <div className="absolute bottom-6 right-6 font-mono text-[9px] tracking-[0.2em] text-[var(--text-muted)] opacity-60">
            STATUS: CALIBRATING
          </div>

          {/* Centered Brand Presentation */}
          <div className="flex flex-col items-center px-4">
            {/* Outline -> Solid Transition Symbol */}
            <LoadingSymbol
              size={104}
              progress={progress}
              variant="fill"
              priority
              className="mb-8"
            />

            {/* Precision Hairline Progress Bar */}
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="System calibration progress"
              className="w-48 sm:w-56 h-[2px] bg-[var(--border)] relative overflow-hidden mb-3"
            >
              <motion.div
                className="h-full bg-[var(--text-primary)] dark:bg-[var(--accent)]"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>

            {/* Telemetry and Metrics Readout */}
            <div className="flex items-center justify-between w-48 sm:w-56 font-mono text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
              <span>XYDV // INIT</span>
              <span aria-hidden="true" className="font-semibold text-[var(--text-primary)]">{progress}%</span>
            </div>

            {/* Dynamic Stage Progression Readout */}
            <p
              aria-live="polite"
              aria-atomic="true"
              className="mt-4 font-mono text-[9px] tracking-[0.25em] text-[var(--text-muted)] uppercase h-4 text-center"
            >
              {progress < 30
                ? 'INITIALIZING TEXTILE ARCHITECTURE'
                : progress < 70
                ? 'CALIBRATING PERFORMANCE MATRICES'
                : progress < 100
                ? 'SYNCHRONIZING DIVISION'
                : 'SYSTEM DEPLOYED'}
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
