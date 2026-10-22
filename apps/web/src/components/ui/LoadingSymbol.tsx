'use client';

import React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';

export interface LoadingSymbolProps {
  size?: number;
  progress?: number;
  variant?: 'fill' | 'pulse';
  className?: string;
  priority?: boolean;
}

/**
 * LoadingSymbol Primitive
 * Renders the official XYDV brand symbol using 4 static PNGs:
 * - Outline: /brand/xydv-symbol-outline.png (light) and /brand/xydv-symbol-outline-white.png (dark)
 * - Solid: /brand/xydv-symbol-solid.png (light) and /brand/xydv-symbol-solid-white.png (dark)
 *
 * Supports:
 * - 'fill' mode: solid symbol reveals dynamically based on progress (0..100)
 * - 'pulse' mode: rhythmic breathing crossfade between outline and solid symbol
 */
export function LoadingSymbol({
  size = 96,
  progress,
  variant = 'fill',
  className = '',
  priority = true,
}: LoadingSymbolProps) {
  const shouldReduceMotion = useReducedMotion();

  // Clamp progress between 0 and 100
  const clampedProgress =
    typeof progress === 'number'
      ? Math.min(100, Math.max(0, progress))
      : variant === 'fill'
        ? 0
        : undefined;

  return (
    <div
      className={`pointer-events-none relative select-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* 1. Fine Hairline Outline Layer (Structural Boundary Frame) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Light Mode Outline */}
        <Image
          src="/brand/xydv-symbol-outline.png"
          alt="XYDV Outline Symbol"
          width={size}
          height={size}
          unoptimized
          priority={priority}
          /* prettier-ignore */
          className="block dark:hidden h-full w-full object-contain select-none"
        />
        {/* Dark Mode Outline */}
        <Image
          src="/brand/xydv-symbol-outline-white.png"
          alt="XYDV Outline Symbol"
          width={size}
          height={size}
          unoptimized
          priority={priority}
          /* prettier-ignore */
          className="hidden dark:block h-full w-full object-contain select-none"
        />
      </div>

      {/* 2. Solid Symbol Layer (Transition / Fill / Pulse) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={
          shouldReduceMotion
            ? { opacity: 1 }
            : variant === 'pulse'
              ? { opacity: 0.15, scale: 0.98 }
              : {
                  opacity:
                    clampedProgress !== undefined ? Math.max(0.12, clampedProgress / 100) : 0,
                }
        }
        animate={
          variant === 'pulse'
            ? shouldReduceMotion
              ? { opacity: 0.85 }
              : {
                  opacity: [0.15, 0.95, 0.15],
                  scale: [0.98, 1.01, 0.98],
                }
            : variant === 'fill' && clampedProgress !== undefined
              ? {
                  opacity: Math.max(0.12, clampedProgress / 100),
                }
              : undefined
        }
        transition={
          variant === 'pulse'
            ? {
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : {
                duration: 0.15,
                ease: 'linear',
              }
        }
        style={{
          clipPath:
            clampedProgress !== undefined ? `inset(${100 - clampedProgress}% 0% 0% 0%)` : undefined,
        }}
      >
        {/* Light Mode Solid */}
        <Image
          src="/brand/xydv-symbol-solid.png"
          alt="XYDV Solid Symbol"
          width={size}
          height={size}
          unoptimized
          priority={priority}
          /* prettier-ignore */
          className="block dark:hidden h-full w-full object-contain select-none"
        />
        {/* Dark Mode Solid */}
        <Image
          src="/brand/xydv-symbol-solid-white.png"
          alt="XYDV Solid Symbol"
          width={size}
          height={size}
          unoptimized
          priority={priority}
          /* prettier-ignore */
          className="hidden dark:block h-full w-full object-contain select-none"
        />
      </motion.div>
    </div>
  );
}
