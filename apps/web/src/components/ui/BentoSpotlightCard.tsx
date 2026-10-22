'use client';

import React, { useRef, useEffect } from 'react';

export interface BentoSpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

/**
 * BentoSpotlightCard (React Bits hardened pattern)
 * Zero React re-renders on mouse movement via direct CSS variable mutations.
 * Includes mobile capability guard to prevent stuck spotlight circles on touch devices
 * and eliminate layout reflows during scroll.
 */
export function BentoSpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(255, 255, 255, 0.18)',
  style,
  ...props
}: BentoSpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof window === 'undefined') return;

    // Mobile capability guard: hover & fine pointer requirement
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!mediaQuery.matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Direct CSS variables updates with ZERO React re-renders
      el.style.setProperty('--spotlight-x', `${x}px`);
      el.style.setProperty('--spotlight-y', `${y}px`);
      el.style.setProperty('--spotlight-opacity', '1');
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--spotlight-x', `${x}px`);
      el.style.setProperty('--spotlight-y', `${y}px`);
      el.style.setProperty('--spotlight-opacity', '1');
    };

    const handleMouseLeave = () => {
      el.style.setProperty('--spotlight-opacity', '0');
    };

    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      style={
        {
          '--spotlight-x': '0px',
          '--spotlight-y': '0px',
          '--spotlight-opacity': '0',
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {/* React Bits Radial Spotlight Sheen */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          opacity: 'var(--spotlight-opacity, 0)',
          background: `radial-gradient(420px circle at var(--spotlight-x, 0px) var(--spotlight-y, 0px), ${spotlightColor}, transparent 80%)`,
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
