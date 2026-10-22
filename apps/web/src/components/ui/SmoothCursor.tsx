'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react';

export function SmoothCursor() {
  const shouldReduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const [isPointerFine, setIsPointerFine] = useState(false);
  const isVisibleRef = useRef(false);

  // Raw mouse coordinates
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Fluid pinpoint dot tracks with high-stiffness spring physics
  const dotX = useSpring(mouseX, { stiffness: 900, damping: 50, mass: 0.1 });
  const dotY = useSpring(mouseY, { stiffness: 900, damping: 50, mass: 0.1 });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaFine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!mediaFine.matches) {
      setIsPointerFine(false);
      return;
    }

    setIsPointerFine(true);
    if (!shouldReduceMotion) {
      document.documentElement.classList.add('has-smooth-cursor');
    }

    const updatePointer = (matches: boolean) => {
      setIsPointerFine(matches);
      if (matches && !shouldReduceMotion) {
        document.documentElement.classList.add('has-smooth-cursor');
      } else {
        document.documentElement.classList.remove('has-smooth-cursor');
      }
    };

    const onMediaChange = (e: MediaQueryListEvent) => {
      updatePointer(e.matches);
    };
    mediaFine.addEventListener('change', onMediaChange);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
      }
    };

    const handleMouseLeave = () => {
      isVisibleRef.current = false;
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      isVisibleRef.current = true;
      setIsVisible(true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisibleRef.current = false;
        setIsVisible(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.documentElement.classList.remove('has-smooth-cursor');
      mediaFine.removeEventListener('change', onMediaChange);
      window.removeEventListener('mousemove', handleMouseMove);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mouseX, mouseY, shouldReduceMotion]);

  // If reduced motion is requested, or not a fine pointer device, disable completely
  if (shouldReduceMotion || !isPointerFine) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Exclusively smooth precision cursor dot — zero trailing rings, halos, or circles */}
      <motion.div
        style={{
          x: dotX,
          y: dotY,
        }}
        animate={{
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ duration: 0.12 }}
        className="pointer-events-none fixed top-0 left-0 -mt-[3px] -ml-[3px] h-1.5 w-1.5 rounded-full bg-[var(--accent)] dark:bg-[var(--accent)]"
      />
    </div>
  );
}
